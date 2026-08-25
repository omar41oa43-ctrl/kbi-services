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

const serializeDate = (d: any) => {
  if (!d) return null
  if (typeof d.toDate === "function") return d.toDate().toISOString()
  if (d instanceof Date) return d.toISOString()
  if (typeof d === "string") return d
  return null
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireTechnician(req)
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const snap = await adminDb.collection("jobs").doc(id).get()
    if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const data = snap.data() as any
    if (data?.technicianId !== ctx.uid) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    return NextResponse.json({
      job: {
        id: snap.id,
        companyName: data.companyName || "",
        issueTitle: data.issueTitle || "",
        description: data.description || "",
        priority: data.priority || "medium",
        location: data.location || "",
        status: data.status || "new",
        technicianId: data.technicianId || "",
        companyPhone: data.companyPhone || "",
        companyWhatsapp: data.companyWhatsapp || "",
        createdAt: serializeDate(data.createdAt),
        updatedAt: serializeDate(data.updatedAt),
        report: data.report || null,
        notes: Array.isArray(data.notes) ? data.notes : [],
        partsUsed: Array.isArray(data.partsUsed) ? data.partsUsed : [],
        serviceCost: data.serviceCost ?? null,
        beforeImages: Array.isArray(data.beforeImages) ? data.beforeImages : [],
        afterImages: Array.isArray(data.afterImages) ? data.afterImages : [],
        startedAt: serializeDate(data.startedAt),
        completedAt: serializeDate(data.completedAt),
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || "Failed to load job") }, { status: 500 })
  }
}

