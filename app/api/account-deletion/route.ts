import { createHash, randomUUID } from "node:crypto"

import { FieldValue, Timestamp } from "firebase-admin/firestore"
import { NextResponse } from "next/server"

import { getAdminDb } from "@/lib/firebase-admin"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const email = String(body?.email || "").trim().toLowerCase().slice(0, 320)
  const technicianId = String(body?.technicianId || "").trim().slice(0, 100)
  const reason = String(body?.reason || "").trim().slice(0, 1000)
  const website = String(body?.website || "").trim()

  if (website) return NextResponse.json({ ok: true })
  if (!emailPattern.test(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid account email." }, { status: 400 })
  }

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const rateKey = createHash("sha256").update(forwarded).digest("hex").slice(0, 32)
  const hour = new Date().toISOString().slice(0, 13).replaceAll(/[-T:]/g, "")
  const db = getAdminDb()
  const rateRef = db.collection("request_rate_limits").doc(`account_delete_${rateKey}_${hour}`)
  const requestId = randomUUID()

  try {
    await db.runTransaction(async (transaction) => {
      const rateSnapshot = await transaction.get(rateRef)
      const count = Number(rateSnapshot.data()?.count || 0)
      if (count >= 5) throw new Error("RATE_LIMIT")

      const now = Timestamp.now()
      transaction.set(rateRef, {
        count: FieldValue.increment(1),
        updatedAt: now,
        expiresAt: Timestamp.fromMillis(Date.now() + 2 * 60 * 60 * 1000),
      }, { merge: true })
      transaction.set(db.collection("account_deletion_requests").doc(requestId), {
        email,
        technicianId: technicianId || null,
        reason: reason || null,
        source: "public_web",
        status: "pending_verification",
        createdAt: now,
        updatedAt: now,
      })
      transaction.set(db.collection("notifications").doc(`account_deletion_${requestId}`), {
        type: "account_deletion_request",
        title: "Account deletion request",
        message: `Account deletion requested for ${email}`,
        role: "admin",
        link: "/admin/requests",
        read: false,
        createdAt: now,
      })
    })
    return NextResponse.json({ ok: true, requestId })
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMIT") {
      return NextResponse.json({ ok: false, error: "Too many requests. Try again later." }, { status: 429 })
    }
    console.error("Account deletion request failed", error)
    return NextResponse.json({ ok: false, error: "Unable to submit the request right now." }, { status: 500 })
  }
}
