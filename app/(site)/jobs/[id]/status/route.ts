import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization") || ""
  const parts = auth.split(" ")
  if (parts.length === 2 && parts[0].toLowerCase() === "bearer") return parts[1]
  return ""
}

async function requireTechnician(req: Request) {
  const token = getBearerToken(req)
  if (!token) return null
  const decoded = await adminAuth.verifyIdToken(token)
  const uid = decoded?.uid
  if (!uid) return null
  const userSnap = await adminDb.collection("users").doc(uid).get()
  const role = userSnap.exists ? (userSnap.data() as any)?.role : null
  if (role !== "technician") return null
  return { uid }
}

const allowed = new Set(["new", "in_progress", "completed"])

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireTechnician(req)
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const status = String(body?.status || "")
    if (!allowed.has(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 })

    const ref = adminDb.collection("jobs").doc(id)
    const snap = await ref.get()
    if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const data = snap.data() as any
    if (data?.technicianId !== ctx.uid) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const update: any = { status, updatedAt: new Date() }
    if (status === "in_progress" && !data?.startedAt) update.startedAt = new Date()
    if (status === "completed") update.completedAt = new Date()
    await ref.update(update)

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || "Failed to update status") }, { status: 500 })
  }
}

