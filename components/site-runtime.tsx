"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { CookieConsent, type CookieDecision } from "@/components/cookie-consent"

const SafeAnalytics = dynamic(
  () => import("@/components/safe-analytics").then((mod) => mod.SafeAnalytics),
  { ssr: false },
)
const GoogleAnalytics = dynamic(
  () => import("@/components/google-analytics").then((mod) => mod.GoogleAnalytics),
  { ssr: false },
)
const UpdateNotification = dynamic(
  () => import("@/components/update-notification").then((mod) => mod.UpdateNotification),
  { ssr: false },
)

/** Loads non-essential monitoring and update UI after the first interaction frame. */
export function SiteRuntime() {
  const [ready, setReady] = useState(false)
  const [consent, setConsent] = useState<CookieDecision | null | "loading">("loading")

  useEffect(() => {
    try {
      const stored = localStorage.getItem("kbi_cookie_consent_v1")
      setConsent(stored === "granted" || stored === "denied" ? stored : null)
    } catch {
      setConsent(null)
    }

    const load = () => setReady(true)
    const runtime = globalThis as typeof globalThis & {
      requestIdleCallback?: (_callback: () => void, _options?: { timeout: number }) => number
      cancelIdleCallback?: (_id: number) => void
    }

    if (runtime.requestIdleCallback) {
      const id = runtime.requestIdleCallback(load, { timeout: 4000 })
      return () => runtime.cancelIdleCallback?.(id)
    }

    const id = window.setTimeout(load, 1600)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <>
      {consent === null ? <CookieConsent onDecision={setConsent} /> : null}
      {ready && consent === "granted" ? (
        <>
          <SafeAnalytics />
          <GoogleAnalytics />
        </>
      ) : null}
      {ready ? <UpdateNotification /> : null}
    </>
  )
}
