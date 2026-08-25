"use server"

import { adminDb } from "@/lib/firebase-admin"

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

export async function getNotificationsAction(role: "admin" | "technician"): Promise<{ notifications: Notification[], error?: string }> {
    try {
        const cacheKey = `__kbi_notifications_${role}_cache_v1`
        const now = Date.now()
        const ttlMs = 60 * 1000
        const backoffMs = 5 * 60 * 1000
        const cached = (globalThis as any)[cacheKey] as { value: Notification[]; ts: number; failedTs?: number } | undefined
        if (cached?.failedTs && now - cached.failedTs < backoffMs) {
            return { notifications: cached.value || [], error: "Temporarily unavailable" }
        }
        if (cached && now - cached.ts < ttlMs) return { notifications: cached.value }

        const snapshot = await adminDb.collection("notifications")
            .where("role", "==", role)
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
        const cacheKey = `__kbi_notifications_${role}_cache_v1`
        const now = Date.now()
        const cached = (globalThis as any)[cacheKey] as { value: Notification[]; ts: number; failedTs?: number } | undefined
        if (cached) {
            ;(globalThis as any)[cacheKey] = { value: cached.value || [], ts: cached.ts || now, failedTs: now }
            return { notifications: cached.value || [], error: "Using cached notifications" }
        }
        return { notifications: [], error: "Failed to fetch notifications" }
    }
}

export async function markNotificationReadAction(notificationId: string): Promise<{ success: boolean, error?: string }> {
    try {
        await adminDb.collection("notifications").doc(notificationId).update({
            read: true
        })
        return { success: true }
    } catch (error) {
        console.error("Error marking notification as read:", error)
        return { success: false, error: "Failed to update notification" }
    }
}

export async function clearNotificationsAction(role: "admin" | "technician"): Promise<{ success: boolean, error?: string }> {
    try {
        while (true) {
            const snapshot = await adminDb.collection("notifications")
                .where("role", "==", role)
                .limit(500)
                .get()

            if (snapshot.empty) break

            const batch = adminDb.batch()
            snapshot.docs.forEach((doc: any) => batch.delete(doc.ref))
            await batch.commit()
        }

        const cacheKey = `__kbi_notifications_${role}_cache_v1`
        ;(globalThis as any)[cacheKey] = { value: [], ts: Date.now(), failedTs: 0 }

        return { success: true }
    } catch (error) {
        console.error("Error clearing notifications:", error)
        return { success: false, error: "Failed to clear notifications" }
    }
}
