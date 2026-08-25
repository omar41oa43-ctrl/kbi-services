"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.technicianRespondToOffer = exports.technicianUpdateFcmToken = exports.technicianUpdateLocation = exports.updateTechnicianStatus = exports.registerTechnician = exports.expireSubscriptions = exports.assignmentTimeout = exports.serviceRequestStatusUpdated = exports.technicianRequestCreated = exports.serviceRequestCreated = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const firestore_2 = require("firebase-functions/v2/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const matching_1 = require("./matching");
const subscriptions_1 = require("./subscriptions");
const notifications_1 = require("./notifications");
const audit_1 = require("./audit");
const utils_1 = require("./utils");
admin.initializeApp();
exports.serviceRequestCreated = (0, firestore_2.onDocumentCreated)("service_requests/{id}", async (event) => {
    const id = String(event.params.id || "");
    if (!id)
        return;
    await (0, matching_1.assignServiceRequest)(id);
});
exports.technicianRequestCreated = (0, firestore_2.onDocumentCreated)("technician_requests/{id}", async (event) => {
    const id = String(event.params.id || "");
    const data = event.data?.data();
    await (0, audit_1.writeAuditLog)({
        action: "technician_request_created",
        targetCollection: "technician_requests",
        targetId: id,
        details: { name: data?.name, phone: data?.phone },
    });
    await (0, notifications_1.sendToTopic)({
        topic: "admins",
        title: "New technician registration",
        body: "A new technician is waiting for approval.",
        data: { requestId: id, type: "technician_request" },
    });
});
exports.serviceRequestStatusUpdated = (0, firestore_2.onDocumentUpdated)("service_requests/{id}", async (event) => {
    const id = String(event.params.id || "");
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const bStatus = String(before?.status || "");
    const aStatus = String(after?.status || "");
    if (!id || bStatus === aStatus)
        return;
    const techId = String(after?.technicianId || "");
    if (techId) {
        const db = (0, firestore_1.getFirestore)();
        const techSnap = await db.collection("technicians").doc(techId).get();
        const token = techSnap.data()?.fcmToken;
        if (token) {
            await (0, notifications_1.sendToTokens)({
                tokens: [token],
                title: "Job updated",
                body: `Status changed to ${aStatus}`,
                data: { requestId: id, status: aStatus },
            });
        }
    }
    await (0, audit_1.writeAuditLog)({
        action: "service_request_status_changed",
        targetCollection: "service_requests",
        targetId: id,
        requestId: id,
        details: { from: bStatus, to: aStatus, technicianId: techId || null },
    });
});
exports.assignmentTimeout = (0, scheduler_1.onSchedule)("every 1 minutes", async () => {
    await (0, matching_1.handleAssignmentTimeout)();
});
exports.expireSubscriptions = (0, scheduler_1.onSchedule)("every day 02:05", async () => {
    await (0, subscriptions_1.expireSubscriptionsBatch)();
});
exports.registerTechnician = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Login required");
    const name = String(request.data?.name || "").trim();
    const phone = String(request.data?.phone || "").trim();
    const skills = Array.isArray(request.data?.skills) ? request.data.skills.map((s) => String(s)) : [];
    if (!name || !phone || skills.length === 0)
        throw new https_1.HttpsError("invalid-argument", "Missing fields");
    const db = (0, firestore_1.getFirestore)();
    const now = firestore_1.Timestamp.now();
    await db.collection("users").doc(uid).set({ role: "technician", updatedAt: now }, { merge: true });
    const reqRef = db.collection("technician_requests").doc();
    await reqRef.set({
        userId: uid,
        name,
        phone,
        skills,
        status: "pending",
        createdAt: now,
        updatedAt: now,
    });
    await (0, audit_1.writeAuditLog)({
        actorUid: uid,
        actorRole: "technician",
        action: "technician_register_submitted",
        targetCollection: "technician_requests",
        targetId: reqRef.id,
        details: { name, phone, skills },
    });
    await (0, notifications_1.sendToTopic)({
        topic: "admins",
        title: "New technician registration",
        body: `${name} submitted a registration request.`,
        data: { requestId: reqRef.id, type: "technician_request" },
    });
    return { requestId: reqRef.id };
});
exports.updateTechnicianStatus = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Login required");
    const db = (0, firestore_1.getFirestore)();
    const userSnap = await db.collection("users").doc(uid).get();
    const role = userSnap.data()?.role;
    if (role !== "admin" && role !== "super_admin")
        throw new https_1.HttpsError("permission-denied", "Admin only");
    const techId = String(request.data?.techId || "");
    const isApproved = Boolean(request.data?.isApproved);
    const isActive = Boolean(request.data?.isActive);
    const subscriptionStatus = String(request.data?.subscriptionStatus || "inactive");
    if (!techId)
        throw new https_1.HttpsError("invalid-argument", "techId required");
    const now = firestore_1.Timestamp.now();
    await db.collection("technicians").doc(techId).set({
        isApproved,
        isActive,
        subscriptionStatus,
        updatedAt: now,
    }, { merge: true });
    await (0, audit_1.writeAuditLog)({
        actorUid: uid,
        actorRole: role,
        action: "technician_status_updated",
        targetCollection: "technicians",
        targetId: techId,
        details: { isApproved, isActive, subscriptionStatus },
    });
    return { ok: true };
});
exports.technicianUpdateLocation = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Login required");
    const lat = (0, utils_1.toNumber)(request.data?.lat, NaN);
    const lng = (0, utils_1.toNumber)(request.data?.lng, NaN);
    if (!Number.isFinite(lat) || !Number.isFinite(lng))
        throw new https_1.HttpsError("invalid-argument", "Invalid coordinates");
    const db = (0, firestore_1.getFirestore)();
    const now = firestore_1.Timestamp.now();
    await db.collection("technicians").doc(uid).set({ location: { lat, lng }, updatedAt: now }, { merge: true });
    return { ok: true };
});
exports.technicianUpdateFcmToken = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Login required");
    const token = String(request.data?.token || "").trim();
    if (!token)
        throw new https_1.HttpsError("invalid-argument", "token required");
    const db = (0, firestore_1.getFirestore)();
    const now = firestore_1.Timestamp.now();
    await db.collection("technicians").doc(uid).set({ fcmToken: token, updatedAt: now }, { merge: true });
    return { ok: true };
});
exports.technicianRespondToOffer = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Login required");
    const requestId = String(request.data?.requestId || "");
    const decision = String(request.data?.decision || "");
    if (!requestId || (decision !== "accept" && decision !== "reject")) {
        throw new https_1.HttpsError("invalid-argument", "Invalid request");
    }
    const db = (0, firestore_1.getFirestore)();
    const techSnap = await db.collection("technicians").doc(uid).get();
    const tech = techSnap.data();
    if (!techSnap.exists || tech?.isApproved !== true || tech?.isActive !== true || tech?.subscriptionStatus !== "active") {
        throw new https_1.HttpsError("permission-denied", "Not eligible");
    }
    const ref = db.collection("service_requests").doc(requestId);
    const now = firestore_1.Timestamp.now();
    if (decision === "accept") {
        await db.runTransaction(async (transaction) => {
            const snap = await transaction.get(ref);
            if (!snap.exists)
                throw new https_1.HttpsError("not-found", "Request not found");
            const sr = snap.data();
            const offers = (0, utils_1.uniqueStrings)(Array.isArray(sr.offers) ? sr.offers : []);
            if (String(sr.status || "").toLowerCase() !== "assigned" || !offers.includes(uid) || sr.technicianId) {
                throw new https_1.HttpsError("aborted", "This offer is no longer available");
            }
            transaction.update(ref, {
                status: "accepted",
                technicianId: uid,
                offers: [],
                updatedAt: now,
            });
            transaction.set(db.collection("technicians").doc(uid), { activeJobs: firestore_1.FieldValue.arrayUnion(requestId), updatedAt: now }, { merge: true });
        });
        await (0, audit_1.writeAuditLog)({
            actorUid: uid,
            actorRole: "technician",
            action: "service_request_accepted",
            targetCollection: "service_requests",
            targetId: requestId,
            requestId,
        });
        await (0, notifications_1.sendToTopic)({
            topic: "admins",
            title: "Job accepted",
            body: "A technician accepted a service request.",
            data: { requestId, technicianId: uid, status: "accepted" },
        });
        return { ok: true, status: "accepted" };
    }
    await db.runTransaction(async (transaction) => {
        const snap = await transaction.get(ref);
        if (!snap.exists)
            throw new https_1.HttpsError("not-found", "Request not found");
        const sr = snap.data();
        const offers = (0, utils_1.uniqueStrings)(Array.isArray(sr.offers) ? sr.offers : []);
        if (String(sr.status || "").toLowerCase() !== "assigned" || !offers.includes(uid) || sr.technicianId) {
            throw new https_1.HttpsError("aborted", "This offer is no longer available");
        }
        transaction.update(ref, {
            offers: firestore_1.FieldValue.arrayRemove(uid),
            updatedAt: now,
            lastOfferedTo: firestore_1.FieldValue.arrayUnion(uid),
        });
    });
    await (0, audit_1.writeAuditLog)({
        actorUid: uid,
        actorRole: "technician",
        action: "service_request_rejected",
        targetCollection: "service_requests",
        targetId: requestId,
        requestId,
    });
    await (0, matching_1.assignServiceRequest)(requestId);
    return { ok: true, status: "rejected" };
});
