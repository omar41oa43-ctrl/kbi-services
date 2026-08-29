"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { Award, Users, Clock, ShieldCheck, Target, Heart, ArrowRight, FileText } from "lucide-react"
import Link from "next/link"
import { useT } from "@/components/language-provider"


const stats = [
  { number: "On-site", label: "Home & Office Visits" },
  { number: "4", label: "Emirates Served" },
  { number: "Upfront", label: "Quote Before Repair" },
  { number: "Written", label: "Eligible Repair Warranty" },
]

const values = [
  {
    icon: <Target className="w-7 h-7 text-cyan-400" />,
    title: "Our Mission",
    description:
      "To provide fast, reliable, and professional on-site repair services that save our customers time and hassle.",
  },
  {
    icon: <Heart className="w-7 h-7 text-pink-400" />,
    title: "Customer First",
    description:
      "We prioritize customer satisfaction above all else. Your trust is our most valuable asset, and we work hard to earn it every day.",
  },
  {
    icon: <ShieldCheck className="w-7 h-7 text-green-400" />,
    title: "Clear Service Terms",
    description:
      "We explain the available parts options, confirm the quote before paid work begins, and document warranty coverage for eligible repairs.",
  },
]

const guarantees = [
  "Diagnostic fees disclosed before the visit",
  "Parts options explained in the quote",
  "Written warranty terms for eligible repairs",
  "No paid repair without quote approval",
  "Same-day appointments subject to availability",
  "Customer data handled under our privacy policy",
]

export function AboutContent({ pdfUrl }: { pdfUrl?: string }) {
  const t = useT()

  return (
    <section className="relative pt-32 pb-16">

      <div className="container mx-auto px-6 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-foreground">
              {t("About")} <span className="text-cyan-500 dark:text-cyan-400">KBI</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t(
                "KBI provides on-site device repair and technical support at homes and offices across all 7 Emirates in the UAE.",
              )}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <GlassCard key={index} className="text-center py-8" hoverEffect={false}>
              <p className="text-4xl md:text-5xl font-bold text-cyan-500 dark:text-cyan-400 mb-2">{stat.number}</p>
              <p className="text-muted-foreground font-medium">{t(stat.label)}</p>
            </GlassCard>
          ))}
        </div>

        {/* Who We Are */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <div>
            <GlassCard className="h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-cyan-500/10">
                  <Users className="w-7 h-7 text-cyan-500 dark:text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">{t("Who We Are")}</h2>
              </div>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  {t(
                    "Founded with a simple mission: to make device repair convenient and hassle-free. We understand how frustrating it can be when your phone, laptop, or TV breaks down unexpectedly.",
                  )}
                </p>
                <p>
                  {t(
                    "That's why we created KBI—a mobile service that comes directly to you. Our technicians bring the tools and practical experience needed to diagnose many common device problems on site.",
                  )}
                </p>
                <p>
                  {t(
                    "We take bookings across all 7 Emirates in the UAE. Appointment times depend on the location, technician capacity, and parts availability.",
                  )}
                </p>
              </div>
            </GlassCard>
          </div>

          <div>
            <GlassCard className="h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-orange-500/10">
                  <Award className="w-7 h-7 text-orange-500 dark:text-orange-400" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">{t("Experienced Technicians")}</h2>
              </div>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  {t(
                    "Our team handles a broad range of consumer and business devices. We assess each request first and confirm whether it can be completed on site or needs another service path.",
                  )}
                </p>
                <p className="font-semibold text-foreground">{t("Each technician specializes in specific device categories:")}</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500" />
                    {t("Mobile phones & tablets (all brands)")}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    {t("Laptops & computers (Windows & Mac)")}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    {t("TVs, monitors & home electronics")}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    {t("CCTV systems & security equipment")}
                  </li>
                </ul>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Our Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-10 text-foreground">
            {t("Our Values")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <div
                key={index}
              >
                <GlassCard className="h-full text-center">
                  <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 w-fit mx-auto mb-4">{value.icon}</div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">{t(value.title)}</h3>
                  <p className="text-muted-foreground leading-relaxed">{t(value.description)}</p>
                </GlassCard>
              </div>
            ))}
          </div>
        </div>

        {/* Our Guarantees */}
        <div>
          <GlassCard>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-green-500/10">
                <ShieldCheck className="w-7 h-7 text-green-500 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">{t("Our Guarantees")}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {guarantees.map((guarantee, index) => (
                <div key={index} className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <Clock className="w-3 h-3 text-green-500 dark:text-green-400" />
                  </div>
                  <span className="text-sm text-foreground/90 font-medium">{t(guarantee)}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-border text-center">
              <p className="text-muted-foreground mb-4">{t("Ready to Fix Your Device?")}</p>
              <Link
                href="/book"
                className="inline-flex items-center gap-2 px-8 py-4 bg-cyan-500 text-black rounded-full font-bold hover:bg-cyan-400 transition-colors shadow-md"
              >
                {t("Book a Technician")} <ArrowRight className="w-5 h-5" />
              </Link>
              {pdfUrl && (
                <div className="mt-4 flex justify-end">
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative inline-flex items-center gap-2 px-7 py-3 rounded-full bg-card border border-border text-foreground backdrop-blur-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <FileText className="w-5 h-5 text-cyan-500 dark:text-cyan-400 transition-transform group-hover:scale-110 group-hover:rotate-12" />
                    <span>{t("Company Presentation (PDF)")}</span>
                  </a>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  )
}
