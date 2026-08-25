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

export async function GET(req: Request) {
  try {
    const ctx = await requireTechnician(req)
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const url = new URL(req.url)
    const status = url.searchParams.get("status") || ""
    let q: any = adminDb.collection("jobs").where("technicianId", "==", ctx.uid).orderBy("createdAt", "desc")
    if (status) q = q.where("status", "==", status)

    const snap = await q.get()
    const serializeDate = (d: any) => {
      if (!d) return null
      if (typeof d.toDate === "function") return d.toDate().toISOString()
      if (d instanceof Date) return d.toISOString()
      if (typeof d === "string") return d
      return null
    }

    const jobs = snap.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
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
      }
    })

    return NextResponse.json({ jobs })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || "Failed to load jobs") }, { status: 500 })
  }
}

