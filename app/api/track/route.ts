import { NextRequest, NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase-admin"
import { rateLimit, getClientIP } from "@/lib/rate-limit"

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const ip = getClientIP(request)
        // Rate limit: 10 requests per minute per IP
        const limiter = rateLimit(`track-phone:${ip}`, { maxRequests: 10, windowMs: 60000 })
        if (!limiter.success) {
            return NextResponse.json(
                { success: false, error: "Too many requests. Please try again later." },
                { status: 429 }
            )
        }

        const { searchParams } = new URL(request.url)
        const rawQuery = (searchParams.get("phone") || searchParams.get("q") || searchParams.get("query") || searchParams.get("orderId") || "").trim()

        if (!rawQuery) {
            return NextResponse.json({ success: false, error: "Phone number or Order ID required" }, { status: 400 })
        }

        const decodedQuery = decodeURIComponent(rawQuery).trim()
        const db = getAdminDb()
        const matchMap = new Map()

        // 1. Check if the query matches an Order ID / Reference
        const orderCandidates = new Set<string>()
        orderCandidates.add(decodedQuery)
        orderCandidates.add(rawQuery)
        orderCandidates.add(decodedQuery.replace(/^#/, ""))
        orderCandidates.add(decodedQuery.toUpperCase())
        orderCandidates.add(decodedQuery.toLowerCase())

        const tokens = decodedQuery.split(/[,;\s]+/).map(t => t.trim().replace(/^#/, "")).filter(Boolean)
        tokens.forEach(t => {
            orderCandidates.add(t)
            orderCandidates.add(t.toUpperCase())
            orderCandidates.add(t.toLowerCase())
        })

        const ordMatches = decodedQuery.match(/(?:ORD|KBI)-?\d+/gi)
        if (ordMatches) {
            ordMatches.forEach(m => {
                orderCandidates.add(m.trim())
                orderCandidates.add(m.trim().toUpperCase())
            })
        }

        const orderSearchTerms = Array.from(orderCandidates).filter(Boolean)

        // Try direct document IDs in orders and bookings
        for (const candidate of orderSearchTerms) {
            const [oDoc, bDoc] = await Promise.all([
                db.collection("orders").doc(candidate).get().catch(() => null),
                db.collection("bookings").doc(candidate).get().catch(() => null)
            ])
            if (oDoc && oDoc.exists) matchMap.set(oDoc.id, oDoc)
            if (bDoc && bDoc.exists) matchMap.set(bDoc.id, bDoc)
        }

        // Query by order fields
        if (orderSearchTerms.length > 0) {
            const oQueryTerms = orderSearchTerms.slice(0, 30) // Firestore limit 30 for 'in'
            const [snapO1, snapO2, snapO3, snapB1] = await Promise.all([
                db.collection("orders").where("orderId", "in", oQueryTerms).get().catch(() => ({ docs: [] })),
                db.collection("orders").where("orderNumber", "in", oQueryTerms).get().catch(() => ({ docs: [] })),
                db.collection("orders").where("trackingCode", "in", oQueryTerms).get().catch(() => ({ docs: [] })),
                db.collection("bookings").where("orderId", "in", oQueryTerms).get().catch(() => ({ docs: [] }))
            ])
            snapO1.docs.forEach((doc: any) => matchMap.set(doc.id, doc))
            snapO2.docs.forEach((doc: any) => matchMap.set(doc.id, doc))
            snapO3.docs.forEach((doc: any) => matchMap.set(doc.id, doc))
            snapB1.docs.forEach((doc: any) => matchMap.set(doc.id, doc))
        }

        // 2. Generate search terms for phone numbers
        const digits = decodedQuery.replace(/[^0-9]/g, "")
        if (digits.length >= 7) {
            const variations = new Set<string>()
            variations.add(digits)
            if (digits.startsWith("0")) {
                variations.add(digits.substring(1))
                variations.add(`971${digits.substring(1)}`)
            } else if (digits.startsWith("971")) {
                variations.add(`0${digits.substring(3)}`)
                variations.add(digits.substring(3))
            } else {
                variations.add(`0${digits}`)
                variations.add(`971${digits}`)
            }
            variations.add(decodedQuery)
            const phoneSearchTerms = Array.from(variations).slice(0, 30)

            const [snap1, snap2, snap3, snapBPhone] = await Promise.all([
                db.collection("orders").where("phone", "in", phoneSearchTerms).get().catch(() => ({ docs: [] })),
                db.collection("orders").where("customerPhone", "in", phoneSearchTerms).get().catch(() => ({ docs: [] })),
                db.collection("orders").where("whatsapp", "in", phoneSearchTerms).get().catch(() => ({ docs: [] })),
                db.collection("bookings").where("phone", "in", phoneSearchTerms).get().catch(() => ({ docs: [] }))
            ])

            snap1.docs.forEach((doc: any) => matchMap.set(doc.id, doc))
            snap2.docs.forEach((doc: any) => matchMap.set(doc.id, doc))
            snap3.docs.forEach((doc: any) => matchMap.set(doc.id, doc))
            snapBPhone.docs.forEach((doc: any) => matchMap.set(doc.id, doc))
        }

        const matches = Array.from(matchMap.values())

        if (matches.length === 0) {
            return NextResponse.json({
                success: true,
                results: [],
                error: `No match found for "${decodedQuery}". Please check your order ID or phone number.`
            }, { status: 200 })
        }

        const results = matches.map((doc: any) => {
            const data = doc.data() || {}

            const safeDate = (val: any) => {
                try {
                    return val?.toDate ? val.toDate().toISOString() : (val ? new Date(val).toISOString() : null)
                } catch { return null }
            }

            const rawStatus = String(data.status || "Order Created")
            const brand = data.brand || ""
            const model = data.model || ""
            const device = data.device || (brand || model ? `${brand} ${model}`.trim() : "Device Repair")
            const cleanOrderId = data.orderId || data.orderNumber || doc.id

            return {
                orderId: cleanOrderId,
                status: rawStatus,
                device,
                customerName: data.customerName || data.name || data.clientName || "",
                phone: data.phone || data.customerPhone || "",
                issue: data.issueType || data.issue || data.problemDescription || data.service || "",
                createdAt: safeDate(data.createdAt),
                updatedAt: safeDate(data.updatedAt),
                technicianName: data.technicianName ? data.technicianName.split(" ")[0] : (data.assignedTechnician ? "Assigned" : ""),
                estimatedCompletion: safeDate(data.estimatedCompletion),
                timeline: Array.isArray(data.statusHistory) ? data.statusHistory : []
            }
        })

        // Sort new to old
        results.sort((a: any, b: any) => {
            const tA = new Date(a.createdAt || 0).getTime()
            const tB = new Date(b.createdAt || 0).getTime()
            return tB - tA
        })

        return NextResponse.json({ success: true, results })

    } catch (e: any) {
        console.error("Public track API error:", e)
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
    }
}
