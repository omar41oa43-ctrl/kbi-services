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
  if (!techSnap.exists || tech?.isApproved !== true || tech?.isActive !== true || tech?.subscriptionStatus !== "active") {
    throw new HttpsError("permission-denied", "Not eligible")
  }

  const ref = db.collection("service_requests").doc(requestId)
  const snap = await ref.get()
  if (!snap.exists) throw new HttpsError("not-found", "Request not found")
  const sr = snap.data() as any
  const offers = uniqueStrings(Array.isArray(sr.offers) ? sr.offers : [])
  if (!offers.includes(uid) && String(sr.technicianId || "") !== uid) {
    throw new HttpsError("permission-denied", "Not assigned")
  }

  const now = Timestamp.now()
  if (decision === "accept") {
    await ref.update({
      status: "accepted",
      technicianId: uid,
      offers: [],
      updatedAt: now,
    })
    await db.collection("technicians").doc(uid).set({ activeJobs: FieldValue.arrayUnion(requestId), updatedAt: now }, { merge: true })
    await writeAuditLog({
      actorUid: uid,
      actorRole: "technician",
      action: "service_request_accepted",
      targetCollection: "service_requests",
      targetId: requestId,
      requestId,
    })
    await sendToTopic({
      topic: "admins",
      title: "Job accepted",
      body: "A technician accepted a service request.",
      data: { requestId, technicianId: uid, status: "accepted" },
    })
    return { ok: true, status: "accepted" }
  }

  await ref.update({
    offers: FieldValue.arrayRemove(uid),
    updatedAt: now,
    lastOfferedTo: FieldValue.arrayUnion(uid),
  })
  await writeAuditLog({
    actorUid: uid,
    actorRole: "technician",
    action: "service_request_rejected",
    targetCollection: "service_requests",
    targetId: requestId,
    requestId,
  })

  await assignServiceRequest(requestId)
  return { ok: true, status: "rejected" }
})
