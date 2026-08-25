import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth, getAdminDb, verifyAdmin } from "@/lib/firebase-admin"
import admin from "firebase-admin"

export const dynamic = "force-dynamic"

function isValidEmail(email: string) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function isValidPassword(pw: string) {
  return typeof pw === "string" && pw.length >= 8
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    // Check if the current user is a master admin or has super_admin role
    const envEmails = process.env.MASTER_ADMIN_EMAILS || "";
    const masterAdmins = envEmails.split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
    const masterUid = process.env.MASTER_ADMIN_UID || "";
    const isMaster = (adminUser.email && masterAdmins.includes(adminUser.email.toLowerCase())) || adminUser.uid === masterUid || adminUser.role === "super_admin";

    if (!isMaster) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const email = String(body?.email || "").trim().toLowerCase()
    const password = String(body?.password || "")
    const name = String(body?.name || "").trim()
    const forceChange = !!body?.forceChange

    if (!isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 })
    }
    if (!isValidPassword(password)) {
      return NextResponse.json({ ok: false, error: "Weak password" }, { status: 400 })
    }

    const auth = getAdminAuth()
    const db = getAdminDb()

    let userRecord: admin.auth.UserRecord
    try {
      userRecord = await auth.createUser({
        email,
        password,
        displayName: name || undefined,
        emailVerified: true,
      })
    } catch (e: any) {
      const msg = String(e?.message || "Failed to create user")
      return NextResponse.json({ ok: false, error: msg }, { status: 400 })
    }

    await auth.setCustomUserClaims(userRecord.uid, { role: "super_admin" })

    const now = admin.firestore.Timestamp.now()
    await db.collection("users").doc(userRecord.uid).set(
      {
        uid: userRecord.uid,
        email,
        name: name || "",
        role: "super_admin",
        mustChangePassword: forceChange,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    )

    try {
      await db.collection("audit_logs").add({
        action: "create_super_admin",
        category: "auth",
        userId: adminUser.uid,
        userEmail: adminUser.email || "unknown",
        targetId: userRecord.uid,
        targetType: "user",
        details: { email, forceChange },
        timestamp: now,
      })
    } catch { }

    return NextResponse.json({ ok: true, uid: userRecord.uid }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 })
  }
}
