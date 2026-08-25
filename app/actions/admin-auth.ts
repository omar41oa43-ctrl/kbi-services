"use server"

import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin"

const adminRoles = new Set(["admin", "super_admin"])

const masterEmails = () => new Set(
  (process.env.MASTER_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
)

const masterUid = () => process.env.MASTER_ADMIN_UID || ""

async function verifyIdentity(idToken: string) {
  if (!idToken) return null
  try {
    return await getAdminAuth().verifyIdToken(idToken, true)
  } catch {
    return null
  }
}

export async function getUserRoleAction(idToken: string) {
  const identity = await verifyIdentity(idToken)
  if (!identity) return { role: null, mustChangePassword: false, error: "Unauthorized" }

  const email = identity.email?.toLowerCase() || ""
  if (identity.uid === masterUid() || (email && masterEmails().has(email))) {
    return { role: "super_admin", mustChangePassword: false }
  }

  const snap = await getAdminDb().collection("users").doc(identity.uid).get()
  if (!snap.exists) return { role: null, mustChangePassword: false }

  const data = snap.data()
  const role = String(data?.role || "").toLowerCase()
  return {
    role: adminRoles.has(role) ? role : null,
    mustChangePassword: !!data?.mustChangePassword,
  }
}

export async function setMustChangePasswordAction(idToken: string, mustChangePassword: boolean) {
  const identity = await verifyIdentity(idToken)
  if (!identity) return { error: "Unauthorized" }

  await getAdminDb().collection("users").doc(identity.uid).set(
    { mustChangePassword: !!mustChangePassword, updatedAt: new Date() },
    { merge: true },
  )
  return { success: true }
}

export async function updateUserEmailAction(idToken: string, email: string) {
  const identity = await verifyIdentity(idToken)
  const normalizedEmail = email.trim().toLowerCase()
  if (!identity) return { error: "Unauthorized" }
  if (!normalizedEmail || identity.email?.toLowerCase() !== normalizedEmail) {
    return { error: "Email must match the authenticated Firebase account" }
  }

  await getAdminDb().collection("users").doc(identity.uid).set(
    { email: normalizedEmail, updatedAt: new Date() },
    { merge: true },
  )
  return { success: true }
}
