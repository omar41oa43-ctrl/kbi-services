import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    setDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp,
} from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { Order, OrderStatus } from "../schema";

/**
 * Create a new order
 */
export async function createOrder(orderData: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, "orders"), {
            ...orderData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error: any) {
        console.error("Create order error:", error);
        throw new Error(error.message || "Failed to create order");
    }
}

/**
 * Get a single order by ID
 */
export async function getOrder(orderId: string): Promise<Order | null> {
    try {
        const docSnap = await getDoc(doc(db, "orders", orderId));
        if (!docSnap.exists()) {
            return null;
        }
        return {
            id: docSnap.id,
            ...docSnap.data(),
        } as Order;
    } catch (error: any) {
        console.error("Get order error:", error);
        return null;
    }
}

/**
 * Update an existing order
 */
export async function updateOrder(orderId: string, updates: Partial<Order>): Promise<void> {
    try {
        await updateDoc(doc(db, "orders", orderId), {
            ...updates,
            updatedAt: serverTimestamp(),
        });
    } catch (error: any) {
        console.error("Update order error:", error);
        throw new Error(error.message || "Failed to update order");
    }
}

/**
 * Delete an order
 */
export async function deleteOrder(orderId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, "orders", orderId));
    } catch (error: any) {
        console.error("Delete order error:", error);
        throw new Error(error.message || "Failed to delete order");
    }
}

/**
 * Get all orders
 */
export async function getAllOrders(): Promise<Order[]> {
    try {
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Order[];
    } catch (error: any) {
        console.error("Get all orders error:", error);
        return [];
    }
}

/**
 * Get orders by status
 */
export async function getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    try {
        const q = query(
            collection(db, "orders"),
            where("status", "==", status),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Order[];
    } catch (error: any) {
        console.error("Get orders by status error:", error);
        return [];
    }
}

/**
 * Get orders for a specific technician
 */
export async function getOrdersByTechnician(technicianId: string): Promise<Order[]> {
    try {
        const q = query(
            collection(db, "orders"),
            where("technicianId", "==", technicianId),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Order[];
    } catch (error: any) {
        console.error("Get orders by technician error:", error);
        return [];
    }
}

/**
 * Get orders for a specific customer
 */
export async function getOrdersByCustomer(customerId: string): Promise<Order[]> {
    try {
        const q = query(
            collection(db, "orders"),
            where("customerId", "==", customerId),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Order[];
    } catch (error: any) {
        console.error("Get orders by customer error:", error);
        return [];
    }
}

/**
 * Assign order to a technician
 */
export async function assignOrderToTechnician(
    orderId: string,
    technicianId: string,
    technicianName: string
): Promise<void> {
    try {
        const payload: Partial<Order> = {
            technicianId,
            technicianName,
            status: "assigned",
            assignedAt: Timestamp.now() as any,
        };

        await updateOrder(orderId, payload);

        // Mirror to bookings, service_requests, and technicians
        const fullPayload = {
            ...payload,
            assignedTechnician: technicianId,
            assignedTechnicianId: technicianId,
            assignedTechnicians: [technicianId],
            assignedTechnicianNames: [technicianName],
            technicianIds: [technicianId],
            technicianNames: [technicianName],
            updatedAt: Timestamp.now(),
        };

        try {
            await setDoc(doc(db, "bookings", orderId), fullPayload, { merge: true });
        } catch (_) {}

        try {
            await setDoc(doc(db, "service_requests", orderId), fullPayload, { merge: true });
        } catch (_) {}

        try {
            await setDoc(
                doc(db, "technicians", technicianId),
                {
                    currentJob: orderId,
                    currentOrder: orderId,
                    status: "ON_JOB",
                    available: false,
                    updatedAt: Timestamp.now(),
                },
                { merge: true }
            );
        } catch (_) {}
    } catch (error: any) {
        console.error("Assign order error:", error);
        throw new Error(error.message || "Failed to assign order");
    }
}

/**
 * Update order status
 */
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    try {
        const updates: Partial<Order> = { status };

        // If completing the order, add completed date
        if (status === "completed") {
            updates.completedDate = Timestamp.now() as any;
        }

        await updateOrder(orderId, updates);
    } catch (error: any) {
        console.error("Update order status error:", error);
        throw new Error(error.message || "Failed to update order status");
    }
}

/**
 * Subscribe to all orders in real-time
 */
export function subscribeToOrders(callback: (_orders: Order[]) => void): () => void {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    return onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Order[];
        callback(orders);
    }, () => {});
}

/**
 * Subscribe to orders by technician in real-time
 */
export function subscribeToTechnicianOrders(
    technicianId: string,
    callback: (_orders: Order[]) => void
): () => void {
    const q = query(
        collection(db, "orders"),
        where("technicianId", "==", technicianId),
        orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Order[];
        callback(orders);
    }, () => {});
}

/**
 * Subscribe to orders by customer in real-time
 */
export function subscribeToCustomerOrders(
    customerId: string,
    callback: (_orders: Order[]) => void
): () => void {
    const q = query(
        collection(db, "orders"),
        where("customerId", "==", customerId),
        orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Order[];
        callback(orders);
    }, () => {});
}
