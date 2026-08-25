"use server"

import { adminDb, adminAuth } from "@/lib/firebase-admin"
import { verifyAdmin } from "@/lib/server-auth"

export async function getSiteSettingsAction() {
    try {
        const cacheKey = "__kbi_site_settings_v1"
        const now = Date.now()
        const ttlMs = 5 * 60 * 1000
        const backoffMs = 5 * 60 * 1000
        const cached = (globalThis as any)[cacheKey] as { value: any; ts: number; failedTs?: number } | undefined
        if (cached?.failedTs && now - cached.failedTs < backoffMs) return cached.value || {}
        if (cached && now - cached.ts < ttlMs) return cached.value

        const doc = await adminDb.collection("settings").doc("site").get()
        if (doc.exists) {
            const value = doc.data()
            ;(globalThis as any)[cacheKey] = { value, ts: now, failedTs: 0 }
            return value
        }
        const value = {}
        ;(globalThis as any)[cacheKey] = { value, ts: now, failedTs: 0 }
        return value
    } catch {
        const cacheKey = "__kbi_site_settings_v1"
        const now = Date.now()
        const cached = (globalThis as any)[cacheKey] as { value: any; ts: number; failedTs?: number } | undefined
        if (cached) {
            ;(globalThis as any)[cacheKey] = { value: cached.value, ts: cached.ts || now, failedTs: now }
            return cached.value || {}
        }
        return {}
    }
}

export async function updateSiteSettingsAction(data: any, idToken: string) {
    try {
        const auth = await verifyAdmin(idToken)
        if (!auth) return { error: "Unauthorized" }

        await adminDb.collection("settings").doc("site").set(data, { merge: true })
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function getSiteConfigAction() {
    try {
        const cacheKey = "__kbi_site_config_v1"
        const now = Date.now()
        const ttlMs = 5 * 60 * 1000
        const backoffMs = 5 * 60 * 1000
        const cached = (globalThis as any)[cacheKey] as { value: any; ts: number; failedTs?: number } | undefined
        if (cached?.failedTs && now - cached.failedTs < backoffMs) return cached.value || {}
        if (cached && now - cached.ts < ttlMs) return cached.value

        const doc = await adminDb.collection("settings").doc("site_config").get()
        if (doc.exists) {
            const value = doc.data()
            ;(globalThis as any)[cacheKey] = { value, ts: now, failedTs: 0 }
            return value
        }
        const value = {}
        ;(globalThis as any)[cacheKey] = { value, ts: now, failedTs: 0 }
        return value
    } catch {
        const cacheKey = "__kbi_site_config_v1"
        const now = Date.now()
        const cached = (globalThis as any)[cacheKey] as { value: any; ts: number; failedTs?: number } | undefined
        if (cached) {
            ;(globalThis as any)[cacheKey] = { value: cached.value, ts: cached.ts || now, failedTs: now }
            return cached.value || {}
        }
        return {}
    }
}

// Contact Settings
export async function getContactSettingsAction() {
    try {
        const doc = await adminDb.collection("settings").doc("contact").get()
        if (doc.exists) {
            return doc.data()
        }
        return {}
    } catch {
        return {}
    }
}

export async function updateContactSettingsAction(data: any, idToken: string) {
    try {
        const auth = await verifyAdmin(idToken)
        if (!auth) return { error: "Unauthorized" }

        await adminDb.collection("settings").doc("contact").set(data, { merge: true })
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

// User Management
export async function getUsersAction() {
    try {
        const cacheKey = "__kbi_admin_users_v1"
        const now = Date.now()
        const ttlMs = 60 * 1000 // 60s cache
        const cached = (globalThis as any)[cacheKey] as { value: any; ts: number } | undefined
        if (cached && now - cached.ts < ttlMs && cached.value?.length) {
            return cached.value
        }

        const snap = await adminDb.collection("users").orderBy("createdAt", "desc").limit(200).get()
        const serializeDate = (d: any) => {
            if (!d) return null
            if (typeof d.toDate === "function") return d.toDate().toISOString()
            if (d instanceof Date) return d.toISOString()
            if (typeof d === "string") return d
            if (typeof d === "number") return new Date(d).toISOString()
            if (typeof d === "object") {
                const sec = typeof d._seconds === "number" ? d._seconds : (typeof d.seconds === "number" ? d.seconds : null)
                const nano = typeof d._nanoseconds === "number" ? d._nanoseconds : (typeof d.nanoseconds === "number" ? d.nanoseconds : null)
                if (sec != null) {
                    const ms = sec * 1000 + (nano ? Math.floor(nano / 1_000_000) : 0)
                    return new Date(ms).toISOString()
                }
            }
            return null
        }
        const users = snap.docs.map((doc: any) => {
            const data = doc.data() as any
            return {
                uid: doc.id,
                email: String(data.email || ""),
                name: String(data.name || ""),
                role: String(data.role || ""),
                mustChangePassword: !!data.mustChangePassword,
                phone: data.phone ? String(data.phone) : "",
                address: data.address ? String(data.address) : "",
                createdAt: serializeDate(data.createdAt),
                updatedAt: serializeDate(data.updatedAt)
            }
        })

        ;(globalThis as any)[cacheKey] = { value: users, ts: now }
        return users
    } catch {
        return []
    }
}

export async function updateUserRoleAction(uid: string, role: string) {
    try {
        // Update Firestore
        await adminDb.collection("users").doc(uid).update({ role })

        // Update Custom Claims
        await adminAuth.setCustomUserClaims(uid, { role })

        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}
