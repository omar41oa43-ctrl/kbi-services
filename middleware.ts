import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const JWKS_URL = "https://www.googleapis.com/serviceaccounts/keys/securetoken@system.gserviceaccount.com"

const getMasterAdmins = () => {
  const envEmails = process.env.MASTER_ADMIN_EMAILS || process.env.NEXT_PUBLIC_MASTER_ADMIN_EMAILS || "";
  return new Set(envEmails.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean));
}

function decodeBase64Url(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/")
  const pad = 4 - (base64.length % 4)
  if (pad < 4) {
    base64 += "=".repeat(pad)
  }
  return atob(base64)
}

async function verifyFirebaseToken(token: string, projectId: string) {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null

    const [headerB64, payloadB64, signatureB64] = parts
    const header = JSON.parse(decodeBase64Url(headerB64))
    const payload = JSON.parse(decodeBase64Url(payloadB64))

    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) return null
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null
    if (payload.aud !== projectId) return null

    const kid = header.kid
    if (!kid) return null

    const res = await fetch(JWKS_URL, {
      next: { revalidate: 3600 } // Cache JWK response
    })
    if (!res.ok) return null
    const { keys } = await res.json()
    
    const jwk = keys.find((k: any) => k.kid === kid)
    if (!jwk) return null

    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      {
        name: "RSASSA-PKCS-v1_5",
        hash: { name: "SHA-256" }
      },
      false,
      ["verify"]
    )

    const signature = Uint8Array.from(decodeBase64Url(signatureB64), c => c.charCodeAt(0))
    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`)

    const isValid = await crypto.subtle.verify(
      "RSASSA-PKCS-v1_5",
      key,
      signature,
      data
    )

    return isValid ? payload : null
  } catch (e) {
    console.error("Middleware signature verification failed:", e)
    return null
  }
}

export async function middleware(request: NextRequest) {
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

    const token = request.cookies.get("kbi_admin_token")?.value
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "kbi2-f4f19"

    const isMock = 
      !process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes("YOUR_") ||
      !projectId || 
      projectId.includes("YOUR_")

    if (isMock) {
      return NextResponse.next()
    }

    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }

    // First try to decode token to check if it's a master admin (without full verification)
    try {
      const parts = token.split(".")
      if (parts.length === 3) {
        const payload = JSON.parse(decodeBase64Url(parts[1]))
        const masterAdmins = getMasterAdmins()
        const isMasterAdmin = payload.email && masterAdmins.has(payload.email.toLowerCase())
        if (isMasterAdmin) {
          console.log("Master admin detected, bypassing full crypto verification")
          return NextResponse.next()
        }
      }
    } catch (e) {
      console.log("Quick check failed, proceeding to full verification")
    }

    const decoded = await verifyFirebaseToken(token, projectId)
    if (!decoded) {
      const response = NextResponse.redirect(new URL("/admin/login", request.url))
      response.cookies.delete("kbi_admin_token")
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}