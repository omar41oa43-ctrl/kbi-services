import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    User as FirebaseUser,
    updateProfile,
    reauthenticateWithCredential,
    updatePassword,
    EmailAuthProvider
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/firebase/firebaseConfig";
import { User, UserRole } from "../schema";

export interface SignUpData {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    phone?: string;
    address?: string;
}

export interface SignInData {
    email: string;
    password: string;
}

/**
 * Sign up a new user with email/password and create their profile in Firestore
 */
export async function signUp(data: SignUpData): Promise<User> {
    try {
        // Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            data.email,
            data.password
        );

        const firebaseUser = userCredential.user;

        // Update display name in Auth
        await updateProfile(firebaseUser, {
            displayName: data.name
        });

        // Create user document in Firestore
        const userDoc: Omit<User, "uid"> = {
            email: data.email,
            name: data.name,
            role: data.role,
            phone: data.phone,
            address: data.address,
            createdAt: serverTimestamp() as any,
            updatedAt: serverTimestamp() as any,
        };

        await setDoc(doc(db, "users", firebaseUser.uid), userDoc);

        // Return complete user object
        return {
            uid: firebaseUser.uid,
            ...userDoc,
        };
    } catch (error: any) {
        throw new Error(error.message || "Failed to sign up");
    }
}

/**
 * Sign in with email and password
 */
export async function signIn(data: SignInData): Promise<FirebaseUser> {
    try {
        const userCredential = await signInWithEmailAndPassword(
            auth,
            data.email,
            data.password
        );
        return userCredential.user;
    } catch (error: any) {
        throw new Error(error.message || "Failed to sign in");
    }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
    try {
        await firebaseSignOut(auth);
    } catch (error: any) {
        throw new Error(error.message || "Failed to sign out");
    }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
        throw new Error(error.message || "Failed to send password reset email");
    }
}

/**
 * Change password for the currently authenticated user
 * - Security: Requires re-authentication using current password before update
 * - Validation: Enforces minimum length and disallows reusing the old password
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
    // Check authentication state
    const user = auth.currentUser;
    if (!user || !user.email) {
        throw new Error("Not authenticated");
    }

    // Basic password rules
    if (!currentPassword || !newPassword) {
        throw new Error("Passwords must not be empty");
    }
    if (newPassword.length < 8) {
        throw new Error("Password must be at least 8 characters");
    }
    if (newPassword === currentPassword) {
        throw new Error("New password must be different from current password");
    }

    try {
        // Step 1: Re-authenticate the user with current password
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);

        // Step 2: Update password in Firebase Auth
        await updatePassword(user, newPassword);
    } catch (error: any) {
        const code = error?.code as string | undefined;
        if (code === "auth/wrong-password") {
            throw new Error("Wrong current password");
        }
        if (code === "auth/weak-password") {
            throw new Error("Weak password");
        }
        if (code === "auth/too-many-requests") {
            throw new Error("Too many attempts. Try again later");
        }
        if (code === "auth/requires-recent-login") {
            throw new Error("Session expired. Please sign in again");
        }
        throw new Error(error?.message || "Failed to change password");
    }
}

/**
 * Get user data from Firestore
 */
export async function getUserData(uid: string): Promise<User | null> {
    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (!userDoc.exists()) {
            return null;
        }
        return {
            uid: userDoc.id,
            ...userDoc.data(),
        } as User;
    } catch (error: any) {
        return null;
    }
}

/**
 * Get the role of the current user
 */
export async function getUserRole(uid: string): Promise<UserRole | null> {
    const userData = await getUserData(uid);
    return userData?.role || null;
}

/**
 * Check if current user has a specific role
 */
export async function hasRole(uid: string, role: UserRole): Promise<boolean> {
    const userRole = await getUserRole(uid);
    return userRole === role;
}

/**
 * Check if current user is admin
 */
export async function isAdmin(uid: string): Promise<boolean> {
    return hasRole(uid, "admin");
}

/**
 * Check if current user is technician
 */
export async function isTechnician(uid: string): Promise<boolean> {
    return hasRole(uid, "technician");
}

/**
 * Check if current user is customer
 */
export async function isCustomer(uid: string): Promise<boolean> {
    return hasRole(uid, "customer");
}
