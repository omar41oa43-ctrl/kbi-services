"use client"

import { ArrowRight, MessageCircle, Phone } from "lucide-react"
import Link from "next/link"
import { useT } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { useSiteContact } from "@/components/contact-provider"

export function CTASection() {
  const t = useT()
  const contact = useSiteContact()
  return (
    <section className="home-deferred py-24 relative">
      <div className="container mx-auto px-6 relative z-10">
        <div className="glass rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10 pointer-events-none" />

          <div className="relative z-10" suppressHydrationWarning>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-foreground">{t("Ready to Fix Your Device?")}</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t("Book a technician now and get your device repaired at your doorstep. Fast, reliable, and guaranteed.")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild variant="primary">
                <Link href="/book" className="inline-flex items-center gap-2 group">
                  {t("Book a Technician")} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
                  {t("WhatsApp")}
                </a>
              </Button>
              <Button asChild variant="outline">
                <a
                  href={`tel:${contact.phone}`}
                  className="inline-flex items-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  {t("Call Us")}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
