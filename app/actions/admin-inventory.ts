"use server"

import { adminDb } from "@/lib/firebase-admin"
import { verifyAdmin } from "@/lib/server-auth"

// --- DEVICES ---
export async function getDevicesAction() {
    try {
        const cacheKey = "__kbi_admin_inv_devices_v1"
        const now = Date.now()
        const ttlMs = 60 * 1000
        const backoffMs = 5 * 60 * 1000
        const cached = (globalThis as any)[cacheKey] as { value: any[]; ts: number; failedTs?: number } | undefined
        if (cached?.failedTs && now - cached.failedTs < backoffMs) return cached.value || []
        if (cached && now - cached.ts < ttlMs) return cached.value

        const snap = await adminDb.collection("devices").limit(500).get()
        const value = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
        ;(globalThis as any)[cacheKey] = { value, ts: now, failedTs: 0 }
        return value
    } catch {
        const cacheKey = "__kbi_admin_inv_devices_v1"
        const now = Date.now()
        const cached = (globalThis as any)[cacheKey] as { value: any[]; ts: number; failedTs?: number } | undefined
        if (cached) {
            ;(globalThis as any)[cacheKey] = { value: cached.value || [], ts: cached.ts || now, failedTs: now }
            return cached.value || []
        }
        return []
    }
}

export async function addDeviceAction(name: string, icon: string, idToken: string) {
    try {
        const auth = await verifyAdmin(idToken)
        if (!auth) return { error: "Unauthorized" }

        await adminDb.collection("devices").add({ name, icon })
        return { success: true }
    } catch (e: any) { return { error: e.message } }
}

export async function deleteDeviceAction(id: string, idToken: string) {
    try {
        const auth = await verifyAdmin(idToken)
        if (!auth) return { error: "Unauthorized" }

        await adminDb.collection("devices").doc(id).delete()
        // Ideally should delete sub-brands etc but keeping simple
        return { success: true }
    } catch (e: any) { return { error: e.message } }
}

// --- BRANDS ---
export async function getBrandsAction() {
    try {
        const cacheKey = "__kbi_admin_inv_brands_v1"
        const now = Date.now()
        const ttlMs = 60 * 1000
        const backoffMs = 5 * 60 * 1000
        const cached = (globalThis as any)[cacheKey] as { value: any[]; ts: number; failedTs?: number } | undefined
        if (cached?.failedTs && now - cached.failedTs < backoffMs) return cached.value || []
        if (cached && now - cached.ts < ttlMs) return cached.value

        const snap = await adminDb.collection("brands").limit(2000).get()
        const value = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
        ;(globalThis as any)[cacheKey] = { value, ts: now, failedTs: 0 }
        return value
    } catch {
        const cacheKey = "__kbi_admin_inv_brands_v1"
        const now = Date.now()
        const cached = (globalThis as any)[cacheKey] as { value: any[]; ts: number; failedTs?: number } | undefined
        if (cached) {
            ;(globalThis as any)[cacheKey] = { value: cached.value || [], ts: cached.ts || now, failedTs: now }
            return cached.value || []
        }
        return []
    }
}

export async function addBrandAction(deviceId: string, name: string, idToken: string) {
    try {
        const auth = await verifyAdmin(idToken)
        if (!auth) return { error: "Unauthorized" }

        await adminDb.collection("brands").add({ deviceId, name })
        return { success: true }
    } catch (e: any) { return { error: e.message } }
}

export async function deleteBrandAction(id: string, idToken: string) {
    try {
        const auth = await verifyAdmin(idToken)
        if (!auth) return { error: "Unauthorized" }

        await adminDb.collection("brands").doc(id).delete()
        return { success: true }
    } catch (e: any) { return { error: e.message } }
}

// --- MODELS ---
export async function getModelsAction() {
    try {
        const cacheKey = "__kbi_admin_inv_models_v1"
        const now = Date.now()
        const ttlMs = 60 * 1000
        const backoffMs = 5 * 60 * 1000
        const cached = (globalThis as any)[cacheKey] as { value: any[]; ts: number; failedTs?: number } | undefined
        if (cached?.failedTs && now - cached.failedTs < backoffMs) return cached.value || []
        if (cached && now - cached.ts < ttlMs) return cached.value

        const snap = await adminDb.collection("models").limit(3000).get()
        const value = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
        ;(globalThis as any)[cacheKey] = { value, ts: now, failedTs: 0 }
        return value
    } catch {
        const cacheKey = "__kbi_admin_inv_models_v1"
        const now = Date.now()
        const cached = (globalThis as any)[cacheKey] as { value: any[]; ts: number; failedTs?: number } | undefined
        if (cached) {
            ;(globalThis as any)[cacheKey] = { value: cached.value || [], ts: cached.ts || now, failedTs: now }
            return cached.value || []
        }
        return []
    }
}

export async function addModelAction(brandId: string, name: string, idToken: string) {
    try {
        const auth = await verifyAdmin(idToken)
        if (!auth) return { error: "Unauthorized" }

        await adminDb.collection("models").add({ brandId, name })
        return { success: true }
    } catch (e: any) { return { error: e.message } }
}

