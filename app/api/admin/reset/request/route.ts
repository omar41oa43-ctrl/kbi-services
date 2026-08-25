import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    { success: false, message: "Use Firebase password reset from the admin sign-in page." },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  )
}
