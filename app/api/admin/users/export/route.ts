import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth, verifyAdmin } from "@/lib/firebase-admin"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const adminUser = await verifyAdmin(req, true)
    if (!adminUser) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const auth = getAdminAuth()
    const lines: string[] = []
    lines.push("email,uid")

    let pageToken: string | undefined = undefined
    do {
      const res = await auth.listUsers(1000, pageToken)
      for (const u of res.users) {
        const email = u.email || ""
        const uid = u.uid
        if (!email) continue
        lines.push(`${email},${uid}`)
      }
      pageToken = res.pageToken || undefined
    } while (pageToken)

    const body = lines.join("\n")
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="users.txt"`,
      },
    })
  } catch (error: any) {
    return new NextResponse(error?.message || "Server error", { status: 500 })
  }
}
