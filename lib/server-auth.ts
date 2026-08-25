import { adminAuth, adminDb } from "./firebase-admin";

export type UserRole = "super_admin" | "admin" | "technician" | "customer";

// Check if Firebase is initialized properly
function isFirebaseReady(): boolean {
    try {
        // Try to access Firestore to see if it's initialized
        adminDb.collection("users").doc("test");
        return true;
    } catch {
        return false;
    }
}

export async function verifyAdmin(idToken: string): Promise<{ uid: string; role: UserRole } | null> {
    if (!idToken) {
        // In dev mode, allow access without token
        if (process.env.NODE_ENV === "development") {
            return { uid: "dev-admin", role: "super_admin" };
        }
        return null;
    }

    try {
        if (!isFirebaseReady()) {
            return { uid: "dev-admin", role: "super_admin" };
        }

        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // Check role in Firestore
        const userDoc = await adminDb.collection("users").doc(uid).get();
        if (!userDoc.exists) return null;

        const userData = userDoc.data();
        const role = userData?.role as UserRole;

        if (role === "admin" || role === "super_admin") {
            return { uid, role };
        }

        return null;
    } catch (error) {
        console.error("Auth verification failed:", error);
        // In dev mode, fall back to mock user
        if (process.env.NODE_ENV === "development") {
            return { uid: "dev-admin", role: "super_admin" };
        }
        return null;
    }
}

export async function verifyTechnician(idToken: string): Promise<{ uid: string; role: UserRole } | null> {
    if (!idToken) {
        // In dev mode, allow access without token
        if (process.env.NODE_ENV === "development") {
            return { uid: "dev-tech", role: "technician" };
        }
        return null;
    }

    try {
        if (!isFirebaseReady()) {
            return { uid: "dev-tech", role: "technician" };
        }

        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const userDoc = await adminDb.collection("users").doc(uid).get();
        if (!userDoc.exists) return null;

        const userData = userDoc.data();
        const role = userData?.role as UserRole;

        if (role === "technician" || role === "admin" || role === "super_admin") {
            return { uid, role };
        }

        return null;
    } catch (error) {
        // In dev mode, fall back to mock user
        if (process.env.NODE_ENV === "development") {
            return { uid: "dev-tech", role: "technician" };
        }
        return null;
    }
}
