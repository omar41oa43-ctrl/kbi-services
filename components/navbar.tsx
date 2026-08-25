"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, useScroll, useMotionValueEvent } from "framer-motion"
import { Phone, MessageCircle, Wrench, CalendarDays, Search, Mail, Home, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useLanguage, useT } from "@/components/language-provider"
import { WhatsAppChatbot } from "@/components/whatsapp-chatbot"
import { Button } from "@/components/ui/button"

import { SiteContact } from "@/lib/site-contact"

interface NavbarProps {
  contact: SiteContact
}

export function Navbar({ contact }: NavbarProps) {
  const { lang, setLang } = useLanguage()
  const t = useT()
  const [isScrolled, setIsScrolled] = useState(false)
  const { scrollY } = useScroll()
  const pathname = usePathname()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const isExcluded = pathname?.startsWith("/admin") || pathname?.startsWith("/tech")
  const isBookingPage = pathname?.startsWith("/book")

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50)
  })

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (isExcluded) return
    const routes = ["/services", "/book", "/track"]
    const doPrefetch = () => routes.forEach((r) => router.prefetch(r))

    const g = globalThis as any
    if (typeof g.requestIdleCallback === "function") {
      const id = g.requestIdleCallback(doPrefetch, { timeout: 2000 })
      return () => g.cancelIdleCallback?.(id)
    }

    const id = setTimeout(doPrefetch, 250)
    return () => clearTimeout(id)
  }, [router, isExcluded])

  const desktopLogo = (
    <Link href="/" className="relative z-50 hidden md:flex" dir="ltr">
      <span className="text-xl md:text-2xl font-bold tracking-tighter text-white">
        KBI<span className="text-cyan-400">.</span>
      </span>
    </Link>
  )

  const languageSwitcher = (
    <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
      <button
        onClick={() => setLang("en")}
        aria-label="Switch to English"
        aria-pressed={lang === "en"}
        className={cn(
          "px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300",
          lang === "en" ? "bg-cyan-500 text-black shadow-[0_0_15px_-3px_rgba(6,182,212,0.5)]" : "text-white/50 hover:text-white"
        )}
      >
        EN
      </button>
      <button
        onClick={() => setLang("ar")}
        aria-label="Switch to Arabic"
        aria-pressed={lang === "ar"}
        className={cn(
          "px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300",
          lang === "ar" ? "bg-cyan-500 text-black shadow-[0_0_15px_-3px_rgba(6,182,212,0.5)]" : "text-white/50 hover:text-white"
        )}
      >
        AR
      </button>
    </div>
  )

  if (isExcluded) {
    return <></>
  }

  const navLinks = [
    { name: t("Home"), raw: "Home", href: "/" },
    { name: t("Services"), raw: "Services", href: "/services" },
    { name: t("Contact"), raw: "Contact", href: "/contact" },
    { name: t("Book Now"), raw: "Book Now", href: "/book" },
    { name: t("Corporate Services"), raw: "Corporate Services", href: "/corporate" },
    { name: t("About"), raw: "About", href: "/about" },
    { name: t("Track Order"), raw: "Track Order", href: "/track" },
  ]

  const sortedNavLinks = lang === "ar" 
    ? [...navLinks].reverse()
    : navLinks

  return (
    <>
      <motion.nav
        initial={false}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300 px-4 md:px-6 py-3",
          isScrolled ? "py-3" : "py-4",
        )}
        style={{ transform: "none" }}
        suppressHydrationWarning
      >
        <motion.header
          className={cn("max-w-7xl mx-auto relative flex items-center justify-between px-4 md:px-6 py-2 transition-all duration-300 glass-nav")}
          suppressHydrationWarning
          dir="ltr"
        >

          {/* Mobile left-side: language button */}
          <div className="flex items-center gap-3 relative">
            <div className="md:hidden">
              {languageSwitcher}
            </div>
            {desktopLogo}
          </div>

          {/* Mobile centered logo */}
          <div className="md:hidden absolute left-1/2 -translate-x-1/2 z-50" dir="ltr">
            <Link href="/" className="relative">
              <span className="text-xl font-bold tracking-tighter text-white">
                KBI<span className="text-cyan-400">.</span>
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <nav aria-label="Primary" className="hidden md:flex items-center justify-center flex-1">
            <ul className="flex items-center justify-center gap-1 xl:gap-2">
              {sortedNavLinks.map((link) => {
                const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
                return (
                  <li key={link.raw}>
                    <Link
                      href={link.href}
                      className={cn(
                        "text-[13px] xl:text-sm font-medium transition-all duration-300 relative py-2 px-3 rounded-xl flex items-center gap-2 group",
                        active 
                          ? "text-cyan-400 bg-white/5 shadow-[0_0_15px_-3px_rgba(6,182,212,0.1)]" 
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <span suppressHydrationWarning className="relative z-10">{link.name}</span>
                      {active && (
                        <motion.div
                          layoutId="active-nav-desktop"
                          className="absolute inset-0 border border-cyan-500/20 bg-cyan-500/5 rounded-xl -z-0"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="hidden md:flex items-center gap-3" dir="ltr">
            <Button asChild variant="secondary" size="sm">
              <a
                href={`https://wa.me/${contact.whatsappRaw}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden xl:inline" suppressHydrationWarning>{t("WhatsApp")}</span>
              </a>
            </Button>
            <Button asChild variant="primary" size="sm">
              <a
                href={`tel:${contact.phone}`}
                className="inline-flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden xl:inline" suppressHydrationWarning>{t("Call Now")}</span>
              </a>
            </Button>
            {languageSwitcher}
          </div>


        </motion.header>
      </motion.nav>
      <nav className="lg:hidden fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="apple-nav">
          <div className="apple-nav-items">
            {[
              { href: "/", label: "Home", icon: Home },
              { href: "/services", label: "Services", icon: Wrench },
              { href: "/book", label: "Book Now", icon: CalendarDays },
              { href: "/corporate", label: "Corporate", icon: Building2 },
              { href: "/track", label: "Track Order", icon: Search },
              { href: "/contact", label: "Contact", icon: Mail },
            ].map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
              const Icon = item.icon as any
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn("group relative flex flex-col items-center justify-center gap-1.5 flex-1")}
                  aria-current={active ? "page" : undefined}
                  aria-label={t(item.label)}
                >
                  <motion.div
                    className="flex flex-col items-center justify-center"
                    animate={active ? { scale: 1.05 } : { scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <div className={cn("apple-nav-item", active ? "apple-nav-item-active" : "apple-nav-item-inactive")}>
                      <Icon className={cn("icon w-6 h-6")} />
                    </div>
                    <span className="block mt-1 text-[10px] sm:text-[12px] font-semibold tracking-tight text-white/70 truncate w-full text-center" suppressHydrationWarning>
                      {t(item.label)}
                    </span>
                  </motion.div>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
      {mounted && !isBookingPage && <WhatsAppChatbot />}
    </>
  )
}
