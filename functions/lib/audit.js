"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeAuditLog = writeAuditLog;
const firestore_1 = require("firebase-admin/firestore");
async function writeAuditLog(input) {
    const db = (0, firestore_1.getFirestore)();
    const payload = {
        actorUid: input.actorUid,
        actorRole: input.actorRole,
        action: input.action,
        targetCollection: input.targetCollection,
        targetId: input.targetId,
        requestId: input.requestId,
        orderId: input.orderId,
        details: input.details,
        createdAt: input.createdAt ?? firestore_1.Timestamp.now(),
    };
    await db.collection("audit_logs").add(payload);
}
