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
    <aside aria-label={isAr ? "اختيارات ملفات تعريف الارتباط" : "Cookie choices"} className="fixed inset-x-4 bottom-20 z-[100] mx-auto max-w-xl rounded-2xl border border-border bg-background/98 p-4 text-foreground shadow-xl backdrop-blur-xl lg:bottom-6" dir={isAr ? "rtl" : "ltr"}>
      <p className="text-sm font-bold">{isAr ? "الخصوصية والتحليلات" : "Privacy and analytics"}</p>
      <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
        {isAr ? "نستخدم التخزين الضروري فقط. ولا تعمل التحليلات دون موافقتك." : "We use essential storage only. Analytics stays off without your consent."}{" "}
        <Link href="/privacy" className="font-semibold text-cyan-700 underline dark:text-cyan-300">{isAr ? "سياسة الخصوصية" : "Privacy policy"}</Link>
      </p>
      <div className="mt-3 flex gap-2 justify-end">
        <button type="button" onClick={() => choose("denied")} className="min-h-10 rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-muted">{isAr ? "رفض" : "Decline"}</button>
        <button type="button" onClick={() => choose("granted")} className="min-h-10 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-black hover:bg-cyan-400">{isAr ? "سماح" : "Allow"}</button>
      </div>
    </aside>
  )
}
