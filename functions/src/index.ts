import * as admin from "firebase-admin"
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore"
import { onCall, HttpsError } from "firebase-functions/v2/https"
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore"
import { onSchedule } from "firebase-functions/v2/scheduler"

import { assignServiceRequest, handleAssignmentTimeout } from "./matching"
import { expireSubscriptionsBatch } from "./subscriptions"
import { sendToTopic, sendToTokens } from "./notifications"
import { writeAuditLog } from "./audit"
import { toNumber, uniqueStrings } from "./utils"

admin.initializeApp()

export const serviceRequestCreated = onDocumentCreated("service_requests/{id}", async (event) => {
  const id = String(event.params.id || "")
  if (!id) return
  await assignServiceRequest(id)
})

export const technicianRequestCreated = onDocumentCreated("technician_requests/{id}", async (event) => {
  const id = String(event.params.id || "")
  const data = event.data?.data() as any
  await writeAuditLog({
    action: "technician_request_created",
    targetCollection: "technician_requests",
    targetId: id,
    details: { name: data?.name, phone: data?.phone },
  })
  await sendToTopic({
    topic: "admins",
    title: "New technician registration",
    body: "A new technician is waiting for approval.",
    data: { requestId: id, type: "technician_request" },
  })
})

export const serviceRequestStatusUpdated = onDocumentUpdated("service_requests/{id}", async (event) => {
  const id = String(event.params.id || "")
  const before = event.data?.before.data() as any
  const after = event.data?.after.data() as any
  const bStatus = String(before?.status || "")
  const aStatus = String(after?.status || "")
  if (!id || bStatus === aStatus) return

  const techId = String(after?.technicianId || "")
  if (techId) {
    const db = getFirestore()
    const techSnap = await db.collection("technicians").doc(techId).get()
    const token = (techSnap.data() as any)?.fcmToken
    if (token) {
      await sendToTokens({
        tokens: [token],
        title: "Job updated",
        body: `Status changed to ${aStatus}`,
        data: { requestId: id, status: aStatus },
      })
    }
  }

  await writeAuditLog({
    action: "service_request_status_changed",
    targetCollection: "service_requests",
    targetId: id,
    requestId: id,
    details: { from: bStatus, to: aStatus, technicianId: techId || null },
  })
})

export const assignmentTimeout = onSchedule("every 1 minutes", async () => {
  await handleAssignmentTimeout()
})

export const expireSubscriptions = onSchedule("every day 02:05", async () => {
  await expireSubscriptionsBatch()
})

export const registerTechnician = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError("unauthenticated", "Login required")
  const name = String((request.data as any)?.name || "").trim()
  const phone = String((request.data as any)?.phone || "").trim()
  const skills = Array.isArray((request.data as any)?.skills) ? (request.data as any).skills.map((s: any) => String(s)) : []
  if (!name || !phone || skills.length === 0) throw new HttpsError("invalid-argument", "Missing fields")

  const db = getFirestore()
  const now = Timestamp.now()

  await db.collection("users").doc(uid).set({ role: "technician", updatedAt: now }, { merge: true })
  const reqRef = db.collection("technician_requests").doc()
  await reqRef.set({
    userId: uid,
    name,
    phone,
    skills,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  })

  await writeAuditLog({
    actorUid: uid,
    actorRole: "technician",
    action: "technician_register_submitted",
    targetCollection: "technician_requests",
    targetId: reqRef.id,
    details: { name, phone, skills },
  })

  await sendToTopic({
    topic: "admins",
    title: "New technician registration",
    body: `${name} submitted a registration request.`,
    data: { requestId: reqRef.id, type: "technician_request" },
  })

  return { requestId: reqRef.id }
})

export const updateTechnicianStatus = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError("unauthenticated", "Login required")
  const db = getFirestore()
  const userSnap = await db.collection("users").doc(uid).get()
  const role = (userSnap.data() as any)?.role
  if (role !== "admin" && role !== "super_admin") throw new HttpsError("permission-denied", "Admin only")

  const techId = String((request.data as any)?.techId || "")
  const isApproved = Boolean((request.data as any)?.isApproved)
  const isActive = Boolean((request.data as any)?.isActive)
  const subscriptionStatus = String((request.data as any)?.subscriptionStatus || "inactive")
  if (!techId) throw new HttpsError("invalid-argument", "techId required")

  const now = Timestamp.now()
  await db.collection("technicians").doc(techId).set(
    {
      isApproved,
      isActive,
      subscriptionStatus,
      updatedAt: now,
    },
    { merge: true }
  )

  await writeAuditLog({
    actorUid: uid,
    actorRole: role,
    action: "technician_status_updated",
    targetCollection: "technicians",
    targetId: techId,
    details: { isApproved, isActive, subscriptionStatus },
  })

  return { ok: true }
})

