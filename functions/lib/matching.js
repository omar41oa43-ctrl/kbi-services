"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreTechnician = scoreTechnician;
exports.skillMatch = skillMatch;
exports.assignServiceRequest = assignServiceRequest;
exports.handleAssignmentTimeout = handleAssignmentTimeout;
const firestore_1 = require("firebase-admin/firestore");
const utils_1 = require("./utils");
const notifications_1 = require("./notifications");
const audit_1 = require("./audit");
function scoreTechnician(params) {
    const distanceWeight = 1.6;
    const ratingWeight = 2.2;
    const loadPenalty = 1.4;
    return -params.distanceKm * distanceWeight + params.rating * ratingWeight - params.activeJobs * loadPenalty;
}
function skillMatch(requestType, skills) {
    const rt = (0, utils_1.normalizeSkill)(requestType);
    const set = new Set(skills.map(utils_1.normalizeSkill));
    if (set.has(rt))
        return true;
    for (const s of set) {
        if (!s)
            continue;
        if (rt.includes(s) || s.includes(rt))
            return true;
    }
    return false;
}
function safePoint(v) {
    const lat = (0, utils_1.toNumber)(v?.lat, NaN);
    const lng = (0, utils_1.toNumber)(v?.lng, NaN);
    if (!Number.isFinite(lat) || !Number.isFinite(lng))
        return null;
    return { lat, lng };
}
async function assignServiceRequest(requestId) {
    const db = (0, firestore_1.getFirestore)();
    const ref = db.collection("service_requests").doc(requestId);
    const snap = await ref.get();
    if (!snap.exists)
        return;
    const data = snap.data();
    const status = String(data.status || "").toLowerCase();
    if (status !== "new" && status !== "assigned")
        return;
    if (data.locationValid === false) {
        await (0, audit_1.writeAuditLog)({
            action: "service_request_assign_skipped_invalid_location",
            targetCollection: "service_requests",
            targetId: requestId,
            requestId,
        });
        return;
    }
    const reqPoint = safePoint(data.location);
    if (!reqPoint) {
        await (0, audit_1.writeAuditLog)({
            action: "service_request_assign_failed_no_location",
            targetCollection: "service_requests",
            targetId: requestId,
            requestId,
        });
        return;
    }
    const excluded = new Set((0, utils_1.uniqueStrings)([...(data.lastOfferedTo || []), ...(data.offers || []), ...(data.assignedTo || [])]));
    const techSnap = await db
        .collection("technicians")
        .where("isApproved", "==", true)
        .where("isActive", "==", true)
        .where("subscriptionStatus", "==", "active")
        .get();
    const candidates = [];
    techSnap.forEach((doc) => {
        if (excluded.has(doc.id))
            return;
        const t = doc.data();
        const skills = (0, utils_1.toStringArray)(t.skills);
        if (!skillMatch(data.type || "", skills))
            return;
        const tPoint = safePoint(t.location);
        if (!tPoint)
            return;
        const distanceKm = (0, utils_1.haversineKm)(reqPoint, tPoint);
        const rating = (0, utils_1.toNumber)(t.rating, 0);
        const activeJobs = Array.isArray(t.activeJobs) ? t.activeJobs.length : 0;
        const score = scoreTechnician({ distanceKm, rating, activeJobs });
        candidates.push({ uid: doc.id, score, distanceKm, rating, activeJobs, fcmToken: t.fcmToken });
    });
    candidates.sort((a, b) => b.score - a.score);
    const offers = candidates.slice(0, 3);
    if (offers.length === 0) {
        await (0, audit_1.writeAuditLog)({
            action: "service_request_assign_no_candidates",
            targetCollection: "service_requests",
            targetId: requestId,
            requestId,
            details: { type: data.type },
        });
        return;
    }
    const offerUids = offers.map((x) => x.uid);
    const tokens = offers.map((x) => x.fcmToken || "").filter(Boolean);
    const expectedAttempt = (0, utils_1.toNumber)(data.assignmentAttempt, 0);
    const assigned = await db.runTransaction(async (transaction) => {
        const currentSnap = await transaction.get(ref);
        if (!currentSnap.exists)
            return false;
        const current = currentSnap.data();
        const currentStatus = String(current.status || "").toLowerCase();
        if ((currentStatus !== "new" && currentStatus !== "assigned") || current.technicianId)
            return false;
        if ((0, utils_1.toNumber)(current.assignmentAttempt, 0) !== expectedAttempt)
            return false;
        const now = firestore_1.Timestamp.now();
        transaction.update(ref, {
            status: "assigned",
            assignedTo: firestore_1.FieldValue.arrayUnion(...offerUids),
            offers: offerUids,
            offeredAt: now,
            updatedAt: now,
            assignmentAttempt: expectedAttempt + 1,
            lastOfferedTo: firestore_1.FieldValue.arrayUnion(...offerUids),
        });
        return true;
    });
    if (!assigned)
        return;
    await (0, audit_1.writeAuditLog)({
        action: "service_request_assigned",
        targetCollection: "service_requests",
        targetId: requestId,
        requestId,
        details: {
            offers: offerUids,
            scored: offers.map((o) => ({ uid: o.uid, score: o.score, distanceKm: o.distanceKm, rating: o.rating, activeJobs: o.activeJobs })),
        },
    });
    await (0, notifications_1.sendToTokens)({
        tokens,
        title: "New job available",
        body: "A new service request matches your skills. Tap to respond.",
        data: { requestId, type: String(data.type || ""), status: "assigned" },
    });
}
async function handleAssignmentTimeout() {
    const db = (0, firestore_1.getFirestore)();
    const now = firestore_1.Timestamp.now();
    const cutoff = firestore_1.Timestamp.fromMillis(now.toMillis() - 2 * 60 * 1000);
    const snap = await db
        .collection("service_requests")
        .where("status", "==", "assigned")
        .where("offeredAt", "<=", cutoff)
        .limit(50)
        .get();
    const ids = snap.docs.map((d) => d.id);
    for (const id of ids) {
        await (0, audit_1.writeAuditLog)({
            action: "service_request_offer_timeout",
            targetCollection: "service_requests",
            targetId: id,
            requestId: id,
        });
        await assignServiceRequest(id);
    }
}
