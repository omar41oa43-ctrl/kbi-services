"use client"

import Link from "next/link"
import { GlassCard } from "@/components/ui/glass-card"
import { Phone, Mail, MapPin, Clock, MessageCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage, useT } from "@/components/language-provider"

import { SiteContact } from "@/lib/site-contact"

const colorMap: Record<string, { text: string; bg: string; border: string; hoverBg: string }> = {
  cyan: {
    text: "text-cyan-700 dark:text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    hoverBg: "hover:bg-cyan-500/20",
  },
  green: {
    text: "text-emerald-700 dark:text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    hoverBg: "hover:bg-green-500/20",
  },
  blue: { text: "text-blue-700 dark:text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", hoverBg: "hover:bg-blue-500/20" },
}

interface ContactContentProps {
  contact: SiteContact
}

export function ContactContent({ contact }: ContactContentProps) {
  const { lang } = useLanguage()
  const isAr = lang === "ar"
  const t = useT()

  const contactMethods = [
    {
      icon: <Phone className="w-8 h-8" />,
      title: "Call Us",
      description: "Speak directly with our support team",
      value: contact.phoneDisplay,
      href: `tel:${contact.phone}`,
      color: "cyan",
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: "WhatsApp",
      description: "Chat with us instantly",
      value: "Send a message",
      href: `https://wa.me/${contact.whatsappRaw}`,
      color: "green",
    },
    {
      icon: <Mail className="w-8 h-8" />,
      title: "Email",
      description: "Send us an email anytime",
      value: contact.email,
      href: `mailto:${contact.email}`,
      color: "blue",
    },
  ]

  return (
    <section className="relative pt-32 pb-16 min-h-screen">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-cyan-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] bg-green-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Hero */}
        <div className="text-center mb-16">
          <div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-foreground">
              {isAr ? (
                t("Contact Us")
              ) : (
                <>Contact <span className="text-cyan-500 dark:text-cyan-400">Us</span></>
              )}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("We're here to help! Reach out through any of the channels below or book a technician directly.")}
            </p>
          </div>
        </div>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {contactMethods.map((method, index) => {
            const colors = colorMap[method.color]
            return (
              <div
                key={index}
              >
                <a
                  href={method.href}
                  target={method.href.startsWith("http") ? "_blank" : undefined}
                  rel={method.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  aria-label={`${t(method.title)}: ${method.value}`}
                  title={t(method.title)}
                  className="block focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-3xl"
                >
                  <GlassCard className={`h-full text-center group cursor-pointer ${colors.hoverBg}`}>
                    <div className={`p-4 rounded-2xl ${colors.bg} ${colors.text} w-fit mx-auto mb-4`}>
                      {method.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">{t(method.title)}</h3>
                    <p className="text-muted-foreground text-sm mb-3">{t(method.description)}</p>
                    <p className={`font-bold ${colors.text}`} dir={isAr && method.href.startsWith("tel:") ? "ltr" : undefined}>{t(method.value)}</p>
                  </GlassCard>
                </a>
              </div>
            )
          })}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <div>
            <GlassCard className="h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-purple-500/10">
                  <MapPin className="w-7 h-7 text-purple-500 dark:text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">{t("Service Areas")}</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                {t("We provide professional on-site repair and IT services across all seven Emirates of the UAE.")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  "Abu Dhabi",
                  "Dubai",
                  "Sharjah",
                  "Ajman",
                  "Ras Al Khaimah",
                  "Fujairah",
                  "Umm Al Quwain",
                ].map((area, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-foreground/80 p-2.5 rounded-lg bg-black/5 dark:bg-white/5 border border-border">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                    <span>{t(area)}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          <div>
            <GlassCard className="h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-orange-500/10">
                  <Clock className="w-7 h-7 text-orange-500 dark:text-orange-400" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">{t("Service Hours")}</h2>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 rounded-xl bg-card border border-border">
                  <span className="text-foreground/80 font-medium">{t("Saturday - Thursday")}</span>
                  <span className="font-bold text-emerald-600 dark:text-green-400" dir="ltr">{contact.workingHoursWeekdays}</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-xl bg-card border border-border">
                  <span className="text-foreground/80 font-medium">{t("Friday")}</span>
                  <span className="font-bold text-emerald-600 dark:text-green-400" dir="ltr">{contact.workingHoursFriday}</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                  <span className="text-foreground/80 font-semibold">{t("Emergency Service")}</span>
                  <span className="font-bold text-emerald-600 dark:text-green-400">{t("24/7 Available")}</span>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {t(
                  "For urgent repairs outside regular hours, contact us via WhatsApp or phone for emergency service availability.",
                )}
              </p>
            </GlassCard>
          </div>
        </div>

        {/* CTA */}
        <div>
          <GlassCard className="text-center cta-creative">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-4 text-foreground">{t("Ready to Get Your Device Fixed?")}</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              {t(
                "Request an on-site technician at your location. Appointment timing is confirmed based on coverage and availability.",
              )}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild variant="primary">
                <Link href="/book" className="inline-flex items-center gap-2">
                  {t("Book a Technician")} <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <a
                  href={`https://wa.me/${contact.whatsappRaw}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  {t("WhatsApp Us")}
                </a>
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  )
}
