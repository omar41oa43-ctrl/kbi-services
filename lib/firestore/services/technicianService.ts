import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    where,
    onSnapshot,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { Technician } from "../schema";

/**
 * Create a new technician profile
 */
export async function createTechnician(techData: Omit<Technician, "id" | "createdAt" | "updatedAt">): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, "technicians"), {
            ...techData,
            totalJobs: 0,
            rating: 0,
            isAvailable: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error: any) {
        console.error("Create technician error:", error);
        throw new Error(error.message || "Failed to create technician");
    }
}

/**
 * Get a single technician by ID
 */
export async function getTechnician(techId: string): Promise<Technician | null> {
    try {
        const docSnap = await getDoc(doc(db, "technicians", techId));
        if (!docSnap.exists()) {
            return null;
        }
        return {
            id: docSnap.id,
            ...docSnap.data(),
        } as Technician;
    } catch (error: any) {
        console.error("Get technician error:", error);
        return null;
    }
}

/**
 * Get technician by user ID
 */
export async function getTechnicianByUserId(userId: string): Promise<Technician | null> {
    try {
        const q = query(collection(db, "technicians"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const doc = querySnapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data(),
        } as Technician;
    } catch (error: any) {
        console.error("Get technician by user ID error:", error);
        return null;
    }
}

/**
 * Update technician profile
 */
export async function updateTechnician(techId: string, updates: Partial<Technician>): Promise<void> {
    try {
        await updateDoc(doc(db, "technicians", techId), {
            ...updates,
            updatedAt: serverTimestamp(),
        });
    } catch (error: any) {
        console.error("Update technician error:", error);
        throw new Error(error.message || "Failed to update technician");
    }
}

/**
 * Delete technician
 */
export async function deleteTechnician(techId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, "technicians", techId));
    } catch (error: any) {
        console.error("Delete technician error:", error);
        throw new Error(error.message || "Failed to delete technician");
    }
}

/**
 * Get all technicians
 */
export async function getAllTechnicians(): Promise<Technician[]> {
    try {
        const querySnapshot = await getDocs(collection(db, "technicians"));
        return querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Technician[];
    } catch (error: any) {
        console.error("Get all technicians error:", error);
        return [];
    }
}

/**
 * Get available technicians
 */
export async function getAvailableTechnicians(): Promise<Technician[]> {
    try {
        const q = query(collection(db, "technicians"), where("isAvailable", "==", true));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Technician[];
    } catch (error: any) {
        console.error("Get available technicians error:", error);
        return [];
    }
}

/**
 * Update technician availability
 */
export async function updateTechnicianAvailability(techId: string, isAvailable: boolean): Promise<void> {
    try {
        await updateTechnician(techId, { isAvailable });
    } catch (error: any) {
        console.error("Update technician availability error:", error);
        throw new Error(error.message || "Failed to update availability");
    }
}

/**
 * Subscribe to all technicians in real-time
 */
export function subscribeToTechnicians(callback: (_technicians: Technician[]) => void): () => void {
    return onSnapshot(collection(db, "technicians"), (snapshot) => {
        const technicians = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Technician[];
        callback(technicians);
    }, () => {});
}
