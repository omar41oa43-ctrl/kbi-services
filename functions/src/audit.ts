import { getFirestore, Timestamp } from "firebase-admin/firestore"
import type { AuditLogDoc, UserRole } from "./types"

export async function writeAuditLog(input: Omit<AuditLogDoc, "createdAt"> & { createdAt?: FirebaseFirestore.Timestamp }) {
  const db = getFirestore()
  const payload: AuditLogDoc = {
    actorUid: input.actorUid,
    actorRole: input.actorRole as UserRole | undefined,
    action: input.action,
    targetCollection: input.targetCollection,
    targetId: input.targetId,
    requestId: input.requestId,
    orderId: input.orderId,
    details: input.details,
    createdAt: input.createdAt ?? Timestamp.now(),
  }
  await db.collection("audit_logs").add(payload)
}
