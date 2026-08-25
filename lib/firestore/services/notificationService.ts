import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    onSnapshot,
    query,
    where,
    orderBy,
    Timestamp,
    limit
} from "firebase/firestore"
import { db } from "@/firebase/firebaseConfig"

export interface Notification {
    id?: string
    type: "order_created" | "status_update" | "assignment" | "low_stock" | "system"
    title: string
    message: string
    read: boolean
    userId?: string
    role?: "admin" | "technician" | "customer"
    orderId?: string
    link?: string
    createdAt?: Date
}

// Create a notification
export async function createNotification(notification: Omit<Notification, "id" | "read" | "createdAt">) {
    const docRef = await addDoc(collection(db, "notifications"), {
        ...notification,
        read: false,
        createdAt: Timestamp.now()
    })
    return docRef.id
}

// Mark notification as read
export async function markAsRead(notificationId: string) {
    await updateDoc(doc(db, "notifications", notificationId), {
        read: true
    })
}

// Mark all notifications as read for a user
export async function markAllAsRead(userId: string) {
    const snapshot = await getDocs(
        query(collection(db, "notifications"), where("userId", "==", userId), where("read", "==", false))
    )

    const updates = snapshot.docs.map(d => updateDoc(d.ref, { read: true }))
    await Promise.all(updates)
}

// Delete a notification
export async function deleteNotification(id: string) {
    await deleteDoc(doc(db, "notifications", id))
}

// Get unread count for user
export async function getUnreadCount(userId: string) {
    const snapshot = await getDocs(
        query(collection(db, "notifications"), where("userId", "==", userId), where("read", "==", false))
    )
    return snapshot.size
}

// Subscribe to notifications for a user
export function subscribeToNotifications(userId: string, callback: (_notifications: Notification[]) => void) {
    return onSnapshot(
        query(
            collection(db, "notifications"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc"),
            limit(50)
        ),
        (snapshot) => {
            const notifications = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
                createdAt: d.data().createdAt?.toDate()
            } as Notification))
            callback(notifications)
        },
        () => {}
    )
}

// Subscribe to notifications for admin (all admin notifications)
export function subscribeToAdminNotifications(callback: (_notifications: Notification[]) => void) {
    return onSnapshot(
        query(
            collection(db, "notifications"),
            where("role", "==", "admin"),
            orderBy("createdAt", "desc"),
            limit(50)
        ),
        (snapshot) => {
            const notifications = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
                createdAt: d.data().createdAt?.toDate()
            } as Notification))
            callback(notifications)
        },
        () => {}
    )
}

// Helper functions to create specific notification types
export async function notifyOrderCreated(orderId: string, customerName: string) {
    await createNotification({
        type: "order_created",
        title: "New Order",
        message: `New order ${orderId} from ${customerName}`,
        role: "admin",
        orderId,
        link: `/admin/orders`
    })
}

export async function notifyStatusUpdate(orderId: string, newStatus: string, customerId?: string) {
    if (customerId) {
        await createNotification({
            type: "status_update",
            title: "Order Status Updated",
            message: `Your order ${orderId} is now: ${newStatus}`,
            userId: customerId,
            role: "customer",
            orderId,
            link: `/track?id=${orderId}`
        })
    }
}

export async function notifyTechnicianAssigned(orderId: string, technicianId: string, _technicianName: string) {
    await createNotification({
        type: "assignment",
        title: "New Assignment",
        message: `You have been assigned to order ${orderId}`,
        userId: technicianId,
        role: "technician",
        orderId,
        link: `/admin/orders`
    })
}

export async function notifyLowStock(itemName: string, currentQty: number) {
    await createNotification({
        type: "low_stock",
        title: "Low Stock Alert",
        message: `${itemName} is running low (${currentQty} remaining)`,
        role: "admin",
        link: `/admin/inventory`
    })
}
