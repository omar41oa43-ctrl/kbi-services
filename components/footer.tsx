"use client"

import type React from "react"
import { useEffect, useState } from "react"
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
  const [mounted, setMounted] = useState(false)
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-20" dir="ltr">
          {/* Brand Column (4 cols) */}
          <div className="lg:col-span-4 lg:col-start-1 flex flex-col items-start text-start">
            <Link href="/" className="inline-block mb-6 group relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
              <div className="relative text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-cyan-100 group-hover:from-cyan-400 group-hover:via-blue-400 group-hover:to-purple-500 transition-all duration-300">
                KBI<span className="text-cyan-500 group-hover:text-blue-400 transition-colors">.</span>
              </div>
            </Link>

            <div className="ps-4 border-s-2 border-white/10 mb-8 hover:border-cyan-500/50 transition-colors duration-300">
              <p className="text-white/60 leading-relaxed max-w-sm text-start" suppressHydrationWarning>
                {(isAr ? (contact.footerTextAr || contact.footerText) : contact.footerText) || (isAr
                  ? "شريكك التقني الموثوق للإصلاح الميداني في أبوظبي. متخصصون في صيانة الهواتف، الحواسيب، الطابعات والشبكات."
                  : "Your trusted technical partner for on-site repairs in Abu Dhabi. Experts in mobile, laptop, printer, and network maintenance.")}
              </p>
            </div>

            <div className="flex items-center justify-start gap-3">
              {socialItems.filter((item) => item.show).map((item, i) => (
                <a
                  key={i}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.ariaLabel}
                  className="group relative w-12 h-12 rounded-2xl bg-white/5 ring-1 ring-white/10 flex items-center justify-center text-white/70 transition-all duration-300 hover:bg-white/10 hover:ring-white/20 hover:shadow-[0_16px_40px_-24px_rgba(6,182,212,0.7)]"
                >
                  <span className="absolute -inset-px rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-70" />
                  <item.icon className="w-5 h-5 relative z-10" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links (3 cols) */}
          <div className="lg:col-span-3 lg:col-start-5" dir={isAr ? "rtl" : "ltr"}>
            <h4 className="font-bold text-white mb-8 relative inline-block text-start">
              {t("Quick Links")}
              <span className="absolute -bottom-2 start-0 w-1/2 h-1 bg-cyan-500 rounded-full" />
            </h4>
            <ul className="space-y-4">
              {[
                { key: "Services", href: "/services" },
                { key: "Book Now", href: "/book" },
                { key: "Track Order", href: "/track" },
                { key: "About", href: "/about" },
                { key: "Contact", href: "/contact" },
              ].map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="text-white/60 hover:text-cyan-400 transition-colors flex items-center gap-2 group justify-start text-start"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-cyan-400 transition-colors" />
                    {t(item.key)}
                  </Link>
                </li>
              ))}
              <li>
                  <a
                    href={googleReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-cyan-400 transition-colors flex items-center gap-2 group justify-start text-start"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-cyan-400 transition-colors" />
                    {t("Rate us on Google")}
                  </a>
                </li>
            </ul>
          </div>

          {/* Services (3 cols) */}
          <div className="lg:col-span-3 lg:col-start-8" dir={isAr ? "rtl" : "ltr"}>
            <h4 className="font-bold text-white mb-8 relative inline-block text-start">
              {t("Services")}
              <span className="absolute -bottom-2 start-0 w-1/2 h-1 bg-blue-500 rounded-full" />
            </h4>
            <ul className="space-y-4">
              {[
                { key: "Mobile Phone Repair", slug: "mobile" },
                { key: "Laptop Repair", slug: "laptop" },
                { key: "TV Repair", slug: "tv" },
                { key: "CCTV Installation", slug: "cctv" },
                { key: "Gaming Console Repair", slug: "gaming" },
              ].map((service, i) => (
                <li key={i}>
                  <a
                    href={`/services#${service.slug}`}
                    className="text-white/60 hover:text-blue-400 transition-colors flex items-center gap-2 group justify-start text-start"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 rtl:rotate-180 transition-all duration-300 text-blue-400" />
                    {t(service.key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact (2 cols) */}
          <div className="lg:col-span-2 lg:col-start-11" dir={isAr ? "rtl" : "ltr"}>
            <h4 className="font-bold text-white mb-8 relative inline-block text-start">
              {t("Contact")}
              <span className="absolute -bottom-2 start-0 w-1/2 h-1 bg-purple-500 rounded-full" />
            </h4>
            <ul className="space-y-6">
              <li className="flex items-start gap-4 text-start">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{t("Hotline 24/7")}</p>
                  <a href={`tel:${contact.phone}`} dir="ltr" className="text-white font-semibold hover:underline">{contact.phoneDisplay}</a>
                </div>
              </li>
              <li className="flex items-start gap-4 text-start">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{t("Location")}</p>
                  <p className="text-white font-semibold">{t((isAr && contact.addressAr) ? contact.addressAr : contact.address)}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 relative" dir="ltr">
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} {t("KBI Repair Services")}. {t("All rights reserved.")}
          </p>

          {/* Center Circular Text - Absolute centered on Desktop */}
          <div className="md:absolute md:left-1/2 md:top-8 md:-translate-x-1/2 md:-translate-y-1/2 flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full group-hover:bg-cyan-500/40 transition-colors" />
              <CircularText
                text="KBI*TECHNOLOGY*KBI*TECHNOLOGY*"
                onHover="speedUp"
                spinDuration={20}
                className="w-20 h-20 md:w-24 md:h-24 text-cyan-400"
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
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,0.9)]" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-6 text-sm text-white/40">
            <Link href="/privacy" className="hover:text-white transition-colors">
              {t("Privacy Policy")}
            </Link>
            <Link href={isAr ? "/terms?lang=ar" : "/terms"} className="hover:text-white transition-colors">
              {t("Terms & Conditions")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
