"use server"

import { adminDb } from "@/lib/firebase-admin"
import { verifyAdmin } from "@/lib/server-auth"

export async function getAuditLogsAction(idToken: string, limitCount: number = 50) {
    try {
        const actor = await verifyAdmin(idToken)
        if (!actor) return []
        const safeLimit = Math.min(Math.max(Math.trunc(limitCount), 1), 200)
        const snap = await adminDb.collection("audit_logs")
            .orderBy("timestamp", "desc")
            .limit(safeLimit)
            .get()

        return snap.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate().toISOString()
        }))
    } catch {
        return []
    }
}

export async function logAuditAction(idToken: string, action: string, targetType: string, details: any = {}) {
    try {
        const actor = await verifyAdmin(idToken)
        if (!actor) return { error: "Unauthorized" }
        await adminDb.collection("audit_logs").add({
            action,
            targetType,
            performedBy: actor.uid,
            details,
            timestamp: new Date(),
            userAgent: "Server Action"
        })
        return { success: true }
    } catch {
        return { error: "Failed to write audit log" }
    }
}