export const technicianUpdateLocation = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError("unauthenticated", "Login required")
  const lat = toNumber((request.data as any)?.lat, NaN)
  const lng = toNumber((request.data as any)?.lng, NaN)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new HttpsError("invalid-argument", "Invalid coordinates")
  const db = getFirestore()
  const now = Timestamp.now()
  await db.collection("technicians").doc(uid).set({ location: { lat, lng }, updatedAt: now }, { merge: true })
  return { ok: true }
})

export const technicianUpdateFcmToken = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError("unauthenticated", "Login required")
  const token = String((request.data as any)?.token || "").trim()
  if (!token) throw new HttpsError("invalid-argument", "token required")
  const db = getFirestore()
  const now = Timestamp.now()
  await db.collection("technicians").doc(uid).set({ fcmToken: token, updatedAt: now }, { merge: true })
  return { ok: true }
})

/**
 * Persist a technician's work-order decision on the server. Legacy admin
 * flows mirror one order into three collections, so update every existing
 * mirror atomically and create one deterministic admin notification.
 */
export const technicianUpdateJob = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError("unauthenticated", "Login required")

  const bookingId = String((request.data as any)?.bookingId || "").trim()
  const requestedStatus = String((request.data as any)?.status || "").trim()
  const notes = String((request.data as any)?.notes || "").trim().slice(0, 500)
  if (!bookingId || !requestedStatus) {
    throw new HttpsError("invalid-argument", "bookingId and status are required")
  }

  const normalizedStatus = requestedStatus.toLowerCase().replaceAll("_", " ")
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
  const status = canonicalStatuses[normalizedStatus]
  if (!status) throw new HttpsError("invalid-argument", "Unsupported job status")

  const db = getFirestore()
  const refs = ["bookings", "orders", "service_requests"].map((collection) =>
    db.collection(collection).doc(bookingId),
  )
  const [techSnap, userSnap] = await Promise.all([
    db.collection("technicians").doc(uid).get(),
    db.collection("users").doc(uid).get(),
  ])
  const tech = techSnap.data() as any
  const user = userSnap.data() as any
  const technicianName = String(
    tech?.full_name || tech?.name || user?.full_name || user?.name || user?.displayName || "Technician",
  ).trim()

  let orderReference = bookingId
  let decisionAlreadySaved = false
  await db.runTransaction(async (transaction) => {
    const snapshots = await Promise.all(refs.map((ref) => transaction.get(ref)))
    const existing = snapshots.filter((snapshot) => snapshot.exists)
    if (existing.length === 0) throw new HttpsError("not-found", "Work order not found")

    const isAssignedToTechnician = existing.some((snapshot) => {
      const data = snapshot.data() as any
      const singleIds = [data?.assignedTechnician, data?.assignedTechnicianId, data?.technicianId, data?.techId]
        .map((value) => String(value || ""))
      const listIds = [data?.assignedTechnicians, data?.technicianIds]
        .flatMap((value) => Array.isArray(value) ? value : [])
        .map((value) => String(value || ""))
      return singleIds.includes(uid) || listIds.includes(uid)
    })
    if (!isAssignedToTechnician) {
      throw new HttpsError("permission-denied", "This work order is not assigned to you")
    }

    const representative = existing[0].data() as any
    orderReference = String(
      representative?.orderNumber || representative?.trackingCode || representative?.orderId || bookingId,
    )
    const existingStatus = String(representative?.status || "").toLowerCase().replaceAll("_", " ")
    if (existingStatus === normalizedStatus) {
      decisionAlreadySaved = true
      return
    }

    if (["accepted", "rejected"].includes(normalizedStatus)) {
      const offerStatuses = new Set(["assigned", "pending", "pending acceptance", "offered", "awaiting acceptance"])
      if (!offerStatuses.has(existingStatus)) {
        throw new HttpsError("failed-precondition", "This assignment has already been answered")
      }
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

    const jobFinished = ["rejected", "completed", "cancelled"].includes(normalizedStatus)
    transaction.set(
      db.collection("technicians").doc(uid),
      {
        currentJob: jobFinished ? null : bookingId,
        currentOrder: jobFinished ? null : bookingId,
        status: jobFinished ? "AVAILABLE" : "ON_JOB",
        available: jobFinished,
        updatedAt: now,
      },
      { merge: true },
    )

    if (["accepted", "rejected"].includes(normalizedStatus)) {
      const accepted = normalizedStatus === "accepted"
      const notificationId = `job_decision_${bookingId}_${uid}_${normalizedStatus}`
      transaction.set(db.collection("notifications").doc(notificationId), {
        type: accepted ? "job_accepted" : "job_rejected",
        title: accepted ? "تم قبول الطلب" : "تم رفض الطلب",
        message: accepted
          ? `${technicianName} قبل الطلب ${orderReference}`
          : `${technicianName} رفض الطلب ${orderReference}${notes ? ` — ${notes}` : ""}`,
        role: "admin",
        technicianId: uid,
        technicianName,
        workOrderId: bookingId,
        orderId: orderReference,
        status: normalizedStatus,
        link: "/admin/orders",
        read: false,
        createdAt: now,
      }, { merge: false })
    }
  })

  if (!decisionAlreadySaved && ["accepted", "rejected"].includes(normalizedStatus)) {
    const accepted = normalizedStatus === "accepted"
    await Promise.allSettled([
      writeAuditLog({
        actorUid: uid,
        actorRole: "technician",
        action: accepted ? "work_order_accepted" : "work_order_rejected",
        targetCollection: "orders",
        targetId: bookingId,
        orderId: bookingId,
        details: { technicianName, orderReference, notes: notes || null },
      }),
      sendToTopic({
        topic: "admins",
        title: accepted ? "Job accepted" : "Job rejected",
        body: accepted
          ? `${technicianName} accepted ${orderReference}.`
          : `${technicianName} rejected ${orderReference}.`,
        data: { requestId: bookingId, technicianId: uid, status: normalizedStatus },
      }),
    ])
  }

  return { ok: true, status: normalizedStatus, alreadySaved: decisionAlreadySaved }
})

