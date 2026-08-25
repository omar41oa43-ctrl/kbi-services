"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expireSubscriptionsBatch = expireSubscriptionsBatch;
const firestore_1 = require("firebase-admin/firestore");
const audit_1 = require("./audit");
async function expireSubscriptionsBatch() {
    const db = (0, firestore_1.getFirestore)();
    const now = firestore_1.Timestamp.now();
    const subSnap = await db
        .collection("subscriptions")
        .where("status", "==", "active")
        .where("endDate", "<=", now)
        .limit(200)
        .get();
    const batch = db.batch();
    for (const doc of subSnap.docs) {
        const data = doc.data();
        const techId = String(data.techId || "");
        batch.update(doc.ref, { status: "inactive", updatedAt: now });
        if (techId) {
            const techRef = db.collection("technicians").doc(techId);
            batch.set(techRef, { subscriptionStatus: "inactive", isActive: false, updatedAt: now }, { merge: true });
        }
        await (0, audit_1.writeAuditLog)({
            action: "subscription_expired",
            targetCollection: "subscriptions",
            targetId: doc.id,
            details: { techId },
        });
    }
    if (!subSnap.empty) {
        await batch.commit();
    }
}
