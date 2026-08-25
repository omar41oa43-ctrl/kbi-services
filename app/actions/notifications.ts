"use server"

import { adminDb } from "@/lib/firebase-admin"
import { verifyAdmin, verifyTechnician } from "@/lib/server-auth"

export interface Notification {
    id: string
    type: string
    title: string
    message: string
    read: boolean
    link?: string
    createdAt: number | string // Timestamp serialized
    role: "admin" | "technician"
}

async function authenticateNotificationUser(role: "admin" | "technician", idToken: string) {
    return role === "admin" ? verifyAdmin(idToken) : verifyTechnician(idToken)
}

export async function getNotificationsAction(role: "admin" | "technician", idToken: string): Promise<{ notifications: Notification[], error?: string }> {
    try {
        const actor = await authenticateNotificationUser(role, idToken)
        if (!actor) return { notifications: [], error: "Unauthorized" }
        const cacheKey = `__kbi_notifications_${role}_${actor.uid}_cache_v2`
        const now = Date.now()
        const ttlMs = 60 * 1000
        const backoffMs = 5 * 60 * 1000
        const cached = (globalThis as any)[cacheKey] as { value: Notification[]; ts: number; failedTs?: number } | undefined
        if (cached?.failedTs && now - cached.failedTs < backoffMs) {
            return { notifications: cached.value || [], error: "Temporarily unavailable" }
        }
        if (cached && now - cached.ts < ttlMs) return { notifications: cached.value }

        let notificationQuery = adminDb.collection("notifications").where("role", "==", role)
        if (role === "technician") notificationQuery = notificationQuery.where("userId", "==", actor.uid)
        const snapshot = await notificationQuery
            .limit(50)
            .get()

        const notifications = snapshot.docs.map((doc: any) => {
            const data = doc.data()
            const createdAt = data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now()
            return {
                id: doc.id,
                ...data,
                createdAt
            } as Notification
        }).sort((a: Notification, b: Notification) => Number(b.createdAt) - Number(a.createdAt))

        ;(globalThis as any)[cacheKey] = { value: notifications, ts: now, failedTs: 0 }
        return { notifications }
    } catch {
        return { notifications: [], error: "Failed to fetch notifications" }
    }
}

export async function markNotificationReadAction(notificationId: string, role: "admin" | "technician", idToken: string): Promise<{ success: boolean, error?: string }> {
    try {
        const actor = await authenticateNotificationUser(role, idToken)
        if (!actor) return { success: false, error: "Unauthorized" }
        const ref = adminDb.collection("notifications").doc(notificationId)
        const snapshot = await ref.get()
        if (!snapshot.exists || (role === "technician" && snapshot.data()?.userId !== actor.uid)) {
            return { success: false, error: "Notification not found" }
        }
        await ref.update({
            read: true
        })
        return { success: true }
    } catch (error) {
        console.error("Error marking notification as read:", error)
        return { success: false, error: "Failed to update notification" }
    }
}

export async function clearNotificationsAction(role: "admin" | "technician", idToken: string): Promise<{ success: boolean, error?: string }> {
    try {
        const actor = await authenticateNotificationUser(role, idToken)
        if (!actor) return { success: false, error: "Unauthorized" }
        while (true) {
            let notificationQuery = adminDb.collection("notifications").where("role", "==", role)
            if (role === "technician") notificationQuery = notificationQuery.where("userId", "==", actor.uid)
            const snapshot = await notificationQuery
                .limit(500)
                .get()

            if (snapshot.empty) break

            const batch = adminDb.batch()
            snapshot.docs.forEach((doc: any) => batch.delete(doc.ref))
            await batch.commit()
        }

        const cacheKey = `__kbi_notifications_${role}_${actor.uid}_cache_v2`
        ;(globalThis as any)[cacheKey] = { value: [], ts: Date.now(), failedTs: 0 }

        return { success: true }
    } catch (error) {
        console.error("Error clearing notifications:", error)
        return { success: false, error: "Failed to clear notifications" }
    }
}
