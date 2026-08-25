import { randomBytes } from "node:crypto"

import { FieldValue } from "firebase-admin/firestore"
import { NextResponse } from "next/server"

import { authenticateAdmin } from "@/lib/api-auth"
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin"

const allowedActions = new Set([
  "CREATE",
  "APPROVE",
  "REJECT",
  "SUSPEND",
  "ACTIVATE",
  "REACTIVATE",
  "DISABLE",
  "FORCE_LOGOUT",
  "LOCK",
  "UNLOCK",
  "RESET_PASSWORD",
  "TOGGLE_SUBSCRIPTION",
  "DELETE",
])

const temporaryPassword = () => `Kbi!${randomBytes(12).toString("base64url")}9a`

const errorMessage = (error: unknown) => error instanceof Error ? error.message : "Unable to update technician account"

async function setAuthDisabled(uid: string, disabled: boolean) {
  try {
    await getAdminAuth().updateUser(uid, { disabled })
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code
    if (code !== "auth/user-not-found") throw error
  }
}

export async function POST(request: Request) {
  const identity = await authenticateAdmin(request)
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json() as {
      action?: string
      technicianId?: string
      data?: Record<string, unknown>
    }
    const action = String(body.action || "").toUpperCase()
    const data = body.data || {}

    if (!allowedActions.has(action)) {
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 })
    }

    const db = getAdminDb()
    const auth = getAdminAuth()

    if (action === "CREATE") {
      const name = String(data.name || "").trim()
      const email = String(data.email || "").trim().toLowerCase()
      const phone = String(data.phone || "").trim()
      const specialization = String(data.specialization || data.department || "").trim()
      const password = String(data.password || temporaryPassword())

      if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 12) {
        return NextResponse.json({ error: "A valid name, email, and 12-character password are required" }, { status: 400 })
      }

      const user = await auth.createUser({
        email,
        emailVerified: true,
        displayName: name,
        phoneNumber: phone.startsWith("+") ? phone : undefined,
        password,
        disabled: false,
      })

      try {
        await auth.setCustomUserClaims(user.uid, { role: "technician" })
        const now = FieldValue.serverTimestamp()
        const batch = db.batch()
        batch.set(db.collection("users").doc(user.uid), {
          uid: user.uid,
          name,
          email,
          phone,
          role: "technician",
          isActive: true,
          mustChangePassword: true,
          createdAt: now,
          updatedAt: now,
        })
        batch.set(db.collection("technicians").doc(user.uid), {
          uid: user.uid,
          userId: user.uid,
          employeeId: String(data.employeeId || `KBI-${user.uid.slice(0, 6).toUpperCase()}`),
          name,
          email,
          phone,
          specialization,
          department: String(data.department || specialization),
          vehicleType: String(data.vehicleType || "Unassigned"),
          status: "APPROVED",
          isApproved: true,
          isActive: true,
          isSuspended: false,
          isLocked: false,
          appAccessEnabled: true,
          available: true,
          online: false,
          rating: 0,
          completedJobs: 0,
          createdAt: now,
          updatedAt: now,
        })
        batch.set(db.collection("audit_logs").doc(), {
          actorId: identity.uid,
          actorRole: identity.role,
          action: "TECHNICIAN_CREATED",
          targetId: user.uid,
          metadata: { email, name },
          createdAt: now,
        })
        await batch.commit()
      } catch (error) {
        await auth.deleteUser(user.uid).catch(() => undefined)
        throw error
      }

      return NextResponse.json({
        success: true,
        technician: { id: user.uid, name, email, status: "APPROVED" },
        temporaryPassword: password,
      }, { status: 201 })
    }

    let technicianId = String(body.technicianId || "").trim()
    if (!technicianId && action === "RESET_PASSWORD") {
      const requestedEmail = String(data.email || "").trim().toLowerCase()
      if (!/^\S+@\S+\.\S+$/.test(requestedEmail)) {
        return NextResponse.json({ error: "A valid technician email is required" }, { status: 400 })
      }
      try {
        technicianId = (await auth.getUserByEmail(requestedEmail)).uid
      } catch {
        return NextResponse.json({ error: "Technician account not found" }, { status: 404 })
      }
    }
    if (!technicianId) return NextResponse.json({ error: "technicianId is required" }, { status: 400 })

    const technicianRef = db.collection("technicians").doc(technicianId)
    const requestRef = db.collection("technician_requests").doc(technicianId)
    const [technicianDoc, requestDoc] = await Promise.all([
      technicianRef.get(),
      requestRef.get(),
    ])

    if (!technicianDoc.exists && !requestDoc.exists) {
      // Also try to find by userId or email in case technicianId is an email or custom ID
      const userByEmail = await auth.getUserByEmail(technicianId).catch(() => null)
      if (!userByEmail) {
        return NextResponse.json({ error: "Technician or application not found" }, { status: 404 })
      }
    }

    const current = (technicianDoc.exists ? technicianDoc.data() : requestDoc.data()) || {}
    const authUid = String(current.authUid || current.uid || current.userId || (technicianDoc.exists ? technicianId : requestDoc.data()?.userId || technicianId))
    const userId = String(current.userId || "")

    if (action === "DELETE") {
      // 1. Delete user from Firebase Auth if exists
      if (authUid) {
        await auth.deleteUser(authUid).catch((err: any) => {
          console.warn(`Auth delete notice for ${authUid}:`, err?.message || err)
        })
      }
      if (userId && userId !== authUid) {
        await auth.deleteUser(userId).catch(() => undefined)
      }

      // 2. Batch delete all Firestore records (technicians, users, technician_requests, remote_commands)
      const batch = db.batch()
      if (technicianDoc.exists) batch.delete(technicianRef)
      if (requestDoc.exists) batch.delete(requestRef)
      if (authUid) {
        batch.delete(db.collection("technicians").doc(authUid))
        batch.delete(db.collection("users").doc(authUid))
        batch.delete(db.collection("technician_requests").doc(authUid))
      }
      if (userId && userId !== authUid) {
        batch.delete(db.collection("technicians").doc(userId))
        batch.delete(db.collection("users").doc(userId))
        batch.delete(db.collection("technician_requests").doc(userId))
      }

      batch.set(db.collection("audit_logs").doc(), {
        actorId: identity.uid,
        actorRole: identity.role,
        action: "TECHNICIAN_DELETED",
        targetId: technicianId,
        metadata: {
          name: current.name || current.full_name || "Unknown",
          email: current.email || "Unknown",
          authUid,
        },
        createdAt: FieldValue.serverTimestamp(),
      })

      await batch.commit()

      return NextResponse.json({
        success: true,
        technicianId,
        action: "DELETE",
        message: "Technician account and all associated profiles deleted permanently.",
      })
    }

    const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() }
    let disableAuth: boolean | null = null

    if (action === "APPROVE" || action === "ACTIVATE" || action === "REACTIVATE") {
      Object.assign(update, {
        status: "APPROVED",
        isApproved: true,
        isActive: true,
        isSuspended: false,
        isLocked: false,
        appAccessEnabled: true,
      })
      disableAuth = false
      await auth.setCustomUserClaims(authUid, { role: "technician" }).catch(() => undefined)
    } else if (action === "REJECT") {
      Object.assign(update, {
        status: "REJECTED",
        isApproved: false,
        isActive: false,
        appAccessEnabled: false,
        available: false,
        online: false,
        isOnline: false,
      })
      disableAuth = true
    } else if (action === "SUSPEND") {
      Object.assign(update, {
        status: "SUSPENDED",
        isActive: false,
        isSuspended: true,
        appAccessEnabled: false,
        available: false,
        online: false,
        isOnline: false,
      })
      disableAuth = true
    } else if (action === "DISABLE") {
      Object.assign(update, {
        status: "DISABLED",
        isActive: false,
        isApproved: false,
        isSuspended: false,
        isLocked: true,
        appAccessEnabled: false,
        available: false,
        online: false,
        isOnline: false,
      })
      disableAuth = true
    } else if (action === "LOCK") {
      Object.assign(update, { isLocked: true, appAccessEnabled: false, available: false, online: false, isOnline: false })
      disableAuth = true
    } else if (action === "UNLOCK") {
      Object.assign(update, { isLocked: false, appAccessEnabled: true })
      disableAuth = false
    } else if (action === "TOGGLE_SUBSCRIPTION") {
      update.subscriptionStatus = current.subscriptionStatus === "active" ? "inactive" : "active"
    }

    let nextPassword: string | undefined
    let resetRequestId: string | undefined
    if (action === "RESET_PASSWORD") {
      nextPassword = String(data?.password || temporaryPassword()).trim()
      if (nextPassword.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
      resetRequestId = String(data?.requestId || "").trim() || undefined
      if (resetRequestId) {
        const resetRequest = await db.collection("password_reset_requests").doc(resetRequestId).get()
        const requestedTechnician = String(resetRequest.data()?.technicianId || resetRequest.data()?.authUid || "")
        const requestedEmail = String(resetRequest.data()?.email || "").trim().toLowerCase()
        const technicianEmail = String(current.email || data?.email || "").trim().toLowerCase()
        if (!resetRequest.exists || (requestedTechnician !== technicianId && requestedEmail !== technicianEmail)) {
          return NextResponse.json({ error: "Password reset request does not match this technician" }, { status: 400 })
        }
      }
      await auth.updateUser(authUid, { password: nextPassword, disabled: false })
      await auth.revokeRefreshTokens(authUid)
      update.mustChangePassword = data?.mustChangePassword !== false
    }

    if (disableAuth !== null) await setAuthDisabled(authUid, disableAuth)
    if (["FORCE_LOGOUT", "SUSPEND", "LOCK"].includes(action)) {
      await auth.revokeRefreshTokens(authUid).catch(() => undefined)
      const commandRef = db.collection("remote_commands").doc()
      const command = {
        cmdId: commandRef.id,
        technicianId,
        action: action === "LOCK" ? "LOCK_SCREEN" : "FORCE_LOGOUT",
        payload: { reason: `Administrator action: ${action}` },
        createdBy: identity.uid,
        executed: false,
        createdAt: FieldValue.serverTimestamp(),
      }
      await commandRef.set(command)
      update.pendingRemoteCommand = command
    }

    const batch = db.batch()
    batch.set(technicianRef, update, { merge: true })
    batch.set(db.collection("users").doc(authUid), {
      isActive: disableAuth === null ? current.isActive !== false : !disableAuth,
      mustChangePassword: action === "RESET_PASSWORD" ? true : Boolean(current.mustChangePassword),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })
    batch.set(db.collection("audit_logs").doc(), {
      actorId: identity.uid,
      actorRole: identity.role,
      action: `TECHNICIAN_${action}`,
      targetId: technicianId,
      createdAt: FieldValue.serverTimestamp(),
    })
    if (action === "RESET_PASSWORD" && resetRequestId) {
      batch.set(db.collection("password_reset_requests").doc(resetRequestId), {
        status: "resolved",
        resolvedBy: identity.uid,
        resolvedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true })
    }
    await batch.commit()

    return NextResponse.json({ success: true, technicianId, action, password: nextPassword, temporaryPassword: nextPassword })
  } catch (error: unknown) {
    const message = errorMessage(error)
    const conflict = message.includes("email-already-exists") || message.includes("phone-number-already-exists")
    console.error("Technician control error:", error)
    return NextResponse.json({ error: conflict ? "A technician account already uses this email or phone" : message }, { status: conflict ? 409 : 500 })
  }
}
