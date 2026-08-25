import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    onSnapshot,
    query,
    orderBy,
    Timestamp
} from "firebase/firestore"
import { db } from "@/firebase/firebaseConfig"

export interface InventoryItem {
    id?: string
    name: string
    sku: string
    category: string
    quantity: number
    minStock: number
    price: number
    costPrice: number
    supplier?: string
    location?: string
    lastRestocked?: Date
    createdAt?: Date
    updatedAt?: Date
}

// Create a new inventory item
export async function createInventoryItem(item: Omit<InventoryItem, "id">) {
    const docRef = await addDoc(collection(db, "inventory"), {
        ...item,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    })
    return docRef.id
}

// Update an inventory item
export async function updateInventoryItem(id: string, updates: Partial<InventoryItem>) {
    await updateDoc(doc(db, "inventory", id), {
        ...updates,
        updatedAt: Timestamp.now()
    })
}

// Delete an inventory item
export async function deleteInventoryItem(id: string) {
    await deleteDoc(doc(db, "inventory", id))
}

// Get all inventory items
export async function getAllInventory() {
    const snapshot = await getDocs(collection(db, "inventory"))
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem))
}

// Get low stock items
export async function getLowStockItems() {
    const snapshot = await getDocs(collection(db, "inventory"))
    return snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as InventoryItem))
        .filter(item => item.quantity <= item.minStock)
}

// Subscribe to inventory changes
export function subscribeToInventory(callback: (_items: InventoryItem[]) => void) {
    return onSnapshot(
        query(collection(db, "inventory"), orderBy("name")),
        (snapshot) => {
            const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem))
            callback(items)
        },
        () => {}
    )
}

// Update stock quantity
export async function updateStock(id: string, quantityChange: number) {
    const items = await getAllInventory()
    const item = items.find(i => i.id === id)
    if (!item) throw new Error("Item not found")

    const newQuantity = Math.max(0, item.quantity + quantityChange)
    await updateInventoryItem(id, {
        quantity: newQuantity,
        ...(quantityChange > 0 ? { lastRestocked: new Date() } : {})
    })

    return newQuantity
}

// Use inventory for an order
export async function useInventoryForOrder(orderId: string, items: { itemId: string; quantity: number }[]) {
    for (const { itemId, quantity } of items) {
        await updateStock(itemId, -quantity)
    }

    // Log usage
    await addDoc(collection(db, "inventory_usage"), {
        orderId,
        items,
        usedAt: Timestamp.now()
    })
}
