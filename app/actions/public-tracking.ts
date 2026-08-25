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

        // Decode URL components in case of "%2C%20", spaces, or commas
        let rawId = decodeURIComponent(orderId).trim()
        
        // Build set of candidate search keys
        const candidates = new Set<string>()
        candidates.add(rawId)
        candidates.add(orderId.trim())

        // Extract individual tokens if multiple IDs were separated by commas or spaces
        const tokens = rawId.split(/[,;\s]+/).map(t => t.trim()).filter(Boolean)
        tokens.forEach(t => {
            candidates.add(t)
            // Strip leading hash
            if (t.startsWith("#")) candidates.add(t.slice(1).trim())
            // If prefixed with KBI- or ORD-
            candidates.add(t.toUpperCase())
            candidates.add(t.toLowerCase())
        })

        // Also extract regex patterns like ORD-\d+ or KBI-\d+
        const ordMatches = rawId.match(/(?:ORD|KBI)-?\d+/gi)
        if (ordMatches) {
            ordMatches.forEach(m => {
                candidates.add(m.trim())
                candidates.add(m.trim().toUpperCase())
            })
        }

        const searchKeys = Array.from(candidates).filter(Boolean)

        // 1. Try direct doc lookups in 'orders' and 'bookings'
        for (const key of searchKeys) {
            const orderDoc = await db.collection("orders").doc(key).get()
            if (orderDoc.exists) {
                const data = orderDoc.data() || {}
                return {
                    id: orderDoc.id,
                    orderId: data.orderId || orderDoc.id,
                    status: data.status || "pending",
                    device: data.device || `${data.brand || ""} ${data.model || ""}`.trim() || "Device Repair",
                    service: data.service || data.serviceType || data.issueType || data.issue || "General Repair",
                    issue: data.issueType || data.issue || "",
                    createdAt: safeDate(data.createdAt),
                    updatedAt: safeDate(data.updatedAt),
                    customerName: data.customerName || data.name || "Customer",
                    customerPhone: data.customerPhone || data.phone || "",
                    technicianName: data.technicianName ? data.technicianName.split(" ")[0] : (data.assignedTechnician ? "Assigned" : ""),
                    assignedTechnician: data.assignedTechnician || data.technicianId,
                    estimatedCompletion: safeDate(data.estimatedCompletion),
                    timeline: Array.isArray(data.statusHistory)
                        ? data.statusHistory.map((h: any) => ({ ...h, timestamp: safeDate(h.timestamp) }))
                        : []
                }
            }

            const bookingDoc = await db.collection("bookings").doc(key).get()
            if (bookingDoc.exists) {
                const data = bookingDoc.data() || {}
                return {
                    id: bookingDoc.id,
                    orderId: data.orderId || data.trackingNumber || bookingDoc.id,
                    status: data.status || "pending",
                    device: data.device || `${data.brand || ""} ${data.model || ""}`.trim() || "Device Repair",
                    service: data.service || data.serviceType || "Service Request",
                    issue: data.issueType || data.issue || "",
                    createdAt: safeDate(data.createdAt),
                    updatedAt: safeDate(data.updatedAt),
                    customerName: data.customerName || data.name || "Customer",
                    customerPhone: data.customerPhone || data.phone || "",
                    technicianName: data.technicianName ? data.technicianName.split(" ")[0] : (data.assignedTechnician ? "Assigned" : ""),
                    assignedTechnician: data.assignedTechnician || data.technicianId,
                    estimatedCompletion: safeDate(data.estimatedCompletion),
                    timeline: Array.isArray(data.statusHistory)
                        ? data.statusHistory.map((h: any) => ({ ...h, timestamp: safeDate(h.timestamp) }))
                        : []
                }
            }
        }

        // 2. Try querying 'orders' collection with 'in' queries on orderId, id, trackingNumber
        for (const chunk of chunkArray(searchKeys, 10)) {
            const [qOrderId, qTracking] = await Promise.all([
                db.collection("orders").where("orderId", "in", chunk).limit(1).get(),
                db.collection("orders").where("trackingNumber", "in", chunk).limit(1).get(),
            ])

            const hit = !qOrderId.empty ? qOrderId.docs[0] : (!qTracking.empty ? qTracking.docs[0] : null)
            if (hit) {
                const data = hit.data() || {}
                return {
                    id: hit.id,
                    orderId: data.orderId || hit.id,
                    status: data.status || "pending",
                    device: data.device || `${data.brand || ""} ${data.model || ""}`.trim() || "Device Repair",
                    service: data.service || data.serviceType || data.issueType || data.issue || "General Repair",
                    issue: data.issueType || data.issue || "",
                    createdAt: safeDate(data.createdAt),
                    updatedAt: safeDate(data.updatedAt),
                    customerName: data.customerName || data.name || "Customer",
                    customerPhone: data.customerPhone || data.phone || "",
                    technicianName: data.technicianName ? data.technicianName.split(" ")[0] : (data.assignedTechnician ? "Assigned" : ""),
                    assignedTechnician: data.assignedTechnician || data.technicianId,
                    estimatedCompletion: safeDate(data.estimatedCompletion),
                    timeline: Array.isArray(data.statusHistory)
                        ? data.statusHistory.map((h: any) => ({ ...h, timestamp: safeDate(h.timestamp) }))
                        : []
                }
            }
        }

        // 3. Try querying 'bookings' collection
        for (const chunk of chunkArray(searchKeys, 10)) {
            const [qOrderId, qTracking] = await Promise.all([
                db.collection("bookings").where("orderId", "in", chunk).limit(1).get(),
                db.collection("bookings").where("trackingNumber", "in", chunk).limit(1).get(),
            ])

            const hit = !qOrderId.empty ? qOrderId.docs[0] : (!qTracking.empty ? qTracking.docs[0] : null)
            if (hit) {
                const data = hit.data() || {}
                return {
                    id: hit.id,
                    orderId: data.orderId || data.trackingNumber || hit.id,
                    status: data.status || "pending",
                    device: data.device || `${data.brand || ""} ${data.model || ""}`.trim() || "Device Repair",
                    service: data.service || data.serviceType || "Service Request",
                    issue: data.issueType || data.issue || "",
                    createdAt: safeDate(data.createdAt),
                    updatedAt: safeDate(data.updatedAt),
                    customerName: data.customerName || data.name || "Customer",
                    customerPhone: data.customerPhone || data.phone || "",
                    technicianName: data.technicianName ? data.technicianName.split(" ")[0] : (data.assignedTechnician ? "Assigned" : ""),
                    assignedTechnician: data.assignedTechnician || data.technicianId,
                    estimatedCompletion: safeDate(data.estimatedCompletion),
                    timeline: Array.isArray(data.statusHistory)
                        ? data.statusHistory.map((h: any) => ({ ...h, timestamp: safeDate(h.timestamp) }))
                        : []
                }
            }
        }

        return null
    } catch (e) {
        console.error("Public Order Search Error", e)
        return null
    }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
    const res: T[][] = []
    for (let i = 0; i < arr.length; i += size) {
        res.push(arr.slice(i, i + size))
    }
    return res
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
