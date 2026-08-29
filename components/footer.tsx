"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { Phone, Mail, MapPin, MessageCircle, ArrowRight, Instagram } from "lucide-react"
import { FaTiktok } from "react-icons/fa6"
import { useLanguage, useT } from "@/components/language-provider"
import CircularText from "@/components/ui/circular-text"
import { SiteContact } from "@/lib/site-contact"
import Link from "next/link"

interface FooterProps {
  contact: SiteContact
}

export function Footer({ contact }: FooterProps) {
  const { lang } = useLanguage()
  const isAr = lang === "ar"
  const t = useT()
  const pathname = usePathname()
  const googleReviewUrl = "https://g.page/r/CWG_uPaqr-MjEAI/review"
  const socialItems = [
    {
      icon: MessageCircle,
      href: `https://wa.me/${contact.whatsappRaw}`,
      show: true,
      ariaLabel: "Chat with us on WhatsApp",
    },
    {
      icon: Phone,
      href: `tel:${contact.phone}`,
      show: true,
      ariaLabel: "Call our customer service",
    },
    {
      icon: Mail,
      href: `mailto:${contact.email}`,
      show: true,
      ariaLabel: "Email us for inquiries",
    },
    {
      icon: Instagram,
      href: "https://www.instagram.com/kbi.services?igsh=d2M1bjc5Y2swc2du&utm_source=qr",
      show: true,
      ariaLabel: "Follow KBI Repairs on Instagram",
    },
    {
      icon: FaTiktok,
      href: "https://www.tiktok.com/@kbi.services?_r=1&_t=ZS-95S9A3Ge4pt",
      show: true,
      ariaLabel: "Follow KBI Repairs on TikTok",
    },
  ]

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/tech")) {
    return null
  }

  return (
    <footer className="relative pt-20 pb-10 overflow-hidden">

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-20 justify-items-center items-center text-center w-full" style={{ textAlign: "center" }}>
          {/* Brand Column (4 cols) */}
          <div className="lg:col-span-4 w-full flex flex-col items-center justify-center text-center mx-auto" style={{ textAlign: "center" }}>
            <Link href="/" className="inline-block mb-6 group relative" dir="ltr">
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <div className="relative text-5xl font-bold tracking-tighter text-foreground group-hover:text-cyan-500 transition-all duration-300 inline-flex items-center" dir="ltr" style={{ direction: "ltr", unicodeBidi: "isolate" }}>
                <span>KBI</span><span className="text-cyan-500 group-hover:text-blue-400 transition-colors">.</span>
              </div>
            </Link>

            <div className="px-4 mb-8 w-full flex justify-center">
              <p className="text-muted-foreground leading-relaxed max-w-sm text-center mx-auto" style={{ textAlign: "center" }} suppressHydrationWarning>
                {(isAr ? (contact.footerTextAr || contact.footerText) : contact.footerText) || (isAr
                  ? "شريكك التقني الموثوق للإصلاح الميداني في كافة أنحاء الإمارات. متخصصون في صيانة الهواتف، الحواسيب، الطابعات والشبكات."
                  : "Your trusted technical partner for on-site repairs across all 7 Emirates in the UAE. Experts in mobile, laptop, printer, and network maintenance.")}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 w-full">
              {socialItems.filter((item) => item.show).map((item, i) => (
                <a
                  key={i}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.ariaLabel}
                  className="group relative w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 ring-1 ring-black/10 dark:ring-white/10 flex items-center justify-center text-foreground/70 dark:text-white/70 transition-all duration-300 hover:bg-black/10 dark:hover:bg-white/10 hover:ring-black/20 dark:hover:ring-white/20 shadow-xs"
                >
                  <span className="absolute -inset-px rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-70" />
                  <item.icon className="w-5 h-5 relative z-10" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links (3 cols) */}
          <div className="lg:col-span-3 w-full flex flex-col items-center justify-center text-center mx-auto" style={{ textAlign: "center" }}>
            <div className="flex flex-col items-center justify-center mb-8 w-full">
              <h2 className="font-bold text-foreground text-lg tracking-wide text-center w-full" style={{ textAlign: "center" }}>
                {t("Quick Links")}
              </h2>
              <div className="mt-2.5 w-12 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.5)] mx-auto" />
            </div>
            <ul className="space-y-4 w-full flex flex-col items-center justify-center text-center" style={{ textAlign: "center" }}>
              {[
                { key: "Services", href: "/services" },
                { key: "Book Now", href: "/book" },
                { key: "Track Order", href: "/track" },
                { key: "About", href: "/about" },
                { key: "Contact", href: "/contact" },
              ].map((item) => (
                <li key={item.key} className="w-full flex justify-center text-center" style={{ textAlign: "center" }}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors flex items-center justify-center gap-2 group text-center mx-auto"
                    style={{ textAlign: "center" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/20 dark:bg-white/20 group-hover:bg-cyan-500 transition-colors shrink-0" />
                    <span>{t(item.key)}</span>
                  </Link>
                </li>
              ))}
              <li className="w-full flex justify-center text-center" style={{ textAlign: "center" }}>
                <a
                  href={googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors flex items-center justify-center gap-2 group text-center mx-auto"
                  style={{ textAlign: "center" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground/20 dark:bg-white/20 group-hover:bg-cyan-500 transition-colors shrink-0" />
                  <span>{t("Rate us on Google")}</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Services (3 cols) */}
          <div className="lg:col-span-3 w-full flex flex-col items-center justify-center text-center mx-auto" style={{ textAlign: "center" }}>
            <div className="flex flex-col items-center justify-center mb-8 w-full">
              <h2 className="font-bold text-foreground text-lg tracking-wide text-center w-full" style={{ textAlign: "center" }}>
                {t("Services")}
              </h2>
              <div className="mt-2.5 w-12 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.5)] mx-auto" />
            </div>
            <ul className="space-y-4 w-full flex flex-col items-center justify-center text-center" style={{ textAlign: "center" }}>
              {[
                { key: "Mobile Phone Repair", slug: "mobile" },
                { key: "Laptop Repair", slug: "laptop" },
                { key: "TV Repair", slug: "tv" },
                { key: "CCTV Installation", slug: "cctv" },
                { key: "Gaming Console Repair", slug: "gaming" },
              ].map((service, i) => (
                <li key={i} className="w-full flex justify-center text-center" style={{ textAlign: "center" }}>
                  <Link
                    href={`/services#${service.slug}`}
                    className="text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-2 group text-center mx-auto"
                    style={{ textAlign: "center" }}
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 rtl:rotate-180 transition-all duration-300 text-blue-500 shrink-0" />
                    <span>{t(service.key)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact (2 cols) */}
          <div className="lg:col-span-2 w-full flex flex-col items-center justify-center text-center mx-auto" style={{ textAlign: "center" }}>
            <div className="flex flex-col items-center justify-center mb-8 w-full">
              <h2 className="font-bold text-foreground text-lg tracking-wide text-center w-full" style={{ textAlign: "center" }}>
                {t("Contact")}
              </h2>
              <div className="mt-2.5 w-12 h-1 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.5)] mx-auto" />
            </div>
            <ul className="space-y-6 w-full flex flex-col items-center justify-center text-center" style={{ textAlign: "center" }}>
              <li className="w-full flex flex-col items-center justify-center text-center gap-2" style={{ textAlign: "center" }}>
                <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                </div>
                <div className="text-center" style={{ textAlign: "center" }}>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 text-center" style={{ textAlign: "center" }}>{t("Hotline 24/7")}</p>
                  <a href={`tel:${contact.phone}`} dir="ltr" className="text-foreground font-semibold hover:underline text-center">{contact.phoneDisplay}</a>
                </div>
              </li>
              <li className="w-full flex flex-col items-center justify-center text-center gap-2" style={{ textAlign: "center" }}>
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                </div>
                <div className="text-center" style={{ textAlign: "center" }}>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 text-center" style={{ textAlign: "center" }}>{t("Service Area")}</p>
                  <p className="text-foreground font-semibold text-center" style={{ textAlign: "center" }}>{t("All 7 Emirates, UAE")}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6 relative" dir="ltr">
          <div className="text-center md:text-start">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} {t("KBI Repair Services")}. {t("All rights reserved.")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{contact.companyName || "KBI GLOBAL TECHNOLOGIES"} · {contact.email}</p>
          </div>

          {/* Center Circular Text - Absolute centered on Desktop */}
          <div className="md:absolute md:left-1/2 md:top-8 md:-translate-x-1/2 md:-translate-y-1/2 flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full group-hover:bg-cyan-500/40 transition-colors" />
              <CircularText
                text="KBI*TECHNOLOGY*KBI*TECHNOLOGY*"
                onHover="speedUp"
                spinDuration={20}
                className="w-20 h-20 md:w-24 md:h-24 text-cyan-500 dark:text-cyan-400"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  aria-hidden="true"
                  className="relative w-7 h-7 md:w-8 md:h-8 scale-100 group-hover:scale-105 transition-transform"
                >
                  <div
                    className="absolute inset-0 rounded-full bg-cyan-500/20 blur-sm animate-ping"
                    style={{ animationDuration: "2.8s" }}
                  />
                  <div
                    className="absolute inset-0 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin"
                    style={{ animationDuration: "1.8s" }}
                  />
                  <div className="absolute -inset-2 rounded-full bg-gradient-to-b from-cyan-500/10 to-transparent blur-md opacity-70 group-hover:opacity-100 transition-opacity" />
                  <div
                    className="absolute inset-0 animate-spin"
                    style={{ animationDuration: "6s" }}
                  >
                    <div className="absolute left-1/2 top-0 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                  </div>
                  <div
                    className="absolute inset-0 animate-spin"
                    style={{ animationDuration: "10s", animationDirection: "reverse" }}
                  >
                    <div className="absolute left-1/2 top-0 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400 opacity-90 shadow-[0_0_8px_rgba(59,130,246,0.7)]" />
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-cyan-500 dark:bg-white shadow-[0_0_14px_rgba(255,255,255,0.9)]" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              {t("Terms & Conditions")}
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              {t("Privacy Policy")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
