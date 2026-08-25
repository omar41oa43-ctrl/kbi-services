"use server"

import { getAdminDb } from "@/lib/firebase-admin"
// import { adminDb } from "@/lib/firebase-admin"

export async function getPublicOrderAction(orderId: string) {
    try {
        if (!orderId) return null

        let db
        try {
            db = getAdminDb()
        } catch (initError: any) {
            console.error("Init Error", initError)
            return null
        }

        const safeDate = (val: any) => {
            try {
                return val?.toDate ? val.toDate().toISOString() : val
            } catch { return null }
        }

        // Query by orderId field
        const q = await db.collection("orders").where("orderId", "==", orderId.trim()).get()
        if (q.empty) {
            // Fallback: try querying by document ID
            const doc = await db.collection("orders").doc(orderId.trim()).get()
            if (!doc.exists) return null

            const data = doc.data()
            if (!data) return null

            return {
                orderId: data.orderId || doc.id,
                status: data.status || "pending",
                device: `${data.brand || ""} ${data.model || ""}`.trim(),
                issue: data.issueType || data.issue || "",
                createdAt: safeDate(data.createdAt),
                updatedAt: safeDate(data.updatedAt),
                technicianName: data.technicianName ? data.technicianName.split(" ")[0] : "Assigned",
                estimatedCompletion: safeDate(data.estimatedCompletion),
                timeline: Array.isArray(data.statusHistory)
                    ? data.statusHistory.map((h: any) => ({ ...h, timestamp: safeDate(h.timestamp) }))
                    : []
            }
        }

        const doc = q.docs[0]
        const data = doc.data()
        if (!data) return null

        return {
            orderId: data.orderId || doc.id,
            status: data.status || "pending",
            device: `${data.brand || ""} ${data.model || ""}`.trim(),
            issue: data.issueType || data.issue || "",
            createdAt: safeDate(data.createdAt),
            updatedAt: safeDate(data.updatedAt),
            technicianName: data.technicianName ? data.technicianName.split(" ")[0] : "Assigned",
            estimatedCompletion: safeDate(data.estimatedCompletion),
            timeline: Array.isArray(data.statusHistory)
                ? data.statusHistory.map((h: any) => ({ ...h, timestamp: safeDate(h.timestamp) }))
                : []
        }
    } catch (e) {
        console.error("Public Order Search Error", e)
        return null
    }
}

export async function getPublicOrdersByPhoneAction(phone: string) {
    try {
        // 1. Generate search variations
        const digits = phone.replace(/[^0-9]/g, "")
        const variations = new Set<string>()
        if (digits.length >= 7) {
            variations.add(digits)
            if (digits.startsWith("0")) {
                variations.add(digits.substring(1))
                variations.add(`971${digits.substring(1)}`)
            } else if (digits.startsWith("971")) {
                variations.add(`0${digits.substring(3)}`)
                variations.add(digits.substring(3))
            } else {
                variations.add(`0${digits}`)
                variations.add(`971${digits}`)
            }
        }
        variations.add(phone.trim())
        const searchTerms = Array.from(variations)

        // 2. Fetch via Query (Indexed Strategy)
        let db
        try {
            db = getAdminDb()
        } catch (initError: any) {
            console.error("Init Error", initError)
            return { error: `Firebase Init Failed: ${initError.message}` }
        }

        const query1 = db.collection("orders").where("phone", "in", searchTerms).get()
        const query2 = db.collection("orders").where("customerPhone", "in", searchTerms).get()
        const query3 = db.collection("orders").where("whatsapp", "in", searchTerms).get()

        const [snap1, snap2, snap3] = await Promise.all([query1, query2, query3])

        const matchMap = new Map()
        snap1.docs.forEach(doc => matchMap.set(doc.id, doc))
        snap2.docs.forEach(doc => matchMap.set(doc.id, doc))
        snap3.docs.forEach(doc => matchMap.set(doc.id, doc))

        const matches = Array.from(matchMap.values())

        // 3. Return Results or Diagnostic Error
        if (matches.length === 0) {
            return {
                error: `No match for ${digits}. Scanned 0 orders (indexed query). Terms: [${searchTerms.join(", ")}]`
            }
        }

        const safeDate = (val: any) => {
            try {
                return val?.toDate ? val.toDate().toISOString() : val
            } catch { return null }
        }

        // 4. Map results
        const results = matches.map(doc => {
            const data = doc.data()
            return {
                orderId: data.orderId || doc.id,
                status: data.status || "pending",
                device: `${data.brand || ""} ${data.model || ""}`.trim(),
                issue: data.issueType || data.issue || "",
                createdAt: safeDate(data.createdAt),
                updatedAt: safeDate(data.updatedAt),
                technicianName: data.technicianName ? data.technicianName.split(" ")[0] : "Assigned",
                estimatedCompletion: safeDate(data.estimatedCompletion),
                timeline: Array.isArray(data.statusHistory)
                    ? data.statusHistory.map((h: any) => ({ ...h, timestamp: safeDate(h.timestamp) }))
                    : []
            }
        })

        // Sort new to old
        results.sort((a, b) => {
            const tA = new Date(a.createdAt || 0).getTime()
            const tB = new Date(b.createdAt || 0).getTime()
            return tB - tA
        })

        return results

    } catch (e: any) {
        console.error("Public Phone Search Error", e)
        return { error: `Server Exception: ${e.message}` }
    }
}
