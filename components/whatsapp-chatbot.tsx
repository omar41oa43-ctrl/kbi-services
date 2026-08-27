"use client"

import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage, useT } from "@/components/language-provider"
import { 
  MessageCircle, 
  Send, 
  Wrench, 
  Search, 
  Building2, 
  HelpCircle, 
  DollarSign, 
  Clock, 
  ShieldCheck, 
  Smartphone, 
  Laptop, 
  CheckCircle2 
} from "lucide-react"

interface WhatsAppChatbotProps {
  bookingStep?: number
  currentDevice?: string
  currentIssue?: string
}

export function WhatsAppChatbot({ 
  bookingStep,
  currentDevice,
  currentIssue
}: WhatsAppChatbotProps) {
  const { lang } = useLanguage()
  const t = useT()
  const isAr = lang === "ar"

  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [mounted, setMounted] = useState(false)

  const phone = "971502491034"

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Quick actions that change based on booking context
  const quickActions = useMemo(() => {
    const baseActions = [
      { label: t("Book Technician"), icon: Wrench, preset: t("Hello, I want to book a technician.") },
      { label: t("Track Order"), icon: Search, preset: t("Hello, I want to track my order.") },
      { label: t("Corporate Support"), icon: Building2, preset: t("Hello, I need corporate support.") },
    ]

    if (bookingStep) {
      // Booking-specific quick actions
      const bookingActions = [
        { label: t("How much?"), icon: DollarSign, preset: t("Hello! I'm booking a repair and would like a price estimate.") },
        { label: t("Same-day?"), icon: Clock, preset: t("Hello! Do you offer same-day service for this repair?") },
        { label: t("Warranty?"), icon: ShieldCheck, preset: t("Hello! What warranty do you offer on repairs?") },
      ]

      // If user is on specific device, add context-specific question
      if (currentDevice) {
        bookingActions.unshift({
          label: `${t("Price for")} ${currentDevice}`,
          icon: currentDevice.includes("phone") || currentDevice.includes("mobile") ? Smartphone : Laptop,
          preset: t("Hello! I'd like to know the price for {device} repair.").replace("{device}", currentDevice)
        })
      }

      return [...baseActions, ...bookingActions]
    }

    return baseActions
  }, [bookingStep, currentDevice, t])

  if (!mounted) return null

  const openWhatsApp = (text?: string) => {
    // Add booking context if available
    let contextMessage = text || message || t("Hello! I need support.")
    
    if (bookingStep) {
      contextMessage += `\n\n📋 Booking Context:\n• Step: ${bookingStep}/5`
      if (currentDevice) contextMessage += `\n• Device: ${currentDevice}`
      if (currentIssue) contextMessage += `\n• Issue: ${currentIssue}`
    }
    
    contextMessage += "\n" + window.location.href
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(contextMessage)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <div
      className={`${isAr ? "left-6" : "right-6"} fixed bottom-24 md:bottom-8 z-[100]`}
      dir={isAr ? "rtl" : "ltr"}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98, originY: "bottom" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "circOut" }}
            className={`mb-4 ${isAr ? "ml-0" : "mr-0"}`}
          >
            <div className="w-[92vw] max-w-[380px] p-5 rounded-3xl border border-border/80 shadow-2xl backdrop-blur-2xl bg-card/95 text-card-foreground">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 dark:bg-emerald-500/20 flex items-center justify-center ring-1 ring-emerald-500/30">
                  <MessageCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground truncate" suppressHydrationWarning>{t("Support Chat")}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5" suppressHydrationWarning>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="truncate">
                      {bookingStep 
                        ? t("Booking help available") 
                        : t("We reply fast on WhatsApp")}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                  aria-label="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>

              {bookingStep && (
                <div className="mb-3.5 p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/25">
                  <div className="flex items-center gap-2 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span suppressHydrationWarning>
                      {t("We can help with booking step {step}").replace("{step}", bookingStep.toString())}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {quickActions.map((qa, i) => (
                  <button
                    key={i}
                    onClick={() => openWhatsApp(qa.preset)}
                    className="flex flex-col items-center justify-center gap-1.5 p-2.5 text-[11px] font-medium rounded-2xl bg-muted/60 hover:bg-accent border border-border/60 hover:border-cyan-500/40 text-foreground transition-all duration-200 group active:scale-95"
                    title={qa.label}
                    suppressHydrationWarning
                  >
                    <div className="p-1.5 rounded-xl bg-background group-hover:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 transition-colors">
                      <qa.icon className="w-4 h-4" />
                    </div>
                    <span className="truncate w-full text-center text-[11px] text-foreground font-semibold" suppressHydrationWarning>{qa.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-2.5">
                <div className="relative">
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && openWhatsApp()}
                    placeholder={t("Type your message...")}
                    className="w-full bg-background/80 border border-input rounded-2xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                    suppressHydrationWarning
                  />
                </div>
                <button
                  onClick={() => openWhatsApp()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md hover:shadow-emerald-500/25 active:scale-[0.98] transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span suppressHydrationWarning>{t("Open WhatsApp")}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className={`relative flex items-center justify-center w-14 h-14 rounded-full font-bold shadow-[0_10px_30px_rgba(16,185,129,0.4)] hover:shadow-[0_15px_35px_rgba(16,185,129,0.6)] z-[101] transition-all duration-300 ${
          bookingStep 
            ? "bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_10px_30px_rgba(6,182,212,0.4)] hover:shadow-[0_15px_35px_rgba(6,182,212,0.6)]" 
            : "bg-gradient-to-r from-green-500 to-emerald-500"
        }`}
        title={bookingStep ? t("Need Help?") : t("Chat with Support")}
        aria-label={bookingStep ? t("Need Help?") : t("Chat with Support")}
        suppressHydrationWarning
      >
        <div className={`absolute -inset-1 rounded-full animate-pulse -z-10 ${
          bookingStep ? "bg-cyan-500/20" : "bg-green-500/20"
        }`} />
        
        {bookingStep ? (
          <HelpCircle className="w-6 h-6 text-black" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6 text-black"
          >
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
          </svg>
        )}
      </motion.button>
    </div>
  )
}