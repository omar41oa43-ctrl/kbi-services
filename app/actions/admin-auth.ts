"use server"

import { adminDb } from "@/lib/firebase-admin"

const getMasterAdmins = () => {
  const envEmails = process.env.MASTER_ADMIN_EMAILS || process.env.NEXT_PUBLIC_MASTER_ADMIN_EMAILS || "";
  return new Set(envEmails.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean));
}

const getMasterUid = () => {
  return process.env.MASTER_ADMIN_UID || process.env.NEXT_PUBLIC_MASTER_ADMIN_UID || "";
}

export async function getUserRoleAction(uid: string, email?: string | null) {
  try {
    const isMaster = (email && getMasterAdmins().has(String(email).toLowerCase())) || uid === getMasterUid()

    // If master admin, return immediately without needing Firebase
    if (isMaster) {
      return { role: "super_admin", mustChangePassword: false }
    }

    // Try Firebase Admin SDK for non-master admins
    try {
      const ref = adminDb.collection("users").doc(uid)
      const snap = await ref.get()
      if (!snap.exists) {
        return { role: null, mustChangePassword: false }
      }
      const data = snap.data() as any
      return { role: (data?.role as string) || null, mustChangePassword: !!data?.mustChangePassword }
    } catch (firebaseErr) {
      console.log("Firebase Admin unavailable, falling back to basic role check")
      return { role: null, mustChangePassword: false }
    }
  } catch (e: any) {
    console.error("getUserRoleAction error:", e)
    return { role: null, mustChangePassword: false, error: e?.message || "Failed to get role" }
  }
}

export async function setMustChangePasswordAction(uid: string, mustChangePassword: boolean) {
  try {
    await adminDb.collection("users").doc(uid).set(
      {
        mustChangePassword: !!mustChangePassword,
        updatedAt: new Date(),
      },
      { merge: true }
    )
    return { success: true }
  } catch (e: any) {
    return { error: e?.message || "Failed to update" }
  }
}

export async function ensureAdminUserDocAction(uid: string, email: string, role: "admin" | "super_admin" = "admin") {
  try {
    await adminDb.collection("users").doc(uid).set(
      {
        email,
        role,
        mustChangePassword: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true }
    )
    return { success: true }
  } catch (e: any) {
    console.log("ensureAdminUserDocAction failed (non-critical):", e?.message)
    return { error: e?.message || "Failed to create user doc" }
  }
}

export async function updateUserEmailAction(uid: string, email: string) {
  try {
    await adminDb.collection("users").doc(uid).set(
      {
        email,
        updatedAt: new Date(),
      },
      { merge: true }
    )
    return { success: true }
  } catch (e: any) {
    return { error: e?.message || "Failed to update email" }
  }
}

export async function setupDefaultAdminAction(password?: string) {
  try {
    const auth = (await import("@/lib/firebase-admin")).getAdminAuth()
    const db = (await import("@/lib/firebase-admin")).getAdminDb()
    const email = "admin@kbi.ae"
    const targetPassword = password || "AdminPassword2026!"

    let uid = ""
    try {
      const user = await auth.getUserByEmail(email)
      uid = user.uid
      await auth.updateUser(uid, {
        password: targetPassword,
        emailVerified: true
      })
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        const newUser = await auth.createUser({
          email,
          password: targetPassword,
          emailVerified: true,
          displayName: "Super Admin"
        })
        uid = newUser.uid
      } else {
        throw e
      }
    }

    // Set custom claim
    await auth.setCustomUserClaims(uid, { role: "super_admin" })

    // Create user document in Firestore
    const now = new Date()
    await db.collection("users").doc(uid).set({
      email,
      role: "super_admin",
      name: "Super Admin",
      updatedAt: now,
      createdAt: now
    }, { merge: true })

    return { success: true, message: `Admin account '${email}' set up successfully.` }
  } catch (error: any) {
    console.error("setupDefaultAdminAction failed:", error)
    return { error: error?.message || "Failed to setup admin account" }
  }
}

