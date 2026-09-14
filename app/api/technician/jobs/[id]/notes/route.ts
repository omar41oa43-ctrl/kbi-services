import { Timestamp } from "firebase-admin/firestore"
import { NextResponse } from "next/server"

import { authenticateTechnician } from "@/lib/api-auth"
import { getAdminDb } from "@/lib/firebase-admin"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const identity = await authenticateTechnician(request)
  if (!identity) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const workOrderId = String(id || "").trim()
  const body = await request.json().catch(() => ({}))
  const note = String(body?.note || "").trim().slice(0, 2000)
  if (!workOrderId || !note) return NextResponse.json({ success: false, error: "Order and note are required" }, { status: 400 })

  const db = getAdminDb()
  const refs = ["bookings", "orders", "service_requests"].map((collection) => db.collection(collection).doc(workOrderId))
  try {
    await db.runTransaction(async (transaction) => {
      const snapshots = await Promise.all(refs.map((ref) => transaction.get(ref)))
      const existing = snapshots.filter((snapshot) => snapshot.exists)
      if (existing.length === 0) throw new Error("NOT_FOUND")
      const assigned = existing.some((snapshot) => {
        const data = snapshot.data()
        const single = [data?.assignedTechnician, data?.assignedTechnicianId, data?.technicianId, data?.techId]
          .map((value) => String(value || ""))
        const multiple = [data?.assignedTechnicians, data?.technicianIds]
          .flatMap((value) => Array.isArray(value) ? value : [])
          .map((value) => String(value || ""))
        return single.includes(identity.uid) || multiple.includes(identity.uid)
      })
      if (!assigned) throw new Error("NOT_ASSIGNED")
      const payload = { technicianNotes: note, updatedAt: Timestamp.now() }
      snapshots.forEach((snapshot, index) => {
        if (snapshot.exists) transaction.set(refs[index], payload, { merge: true })
      })
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    const code = error instanceof Error ? error.message : ""
    if (code === "NOT_FOUND") return NextResponse.json({ success: false, error: "Work order not found" }, { status: 404 })
    if (code === "NOT_ASSIGNED") return NextResponse.json({ success: false, error: "This order is not assigned to you" }, { status: 403 })
    console.error("Technician note error:", error)
    return NextResponse.json({ success: false, error: "Unable to save the note" }, { status: 500 })
  }
}
