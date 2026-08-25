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
        const phone = searchParams.get("phone")

        if (!phone) {
            return NextResponse.json({ success: false, error: "Phone number required" }, { status: 400 })
        }

        // Generate search terms (variations)
        const digits = phone.replace(/[^0-9]/g, "")
        const variations = new Set<string>()
        if (digits.length >= 7) {
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
        }
        variations.add(phone.trim())
        const searchTerms = Array.from(variations)

        const db = getAdminDb()
        
        // Query by variations
        const query1 = db.collection("orders").where("phone", "in", searchTerms).get()
        const query2 = db.collection("orders").where("customerPhone", "in", searchTerms).get()
        const query3 = db.collection("orders").where("whatsapp", "in", searchTerms).get()

        const [snap1, snap2, snap3] = await Promise.all([query1, query2, query3])
        
        const matchMap = new Map()
        snap1.docs.forEach(doc => matchMap.set(doc.id, doc))
        snap2.docs.forEach(doc => matchMap.set(doc.id, doc))
        snap3.docs.forEach(doc => matchMap.set(doc.id, doc))
        
        const matches = Array.from(matchMap.values())

        if (matches.length === 0) {
            return NextResponse.json({
                success: true,
                results: [],
                error: `No match found for this phone number.`
            }, { status: 200 })
        }

        const results = matches.map(doc => {
            const data = doc.data()

            const safeDate = (val: any) => {
                try {
                    return val?.toDate ? val.toDate().toISOString() : val
                } catch { return null }
            }

            return {
                orderId: data.orderId,
                status: data.status,
                device: `${data.brand || ""} ${data.model || ""}`.trim(),
                issue: data.issueType || data.issue || "",
                createdAt: safeDate(data.createdAt),
                updatedAt: safeDate(data.updatedAt),
                technicianName: data.technicianName ? data.technicianName.split(" ")[0] : "Assigned",
                estimatedCompletion: data.estimatedCompletion,
                timeline: data.statusHistory || []
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
