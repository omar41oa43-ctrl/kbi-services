"use client"

import Link from "next/link"
import { useLanguage } from "@/components/language-provider"

export type CookieDecision = "granted" | "denied"

export function CookieConsent({ onDecision }: { onDecision: (_decision: CookieDecision) => void }) {
  const { lang } = useLanguage()
  const isAr = lang === "ar"

  const choose = (decision: CookieDecision) => {
    try {
      localStorage.setItem("kbi_cookie_consent_v1", decision)
    } catch {}
    onDecision(decision)
  }

  return (
    <aside aria-label={isAr ? "اختيارات ملفات تعريف الارتباط" : "Cookie choices"} className="fixed inset-x-4 bottom-20 z-[100] mx-auto max-w-2xl rounded-2xl border border-border bg-background/98 p-5 text-foreground shadow-2xl backdrop-blur-xl lg:bottom-6" dir={isAr ? "rtl" : "ltr"}>
      <p className="font-bold">{isAr ? "خصوصيتك وخيارات التحليلات" : "Your privacy and analytics choices"}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {isAr ? "نستخدم التخزين الضروري لتشغيل الموقع. ولن نفعّل أدوات التحليلات الاختيارية إلا إذا وافقت." : "We use essential storage to operate the site. Optional analytics will only load if you accept."}{" "}
        <Link href="/privacy" className="font-semibold text-cyan-700 underline dark:text-cyan-300">{isAr ? "سياسة الخصوصية" : "Privacy policy"}</Link>
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={() => choose("denied")} className="rounded-xl border border-border px-5 py-2.5 font-semibold hover:bg-muted">{isAr ? "رفض التحليلات" : "Decline analytics"}</button>
        <button type="button" onClick={() => choose("granted")} className="rounded-xl bg-cyan-500 px-5 py-2.5 font-bold text-black hover:bg-cyan-400">{isAr ? "السماح بالتحليلات" : "Allow analytics"}</button>
      </div>
    </aside>
  )
}
