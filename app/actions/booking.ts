"use server"

import { adminDb } from "@/lib/firebase-admin"
import { Timestamp } from "firebase-admin/firestore"
import { getNextOrderNumberAction } from "./admin-orders"
import prisma from "@/lib/prisma"
import { z } from "zod"
import { createHash } from "node:crypto"

const bookingSchema = z.object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().trim().min(7).max(24).regex(/^[+\d][\d\s()-]+$/),
    whatsapp: z.string().trim().max(24).optional().default(""),
    email: z.string().trim().email().max(254).optional().or(z.literal("")),
    emirateId: z.string().trim().min(2).max(50),
    emirateName: z.string().trim().min(2).max(40),
    areaId: z.string().trim().max(80).optional().default(""),
    areaName: z.string().trim().min(2).max(100),
    address: z.string().trim().max(500).optional().default("On-site Doorstep"),
    locationLat: z.number().min(-90).max(90).nullable().optional(),
    locationLng: z.number().min(-180).max(180).nullable().optional(),
    locationType: z.enum(["home", "office"]).default("home"),
    companyName: z.string().trim().max(120).optional().default(""),
    unitNumber: z.string().trim().max(60).optional().default(""),
    notes: z.string().trim().max(1500).optional().default(""),
    preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    preferredTime: z.string().trim().min(2).max(40),
    privacyConsent: z.boolean().optional().default(true),
    idempotencyKey: z.string().trim().regex(/^[A-Za-z0-9_-]{16,100}$/),
})

const deviceEntrySchema = z.object({
    id: z.string().trim().min(1).max(100),
    deviceId: z.string().trim().min(1).max(80),
    deviceName: z.string().trim().min(1).max(100),
    brandId: z.string().trim().min(1).max(80),
    brandName: z.string().trim().min(1).max(100),
    model: z.string().trim().min(1).max(160),
    issues: z.array(z.string().trim().min(1).max(200)).min(1).max(12),
})

