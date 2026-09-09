"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body className="grid min-h-screen place-items-center bg-[#030405] p-6 text-white">
        <main className="max-w-md text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-[#1ECBC7]">KBI Services</p>
          <h1 className="mb-3 text-3xl font-black">Something went wrong</h1>
          <p className="mb-6 text-white/70">The issue was recorded. Please retry without losing your booking draft.</p>
          <button onClick={reset} className="rounded-2xl bg-[#1ECBC7] px-6 py-3 font-black text-[#030405]">
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
