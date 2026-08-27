"use server"

import { getAdminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"
import { z } from "zod"
import { verifyAdmin } from "@/lib/server-auth"

const corporateRequestSchema = z.object({
    companyName: z.string().trim().min(2).max(150),
    companyEmail: z.string().trim().email().max(254),
    contactName: z.string().trim().min(2).max(120),
    mobileNumber: z.string().trim().min(7).max(24).regex(/^[+\d][\d\s()-]+$/),
    location: z.string().trim().min(2).max(250),
    deviceCount: z.string().trim().max(8).optional().default(""),
    deviceTypes: z.string().trim().max(500).optional().default(""),
    urgency: z.enum(["", "Normal", "High", "Critical"]).default(""),
    preferredTime: z.string().trim().max(100).optional().default(""),
    notes: z.string().trim().max(2000).optional().default(""),
    privacyConsent: z.literal(true),
})

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] || char)

export async function submitCorporateBookingAction(formData: any) {
    try {
        const parsed = corporateRequestSchema.safeParse(formData)
        if (!parsed.success) return { error: "Please review the request details and try again." }
        formData = parsed.data
        const db = getAdminDb()

        // Construct the detailed message for the existing Admin UI
        const detailedMessage = `
Location: ${formData.location || 'N/A'}
Device Types: ${formData.deviceTypes || 'N/A'}
Urgency: ${formData.urgency || 'Normal'}
Preferred Time: ${formData.preferredTime || 'N/A'}

Additional Notes:
${formData.notes || 'None'}
    `.trim()

        const docData = {
            companyName: formData.companyName,
            email: formData.companyEmail, // Map to 'email' as per Admin UI
            contactPerson: formData.contactName, // Map to 'contactPerson'
            phone: formData.mobileNumber, // Map to 'phone'
            deviceCount: formData.deviceCount,

            // Store structured data for future use
            location: formData.location,
            deviceTypes: formData.deviceTypes,
            urgency: formData.urgency,
            preferredTime: formData.preferredTime,
            notes: formData.notes,

            // The message field shown in Admin
            message: detailedMessage,

            status: "New",
            createdAt: FieldValue.serverTimestamp(),
        }

        await db.collection("corporate_requests").add(docData)

        // Send Email Notification
        // We send to the configured SMTP User (Admin) by default, or a specific notification email
        const adminEmail = process.env.SMTP_USER

        if (adminEmail) {
            const { sendEmail } = await import("@/lib/email-service")
            await sendEmail({
                to: adminEmail,
                subject: `New Corporate Request: ${formData.companyName}`,
                text: detailedMessage,
                html: `
                    <h2>New Corporate Booking Request</h2>
                    <p><strong>Company:</strong> ${escapeHtml(formData.companyName)}</p>
                    <p><strong>Contact:</strong> ${escapeHtml(formData.contactName)} (${escapeHtml(formData.mobileNumber)})</p>
                    <p><strong>Email:</strong> ${escapeHtml(formData.companyEmail)}</p>
                    <hr />
                    <p><strong>Location:</strong> ${escapeHtml(formData.location || 'N/A')}</p>
                    <p><strong>Device Count:</strong> ${escapeHtml(formData.deviceCount || 'N/A')}</p>
                    <p><strong>Device Types:</strong> ${escapeHtml(formData.deviceTypes || 'N/A')}</p>
                    <p><strong>Urgency:</strong> ${escapeHtml(formData.urgency || 'Normal')}</p>
                    <p><strong>Preferred Time:</strong> ${escapeHtml(formData.preferredTime || 'N/A')}</p>
                    <hr />
                    <h3>Notes:</h3>
                    <p>${escapeHtml(formData.notes || 'None')}</p>
                    <br />
                    <p><a href="https://kbi.services/admin/inbox/corporate">View in Admin Panel</a></p>
                `
            })
        }

        return { success: true }
    } catch (error: any) {
        console.error("Corporate booking submission error:", error)
        return { error: error.message || "Failed to submit request" }
    }
}

// ... existing code ...

export async function getCorporateRequestsAction(idToken: string) {
    try {
        if (!await verifyAdmin(idToken)) return { error: "Unauthorized" }
        const cacheKey = "__kbi_corporate_requests_v1"
        const now = Date.now()
        const ttlMs = 60 * 1000
        const backoffMs = 5 * 60 * 1000
        const cached = (globalThis as any)[cacheKey] as { value: any; ts: number; failedTs?: number } | undefined
        if (cached?.failedTs && now - cached.failedTs < backoffMs) return cached.value
        if (cached && now - cached.ts < ttlMs) return cached.value

        const db = getAdminDb()
        const snapshot = await db.collection("corporate_requests").orderBy("createdAt", "desc").limit(100).get()

        const requests = snapshot.docs.map(doc => {
            const data = doc.data()
            return {
                id: doc.id,
                ...data,
                // Serialize Firestore Timestamp to Date or ISO String for client
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null
            }
        })
        const value = { success: true, data: requests }
        ;(globalThis as any)[cacheKey] = { value, ts: now, failedTs: 0 }
        return value
    } catch (error: any) {
        const cacheKey = "__kbi_corporate_requests_v1"
        const now = Date.now()
        const cached = (globalThis as any)[cacheKey] as { value: any; ts: number; failedTs?: number } | undefined
        if (cached) {
            ;(globalThis as any)[cacheKey] = { value: cached.value, ts: cached.ts || now, failedTs: now }
            return cached.value
        }
        return { error: error.message || "Failed to fetch requests" }
    }
}

export async function updateCorporateRequestStatusAction(id: string, status: "New" | "Contacted" | "Closed", idToken: string) {
    try {
        if (!await verifyAdmin(idToken)) return { error: "Unauthorized" }
        if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) return { error: "Invalid request ID" }
        const db = getAdminDb()
        await db.collection("corporate_requests").doc(id).update({ status })
        return { success: true }
    } catch (error: any) {
        console.error("Error updating status:", error)
        return { error: error.message || "Failed to update status" }
    }
}

export async function deleteCorporateRequestAction(id: string, idToken: string) {
    try {
        if (!await verifyAdmin(idToken)) return { error: "Unauthorized" }
        if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) return { error: "Invalid request ID" }
        const db = getAdminDb()
        await db.collection("corporate_requests").doc(id).delete()
        return { success: true }
    } catch (error: any) {
        console.error("Error deleting request:", error)
        return { error: error.message || "Failed to delete request" }
    }
}
