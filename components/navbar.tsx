"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Phone, MessageCircle, CalendarDays, Search, Home, Building2, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useLanguage, useT } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

import { SiteContact } from "@/lib/site-contact"

const WhatsAppChatbot = dynamic(
  () => import("@/components/whatsapp-chatbot").then((mod) => mod.WhatsAppChatbot),
  { ssr: false },
)

interface NavbarProps {
  contact: SiteContact
}

export function Navbar({ contact }: NavbarProps) {
  const { lang, setLang } = useLanguage()
  const t = useT()
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const hasArabicUrls = pathname === "/ar" || pathname?.startsWith("/ar/")

  const [supportReady, setSupportReady] = useState(false)
  const isExcluded = pathname?.startsWith("/admin") || pathname?.startsWith("/tech")
  const isBookingPage = pathname?.startsWith("/book") || pathname?.startsWith("/ar/book")

  useEffect(() => {
    const updateScrolled = () => {
      const next = window.scrollY > 50
      setIsScrolled((current) => (current === next ? current : next))
    }

    updateScrolled()
    window.addEventListener("scroll", updateScrolled, { passive: true })
    return () => window.removeEventListener("scroll", updateScrolled)
  }, [])

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (isExcluded) return
    const connection = (navigator as Navigator & {
      connection?: { effectiveType?: string; saveData?: boolean }
    }).connection

    if (connection?.saveData || connection?.effectiveType?.includes("2g")) return

    const routePrefix = hasArabicUrls ? "/ar" : ""
    const routes = ["/services", "/book", "/track", "/corporate"].map((route) => `${routePrefix}${route}`)
    const doPrefetch = () => routes.forEach((r) => router.prefetch(r))

    const g = globalThis as any
    if (typeof g.requestIdleCallback === "function") {
      const id = g.requestIdleCallback(doPrefetch, { timeout: 3500 })
      return () => g.cancelIdleCallback?.(id)
    }

    const id = setTimeout(doPrefetch, 1800)
    return () => clearTimeout(id)
  }, [router, isExcluded, hasArabicUrls])

  useEffect(() => {
    if (isExcluded || isBookingPage) return

    const loadSupport = () => setSupportReady(true)
    const g = globalThis as any

    if (typeof g.requestIdleCallback === "function") {
      const id = g.requestIdleCallback(loadSupport, { timeout: 4000 })
      return () => g.cancelIdleCallback?.(id)
    }

    const id = window.setTimeout(loadSupport, 1800)
    return () => window.clearTimeout(id)
  }, [isBookingPage, isExcluded])

  const desktopLogo = (
    <Link href={hasArabicUrls ? "/ar" : "/"} className="hidden md:flex items-center gap-2 group" dir="ltr" aria-label="KBI home">
      <span className="text-2xl font-bold tracking-tighter text-foreground dark:text-white inline-flex items-center" dir="ltr" style={{ direction: "ltr", unicodeBidi: "isolate" }}>
        <span>KBI</span><span className="text-cyan-500 dark:text-cyan-400">.</span>
      </span>
    </Link>
  )

  const languageSwitcher = (
    <button
      type="button"
      onClick={() => {
        const isArabicRoute = pathname === "/ar" || pathname?.startsWith("/ar/")
        const supportsArabicRoute = pathname === "/"
          || pathname === "/services"
          || pathname?.startsWith("/services/")
          || pathname === "/about"
          || pathname === "/contact"
          || pathname === "/book"
          || pathname === "/track"
          || pathname === "/corporate"
          || pathname?.startsWith("/locations/")

        if (isArabicRoute) {
          setLang("en")
          router.push(pathname === "/ar" ? "/" : pathname.replace(/^\/ar/, ""))
          return
        }

        setLang("ar")
        if (supportsArabicRoute) {
          router.push(pathname === "/" ? "/ar" : `/ar${pathname}`)
        }
      }}
      title={lang === "en" ? "التغيير إلى العربية" : "Switch to English"}
      aria-label={lang === "en" ? "Switch to Arabic" : "Switch to English"}
      className={cn(
        "relative h-9 w-9 md:h-10 md:w-10 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-300 cursor-pointer group shadow-sm",
        "bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white",
        "dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-white/80"
      )}
    >
      <Globe className="w-4 h-4 md:w-4.5 md:h-4.5 text-cyan-500 dark:text-cyan-400 group-hover:rotate-45 transition-transform duration-300" />
    </button>
  )

  if (isExcluded) {
    return <></>
  }

  const navLinks = [
    { name: t("Home"), raw: "Home", href: hasArabicUrls ? "/ar" : "/" },
    { name: t("Services"), raw: "Services", href: hasArabicUrls ? "/ar/services" : "/services" },
    { name: t("Book Now"), raw: "Book Now", href: hasArabicUrls ? "/ar/book" : "/book" },
    { name: t("Corporate Services"), raw: "Corporate Services", href: hasArabicUrls ? "/ar/corporate" : "/corporate" },
    { name: t("About"), raw: "About", href: hasArabicUrls ? "/ar/about" : "/about" },
    { name: t("Contact"), raw: "Contact", href: hasArabicUrls ? "/ar/contact" : "/contact" },
    { name: t("Track Order"), raw: "Track Order", href: hasArabicUrls ? "/ar/track" : "/track" },
  ]

  const sortedNavLinks = lang === "ar" 
    ? [...navLinks].reverse()
    : navLinks

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-[padding] duration-200 px-3 md:px-6 py-2.5 md:py-3",
          isScrolled ? "py-2 md:py-3" : "py-3 md:py-4",
        )}
        suppressHydrationWarning
      >
        <header
          className={cn("max-w-7xl mx-auto relative flex items-center justify-between px-3 md:px-6 py-2 md:py-2.5 transition-[background-color,box-shadow] duration-200 glass-nav min-h-[48px] md:min-h-[56px]")}
          suppressHydrationWarning
          dir="ltr"
        >

          {/* Left-side: Desktop Logo & Mobile left spacer to balance right buttons */}
          <div className="flex items-center gap-2 relative z-50">
            {desktopLogo}
            <div className="md:hidden w-[76px]" aria-hidden="true" />
          </div>

          {/* Mobile Centered Logo */}
          <div className="md:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-auto" dir="ltr">
            <Link href={hasArabicUrls ? "/ar" : "/"} className="flex items-center justify-center py-1 group" dir="ltr" style={{ direction: "ltr", unicodeBidi: "isolate" }} aria-label="KBI home">
              <span className="text-[1.35rem] sm:text-2xl font-black tracking-tight text-foreground dark:text-white inline-flex items-center leading-none" dir="ltr" style={{ direction: "ltr", unicodeBidi: "isolate" }}>
                <span>KBI</span><span className="text-cyan-500 dark:text-cyan-400">.</span>
              </span>
            </Link>
          </div>

          {/* Mobile Right-side: language button & theme toggle */}
          <div className="md:hidden flex items-center gap-1.5 z-50" dir="ltr">
            {languageSwitcher}
            <ThemeToggle />
          </div>

          {/* Desktop Menu */}
          <nav aria-label="Primary" className="hidden md:flex items-center justify-center flex-1">
            <ul className="flex items-center justify-center gap-1 xl:gap-2">
              {sortedNavLinks.map((link) => {
                const active = link.href === "/" || link.href === "/ar" ? pathname === link.href : pathname.startsWith(link.href)
                return (
                  <li key={link.raw}>
                    <Link
                      href={link.href}
                      prefetch={false}
                      className={cn(
                        "min-h-11 text-[13px] xl:text-sm font-medium transition-all duration-300 relative py-2 px-3 rounded-xl flex items-center gap-2 group",
                        active 
                          ? "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 dark:bg-white/5 shadow-xs" 
                          : "text-foreground/80 dark:text-white/70 hover:text-foreground dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                      )}
                    >
                      <span suppressHydrationWarning className="relative z-10">{link.name}</span>
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-0 border border-cyan-500/20 bg-cyan-500/5 rounded-xl -z-0"
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
            <ThemeToggle />
            {languageSwitcher}
          </div>

        </header>
      </nav>
      <nav className="lg:hidden fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="apple-nav">
          <div className="apple-nav-items">
            {[
              { href: hasArabicUrls ? "/ar" : "/", label: "Home", icon: Home },
              { href: hasArabicUrls ? "/ar/book" : "/book", label: "Book Now", icon: CalendarDays },
              { href: hasArabicUrls ? "/ar/corporate" : "/corporate", label: "Corporate", icon: Building2 },
              { href: hasArabicUrls ? "/ar/track" : "/track", label: "Track Order", icon: Search },
            ].map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
              const Icon = item.icon as any
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  className={cn("group relative flex flex-col items-center justify-center gap-1.5 flex-1")}
                  aria-current={active ? "page" : undefined}
                  aria-label={t(item.label)}
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className={cn("apple-nav-item", active ? "apple-nav-item-active" : "apple-nav-item-inactive")}>
                      <Icon className={cn("icon w-5 h-5")} />
                    </div>
                    <span className="block mt-1 text-[10px] sm:text-[11px] font-semibold tracking-tight text-foreground/80 dark:text-white/80 truncate w-full text-center" suppressHydrationWarning>
                      {t(item.label)}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
      {supportReady && !isBookingPage && <WhatsAppChatbot />}
    </>
  )
}
