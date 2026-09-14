import { FieldValue, Timestamp, type DocumentData } from "firebase-admin/firestore"
import { NextResponse } from "next/server"

import { authenticateTechnician } from "@/lib/api-auth"
import { getAdminDb } from "@/lib/firebase-admin"

function assignedTo(uid: string, data: DocumentData | undefined) {
  const single = [data?.assignedTechnician, data?.assignedTechnicianId, data?.technicianId, data?.techId]
    .map((value) => String(value || ""))
  const multiple = [data?.assignedTechnicians, data?.technicianIds]
    .flatMap((value) => Array.isArray(value) ? value : [])
    .map((value) => String(value || ""))
  return single.includes(uid) || multiple.includes(uid)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const identity = await authenticateTechnician(request)
  if (!identity) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const workOrderId = String(id || "").trim()
  const body = await request.json().catch(() => ({}))
  const finalPrice = Number(body?.finalPrice)
  const notes = String(body?.notes || "").trim().slice(0, 2000)
  const paymentMethod = String(body?.paymentMethod || "").trim().slice(0, 80)
  const photos = (Array.isArray(body?.photos) ? body.photos : [])
    .map((value: unknown) => String(value || "").trim())
    .filter(Boolean)
    .slice(0, 12)
  if (!workOrderId || !Number.isFinite(finalPrice) || finalPrice < 0 || finalPrice > 1_000_000) {
    return NextResponse.json({ success: false, error: "A valid order and final price are required" }, { status: 400 })
  }

  const db = getAdminDb()
  const refs = ["bookings", "orders", "service_requests"].map((collection) =>
    db.collection(collection).doc(workOrderId),
  )

  try {
    await db.runTransaction(async (transaction) => {
      const snapshots = await Promise.all(refs.map((ref) => transaction.get(ref)))
      const existing = snapshots.filter((snapshot) => snapshot.exists)
      if (existing.length === 0) throw new Error("NOT_FOUND")
      if (!existing.some((snapshot) => assignedTo(identity.uid, snapshot.data()))) throw new Error("NOT_ASSIGNED")

      const current = String(existing[0].data()?.status || "").toLowerCase().replaceAll("_", " ")
      if (["cancelled", "rejected"].includes(current)) throw new Error("TERMINAL")
      const now = Timestamp.now()
      const payload = {
        status: "Completed",
        finalPrice,
        finalAmount: finalPrice,
        completionNotes: notes,
        paymentMethod,
        completionPhotos: photos,
        completedAt: now,
        updatedAt: now,
      }
      snapshots.forEach((snapshot, index) => {
        if (snapshot.exists) transaction.set(refs[index], payload, { merge: true })
      })
      transaction.set(db.collection("technicians").doc(identity.uid), {
        currentJob: null,
        currentOrder: null,
        activeJob: null,
        activeOrderId: null,
        activeJobs: FieldValue.arrayRemove(workOrderId),
        status: "AVAILABLE",
        available: true,
        updatedAt: now,
      }, { merge: true })
      transaction.set(db.collection("notifications").doc(`job_completed_${workOrderId}_${identity.uid}`), {
        type: "job_completed",
        title: "تم إكمال الطلب",
        message: `تم إكمال الطلب ${workOrderId} بقيمة ${finalPrice.toFixed(2)} AED`,
        role: "admin",
        technicianId: identity.uid,
        workOrderId,
        status: "completed",
        link: "/admin/orders",
        read: false,
        createdAt: now,
      }, { merge: true })
      transaction.set(db.collection("audit_logs").doc(), {
        actorUid: identity.uid,
        actorRole: "technician",
        action: "work_order_completed",
        targetCollection: "orders",
        targetId: workOrderId,
        orderId: workOrderId,
        details: { finalPrice, paymentMethod, photoCount: photos.length },
        createdAt: now,
      })
    })
    return NextResponse.json({ success: true, status: "completed" })
  } catch (error) {
    const code = error instanceof Error ? error.message : ""
    if (code === "NOT_FOUND") return NextResponse.json({ success: false, error: "Work order not found" }, { status: 404 })
    if (code === "NOT_ASSIGNED") return NextResponse.json({ success: false, error: "This order is not assigned to you" }, { status: 403 })
    if (code === "TERMINAL") return NextResponse.json({ success: false, error: "This work order can no longer be completed" }, { status: 409 })
    console.error("Technician completion error:", error)
    return NextResponse.json({ success: false, error: "Unable to complete the order" }, { status: 500 })
  }
}
