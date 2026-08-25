"use server"

import { adminDb } from "@/lib/firebase-admin"
import { Timestamp } from "firebase-admin/firestore"
import { getNextOrderNumberAction } from "./admin-orders"
import prisma from "@/lib/prisma"

export async function createBookingAction(formData: any, deviceEntries: any[]) {
    try {
        const createdIds: string[] = []

        // Create PostgreSQL order first
        const pgOrderNumbers = await prisma.order.findMany({
            select: { orderNumber: true },
            orderBy: { createdAt: 'desc' },
            take: 1
        })
        let nextPgOrderNumber = 1
        if (pgOrderNumbers.length > 0) {
            const lastOrderNumber = pgOrderNumbers[0].orderNumber
            const match = lastOrderNumber.match(/KBI-(\d+)/)
            if (match) {
                nextPgOrderNumber = parseInt(match[1]) + 1
            }
        }
        const pgOrderNumber = `KBI-${nextPgOrderNumber.toString().padStart(6, '0')}`

        const pgUser = await prisma.user.upsert({
            where: { phone: formData.phone },
            update: {
                name: formData.name,
                email: formData.email || null,
            },
            create: {
                name: formData.name,
                phone: formData.phone,
                email: formData.email || null,
                role: 'CUSTOMER',
            }
        })

        const pgOrder = await prisma.order.create({
            data: {
                orderNumber: pgOrderNumber,
                customerId: pgUser.id,
                description: formData.notes || null,
                address: formData.address || null,
                latitude: formData.locationLat,
                longitude: formData.locationLng,
                images: [],
                devices: {
                    create: deviceEntries.map((entry: any) => ({
                        category: entry.deviceName,
                        brand: entry.brandName,
                        model: entry.model,
                        issue: entry.issues.join(", "),
                    })),
                },
            },
            include: { devices: true }
        })

        // Add to customer timeline
        await prisma.customerTimeline.create({
            data: {
                userId: pgUser.id,
                eventType: "ORDER_CREATED",
                title: `New Order ${pgOrderNumber} Created`,
                data: {
                    orderNumber: pgOrderNumber,
                    orderId: pgOrder.id,
                },
            },
        })

        createdIds.push(pgOrderNumber)

        // Continue with Firebase for backward compatibility
        for (const entry of deviceEntries) {
            // Get sequential order number from admin actions
            const nextOrderResult = await getNextOrderNumberAction()
            const orderId = nextOrderResult.orderNumber || `KBI-${Math.floor(1000 + Math.random() * 9000)}`

            const payload = {
                orderId,
                name: formData.name,
                phone: formData.phone,
                whatsapp: formData.whatsapp || "",
                address: formData.address,
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
                createdAt: new Date(),
                updatedAt: new Date()
            }

            // Add Order
            const orderRef = adminDb.collection("orders").doc()
            await orderRef.set(payload);

            const lat = typeof formData.locationLat === "number" ? formData.locationLat : null
            const lng = typeof formData.locationLng === "number" ? formData.locationLng : null
            const hasCoords = typeof lat === "number" && typeof lng === "number"

            // Add Booking to 'bookings' collection
            const bookingPayload = {
                bookingId: orderId,
                customerName: formData.name,
                customerPhone: formData.phone,
                customerEmail: formData.email || "",
                service: entry.deviceName,
                device: `${entry.brandName || ""} ${entry.model || ""}`.trim(),
                issue: entry.issues.join(", "),
                address: formData.address || "",
                location: {
                    lat: hasCoords ? lat : 0,
                    lng: hasCoords ? lng : 0
                },
                priority: "Normal",
                status: "Pending",
                assignedTechnician: null,
                notes: formData.notes || "",
                createdAt: new Date(),
                updatedAt: new Date()
            }
            await adminDb.collection("bookings").doc(orderId).set(bookingPayload)

            // Add to job_history
            await adminDb.collection("job_history").add({
                bookingId: orderId,
                action: "Booking Created",
                performedBy: "Customer",
                timestamp: new Date(),
                notes: "Booking submitted via customer website form."
            })

            const srRef = adminDb.collection("service_requests").doc()
            await srRef.set({
                type: String(entry.deviceName || ""),
                description: `${entry.brandName || ""} ${entry.model || ""} - ${(entry.issues || []).join(", ")}`.trim(),
                location: {
                    lat: hasCoords ? lat : 0,
                    lng: hasCoords ? lng : 0,
                    address: String(formData.address || ""),
                },
                locationValid: hasCoords,
                status: "new",
                assignedTo: [],
                offers: [],
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                orderId,
            })

            if (orderId !== pgOrderNumber) {
                createdIds.push(orderId)
            }

            // Add Notification
            await adminDb.collection("notifications").add({
                type: "order_created",
                title: "New Order",
                message: `New order ${orderId} from ${formData.name}`,
                role: "admin",
                orderId,
                link: `/admin/orders`,
                read: false,
                createdAt: new Date()
            })

            await adminDb.collection("notifications").add({
                type: "service_request_created",
                title: "New Service Request",
                message: `New service request for order ${orderId}`,
                role: "admin",
                orderId,
                link: `/admin/orders`,
                read: false,
                createdAt: new Date()
            })
        }

        return { success: true, orderIds: createdIds, primaryOrderId: pgOrderNumber }

    } catch (error: any) {
        console.error("Error in createBookingAction:", error)
        return { error: error.message }
    }
}
