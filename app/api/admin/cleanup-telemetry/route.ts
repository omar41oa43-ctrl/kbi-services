import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAdmin } from "@/lib/server-auth"

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.replace(/^Bearer\s+/i, "")
    const actor = await verifyAdmin(token)
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Query stale telemetry tracking points
    const snap = await adminDb
      .collection("technician_locations")
      .where("timestamp", "<", thirtyDaysAgo)
      .limit(500)
      .get()

    if (snap.empty) {
      return NextResponse.json({ success: true, count: 0, message: "No stale telemetry found" })
    }

    const batch = adminDb.batch()
    snap.docs.forEach((doc: any) => {
      batch.delete(doc.ref)
    })
    await batch.commit()

    return NextResponse.json({
      success: true,
      cleanedCount: snap.size,
      message: `Successfully cleaned up ${snap.size} stale location tracking records.`,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to cleanup telemetry" }, { status: 500 })
  }
}
