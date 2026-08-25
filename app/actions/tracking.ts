"use server"

import { adminDb } from "@/lib/firebase-admin"

export async function trackOrderAction(queryText: string) {
    if (!queryText) return { error: "Empty query" }

    const raw = queryText.trim()
    // Check format
    const isPhoneNumber = /^[\d\s\+\-]+$/.test(raw) && raw.length >= 7

    try {
        if (isPhoneNumber) {
            // Parallel queries
            const q1 = await adminDb.collection("orders").where("phone", "==", raw).get()
            const q2 = await adminDb.collection("orders").where("customerPhone", "==", raw).get()

            const resultMap = new Map()
            q1.docs.forEach((d: any) => {
                const data = d.data();
                // Convert timestamps to ISO strings for serialization
                if (data.createdAt && typeof data.createdAt.toDate === 'function') data.createdAt = data.createdAt.toDate().toISOString();
                if (data.updatedAt && typeof data.updatedAt.toDate === 'function') data.updatedAt = data.updatedAt.toDate().toISOString();
                if (data.estimatedCompletion && typeof data.estimatedCompletion.toDate === 'function') data.estimatedCompletion = data.estimatedCompletion.toDate().toISOString();
                resultMap.set(d.id, { id: d.id, ...data })
            })
            q2.docs.forEach((d: any) => {
                const data = d.data();
                if (data.createdAt && typeof data.createdAt.toDate === 'function') data.createdAt = data.createdAt.toDate().toISOString();
                if (data.updatedAt && typeof data.updatedAt.toDate === 'function') data.updatedAt = data.updatedAt.toDate().toISOString();
                if (data.estimatedCompletion && typeof data.estimatedCompletion.toDate === 'function') data.estimatedCompletion = data.estimatedCompletion.toDate().toISOString();
                resultMap.set(d.id, { id: d.id, ...data })
            })

            const results = Array.from(resultMap.values())

            if (results.length === 0) return { error: "No orders found for this phone number" }
            if (results.length === 1) return { found: true, data: results[0] }
            return { found: true, multiple: true, matches: results }
        } else {
            // Order ID
            const q = await adminDb.collection("orders").where("orderId", "==", raw).get()
            if (q.empty) return { error: "Order not found" }
            const doc = q.docs[0];
            const data = doc.data();
            if (data.createdAt && typeof data.createdAt.toDate === 'function') data.createdAt = data.createdAt.toDate().toISOString();
            if (data.updatedAt && typeof data.updatedAt.toDate === 'function') data.updatedAt = data.updatedAt.toDate().toISOString();
            if (data.estimatedCompletion && typeof data.estimatedCompletion.toDate === 'function') data.estimatedCompletion = data.estimatedCompletion.toDate().toISOString();

            return { found: true, data: { id: doc.id, ...data } }
        }
    } catch (error: any) {
        return { error: error.message || "Server error" }
    }
}
