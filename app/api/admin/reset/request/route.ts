import { NextRequest, NextResponse } from "next/server"
import { auth, db } from "@/firebase/firebaseConfig"
import { collection, getDocs, query, where } from "firebase/firestore"
import { sendPasswordResetEmail } from "firebase/auth"
import { rateLimit, getClientIP } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"



function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIP(req)
    // 5 requests per 10 minutes (matches original intent)
    const limiter = rateLimit(`admin-reset:${ip}`, { maxRequests: 5, windowMs: 10 * 60 * 1000 })

    if (!limiter.success) {
      return NextResponse.json(
        { success: false, message: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    const { email: requestEmail } = await req.json()
    const email = requestEmail?.trim().toLowerCase()

    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, message: "Invalid email address." }, { status: 400 })
    }

    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", email))
    const snap = await getDocs(q)
    const isAdmin = snap.docs.some((d) => {
      const role = String(d.data()?.role || "")
      return role === "admin" || role === "super_admin"
    })

    const origin = req.nextUrl.origin
    const resetUrl = `${origin}/admin/reset-password`

    if (isAdmin) {
      try {
        await sendPasswordResetEmail(auth, email, {
          url: resetUrl,
          handleCodeInApp: true,
        })
      } catch (e) {
        console.error("Failed to send reset email:", e)
      }
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: "If this admin email is registered, a reset link has been sent.",
    })
  } catch (error: any) {
    console.error("Reset request error:", error)
    return NextResponse.json({
      success: true,
      message: "If this admin email is registered, a reset link has been sent.",
    })
  }
}
