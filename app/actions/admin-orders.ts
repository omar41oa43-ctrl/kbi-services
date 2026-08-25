"use server"

import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"
import { verifyAdmin } from "@/lib/server-auth"

// Check if Firebase is ready
function isFirebaseReady(): boolean {
    try {
        adminDb.collection("orders").doc("test");
        return true;
    } catch {
        return false;
    }
}

type OrdersCursor = {
    createdAtIso: string
}

export async function getAdminOrdersPageAction(input?: { limit?: number; cursor?: OrdersCursor | null; idToken?: string }) {
    try {
        const auth = await verifyAdmin(input?.idToken || "")
        if (!auth) return { orders: [], nextCursor: null, hasMore: false, error: "Unauthorized" }

        if (!isFirebaseReady()) return { orders: [], nextCursor: null, hasMore: false, error: "Firebase Admin is not configured." }

        const limit = Math.min(Math.max(Number(input?.limit || 50), 1), 100)
        const cacheKey = `__kbi_admin_orders_page_v2_${limit}_${input?.cursor?.createdAtIso || "first"}`
        const now = Date.now()
        const ttlMs = 30 * 1000
        const backoffMs = 5 * 60 * 1000
        const cached = (globalThis as any)[cacheKey] as { value: any; ts: number; failedTs?: number } | undefined
        if (cached?.failedTs && now - cached.failedTs < backoffMs) return cached.value
        if (cached && now - cached.ts < ttlMs) return cached.value

        let q: any = adminDb.collection("orders").orderBy("createdAt", "desc")
        if (input?.cursor?.createdAtIso) {
            q = q.startAfter(new Date(input.cursor.createdAtIso))
        }
        q = q.limit(limit)

        const snap = await q.get()

        const serializeDate = (d: any) => {
            if (!d) return null
            if (typeof d.toDate === "function") return d.toDate().toISOString()
            if (d instanceof Date) return d.toISOString()
            if (typeof d === "string") return d
            return null
        }

        const orders = snap.docs.map((doc: any) => {
            const data = doc.data()
            return {
                id: doc.id,
                orderId: data.orderId || doc.id,
                customerName: data.customerName || data.name || "Unknown",
                customerPhone: data.customerPhone || data.phone || "",
                deviceType: data.deviceType || "Device",
                brand: data.brand || "",
                model: data.model || "",
                issue: data.issue || data.issueType || "",
                status: data.status,
                technicianId: data.technicianId,
                technicianName: data.technicianName || data.technician,
                createdAt: serializeDate(data.createdAt),
                updatedAt: serializeDate(data.updatedAt),
                estimatedCompletion: serializeDate(data.estimatedCompletion),
                price: data.price,
                notes: data.notes,
                statusHistory: Array.isArray(data.statusHistory)
                    ? data.statusHistory.map((h: any) => ({ ...h, timestamp: serializeDate(h.timestamp) }))
                    : []
            }
        })

        const last = snap.docs[snap.docs.length - 1]
        const lastCreatedAtIso = last ? serializeDate(last.data()?.createdAt) : null
        const nextCursor = last && lastCreatedAtIso ? { createdAtIso: lastCreatedAtIso } : null
        const hasMore = snap.size === limit

        const value = { orders, nextCursor, hasMore }
        ;(globalThis as any)[cacheKey] = { value, ts: now, failedTs: 0 }
        return value
    } catch (error: any) {
        const limit = Math.min(Math.max(Number(input?.limit || 50), 1), 100)
        const cacheKey = `__kbi_admin_orders_page_v2_${limit}_${input?.cursor?.createdAtIso || "first"}`
        const now = Date.now()
        const cached = (globalThis as any)[cacheKey] as { value: any; ts: number; failedTs?: number } | undefined
        if (cached) {
            ;(globalThis as any)[cacheKey] = { value: cached.value, ts: cached.ts || now, failedTs: now }
            return cached.value
        }
        const msg = String(error?.message || "")
        const errorText = msg.includes("RESOURCE_EXHAUSTED") || msg.includes("Quota exceeded")
            ? "Firebase quota exceeded"
            : msg || "Failed to fetch orders"
        return { orders: [], nextCursor: null, hasMore: false, error: errorText }
    }
}

