"use server"

import { adminDb } from "@/lib/firebase-admin"
import { Timestamp } from "firebase-admin/firestore"
import { getNextOrderNumberAction } from "./admin-orders"
import prisma from "@/lib/prisma"

export async function createBookingAction(formData: any, deviceEntries: any[]) {
    try {
        const createdIds: string[] = []
        const customerName = String(formData?.name || "Customer").trim() || "Customer"
        const customerPhone = String(formData?.phone || "").trim()

        if (!customerPhone) {
            return { error: "Phone number is required" }
        }

        if (!Array.isArray(deviceEntries) || deviceEntries.length === 0) {
            return { error: "At least one device is required" }
        }

        // Generate clean atomic unique order number
        let pgOrderNumber = ""
        try {
            const counterRes = await getNextOrderNumberAction()
            if (counterRes && counterRes.orderNumber) {
                pgOrderNumber = counterRes.orderNumber
            }
        } catch (counterErr) {
            console.error("Counter generation error:", counterErr)
        }

        if (!pgOrderNumber) {
            // High-entropy timestamp-based fallback to guarantee uniqueness
            const now = Date.now()
            const timeSeq = (now % 1000000).toString().padStart(6, "0")
            pgOrderNumber = `KBI-${timeSeq}`
        }

        let pgUserId = ""
        try {
            const pgUser = await prisma.user.upsert({
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
            pgUserId = pgUser?.id || ""

            const sanitizedDevices = deviceEntries.map((entry: any) => ({
                category: String(entry?.deviceName || entry?.deviceType || "Device"),
                brand: String(entry?.brandName || entry?.brand || "Brand"),
                model: String(entry?.model || "Model"),
                issue: Array.isArray(entry?.issues) ? entry.issues.join(", ") : String(entry?.issue || "Inspection"),
            }))

            const pgOrder = await prisma.order.create({
                data: {
                    orderNumber: pgOrderNumber,
                    customerId: pgUserId,
                    description: formData?.notes || null,
                    address: formData?.address || formData?.areaName || "UAE",
                    latitude: typeof formData?.locationLat === "number" ? formData.locationLat : null,
                    longitude: typeof formData?.locationLng === "number" ? formData.locationLng : null,
                    images: [],
                    devices: sanitizedDevices,
                },
            })

            // Add to customer timeline safely
            if (pgUserId) {
                await prisma.customerTimeline.create({
                    data: {
                        userId: pgUserId,
                        eventType: "ORDER_CREATED",
                        title: `New Order ${pgOrderNumber} Created`,
                        data: {
                            orderNumber: pgOrderNumber,
                            orderId: pgOrder?.id || pgOrderNumber,
                        },
                    },
                }).catch(() => {})
            }
        } catch (pgErr) {
            console.error("Prisma order creation fallback:", pgErr)
        }

        createdIds.push(pgOrderNumber)

        // Continue with Firebase for backward compatibility
        for (const entry of deviceEntries) {
            const orderId = pgOrderNumber

            const lat = typeof formData.locationLat === "number" ? formData.locationLat : null
            const lng = typeof formData.locationLng === "number" ? formData.locationLng : null
            const hasCoords = typeof lat === "number" && typeof lng === "number"

            const emirateId = String(formData.emirateId || "abu-dhabi")
            const emirate = String(formData.emirateName || (emirateId === "dubai" ? "Dubai" : emirateId === "sharjah" ? "Sharjah" : emirateId === "ajman" ? "Ajman" : "Abu Dhabi"))
            const areaId = String(formData.areaId || "")
            const area = String(formData.areaName || "")
            const fullAddress = [area, formData.address, emirate, "UAE"].filter(Boolean).join(", ")

            const payload = {
                orderId,
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
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            }

            try {
                await adminDb.collection("orders").add(payload)

                const bookingPayload: any = {
                    bookingId: orderId,
                    orderId,
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
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
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

                await adminDb.collection("bookings").doc(orderId).set(bookingPayload)

                await adminDb.collection("customer_timeline").add({
                    bookingId: orderId,
                    orderId,
                    status: "pending",
                    action: "Booking Created",
                    notes: `Customer created a booking in ${emirate} (${area || 'Doorstep'}) for ${entry?.brandName || ""} ${entry?.model || ""}`,
                    timestamp: Timestamp.now(),
                }).catch(() => {})

                const srRef = adminDb.collection("service_requests").doc()
                await srRef.set({
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
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                    orderId,
                }).catch(() => {})

                // Add Notification
                await adminDb.collection("notifications").add({
                    type: "order_created",
                    title: "New Order",
                    message: `New order ${orderId} from ${customerName}`,
                    role: "admin",
                    orderId,
                    link: `/admin/orders`,
                    read: false,
                    createdAt: new Date()
                }).catch(() => {})
            } catch (fbErr) {
                console.error("Firebase booking write error:", fbErr)
            }
        }

        return { success: true, orderIds: createdIds, primaryOrderId: pgOrderNumber }

    } catch (error: any) {
        console.error("Error in createBookingAction:", error)
        return { error: error?.message || "Failed to create order" }
    }
}
