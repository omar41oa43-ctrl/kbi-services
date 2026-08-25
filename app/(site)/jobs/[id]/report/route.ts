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

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireTechnician(req)
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const report = String(body?.report || "").trim()
    const beforeImages = Array.isArray(body?.beforeImages) ? body.beforeImages : []
    const afterImages = Array.isArray(body?.afterImages) ? body.afterImages : []
    const imagesCount = beforeImages.length + afterImages.length

    if (!report) return NextResponse.json({ error: "Report is required" }, { status: 400 })
    if (imagesCount < 1) return NextResponse.json({ error: "At least one image is required" }, { status: 400 })

    const ref = adminDb.collection("jobs").doc(id)
    const snap = await ref.get()
    if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const data = snap.data() as any
    if (data?.technicianId !== ctx.uid) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const update: any = {
      report,
      notes: Array.isArray(body?.notes) ? body.notes : [],
      partsUsed: Array.isArray(body?.partsUsed) ? body.partsUsed : [],
      serviceCost: body?.serviceCost ?? null,
      beforeImages,
      afterImages,
      updatedAt: new Date(),
    }

    await ref.set(update, { merge: true })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || "Failed to submit report") }, { status: 500 })
  }
}

