import { getFirestore, Timestamp } from "firebase-admin/firestore"
import { writeAuditLog } from "./audit"

export async function expireSubscriptionsBatch() {
  const db = getFirestore()
  const now = Timestamp.now()

  const subSnap = await db
    .collection("subscriptions")
    .where("status", "==", "active")
    .where("endDate", "<=", now)
    .limit(200)
    .get()

  const batch = db.batch()
  for (const doc of subSnap.docs) {
    const data = doc.data() as any
    const techId = String(data.techId || "")
    batch.update(doc.ref, { status: "inactive", updatedAt: now })
    if (techId) {
      const techRef = db.collection("technicians").doc(techId)
      batch.set(
        techRef,
        { subscriptionStatus: "inactive", isActive: false, updatedAt: now },
        { merge: true }
      )
    }
    await writeAuditLog({
      action: "subscription_expired",
      targetCollection: "subscriptions",
      targetId: doc.id,
      details: { techId },
    })
  }

  if (!subSnap.empty) {
    await batch.commit()
  }
}
