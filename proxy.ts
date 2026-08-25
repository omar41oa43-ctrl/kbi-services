import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export const ADMIN_SESSION_COOKIE = "kbi_admin_session"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/admin")) {
    // Skip static assets, login page, and reset password page
    if (
      pathname === "/admin/login" || 
      pathname.startsWith("/admin/reset-password") ||
      pathname.includes(".")
    ) {
      return NextResponse.next()
    }

    const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
