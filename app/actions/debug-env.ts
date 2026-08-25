"use server"

import { getAdminAuth } from "@/lib/firebase-admin"
import { verifyAdmin, UserRoles } from "@/lib/server-auth"

export async function checkEnvServer(idToken: string) {
  const actor = await verifyAdmin(idToken)
  if (!actor || actor.role !== UserRoles.SUPER_ADMIN) return { error: "Unauthorized" }

  let firebaseAdminReady = false
  try {
    await getAdminAuth().listUsers(1)
    firebaseAdminReady = true
  } catch {
    firebaseAdminReady = false
  }

  return {
    firebaseAdminReady,
    serviceAccountConfigured: Boolean(
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      || process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      || (process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY),
    ),
    projectConfigured: Boolean(
      process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    ),
    nodeEnv: process.env.NODE_ENV,
  }
}
