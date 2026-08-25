import { NextRequest, NextResponse } from "next/server"

import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSessionCookie,
  verifyAdminIdToken as verifyAdmin,
} from "@/lib/admin-session"

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  priority: "high" as const,
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin")
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ ok: false, error: "Invalid origin" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const idToken = typeof body?.idToken === "string" ? body.idToken : ""
  if (!await verifyAdmin(idToken)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
  }

  const session = await createAdminSessionCookie(idToken)
  if (!session) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
  }

  const response = NextResponse.json({ ok: true, role: session.identity.role })
  response.cookies.set(ADMIN_SESSION_COOKIE, session.sessionCookie, {
    ...cookieOptions,
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  })
  return response
}

export async function DELETE(request: NextRequest) {
  const origin = request.headers.get("origin")
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ ok: false, error: "Invalid origin" }, { status: 403 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 })
  return response
}