export async function getAdminOrdersAction(idToken?: string) {
    try {
        const auth = await verifyAdmin(idToken || "")
        if (!auth) return []

        if (!isFirebaseReady()) return []

        const cacheKey = "__kbi_admin_orders_cache_v2"
        const nowMs = Date.now()
        const ttlMs = 30 * 1000
        const backoffMs = 5 * 60 * 1000
        const cached = (globalThis as any)[cacheKey] as { value: any[]; ts: number; failedTs?: number } | undefined
        if (cached?.failedTs && nowMs - cached.failedTs < backoffMs) return cached.value || []
        if (cached && nowMs - cached.ts < ttlMs) return cached.value

        const snap = await adminDb.collection("orders").orderBy("createdAt", "desc").limit(50).get()
        const value = snap.docs.map((doc: any) => {
            const data = doc.data()
            // Serialize dates to ISO strings
            const serializeDate = (d: any) => {
                if (!d) return null;
                if (typeof d.toDate === "function") return d.toDate().toISOString(); // Firestore Timestamp
                if (d instanceof Date) return d.toISOString(); // JS Date
                if (typeof d === "string") return d; // Already string
                return null;
            };

            const created = serializeDate(data.createdAt);
            const updated = serializeDate(data.updatedAt);
            const est = serializeDate(data.estimatedCompletion);

            return {
                id: doc.id,
                orderId: data.orderId || doc.id,
                customerName: data.customerName || data.name || "Unknown",
                customerPhone: data.customerPhone || data.phone || "",
                deviceType: data.deviceType || "Device",
                brand: data.brand || "",
                model: data.model || "",
                issue: data.issue || data.issueType || "",
                status: data.status,
                technicianId: data.technicianId,
                technicianName: data.technicianName || data.technician,
                createdAt: created,
                updatedAt: updated,
                estimatedCompletion: est,
                price: data.price,
                notes: data.notes,
                statusHistory: Array.isArray(data.statusHistory) ? data.statusHistory.map((h: any) => ({
                    ...h,
                    timestamp: serializeDate(h.timestamp)
                })) : []
            }
        })
        ;(globalThis as any)[cacheKey] = { value, ts: nowMs, failedTs: 0 }
        return value
    } catch {
        const cacheKey = "__kbi_admin_orders_cache_v2"
        const now = Date.now()
        const cached = (globalThis as any)[cacheKey] as { value: any[]; ts: number; failedTs?: number } | undefined
        if (cached) {
            ;(globalThis as any)[cacheKey] = { value: cached.value || [], ts: cached.ts || now, failedTs: now }
            return cached.value || []
        }
        return []
    }
}

