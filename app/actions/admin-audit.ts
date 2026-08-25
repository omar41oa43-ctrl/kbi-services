"use server"

import { adminDb } from "@/lib/firebase-admin"

export async function getAuditLogsAction(limitCount: number = 50) {
    try {
        const snap = await adminDb.collection("audit_logs")
            .orderBy("timestamp", "desc")
            .limit(limitCount)
            .get()

        return snap.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate().toISOString()
        }))
    } catch (e: any) {
        return []
    }
}

export async function logAuditAction(action: string, targetType: string, performedBy: string, details: any = {}) {
    try {
        await adminDb.collection("audit_logs").add({
            action,
            targetType,
            performedBy, // userId or email
            details,
            timestamp: new Date(),
            userAgent: "Server Action"
        })
    } catch (e) {
        // Silently fail or handle internally
    }
}
