import { FieldValue, Timestamp } from "firebase-admin/firestore"
import { NextResponse } from "next/server"

import { authenticateTechnician } from "@/lib/api-auth"
import { getAdminDb } from "@/lib/firebase-admin"

const canonicalStatuses: Record<string, string> = {
  accepted: "Accepted",
  rejected: "Rejected",
  "on the way": "on_the_way",
  arrived: "arrived",
  "in progress": "in_progress",
  working: "in_progress",
  completed: "Completed",
  cancelled: "Cancelled",
}

const offerStatuses = new Set([
  "assigned",
  "pending",
  "pending acceptance",
  "offered",
  "awaiting acceptance",
])

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const identity = await authenticateTechnician(request)
  if (!identity) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const workOrderId = String(id || "").trim()
  const body = await request.json().catch(() => ({}))
  const normalizedStatus = String(body?.status || "").trim().toLowerCase().replaceAll("_", " ")
  const status = canonicalStatuses[normalizedStatus]
  const notes = String(body?.notes || "").trim().slice(0, 500)
  if (!workOrderId || !status) {
    return NextResponse.json({ success: false, error: "Invalid order decision" }, { status: 400 })
  }

  const db = getAdminDb()
  const refs = ["bookings", "orders", "service_requests"].map((collection) =>
    db.collection(collection).doc(workOrderId),
  )
  const [techSnap, userSnap] = await Promise.all([
    db.collection("technicians").doc(identity.uid).get(),
    db.collection("users").doc(identity.uid).get(),
  ])
  const tech = techSnap.data()
  const user = userSnap.data()
  const technicianName = String(
    tech?.full_name || tech?.name || user?.full_name || user?.name || user?.displayName || identity.email || "Technician",
  ).trim()

  try {
    let alreadySaved = false
    let orderReference = workOrderId

    await db.runTransaction(async (transaction) => {
      const snapshots = await Promise.all(refs.map((ref) => transaction.get(ref)))
      const existing = snapshots.filter((snapshot) => snapshot.exists)
      if (existing.length === 0) throw new Error("NOT_FOUND")

      const assignedToCaller = existing.some((snapshot) => {
        const data = snapshot.data()
        const singleIds = [data?.assignedTechnician, data?.assignedTechnicianId, data?.technicianId, data?.techId]
          .map((value) => String(value || ""))
        const listIds = [data?.assignedTechnicians, data?.technicianIds]
          .flatMap((value) => Array.isArray(value) ? value : [])
          .map((value) => String(value || ""))
        return singleIds.includes(identity.uid) || listIds.includes(identity.uid)
      })
      if (!assignedToCaller) throw new Error("NOT_ASSIGNED")

      const representative = existing[0].data()
      orderReference = String(
        representative?.orderNumber || representative?.trackingCode || representative?.orderId || workOrderId,
      )
      const previousStatus = String(representative?.status || "").toLowerCase().replaceAll("_", " ")
      if (previousStatus === normalizedStatus) {
        alreadySaved = true
        return
      }
      if (["accepted", "rejected"].includes(normalizedStatus) && !offerStatuses.has(previousStatus)) {
        throw new Error("ALREADY_ANSWERED")
      }

      const now = Timestamp.now()
      const payload: Record<string, unknown> = {
        status,
        technicianNotes: notes || null,
        updatedAt: now,
      }
      if (["accepted", "rejected"].includes(normalizedStatus)) {
        payload.technicianDecision = normalizedStatus
        payload.technicianDecisionAt = now
      }
      if (normalizedStatus === "accepted") payload.acceptedAt = now
      if (normalizedStatus === "rejected") payload.rejectedAt = now
      if (["completed", "cancelled"].includes(normalizedStatus)) payload.completedAt = now

      snapshots.forEach((snapshot, index) => {
        if (snapshot.exists) transaction.set(refs[index], payload, { merge: true })
      })

      const finished = ["rejected", "completed", "cancelled"].includes(normalizedStatus)
      transaction.set(db.collection("technicians").doc(identity.uid), {
        currentJob: finished ? null : workOrderId,
        currentOrder: finished ? null : workOrderId,
        status: finished ? "AVAILABLE" : "ON_JOB",
        available: finished,
        ...(finished ? { activeJobs: FieldValue.arrayRemove(workOrderId) } : {}),
        updatedAt: now,
      }, { merge: true })

      if (["accepted", "rejected"].includes(normalizedStatus)) {
        const accepted = normalizedStatus === "accepted"
        transaction.set(
          db.collection("notifications").doc(`job_decision_${workOrderId}_${identity.uid}_${normalizedStatus}`),
          {
            type: accepted ? "job_accepted" : "job_rejected",
            title: accepted ? "تم قبول الطلب" : "تم رفض الطلب",
            message: accepted
              ? `${technicianName} قبل الطلب ${orderReference}`
              : `${technicianName} رفض الطلب ${orderReference}${notes ? ` — ${notes}` : ""}`,
            role: "admin",
            technicianId: identity.uid,
            technicianName,
            workOrderId,
            orderId: orderReference,
            status: normalizedStatus,
            link: "/admin/orders",
            read: false,
            createdAt: now,
          },
        )
      }

      transaction.set(db.collection("audit_logs").doc(), {
        actorUid: identity.uid,
        actorRole: "technician",
        action: `work_order_${normalizedStatus.replaceAll(" ", "_")}`,
        targetCollection: "orders",
        targetId: workOrderId,
        orderId: workOrderId,
        details: { technicianName, orderReference, notes: notes || null },
        createdAt: now,
      })
    })

    return NextResponse.json({ success: true, status: normalizedStatus, alreadySaved })
  } catch (error) {
    const code = error instanceof Error ? error.message : ""
    if (code === "NOT_FOUND") {
      return NextResponse.json({ success: false, error: "Work order not found" }, { status: 404 })
    }
    if (code === "NOT_ASSIGNED") {
      return NextResponse.json({ success: false, error: "This order is not assigned to you" }, { status: 403 })
    }
    if (code === "ALREADY_ANSWERED") {
      return NextResponse.json({ success: false, error: "This assignment has already been answered" }, { status: 409 })
    }
    console.error("Technician decision error:", error)
    return NextResponse.json({ success: false, error: "Unable to save decision" }, { status: 500 })
  }
}