export const technicianRespondToOffer = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError("unauthenticated", "Login required")
  const requestId = String((request.data as any)?.requestId || "")
  const decision = String((request.data as any)?.decision || "")
  if (!requestId || (decision !== "accept" && decision !== "reject")) {
    throw new HttpsError("invalid-argument", "Invalid request")
  }

  const db = getFirestore()
  const techSnap = await db.collection("technicians").doc(uid).get()
  const tech = techSnap.data() as any
  const technicianName = String(tech?.full_name || tech?.name || "Technician").trim()
  if (!techSnap.exists || tech?.isApproved !== true || tech?.isActive !== true || tech?.subscriptionStatus !== "active") {
    throw new HttpsError("permission-denied", "Not eligible")
  }

  const ref = db.collection("service_requests").doc(requestId)
  const now = Timestamp.now()
  if (decision === "accept") {
    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(ref)
      if (!snap.exists) throw new HttpsError("not-found", "Request not found")
      const sr = snap.data() as any
      const offers = uniqueStrings(Array.isArray(sr.offers) ? sr.offers : [])
      if (String(sr.status || "").toLowerCase() !== "assigned" || !offers.includes(uid) || sr.technicianId) {
        throw new HttpsError("aborted", "This offer is no longer available")
      }

      transaction.update(ref, {
        status: "accepted",
        technicianId: uid,
        offers: [],
        updatedAt: now,
      })
      transaction.set(
        db.collection("technicians").doc(uid),
        { activeJobs: FieldValue.arrayUnion(requestId), updatedAt: now },
        { merge: true },
      )
    })
    await writeAuditLog({
      actorUid: uid,
      actorRole: "technician",
      action: "service_request_accepted",
      targetCollection: "service_requests",
      targetId: requestId,
      requestId,
    })
    await db.collection("notifications").doc(`service_decision_${requestId}_${uid}_accepted`).set({
      type: "job_accepted",
      title: "تم قبول الطلب",
      message: `${technicianName} قبل الطلب ${requestId}`,
      role: "admin",
      technicianId: uid,
      technicianName,
      workOrderId: requestId,
      status: "accepted",
      link: "/admin/orders",
      read: false,
      createdAt: now,
    })
    await Promise.allSettled([
      sendToTopic({
        topic: "admins",
        title: "Job accepted",
        body: `${technicianName} accepted ${requestId}.`,
        data: { requestId, technicianId: uid, status: "accepted" },
      }),
    ])
    return { ok: true, status: "accepted" }
  }

  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref)
    if (!snap.exists) throw new HttpsError("not-found", "Request not found")
    const sr = snap.data() as any
    const offers = uniqueStrings(Array.isArray(sr.offers) ? sr.offers : [])
    if (String(sr.status || "").toLowerCase() !== "assigned" || !offers.includes(uid) || sr.technicianId) {
      throw new HttpsError("aborted", "This offer is no longer available")
    }
    transaction.update(ref, {
      offers: FieldValue.arrayRemove(uid),
      updatedAt: now,
      lastOfferedTo: FieldValue.arrayUnion(uid),
    })
  })
  await writeAuditLog({
    actorUid: uid,
    actorRole: "technician",
    action: "service_request_rejected",
    targetCollection: "service_requests",
    targetId: requestId,
    requestId,
  })

  await db.collection("notifications").doc(`service_decision_${requestId}_${uid}_rejected`).set({
    type: "job_rejected",
    title: "تم رفض الطلب",
    message: `${technicianName} رفض الطلب ${requestId}`,
    role: "admin",
    technicianId: uid,
    technicianName,
    workOrderId: requestId,
    status: "rejected",
    link: "/admin/orders",
    read: false,
    createdAt: now,
  })
  await Promise.allSettled([
    sendToTopic({
      topic: "admins",
      title: "Job rejected",
      body: `${technicianName} rejected ${requestId}.`,
      data: { requestId, technicianId: uid, status: "rejected" },
    }),
  ])

  await assignServiceRequest(requestId)
  return { ok: true, status: "rejected" }
})
