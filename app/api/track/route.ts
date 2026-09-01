import { NextRequest, NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase-admin"
import { getClientIP, rateLimit } from "@/lib/rate-limit"
import type { DocumentSnapshot } from "firebase-admin/firestore"

export const dynamic = "force-dynamic"

const normalizeOrderId = (value: string) => value.trim().replace(/^#/, "").toUpperCase()
const lastFour = (value: unknown) => String(value || "").replace(/\D/g, "").slice(-4)

const safeDate = (value: any) => {
  try {
    if (!value) return null
    return value.toDate ? value.toDate().toISOString() : new Date(value).toISOString()
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const ip = getClientIP(request)
  const limiter = rateLimit(`public-track:${ip}`, { maxRequests: 6, windowMs: 60_000 })

  if (!limiter.success) {
    return NextResponse.json(
      { success: false, error: "Unable to verify this request. Please wait and try again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limiter.resetIn / 1000)) } },
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const orderIdParam = (searchParams.get("orderId") || "").trim()
    const phoneParam = (searchParams.get("phone") || searchParams.get("last4") || "").trim()
    const queryParam = (searchParams.get("q") || searchParams.get("query") || "").trim()

    let orderQuery = orderIdParam ? normalizeOrderId(orderIdParam) : ""
    let rawPhone = phoneParam.replace(/\D/g, "")

    if (queryParam) {
      const cleanDigits = queryParam.replace(/\D/g, "")
      if (cleanDigits.length >= 7 && !queryParam.toUpperCase().includes("KBI") && !queryParam.toUpperCase().includes("ORD")) {
        rawPhone = cleanDigits
      } else {
        orderQuery = normalizeOrderId(queryParam)
      }
    }

    if (!orderQuery && rawPhone.length < 4) {
      return NextResponse.json(
        { success: false, error: "Please enter your KBI order number or phone number." },
        { status: 400 },
      )
    }

    const db = getAdminDb()
    const documents = new Map<string, DocumentSnapshot>()

    // 1. Search by Order ID if provided
    if (orderQuery) {
      const [bookingDoc, orderDoc, orderIdSnap, orderNumberSnap, trackingCodeSnap] = await Promise.all([
        db.collection("bookings").doc(orderQuery).get().catch(() => null),
        db.collection("orders").doc(orderQuery).get().catch(() => null),
        db.collection("orders").where("orderId", "==", orderQuery).limit(10).get().catch(() => null),
        db.collection("orders").where("orderNumber", "==", orderQuery).limit(10).get().catch(() => null),
        db.collection("orders").where("trackingCode", "==", orderQuery).limit(10).get().catch(() => null),
      ])

      if (bookingDoc?.exists) documents.set(`bookings:${bookingDoc.id}`, bookingDoc)
      if (orderDoc?.exists) documents.set(`orders:${orderDoc.id}`, orderDoc)
      for (const snap of [orderIdSnap, orderNumberSnap, trackingCodeSnap]) {
        snap?.docs.forEach((doc) => documents.set(`orders:${doc.id}`, doc))
      }
    }

    // 2. Search by Phone Number if provided
    if (rawPhone.length >= 4) {
      const variations = new Set<string>()
      variations.add(rawPhone)
      if (rawPhone.startsWith("0")) {
        variations.add(rawPhone.substring(1))
        variations.add(`971${rawPhone.substring(1)}`)
        variations.add(`+971${rawPhone.substring(1)}`)
      } else if (rawPhone.startsWith("971")) {
        variations.add(`0${rawPhone.substring(3)}`)
        variations.add(rawPhone.substring(3))
        variations.add(`+${rawPhone}`)
      } else {
        variations.add(`0${rawPhone}`)
        variations.add(`971${rawPhone}`)
        variations.add(`+971${rawPhone}`)
      }

      const phoneTerms = Array.from(variations).slice(0, 30)

      const [snapP1, snapP2, snapP3, snapPB] = await Promise.all([
        db.collection("orders").where("phone", "in", phoneTerms).limit(20).get().catch(() => null),
        db.collection("orders").where("customerPhone", "in", phoneTerms).limit(20).get().catch(() => null),
        db.collection("orders").where("whatsapp", "in", phoneTerms).limit(20).get().catch(() => null),
        db.collection("bookings").where("phone", "in", phoneTerms).limit(20).get().catch(() => null),
      ])

      for (const snap of [snapP1, snapP2, snapP3, snapPB]) {
        snap?.docs.forEach((doc) => documents.set(doc.ref.path, doc))
      }
    }

    let verified = [...documents.values()]

    // If BOTH orderQuery AND rawPhone were specified, filter to match both
    if (orderQuery && rawPhone.length >= 4) {
      const verificationLast4 = rawPhone.slice(-4)
      verified = verified.filter((doc) => {
        const data = doc.data() || {}
        const docPhone = String(data.phone || data.customerPhone || data.whatsapp || "").replace(/\D/g, "")
        return docPhone.endsWith(verificationLast4) || (rawPhone.length >= 7 && (docPhone.includes(rawPhone) || rawPhone.includes(docPhone)))
      })
    }

    if (verified.length === 0) {
      return NextResponse.json(
        { success: false, error: "We could not find an order matching your search. Please check your order ID or phone number." },
        { status: 404 },
      )
    }

    const rawResults = verified.map((doc) => {
      const data = doc.data() || {}
      const brand = data.brand || ""
      const model = data.model || data.deviceModel || ""
      const device = data.device || data.deviceType || data.serviceType || `${brand} ${model}`.trim() || "Device repair"
      const publicOrderId = data.orderNumber || data.reference || data.trackingCode || data.orderId || orderQuery || doc.id

      return {
        orderId: String(publicOrderId).toUpperCase(),
        status: String(data.status || "Order Created"),
        device,
        issue: data.issueType || data.issue || data.service || (Array.isArray(data.deviceIssues) ? data.deviceIssues.join(", ") : ""),
        createdAt: safeDate(data.createdAt),
        updatedAt: safeDate(data.updatedAt),
        technicianName: data.technicianName ? String(data.technicianName).split(" ")[0] : data.assignedTechnician ? "Assigned" : "",
        estimatedCompletion: safeDate(data.estimatedCompletion),
        timeline: Array.isArray(data.statusHistory)
          ? data.statusHistory.map((item: any) => ({ ...item, timestamp: safeDate(item.timestamp) }))
          : [],
      }
    })

    // A booking is mirrored across multiple collections for compatibility.
    // Group those documents by their public order number so phone searches show
    // one card per request instead of duplicate order/booking records.
    const groupedResults = new Map<string, (typeof rawResults)[number]>()
    for (const result of rawResults) {
      const key = normalizeOrderId(result.orderId)
      const current = groupedResults.get(key)
      if (!current) {
        groupedResults.set(key, result)
        continue
      }

      let devices = Array.from(new Set([current.device, result.device].filter(Boolean)))
      if (devices.length > 1) devices = devices.filter((device) => device !== "Device repair")
      const issues = Array.from(new Set([current.issue, result.issue].filter(Boolean)))
      const timelines = [...(current.timeline || []), ...(result.timeline || [])]

      groupedResults.set(key, {
        ...current,
        device: devices.join(" · "),
        issue: issues.join(" · "),
        createdAt: current.createdAt || result.createdAt,
        updatedAt: result.updatedAt || current.updatedAt,
        technicianName: current.technicianName || result.technicianName,
        estimatedCompletion: current.estimatedCompletion || result.estimatedCompletion,
        timeline: timelines,
      })
    }

    const results = [...groupedResults.values()].sort((a, b) => {
      const aTime = a.createdAt ? Date.parse(a.createdAt) : 0
      const bTime = b.createdAt ? Date.parse(b.createdAt) : 0
      return bTime - aTime
    })

    return NextResponse.json(
      { success: true, results },
      { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } },
    )
  } catch (error) {
    console.error("Public tracking verification failed", error)
    return NextResponse.json(
      { success: false, error: "Tracking is temporarily unavailable. Please contact support." },
      { status: 500 },
    )
  }
}
