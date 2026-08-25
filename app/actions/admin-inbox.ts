"use server"

import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"
import { verifyAdmin } from "@/lib/server-auth"

async function requireAdmin(idToken: string) {
    if (!await verifyAdmin(idToken)) throw new Error("Unauthorized")
}

// --- CONTACT MESSAGES ---

export async function getMessagesAction(idToken: string) {
    try {
        await requireAdmin(idToken)
        const snap = await adminDb.collection("messages").orderBy("createdAt", "desc").get()
        return snap.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
            // Ensure dates are serializable
            createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt
        }))
    } catch {
        return []
    }
}

export async function markMessageReadAction(id: string, idToken: string) {
    try {
        await requireAdmin(idToken)
        await adminDb.collection("messages").doc(id).update({ status: "Read" })
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function deleteMessageAction(id: string, idToken: string) {
    try {
        await requireAdmin(idToken)
        await adminDb.collection("messages").doc(id).delete()
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

// --- TECH REQUESTS ---

export async function getTechRequestsAction(idToken: string) {
    try {
        await requireAdmin(idToken)
        const snap = await adminDb.collection("tech_requests").orderBy("createdAt", "desc").get()
        return snap.docs.map((doc: any) => {
            const data = doc.data()
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
            }
        })
    } catch {
        return []
    }
}

export async function approveRequestAction(requestId: string, idToken: string, adminNote?: string) {
    try {
        const actor = await verifyAdmin(idToken)
        if (!actor) throw new Error("Unauthorized")
        const ref = adminDb.collection("tech_requests").doc(requestId)
        const docSnap = await ref.get()
        if (!docSnap.exists) throw new Error("Request not found")
        const req: any = { id: docSnap.id, ...docSnap.data() }

        await ref.update({
            status: "approved",
            updatedAt: new Date(),
            adminNotes: adminNote || null,
            history: FieldValue.arrayUnion({
                action: "approved",
                by: actor.uid,
                at: new Date(),
                note: adminNote || null
            })
        })

        // Update Order Invoice
        const orderRef = adminDb.collection("orders").doc(req.orderId)
        const total = (req.finalPrice ?? req.estimatedPrice) * req.quantity

        await orderRef.update({
            invoiceItems: FieldValue.arrayUnion({
                description: req.partOrServiceName,
                category: req.category,
                quantity: req.quantity,
                unitPrice: req.finalPrice ?? req.estimatedPrice,
                total: total,
                requestId: req.id,
                addedAt: new Date(),
            }),
            status: "in_progress", // Ensure status is active
            updatedAt: new Date()
            // Note: Incremeting totalCost via action is hard without transaction or knowing current. 
            // Admin SDK doesn't have FieldValue.increment easily for deep fields unless top level.
            // But we can do it if `totalCost` is top level.
            // However, `updateDoc` merges.
        })

        // Notify Tech
        await adminDb.collection("notifications").add({
            role: "technician",
            userId: req.technicianId,
            type: "tech_request",
            message: "Request approved",
            orderId: req.orderId,
            requestId: req.id,
            createdAt: new Date(),
        })

        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function rejectRequestAction(requestId: string, idToken: string, adminNote?: string) {
    try {
        const actor = await verifyAdmin(idToken)
        if (!actor) throw new Error("Unauthorized")
        const ref = adminDb.collection("tech_requests").doc(requestId)
        const docSnap = await ref.get()
        if (!docSnap.exists) throw new Error("Request not found")
        const req: any = { id: docSnap.id, ...docSnap.data() }

        await ref.update({
            status: "rejected",
            updatedAt: new Date(),
            adminNotes: adminNote || null,
            history: FieldValue.arrayUnion({
                action: "rejected",
                by: actor.uid,
                at: new Date(),
                note: adminNote || null
            })
        })

        // Notify Tech
        await adminDb.collection("notifications").add({
            role: "technician",
            userId: req.technicianId,
            type: "tech_request",
            message: "Request rejected",
            orderId: req.orderId,
            requestId: req.id,
            createdAt: new Date(),
        })

        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function updateRequestPriceAction(requestId: string, newPrice: number, idToken: string) {
    try {
        const actor = await verifyAdmin(idToken)
        if (!actor) throw new Error("Unauthorized")
        if (!Number.isFinite(newPrice) || newPrice < 0) throw new Error("Invalid price")
        const ref = adminDb.collection("tech_requests").doc(requestId)
        const snap = await ref.get()
        const data = snap.data() as any

        await ref.update({
            finalPrice: newPrice,
            updatedAt: new Date(),
            priceChanges: FieldValue.arrayUnion({
                oldPrice: data.estimatedPrice,
                newPrice,
                changedAt: new Date(),
                changedBy: actor.uid
            }),
            history: FieldValue.arrayUnion({
                action: "price_updated",
                by: actor.uid,
                at: new Date(),
                note: `AED ${data.estimatedPrice} -> AED ${newPrice}`
            })
        })

        // Notify Tech
        await adminDb.collection("notifications").add({
            role: "technician",
            userId: data.technicianId,
            type: "tech_request",
            message: "Price updated by admin",
            orderId: data.orderId,
            requestId: requestId,
            createdAt: new Date(),
        })

        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}