export async function deleteModelAction(id: string, idToken: string) {
    try {
        const auth = await verifyAdmin(idToken)
        if (!auth) return { error: "Unauthorized" }

        await adminDb.collection("models").doc(id).delete()
        return { success: true }
    } catch (e: any) { return { error: e.message } }
}

// --- ISSUES ---
export async function getIssuesAction() {
    try {
        const cacheKey = "__kbi_admin_inv_issues_v1"
        const now = Date.now()
        const ttlMs = 60 * 1000
        const backoffMs = 5 * 60 * 1000
        const cached = (globalThis as any)[cacheKey] as { value: any[]; ts: number; failedTs?: number } | undefined
        if (cached?.failedTs && now - cached.failedTs < backoffMs) return cached.value || []
        if (cached && now - cached.ts < ttlMs) return cached.value

        const snap = await adminDb.collection("issues").limit(1000).get()
        const value = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
        ;(globalThis as any)[cacheKey] = { value, ts: now, failedTs: 0 }
        return value
    } catch {
        const cacheKey = "__kbi_admin_inv_issues_v1"
        const now = Date.now()
        const cached = (globalThis as any)[cacheKey] as { value: any[]; ts: number; failedTs?: number } | undefined
        if (cached) {
            ;(globalThis as any)[cacheKey] = { value: cached.value || [], ts: cached.ts || now, failedTs: now }
            return cached.value || []
        }
        return []
    }
}

export async function addIssueAction(deviceId: string, name: string, durationMinutes: number, idToken: string) {
    try {
        const auth = await verifyAdmin(idToken)
        if (!auth) return { error: "Unauthorized" }

        await adminDb.collection("issues").add({ deviceId, name, durationMinutes })
        return { success: true }
    } catch (e: any) { return { error: e.message } }
}

export async function updateIssueAction(id: string, data: any, idToken: string) {
    try {
        const auth = await verifyAdmin(idToken)
        if (!auth) return { error: "Unauthorized" }

        await adminDb.collection("issues").doc(id).update(data)
        return { success: true }
    } catch (e: any) { return { error: e.message } }
}

export async function deleteIssueAction(id: string, idToken: string) {
    try {
        const auth = await verifyAdmin(idToken)
        if (!auth) return { error: "Unauthorized" }

        await adminDb.collection("issues").doc(id).delete()
        return { success: true }
    } catch (e: any) { return { error: e.message } }
}

// --- PARTS ---
export async function getPartsAction() {
    try {
        const cacheKey = "__kbi_admin_inv_parts_v1"
        const now = Date.now()
        const ttlMs = 45 * 1000
        const backoffMs = 5 * 60 * 1000
        const cached = (globalThis as any)[cacheKey] as { value: any[]; ts: number; failedTs?: number } | undefined
        if (cached?.failedTs && now - cached.failedTs < backoffMs) return cached.value || []
        if (cached && now - cached.ts < ttlMs) return cached.value

        const snap = await adminDb.collection("parts").limit(1000).get()
        const value = snap.docs.map((doc: any) => {
            const data = doc.data()
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
            }
        })
        ;(globalThis as any)[cacheKey] = { value, ts: now, failedTs: 0 }
        return value
    } catch (e: any) {
        const cacheKey = "__kbi_admin_inv_parts_v1"
        const now = Date.now()
        const cached = (globalThis as any)[cacheKey] as { value: any[]; ts: number; failedTs?: number } | undefined
        if (cached) {
            ;(globalThis as any)[cacheKey] = { value: cached.value || [], ts: cached.ts || now, failedTs: now }
            return cached.value || []
        }
        return []
    }
}

export async function addPartAction(data: any) {
    try {
        await adminDb.collection("parts").add({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        })
        delete (globalThis as any)["__kbi_admin_inv_parts_v1"]
        return { success: true }
    } catch (e: any) { return { error: e.message } }
}

export async function updatePartAction(id: string, data: any) {
    try {
        await adminDb.collection("parts").doc(id).update({
            ...data,
            updatedAt: new Date()
        })
        delete (globalThis as any)["__kbi_admin_inv_parts_v1"]
        return { success: true }
    } catch (e: any) { return { error: e.message } }
}

export async function deletePartAction(id: string) {
    try {
        await adminDb.collection("parts").doc(id).delete()
        delete (globalThis as any)["__kbi_admin_inv_parts_v1"]
        return { success: true }
    } catch (e: any) { return { error: e.message } }
}

export async function updatePartStockAction(id: string, delta: number) {
    try {
        const ref = adminDb.collection("parts").doc(id)
        await adminDb.runTransaction(async (t: any) => {
            const doc = await t.get(ref)
            if (!doc.exists) return
            const current = doc.data()?.quantity || 0
            const newQty = Math.max(0, current + delta)
            t.update(ref, { quantity: newQty, updatedAt: new Date() })
        })
        delete (globalThis as any)["__kbi_admin_inv_parts_v1"]
        return { success: true }
    } catch (e: any) { return { error: e.message } }
}