export async function createBookingAction(formData: any, deviceEntries: any[]) {
    try {
        const validated = z.object({
            formData: bookingSchema,
            deviceEntries: z.array(deviceEntrySchema).length(1),
        }).safeParse({ formData, deviceEntries })

        if (!validated.success) {
            return { error: "Please review the booking details and try again." }
        }

        formData = validated.data.formData
        deviceEntries = validated.data.deviceEntries
        const customerName = String(formData?.name || "Customer").trim() || "Customer"
        const customerPhone = String(formData?.phone || "").trim()

        const idempotencyKey = formData.idempotencyKey
        const idempotencyRef = adminDb.collection("booking_idempotency").doc(idempotencyKey)
        const requestHash = createHash("sha256")
            .update(JSON.stringify({ formData, deviceEntries }))
            .digest("hex")
        let reusedReservation = false

        // A retry first reuses the order number already reserved for this
        // browser attempt. Concurrent requests may both reserve a counter
        // value, but only one can create the idempotency document.
        let pgOrderNumber = ""
        const existingReservation = await idempotencyRef.get()
        if (existingReservation.exists) {
            const reservation = existingReservation.data()
            pgOrderNumber = String(reservation?.orderId || "")
            reusedReservation = Boolean(pgOrderNumber)

            if (reservation?.requestHash && reservation.requestHash !== requestHash) {
                return { error: "This booking attempt has changed. Please start a new booking." }
            }

            if (reservation?.status === "completed" && pgOrderNumber) {
                return {
                    success: true,
                    orderIds: [pgOrderNumber],
                    primaryOrderId: pgOrderNumber,
                    deduplicated: true,
                }
            }
        }

        try {
            if (!pgOrderNumber) {
                const counterRes = await getNextOrderNumberAction()
                const candidateOrderNumber = counterRes?.orderNumber || ""

                if (candidateOrderNumber) {
                    try {
                        await idempotencyRef.create({
                            orderId: candidateOrderNumber,
                            requestHash,
                            status: "processing",
                            createdAt: Timestamp.now(),
                            updatedAt: Timestamp.now(),
                        })
                        pgOrderNumber = candidateOrderNumber
                    } catch (reservationError: any) {
                        const code = String(reservationError?.code || "")
                        if (code !== "6" && code !== "already-exists") throw reservationError

                        const winningReservation = await idempotencyRef.get()
                        const reservation = winningReservation.data()
                        if (reservation?.requestHash && reservation.requestHash !== requestHash) {
                            return { error: "This booking attempt has changed. Please start a new booking." }
                        }
                        pgOrderNumber = String(reservation?.orderId || "")
                        reusedReservation = Boolean(pgOrderNumber)
                    }
                }
            }
        } catch (counterErr) {
            console.error("Counter generation error:", counterErr)
        }

        if (!pgOrderNumber) {
            return { error: "Unable to reserve a unique order number. Please try again." }
        }

        // Keep the customer directory in sync, but do it alongside the booking
        // write so it cannot add a full extra round trip to the form response.
        const customerSync = prisma.user.upsert({
                where: { phone: customerPhone },
                update: {
                    name: customerName,
                    email: formData?.email || null,
                },
                create: {
                    name: customerName,
                    phone: customerPhone,
                    email: formData?.email || null,
                    role: 'CUSTOMER',
                }
            })
            .catch((customerError: unknown) => {
                console.error("Customer directory sync notice:", customerError)
                return null
            })

        // Use one short, atomic counter value everywhere the customer sees or
        // searches for the request. Legacy long tracking codes remain searchable
        // through the tracking API, but all new bookings use KBI-000000 format.
        const publicTrackingCode = pgOrderNumber

        const bookingWrites: Array<Promise<FirebaseFirestore.WriteResult[]>> = []

        // Persist every booking representation atomically. This removes the
        // previous duplicate order record and five sequential network writes.
        for (const entry of deviceEntries) {
            const orderId = publicTrackingCode

            const lat = typeof formData.locationLat === "number" ? formData.locationLat : null
            const lng = typeof formData.locationLng === "number" ? formData.locationLng : null
            const hasCoords = typeof lat === "number" && typeof lng === "number"

            const emirateId = String(formData.emirateId || "abu-dhabi")
            const emirate = String(formData.emirateName || (emirateId === "dubai" ? "Dubai" : emirateId === "sharjah" ? "Sharjah" : emirateId === "ajman" ? "Ajman" : "Abu Dhabi"))
            const areaId = String(formData.areaId || "")
            const area = String(formData.areaName || "")
            const fullAddress = [area, formData.address, emirate, "UAE"].filter(Boolean).join(", ")

            const now = Timestamp.now()
            const payload = {
                orderId,
                orderNumber: pgOrderNumber,
                trackingCode: publicTrackingCode,
                country: "UAE",
                emirateId,
                emirate,
                areaId,
                area,
                name: formData.name,
                phone: formData.phone,
                whatsapp: formData.whatsapp || "",
                address: formData.address,
                fullAddress,
                locationType: formData.locationType || "home",
                companyName: formData.companyName || "",
                unitNumber: formData.unitNumber || "",
                notes: formData.notes || "",
                preferredDate: formData.preferredDate || "",
                preferredTime: formData.preferredTime || "",
                deviceType: entry.deviceName,
                brand: entry.brandName,
                model: entry.model,
                issueType: entry.issues.join(", "),
                status: "Order Created",
                technician: "unassigned",
                price: 0,
                createdAt: now,
                updatedAt: now,
            }

            const bookingPayload: any = {
                    bookingId: orderId,
                    orderId,
                    orderNumber: pgOrderNumber,
                    trackingCode: publicTrackingCode,
                    country: "UAE",
                    emirateId,
                    emirate,
                    areaId,
                    area,
                    customerName: customerName,
                    customerPhone: customerPhone,
                    serviceType: String(entry?.deviceName || "Device"),
                    deviceModel: `${entry?.brandName || ""} ${entry?.model || ""}`.trim(),
                    deviceIssues: entry?.issues || [],
                    address: String(formData?.address || formData?.areaName || "UAE"),
                    fullAddress,
                    notes: formData?.notes || "",
                    scheduledDate: formData?.preferredDate || new Date().toISOString().split("T")[0],
                    scheduledTime: formData?.preferredTime || "afternoon",
                    status: "pending",
                    priority: "MEDIUM",
                    createdAt: now,
                    updatedAt: now,
                }

                if (hasCoords) {
                    bookingPayload.latitude = lat
                    bookingPayload.longitude = lng
                    bookingPayload.location = {
                        lat,
                        lng,
                        address: String(formData?.address || ""),
                    }
                }

            const batch = adminDb.batch()
            batch.set(adminDb.collection("orders").doc(orderId), payload, { merge: true })
            batch.set(adminDb.collection("bookings").doc(orderId), bookingPayload, { merge: true })
            batch.set(adminDb.collection("customer_timeline").doc(orderId), {
                    bookingId: orderId,
                    orderId,
                    status: "pending",
                    action: "Booking Created",
                    notes: `Customer created a booking in ${emirate} (${area || 'Doorstep'}) for ${entry?.brandName || ""} ${entry?.model || ""}`,
                    timestamp: now,
                })

            batch.set(adminDb.collection("service_requests").doc(orderId), {
                    type: String(entry?.deviceName || "Device"),
                    description: `${entry?.brandName || ""} ${entry?.model || ""} - ${(entry?.issues || []).join(", ")}`.trim(),
                    country: "UAE",
                    emirateId,
                    emirate,
                    areaId,
                    area,
                    location: {
                        lat: hasCoords ? lat : 0,
                        lng: hasCoords ? lng : 0,
                        address: String(formData?.address || formData?.areaName || "UAE"),
                    },
                    locationValid: hasCoords,
                    status: "new",
                    assignedTo: [],
                    offers: [],
                    createdAt: now,
                    updatedAt: now,
                    orderId,
                })

            batch.set(adminDb.collection("notifications").doc(`order-created-${orderId}`), {
                    type: "order_created",
                    title: "New Order",
                    message: `New order ${orderId} from ${customerName}`,
                    role: "admin",
                    orderId,
                    link: `/admin/orders`,
                    read: false,
                    createdAt: now,
                })
            batch.set(idempotencyRef, {
                    orderId,
                    requestHash,
                    status: "completed",
                    completedAt: now,
                    updatedAt: now,
                }, { merge: true })
            bookingWrites.push(batch.commit())
        }

        await Promise.all([customerSync, ...bookingWrites])

        return {
            success: true,
            orderIds: [publicTrackingCode],
            primaryOrderId: publicTrackingCode,
            deduplicated: reusedReservation,
        }

    } catch (error: any) {
        console.error("Error in createBookingAction:", error)
        return { error: error?.message || "Failed to create order" }
    }
}
