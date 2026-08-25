"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ShieldCheck, X } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

export function CookieConsent() {
  const { lang } = useLanguage()
  const isAr = lang === "ar"
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if consent has already been given or declined
    const consent = localStorage.getItem("kbi_cookie_consent_v1")
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 2000)
      return () => clearTimeout(timer)
    } else {
      // Sync loaded state to Google Consent Mode
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("consent", "update", {
          ad_storage: consent === "granted" ? "granted" : "denied",
          analytics_storage: consent === "granted" ? "granted" : "denied",
        })
      }
    }
  }, [])

  const handleConsent = (status: "granted" | "denied") => {
    localStorage.setItem("kbi_cookie_consent_v1", status)
    setIsVisible(false)

    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("consent", "update", {
        ad_storage: status === "granted" ? "granted" : "denied",
        analytics_storage: status === "granted" ? "granted" : "denied",
      })
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 z-50 max-w-md w-auto"
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-black/85 backdrop-blur-xl p-6 shadow-[0_20px_50px_rgba(6,182,212,0.15)] ring-1 ring-white/10" dir={isAr ? "rtl" : "ltr"}>
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-cyan-500/10 blur-xl pointer-events-none" />
            
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 text-start">
                <h4 className="text-base font-bold text-white mb-1">
                  {isAr ? "خصوصيتك تهمنا 🍪" : "We Value Your Privacy 🍪"}
                </h4>
                <p className="text-sm text-white/70 leading-relaxed mb-4">
                  {isAr
                    ? "نستخدم ملفات تعريف الارتباط لتحسين تجربة التصفح وتحليل حركة المرور. بالنقر فوق 'قبول الكل'، فإنك توافق على استخدامنا لملفات تعريف الارتباط."
                    : "We use cookies to optimize site features and analyze our traffic. By clicking \"Accept All\", you consent to our cookie usage."}
                </p>
                <div className="flex gap-3 justify-start">
                  <Button
                    onClick={() => handleConsent("granted")}
                    className="rounded-xl px-5 h-10 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-colors"
                  >
                    {isAr ? "قبول الكل" : "Accept All"}
                  </Button>
                  <Button
                    onClick={() => handleConsent("denied")}
                    variant="ghost"
                    className="rounded-xl px-5 h-10 border border-white/10 hover:bg-white/5 text-white/80 hover:text-white text-xs transition-colors"
                  >
                    {isAr ? "رفض" : "Decline"}
                  </Button>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setIsVisible(false)}
              aria-label="Close cookie banner"
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
