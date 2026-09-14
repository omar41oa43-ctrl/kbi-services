import { Timestamp } from "firebase-admin/firestore"
import { NextResponse } from "next/server"

import { authenticateTechnician } from "@/lib/api-auth"
import { getAdminDb } from "@/lib/firebase-admin"

export async function POST(request: Request) {
  const identity = await authenticateTechnician(request)
  if (!identity) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const channel = String(body?.channel || "app").trim().slice(0, 30) || "app"
  const db = getAdminDb()
  const now = Timestamp.now()
  const batch = db.batch()
  batch.set(db.collection("activation_requests").doc(identity.uid), {
    userId: identity.uid,
    status: "pending",
    channel,
    createdAt: now,
    updatedAt: now,
  }, { merge: true })
  batch.set(db.collection("notifications").doc(`activation_${identity.uid}`), {
    type: "activation_request",
    title: "طلب تفعيل فني",
    message: `${identity.email || identity.uid} طلب تفعيل الحساب`,
    role: "admin",
    technicianId: identity.uid,
    link: "/admin/technicians",
    read: false,
    createdAt: now,
  }, { merge: true })
  batch.set(db.collection("audit_logs").doc(), {
    actorUid: identity.uid,
    actorRole: "technician",
    action: "technician_activation_requested",
    targetCollection: "activation_requests",
    targetId: identity.uid,
    createdAt: now,
  })
  await batch.commit()
  return NextResponse.json({ success: true })
}