export async function updateOrderStatusAction(orderId: string, status: string, note?: string, idToken?: string) {
    try {
        const auth = await verifyAdmin(idToken || "")
        if (!auth) return { error: "Unauthorized" }

        const now = new Date()
        await adminDb.collection("orders").doc(orderId).update({
            status,
            updatedAt: now,
            statusHistory: FieldValue.arrayUnion({
                status,
                timestamp: now,
                note: note || `Status updated to ${status}`
            })
        })

        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function deleteOrderAction(orderId: string, idToken: string) {
    try {
        const auth = await verifyAdmin(idToken)
        if (!auth) return { error: "Unauthorized" }

        await adminDb.collection("orders").doc(orderId).delete()
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

async function nextCounter(prefix: string, counterDocId: string) {
    const ref = adminDb.collection("counters").doc(counterDocId)
    const nextValue = await adminDb.runTransaction(async (tx: any) => {
        const snap = await tx.get(ref)
        let current = snap.exists ? Number((snap.data() as any)?.current || 0) : 0
        current += 1
        tx.set(ref, { current }, { merge: true })
        return current
    })
    return `${prefix}-${String(nextValue).padStart(6, "0")}`
}

export async function getNextInvoiceNumberAction() {
    try {
        const num = await nextCounter("INV", "invoices")
        return { invoiceNumber: num }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function getNextOrderNumberAction() {
    try {
        const num = await nextCounter("ORD", "orders")
        return { orderNumber: num }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function updateEtaAction(orderId: string, estimatedCompletionIso: string, idToken?: string) {
    try {
        const auth = await verifyAdmin(idToken || "")
        if (!auth) return { error: "Unauthorized" }

        await adminDb.collection("orders").doc(orderId).update({
            estimatedCompletion: estimatedCompletionIso,
            updatedAt: new Date(),
        })
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function updateOrderPriceAction(orderId: string, price: number, idToken?: string) {
    try {
        const auth = await verifyAdmin(idToken || "")
        if (!auth) return { error: "Unauthorized" }

        await adminDb.collection("orders").doc(orderId).update({
            price: price,
            updatedAt: new Date(),
        })
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function finalizeInvoiceAction(input: {
    orderDocId: string
    invoiceNumber: string
    invoiceDate: string
    language: "en" | "ar" | "both"
    discount?: number
    vatEnabled?: boolean
    vatRate?: number
    warrantyPeriod?: string
    adminNotes?: string
    disclaimerText?: string
    subtotalOverride?: string
    totalOverride?: string
    manualRows?: Array<{ description?: string; partNo?: string; quantity?: number; total?: number }>
    idToken?: string
}) {
    try {
        const auth = await verifyAdmin(input.idToken || "")
        if (!auth) return { error: "Unauthorized" }

        const discount = Number(input.discount || 0)
        const vatRate = Number(input.vatRate || 0)
        const vatEnabled = !!input.vatEnabled
        const rows = Array.isArray(input.manualRows) ? input.manualRows : []
        const subtotalFromRows = rows.reduce((s, r) => s + Number(r?.total || 0), 0)
        const afterDiscount = subtotalFromRows - discount
        const vatAmount = vatEnabled ? afterDiscount * vatRate : 0
        const totalFromRows = afterDiscount + vatAmount

        const subtotalFinal = input.subtotalOverride && input.subtotalOverride.trim() !== ""
            ? Number(input.subtotalOverride)
            : subtotalFromRows
        const totalFinal = input.totalOverride && input.totalOverride.trim() !== ""
            ? Number(input.totalOverride)
            : totalFromRows

        await adminDb.collection("orders").doc(input.orderDocId).update({
            invoice: {
                invoiceNumber: input.invoiceNumber,
                invoiceDate: new Date(`${input.invoiceDate}T00:00:00`),
                status: "finalized",
                generatedBy: "admin",
                discount,
                vatEnabled,
                vatRate,
                warrantyPeriod: input.warrantyPeriod || "",
                adminNotes: input.adminNotes || "",
                disclaimerText: input.disclaimerText || "",
                manualRows: rows,
                subtotal: subtotalFinal,
                total: totalFinal,
                language: input.language,
                history: FieldValue.arrayUnion({ action: "finalized", by: "admin", at: new Date() }),
            },
            updatedAt: new Date(),
        })

        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function overrideInvoiceAction(orderDocId: string, overrideReason: string) {
    try {
        if (!overrideReason) return { error: "Override reason required" }
        await adminDb.collection("orders").doc(orderDocId).update({
            "invoice.history": FieldValue.arrayUnion({ action: "override", by: "admin", at: new Date(), note: overrideReason }),
            updatedAt: new Date(),
        })
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function createOrderAction(input: {
    customerName: string
    customerPhone: string
    deviceType: string
    brand: string
    model: string
    issue: string
    price?: number
    location?: string
}) {
    try {
        const orderNumber = await nextCounter("ORD", "orders")
        const now = new Date()
        const docRef = await adminDb.collection("orders").add({
            orderId: orderNumber,
            customerName: input.customerName,
            customerPhone: input.customerPhone,
            deviceType: input.deviceType,
            brand: input.brand,
            model: input.model,
            issue: input.issue,
            price: input.price ?? 0,
            location: input.location || "",
            status: "pending",
            createdAt: now,
            updatedAt: now,
            statusHistory: [{ status: "pending", timestamp: now, note: "Order created" }],
        })
        return { success: true, id: docRef.id, orderId: orderNumber }
    } catch (error: any) {
        return { error: error.message }
    }
}
