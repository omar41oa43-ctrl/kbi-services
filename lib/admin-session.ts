import type { DecodedIdToken } from "firebase-admin/auth"

import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin"

export const ADMIN_SESSION_COOKIE = "kbi_admin_session"
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24

const adminRoles = new Set([
  "super_admin",
  "admin",
  "dispatcher",
  "support",
  "operations_manager",
  "customer_support",
])

const masterEmails = () => new Set(
  (process.env.MASTER_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
)

async function authorize(decoded: DecodedIdToken) {
  if (!decoded.uid || decoded.email_verified === false) return null

  const email = decoded.email?.trim().toLowerCase() || ""
  const isMaster = decoded.uid === (process.env.MASTER_ADMIN_UID || "")
    || (email && masterEmails().has(email))
  if (isMaster) return { uid: decoded.uid, email, role: "super_admin" as const }

  const profile = await getAdminDb().collection("users").doc(decoded.uid).get()
  if (!profile.exists) return null
  const data = profile.data() || {}
  
  if (data.isActive === false || data.isLocked === true || data.disabled === true) {
    return null
  }

  const role = String(data.role || "").trim().toLowerCase()
  if (!adminRoles.has(role)) return null

  return { uid: decoded.uid, email, role: role as "admin" | "super_admin" | "dispatcher" | "support" }
}

export async function verifyAdminIdToken(idToken: string) {
  if (!idToken) return null
  try {
    return authorize(await getAdminAuth().verifyIdToken(idToken, true))
  } catch {
    return null
  }
}

export async function verifyAdminSessionCookie(sessionCookie: string) {
  if (!sessionCookie) return null
  try {
    return authorize(await getAdminAuth().verifySessionCookie(sessionCookie, true))
  } catch {
    return null
  }
}

export async function createAdminSessionCookie(idToken: string) {
  const identity = await verifyAdminIdToken(idToken)
  if (!identity) return null
  const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
    expiresIn: ADMIN_SESSION_MAX_AGE_SECONDS * 1000,
  })
  return { identity, sessionCookie }
}
