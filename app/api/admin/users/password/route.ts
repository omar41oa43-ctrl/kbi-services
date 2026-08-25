import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth, getAdminDb, verifyAdmin } from "@/lib/firebase-admin"
import admin from "firebase-admin"

export const dynamic = "force-dynamic"

function isValidPassword(pw: string) {
  return typeof pw === "string" && pw.length >= 8
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await verifyAdmin(req, true)
    if (!adminUser) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const targetUid = String(body?.uid || "").trim()
    const targetEmail = String(body?.email || "").trim().toLowerCase()
    const newPassword = String(body?.password || "")
    const forceChange = !!body?.forceChange

    if (!isValidPassword(newPassword)) {
      return NextResponse.json({ ok: false, error: "Weak password" }, { status: 400 })
    }

    const auth = getAdminAuth()
    const db = getAdminDb()

    let finalTargetUid = targetUid
    if (!finalTargetUid && targetEmail) {
      try {
        const u = await auth.getUserByEmail(targetEmail)
        finalTargetUid = u.uid
      } catch {
        return NextResponse.json({ ok: false, error: "Target user not found" }, { status: 404 })
      }
    }
    if (!finalTargetUid) {
      return NextResponse.json({ ok: false, error: "Missing target" }, { status: 400 })
    }

    await auth.updateUser(finalTargetUid, { password: newPassword })
    try {
      await db.collection("users").doc(finalTargetUid).update({
        mustChangePassword: forceChange,
        updatedAt: admin.firestore.Timestamp.now(),
      })
    } catch {}

    try {
      await db.collection("audit_logs").add({
        action: "password_changed",
        category: "auth",
        userId: adminUser.uid,
        userEmail: adminUser.email || "unknown",
        targetId: finalTargetUid,
        targetType: "user",
        details: { forceChange },
        timestamp: admin.firestore.Timestamp.now(),
      })
    } catch {}

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Server error" }, { status: 500 })
  }
}
