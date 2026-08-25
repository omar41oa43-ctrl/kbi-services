import { FieldValue } from "firebase-admin/firestore"
import { NextRequest, NextResponse } from "next/server"

import { verifyAdmin, getAdminDb, getAdminMessaging } from "@/lib/firebase-admin"
import { normalizeOrderStatus, ORDER_STATUSES } from "@/lib/order-status"

const allowedSources = new Set(["bookings", "orders"])
const allowedPriorities = new Set(["LOW", "NORMAL", "HIGH", "URGENT"])

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ source: string; id: string }> },
) {
  const identity = await verifyAdmin(request)
  if (!identity) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })

  const { source, id } = await params
  if (!allowedSources.has(source)) {
    return NextResponse.json({ ok: false, error: "Invalid work-order source" }, { status: 400 })
  }

  const body = await request.json().catch(() => null)
  const status = normalizeOrderStatus(body?.status)
  const priority = String(body?.priority || "NORMAL").trim().toUpperCase()
  if (!ORDER_STATUSES.includes(status) || !allowedPriorities.has(priority)) {
    return NextResponse.json({ ok: false, error: "Invalid update" }, { status: 400 })
  }

  const db = getAdminDb()
  const reference = db.collection(source).doc(id)
  const existing = await reference.get()
  if (!existing.exists) return NextResponse.json({ ok: false, error: "Work order not found" }, { status: 404 })

  const rawIds = Array.isArray(body?.technicianIds)
    ? body.technicianIds
    : Array.isArray(body?.assignedTechnicians)
    ? body.assignedTechnicians
    : body?.technicianId
    ? [body.technicianId]
    : []

  const rawNames = Array.isArray(body?.technicianNames)
    ? body.technicianNames
    : Array.isArray(body?.assignedTechnicianNames)
    ? body.assignedTechnicianNames
    : body?.technicianName
    ? [body.technicianName]
    : []

  const technicianIds = rawIds.map(String).map((s: string) => s.trim()).filter((s: string) => s.length > 0)
  const technicianNames = rawNames.map(String).map((s: string) => s.trim()).filter((s: string) => s.length > 0)

  const primaryTechnicianId = technicianIds[0] || (typeof body?.technicianId === "string" ? body.technicianId.trim() : "")
  const primaryTechnicianName = technicianNames[0] || (typeof body?.technicianName === "string" ? body.technicianName.trim() : "")

  // If a technician is assigned directly and status was PENDING or default, promote directly to ASSIGNED
  const finalStatus = technicianIds.length > 0 && (status === "PENDING" || !body?.status)
    ? "ASSIGNED"
    : status

  const previous = existing.data() || {}
  const previousTechnicianIds = (Array.isArray(previous.technicianIds)
    ? previous.technicianIds
    : Array.isArray(previous.assignedTechnicians)
    ? previous.assignedTechnicians
    : previous.technicianId || previous.assignedTechnicianId || previous.assignedTechnician
    ? [previous.technicianId || previous.assignedTechnicianId || previous.assignedTechnician]
    : []).map(String).filter(Boolean)
  const newlyAssignedIds = technicianIds.filter((techId: string) => !previousTechnicianIds.includes(techId))
  const terminalUpdate = ["COMPLETED", "CANCELLED", "REJECTED"].includes(finalStatus)
  const releasedTechnicianIds = terminalUpdate
    ? Array.from(new Set([...previousTechnicianIds, ...technicianIds]))
    : previousTechnicianIds.filter((techId: string) => !technicianIds.includes(techId))
  const parsedAmount = typeof body?.totalAmount === "number" || typeof body?.price === "number" || typeof body?.serviceAmount === "number" || (typeof body?.totalAmount === "string" && !isNaN(Number(body.totalAmount)))
    ? Number(body?.totalAmount ?? body?.price ?? body?.serviceAmount)
    : undefined

  const orderPayload = {
    status: finalStatus,
    priority,
    ...(parsedAmount !== undefined ? { totalAmount: parsedAmount, price: parsedAmount, serviceAmount: parsedAmount } : {}),
    assignedTechnician: primaryTechnicianId || null,
    assignedTechnicianId: primaryTechnicianId || null,
    technicianId: primaryTechnicianId || null,
    technicianName: primaryTechnicianName || null,
    assignedTechnicians: technicianIds,
    assignedTechnicianNames: technicianNames,
    technicianIds: technicianIds,
    technicianNames: technicianNames,
    ...(technicianIds.length > 0 ? { assignedAt: FieldValue.serverTimestamp() } : {}),
    updatedAt: FieldValue.serverTimestamp(),
  }

  // Keep every app-facing source on the same revision atomically.
  const syncBatch = db.batch()
  for (const collectionName of ["orders", "bookings", "service_requests"]) {
    syncBatch.set(db.collection(collectionName).doc(id), orderPayload, { merge: true })
  }
  await syncBatch.commit()

  // Safely sync technicians' currentJob status in Firestore and send direct in-app alerts + push notifications
  const orderRef = previous.orderId || previous.bookingId || previous.orderNumber || id
  const customerName = previous.customerName || previous.clientName || previous.name || "Customer"
  const serviceName = previous.service || previous.serviceName || previous.device || "Device Repair"
  const customerAddress = previous.address || previous.location?.address || "Abu Dhabi, UAE"

  if (newlyAssignedIds.length > 0 && !terminalUpdate) {
    for (const techId of newlyAssignedIds) {
      try {
        // 1. Update technician active state & dispatch direct remote screen trigger
        await db.collection("technicians").doc(techId).set({
          currentJob: id,
          currentOrder: id,
          status: "ON_JOB",
          available: false,
          pendingRemoteCommand: {
            cmdId: `cmd-${Date.now()}`,
            action: "NAVIGATE",
            payload: {
              screen: "INCOMING_ORDER",
              orderId: id,
              reference: String(orderRef),
            },
            createdAt: FieldValue.serverTimestamp(),
          },
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true })

        // 2. Create in-app notification
        await db.collection("notifications").add({
          userId: techId,
          technicianId: techId,
          title: `New Dispatch: ${orderRef}`,
          body: `You have been assigned to ${customerName} (${serviceName}) at ${customerAddress}.`,
          type: "job",
          category: "Jobs",
          orderId: orderRef,
          workOrderId: id,
          isRead: false,
          createdAt: FieldValue.serverTimestamp(),
        })

        // 3. Send high-priority FCM push notification if device token exists
        try {
          const messaging = getAdminMessaging()
          const [techDoc, userDoc] = await Promise.all([
            db.collection("technicians").doc(techId).get(),
            db.collection("users").doc(techId).get(),
          ])
          const fcmToken =
            techDoc.data()?.fcmToken ||
            userDoc.data()?.fcmToken ||
            techDoc.data()?.pushToken ||
            userDoc.data()?.pushToken

          if (fcmToken && typeof fcmToken === "string" && fcmToken.length > 10) {
            await messaging.send({
              token: fcmToken,
              notification: {
                title: `🚨 New Dispatch: ${orderRef}`,
                body: `Assigned to ${customerName} (${serviceName})`,
              },
              data: {
                orderId: id,
                reference: String(orderRef),
                type: "job_assigned",
                click_action: "FLUTTER_NOTIFICATION_CLICK",
              },
              apns: {
                payload: {
                  aps: {
                    sound: "default",
                    badge: 1,
                    contentAvailable: true,
                  },
                },
              },
            })
          }
        } catch (pushErr) {
          console.warn(`FCM direct push notification notice for ${techId}:`, pushErr)
        }
      } catch (techErr) {
        console.warn(`Technician status sync notice for ${techId}:`, techErr)
      }
    }
  }

  if (releasedTechnicianIds.length > 0) {
    for (const techId of releasedTechnicianIds) {
      try {
        const technicianRef = db.collection("technicians").doc(techId)
        const technicianSnapshot = await technicianRef.get()
        const currentJob = String(technicianSnapshot.data()?.currentJob || technicianSnapshot.data()?.currentOrder || "")
        if (currentJob && currentJob !== id) continue
        await technicianRef.set({
          currentJob: null,
          currentOrder: null,
          status: "AVAILABLE",
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true })
      } catch (techErr) {
        console.warn(`Technician free status sync notice for ${techId}:`, techErr)
      }
    }
  }

  await db.collection("order_status_history").add({
    workOrderId: id,
    source,
    reference: previous.orderId || previous.bookingId || previous.orderNumber || id,
    fromStatus: normalizeOrderStatus(previous.status),
    toStatus: finalStatus,
    priority,
    technicianId: primaryTechnicianId || null,
    technicianIds,
    changedBy: identity.uid,
    changedAt: FieldValue.serverTimestamp(),
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ source: string; id: string }> },
) {
  const identity = await verifyAdmin(request)
  if (!identity) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })

  const { source, id } = await params
  if (!allowedSources.has(source)) {
    return NextResponse.json({ ok: false, error: "Invalid work-order source" }, { status: 400 })
  }

  const db = getAdminDb()
  const reference = db.collection(source).doc(id)
  const existing = await reference.get()
  if (!existing.exists) return NextResponse.json({ ok: false, error: "Work order not found" }, { status: 404 })

  const previous = existing.data() || {}
  const orderRef = previous.orderId || previous.bookingId || previous.orderNumber || id
  const assignedIds = (Array.isArray(previous.technicianIds)
    ? previous.technicianIds
    : Array.isArray(previous.assignedTechnicians)
    ? previous.assignedTechnicians
    : previous.technicianId || previous.assignedTechnicianId || previous.assignedTechnician
    ? [previous.technicianId || previous.assignedTechnicianId || previous.assignedTechnician]
    : []).map(String).filter(Boolean)

  const deleteBatch = db.batch()
  for (const collectionName of ["orders", "bookings", "service_requests"]) {
    deleteBatch.delete(db.collection(collectionName).doc(id))
  }
  await deleteBatch.commit()

  for (const techId of assignedIds) {
    try {
      const technicianRef = db.collection("technicians").doc(techId)
      const technicianSnapshot = await technicianRef.get()
      const currentJob = String(technicianSnapshot.data()?.currentJob || technicianSnapshot.data()?.currentOrder || "")
      if (currentJob && currentJob !== id) continue
      await technicianRef.set({
        currentJob: null,
        currentOrder: null,
        status: "AVAILABLE",
        available: true,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true })
    } catch (releaseError) {
      console.warn(`Technician release notice for ${techId}:`, releaseError)
    }
  }

  await db.collection("order_status_history").add({
    workOrderId: id,
    source,
    reference: orderRef,
    action: "DELETED",
    changedBy: identity.uid,
    changedAt: FieldValue.serverTimestamp(),
  })

  return NextResponse.json({ ok: true })
}
