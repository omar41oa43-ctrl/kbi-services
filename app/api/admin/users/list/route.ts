import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth, verifyAdmin } from "@/lib/firebase-admin"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const adminUser = await verifyAdmin(req, true)
    if (!adminUser) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
    }

    const auth = getAdminAuth()
    const users: Array<{ uid: string; email: string }> = []
    let pageToken: string | undefined = undefined
    do {
      const res = await auth.listUsers(1000, pageToken)
      for (const u of res.users) {
        const email = u.email || ""
        if (email) {
          users.push({ uid: u.uid, email })
        }
      }
      pageToken = res.pageToken || undefined
    } while (pageToken)

    return NextResponse.json({ ok: true, users }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Server error" }, { status: 500 })
  }
}
