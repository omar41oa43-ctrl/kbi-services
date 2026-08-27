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
    const orderId = normalizeOrderId(searchParams.get("orderId") || "")
    const verification = (searchParams.get("last4") || "").replace(/\D/g, "")

    if (!/^[A-Z0-9-]{4,64}$/.test(orderId) || verification.length !== 4) {
      return NextResponse.json(
        { success: false, error: "Enter a valid order ID and the last 4 digits of the booking phone number." },
        { status: 400 },
      )
    }

    const db = getAdminDb()
    const [bookingDoc, orderIdSnap, orderNumberSnap, trackingCodeSnap] = await Promise.all([
      db.collection("bookings").doc(orderId).get().catch(() => null),
      db.collection("orders").where("orderId", "==", orderId).limit(10).get().catch(() => null),
      db.collection("orders").where("orderNumber", "==", orderId).limit(10).get().catch(() => null),
      db.collection("orders").where("trackingCode", "==", orderId).limit(10).get().catch(() => null),
    ])

    const documents = new Map<string, DocumentSnapshot>()
    if (bookingDoc?.exists) documents.set(`bookings:${bookingDoc.id}`, bookingDoc)
    for (const snap of [orderIdSnap, orderNumberSnap, trackingCodeSnap]) {
      snap?.docs.forEach((doc) => documents.set(`orders:${doc.id}`, doc))
    }

    const verified = [...documents.values()].filter((doc) => {
      const data = doc.data() || {}
      return lastFour(data.phone || data.customerPhone || data.whatsapp) === verification
    })

    if (verified.length === 0) {
      return NextResponse.json(
        { success: false, error: "We could not verify those details. Check the order ID and phone digits, or contact support." },
        { status: 404 },
      )
    }

    const results = verified.map((doc) => {
      const data = doc.data() || {}
      const brand = data.brand || ""
      const model = data.model || data.deviceModel || ""
      const device = data.device || data.deviceType || data.serviceType || `${brand} ${model}`.trim() || "Device repair"

      return {
        orderId: data.orderId || data.orderNumber || orderId,
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
