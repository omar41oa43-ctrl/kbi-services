import { FieldValue } from "firebase-admin/firestore"
import { NextRequest, NextResponse } from "next/server"

import { verifyAdmin, getAdminDb, getAdminMessaging } from "@/lib/firebase-admin"
import { normalizeOrderStatus, ORDER_STATUSES } from "@/lib/order-status"
import { reserveNextOrderNumber } from "@/lib/order-number"

export async function POST(request: NextRequest) {
  const identity = await verifyAdmin(request)
  if (!identity) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ ok: false, error: "Invalid request payload" }, { status: 400 })
  }

  const customerName = String(body.customerName || body.clientName || "").trim()
  const customerPhone = String(body.customerPhone || body.clientPhone || body.phone || "").trim()
  const device = String(body.device || body.deviceModel || "").trim()
  const service = String(body.service || body.serviceType || "").trim()
  const address = String(body.address || "").trim()

  if (!customerName || !customerPhone || !device || !service || !address) {
    return NextResponse.json(
      { ok: false, error: "Customer name, phone, address, device, and service are required." },
      { status: 400 }
    )
  }

  const priceNum = Number(body.price ?? body.totalAmount ?? body.serviceAmount)
  if (!Number.isFinite(priceNum) || priceNum <= 0) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid order price greater than AED 0." },
      { status: 400 }
    )
  }

  const rawStatus = String(body.status || "").trim().toUpperCase()
  const rawPriority = String(body.priority || "NORMAL").trim().toUpperCase()
  const priority = ["LOW", "NORMAL", "HIGH", "URGENT"].includes(rawPriority) ? rawPriority : "NORMAL"

  const rawIds = Array.isArray(body.technicianIds)
    ? body.technicianIds
    : body.technicianId
    ? [body.technicianId]
    : []
  const rawNames = Array.isArray(body.technicianNames)
    ? body.technicianNames
    : body.technicianName
    ? [body.technicianName]
    : []

  const technicianIds = rawIds.map(String).map((s: string) => s.trim()).filter((s: string) => s.length > 0)
  const technicianNames = rawNames.map(String).map((s: string) => s.trim()).filter((s: string) => s.length > 0)

  const primaryTechnicianId = technicianIds[0] || ""
  const primaryTechnicianName = technicianNames[0] || ""

  // If a technician is assigned, default status to ASSIGNED, otherwise PENDING
  const status = normalizeOrderStatus(
    rawStatus && ORDER_STATUSES.includes(rawStatus as any)
      ? rawStatus
      : technicianIds.length > 0
      ? "ASSIGNED"
      : "PENDING"
  )

  const db = getAdminDb()

  // Generate a durable reference through a Firestore transaction. Starting new
  // counters with standard 6-digit format KBI-000001
  const customRef = String(body.orderNumber || body.reference || "").trim().toUpperCase()
  let orderNumber: string
  if (customRef) {
    orderNumber = customRef.startsWith("KBI-") ? customRef : `KBI-${customRef}`
    const duplicate = await db.collection("orders").where("orderNumber", "==", orderNumber).limit(1).get()
    if (!duplicate.empty) {
      return NextResponse.json({ ok: false, error: `${orderNumber} already exists.` }, { status: 409 })
    }
  } else {
    orderNumber = await reserveNextOrderNumber()
  }

  const latNum = Number(body.latitude)
  const lngNum = Number(body.longitude)
  const hasCoordinates = Number.isFinite(latNum) && Number.isFinite(lngNum)
  const orderRef = db.collection("orders").doc()
  const orderId = orderRef.id

  const newOrderDoc = {
    id: orderId,
    orderId: orderNumber,
    orderNumber: orderNumber,
    trackingCode: orderNumber,
    reference: orderNumber,
    customerName: customerName,
    clientName: customerName,
    customerPhone: customerPhone,
    clientPhone: customerPhone,
    phone: customerPhone,
    customerEmail: String(body.customerEmail || body.email || "").trim(),
    email: String(body.customerEmail || body.email || "").trim(),
    device: device,
    deviceModel: device,
    service: service,
    serviceType: service,
    issue: service,
    problemDescription: String(body.problemDescription || body.notes || "").trim(),
    notes: String(body.notes || "").trim(),
    address,
    city: String(body.city || "Abu Dhabi").trim(),
    area: String(body.area || "").trim(),
    ...(hasCoordinates ? { latitude: latNum, longitude: lngNum } : {}),
    location: {
      ...(hasCoordinates ? { lat: latNum, lng: lngNum, latitude: latNum, longitude: lngNum } : {}),
      address,
    },
    status: status,
    priority: priority,
    price: priceNum,
    finalAmount: priceNum,
    totalAmount: priceNum,
    serviceAmount: priceNum,
    estimatedPrice: priceNum,
    currency: "AED",
    assignedTechnician: primaryTechnicianId || null,
    assignedTechnicianId: primaryTechnicianId || null,
    technicianId: primaryTechnicianId || null,
    technicianName: primaryTechnicianName || null,
    assignedTechnicians: technicianIds,
    assignedTechnicianNames: technicianNames,
    technicianIds: technicianIds,
    technicianNames: technicianNames,
    scheduledDate: String(body.scheduledDate || new Date().toISOString().split("T")[0]).trim(),
    scheduledTime: String(body.scheduledTime || "ASAP").trim(),
    timeSlot: String(body.timeSlot || "ASAP").trim(),
    source: "ADMIN_PORTAL",
    createdBy: identity.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }

  // Write every consumer-facing source atomically so the admin and technician
  // applications never observe a partially created work order.
  const createBatch = db.batch()
  createBatch.set(orderRef, newOrderDoc)
  createBatch.set(db.collection("bookings").doc(orderId), newOrderDoc)
  createBatch.set(db.collection("service_requests").doc(orderId), newOrderDoc)
  await createBatch.commit()

  // 3. If technicians assigned, update technician status and dispatch real-time in-app & FCM push notifications
  if (technicianIds.length > 0) {
    for (const techId of technicianIds) {
      try {
        await db.collection("technicians").doc(techId).set({
          currentJob: orderId,
          currentOrder: orderId,
          status: "ON_JOB",
          available: false,
          pendingRemoteCommand: {
            cmdId: `cmd-${Date.now()}`,
            action: "NAVIGATE",
            payload: {
              screen: "INCOMING_ORDER",
              orderId: orderId,
              reference: String(orderNumber),
            },
            createdAt: FieldValue.serverTimestamp(),
          },
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true })

        await db.collection("notifications").add({
          userId: techId,
          technicianId: techId,
          title: `🚨 New Order Assigned: ${orderNumber}`,
          body: `Assigned to ${customerName} for ${device} (${service}) at ${address}.`,
          type: "job",
          category: "Jobs",
          orderId: orderNumber,
          workOrderId: orderId,
          isRead: false,
          createdAt: FieldValue.serverTimestamp(),
        })

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
                title: `🚨 New Order: ${orderNumber}`,
                body: `${customerName} • ${device} (${service})`,
              },
              data: {
                orderId: orderId,
                reference: orderNumber,
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

  // 4. Log in order status history
  await db.collection("order_status_history").add({
    workOrderId: orderId,
    source: "orders",
    reference: orderNumber,
    fromStatus: "CREATED",
    toStatus: status,
    priority: priority,
    technicianId: primaryTechnicianId || null,
    technicianIds: technicianIds,
    changedBy: identity.uid,
    changedAt: FieldValue.serverTimestamp(),
  })

  return NextResponse.json({
    ok: true,
    orderId: orderId,
    reference: orderNumber,
  })
}
