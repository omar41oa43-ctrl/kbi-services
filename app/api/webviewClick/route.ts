import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const requestTime = url.searchParams.get("ide_webview_request_time")
  return NextResponse.json({ ok: true, requestTime }, { status: 200, headers: { "Cache-Control": "no-store" } })
}

export async function POST(req: Request) {
  let body: unknown = null
  try {
    body = await req.json()
  } catch {}
  return NextResponse.json({ ok: true, body }, { status: 200, headers: { "Cache-Control": "no-store" } })
}
