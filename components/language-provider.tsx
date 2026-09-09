"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"

export type Lang = "en" | "ar"
type Dictionary = Record<string, string>

const ENGLISH_COPY: Dictionary = {
  "Corporate hero description": "Reliable on-site repair and maintenance for your company devices, delivered directly at your workplace across the UAE.",
  "Critical industries description": "Specialized field-service infrastructure for organizations where downtime is not an option.",
  "Corporate form description": "Tell us what your organization needs and our corporate team will respond using the details provided.",
  "Corporate CTA description": "Request priority on-site maintenance with experienced technicians, careful handling, and clear service-level commitments.",
  "Dedicated Account Manager Desc": "One dedicated contact who understands your sites, assets, and service history.",
  "Priority Service Desc": "Fast-track dispatch and repair scheduling for business-critical requests.",
  "On-Site Repairs Desc": "Certified technicians come directly to your workplace, reducing downtime and transport risk.",
  "Maintenance Contracts Desc": "Flexible monthly and annual plans designed around your fleet and operating hours.",
  "Asset Reporting Desc": "Clear reports covering device condition, faults, repairs, and recommended next actions.",
  "Data Security Desc": "Strict handling protocols protect company devices and sensitive business information.",
  "Our Mission Desc": "Deliver fast, reliable on-site repairs that save customers time and keep their technology working.",
  "Customer First Desc": "We put customer satisfaction first through clear communication, respectful service, and dependable support.",
  "Quality Guarantee Desc": "We use original or high-quality parts and back eligible repairs with a clear service warranty.",
}

const LanguageContext = createContext<{
  lang: Lang
  setLang: (_lang: Lang) => void
  dictionary: Dictionary | null
}>({ lang: "en", setLang: () => {}, dictionary: null })

export function LanguageProvider({
  children,
  initialLang,
  initialDictionary,
}: {
  children: React.ReactNode
  initialLang?: Lang
  initialDictionary?: Dictionary
}) {
  const [lang, setLang] = useState<Lang>(initialLang ?? "en")
  const [dictionary, setDictionary] = useState<Dictionary | null>(initialDictionary ?? null)
  const pathname = usePathname()

  useEffect(() => {
    if (initialLang) return
    setLang(pathname === "/ar" || pathname?.startsWith("/ar/") ? "ar" : "en")
  }, [initialLang, pathname])

  useEffect(() => {
    if (lang !== "ar" || dictionary) return
    let active = true
    import("@/lib/i18n-dictionary").then(({ DICTIONARY }) => {
      if (active) setDictionary(DICTIONARY)
    }).catch(() => {})
    return () => { active = false }
  }, [dictionary, lang])

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"
    try {
      window.localStorage.setItem("kbi-lang", lang)
      document.cookie = `kbi_lang=${lang};path=/;max-age=31536000;SameSite=Lax`
    } catch {}
  }, [lang])

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    let reloading = false
    const reloadOnce = () => {
      if (reloading) return
      reloading = true
      window.location.reload()
    }
    const onRejection = (event: PromiseRejectionEvent) => {
      const name = String(event.reason?.name || "")
      const message = String(event.reason?.message || "")
      if (name === "AbortError" || /ERR_ABORTED|\?_rsc=/.test(message)) {
        event.preventDefault()
        return
      }
      if (name === "ChunkLoadError" || /Loading chunk .* failed|Failed to load chunk/i.test(message)) reloadOnce()
    }
    window.addEventListener("unhandledrejection", onRejection)
    return () => {
      window.removeEventListener("unhandledrejection", onRejection)
    }
  }, [])

  const value = useMemo(() => ({ lang, setLang, dictionary }), [dictionary, lang])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const { lang, setLang } = useContext(LanguageContext)
  return { lang, setLang }
}

export function useT() {
  const { lang, dictionary } = useContext(LanguageContext)
  return (key: string) => (lang === "ar" ? dictionary?.[key] || key : ENGLISH_COPY[key] || key)
}
