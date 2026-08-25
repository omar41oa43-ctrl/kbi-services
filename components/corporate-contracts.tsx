"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/animations"
import { CalendarClock, ClipboardList, Truck, CheckCircle2 } from "lucide-react"
import { useLanguage, useT } from "@/components/language-provider"

export function CorporateContractsSection() {
  const t = useT()
  const { lang } = useLanguage()
  const isAr = lang === "ar"

  const plans = [
    {
      title: t("Monthly Contract"),
      icon: CalendarClock,
      features: [t("Unlimited visits"), t("Fixed monthly rate"), t("Priority repairs")],
      color: "text-blue-400",
      gradient: "from-blue-500/20",
      border: "group-hover:border-blue-500/50",
      popular: false,
    },
    {
      title: t("Yearly Contract"),
      icon: ClipboardList,
      features: [t("Discounted pricing"), t("Full IT Support"), t("Replacement options")],
      color: "text-purple-400",
      gradient: "from-purple-500/20",
      border: "group-hover:border-purple-500/50",
      popular: true,
    },
    {
      title: t("Pay-Per-Visit"),
      icon: Truck,
      features: [t("One-time repair"), t("Standard rates"), t("Ideal for occasional needs")],
      color: "text-green-400",
      gradient: "from-green-500/20",
      border: "group-hover:border-green-500/50",
      popular: false,
    },
  ]

  return (
    <section className="py-16">
      <div className="container mx-auto px-6" data-dir={isAr ? "rtl" : "ltr"}>
        <FadeIn>
          <h2 className="text-2xl md:text-3xl font-bold mb-8">{t("Corporate Maintenance Contracts")}</h2>
        </FadeIn>
        <StaggerContainer className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <StaggerItem key={i} className="h-full">
              <GlassCard className={`h-full border border-white/10 group relative overflow-hidden transition-all duration-300 ${plan.border} ${plan.popular ? "ring-1 ring-cyan-500/30 bg-cyan-500/5" : ""}`}>
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-cyan-500 text-black text-xs font-bold px-3 py-1 rounded-bl-xl">
                    {t("POPULAR")}
                  </div>
                )}
                <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="relative z-10 p-2">
                  <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 ${plan.color} group-hover:scale-110 transition-transform duration-300`}>
                    <plan.icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-xl font-bold mb-4">{plan.title}</h3>

                  <ul className="space-y-3">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-3 text-sm text-white/70">
                        <CheckCircle2 className={`w-4 h-4 ${plan.color}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </GlassCard>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <StaggerContainer delay={0.2} className="grid md:grid-cols-3 gap-6 mt-8">
          <StaggerItem>
            <GlassCard hoverEffect={false} className="border border-white/10 h-full">
              <div className="text-3xl font-bold">
                <span className="text-cyan-400">2h</span> {t("avg response")}
              </div>
              <p className="text-white/60 text-sm mt-1">{t("Priority dispatch for corporate clients")}</p>
            </GlassCard>
          </StaggerItem>
          <StaggerItem>
            <GlassCard hoverEffect={false} className="border border-white/10 h-full">
              <div className="text-3xl font-bold">
                <span className="text-cyan-400">100+</span> {t("technicians")}
              </div>
              <p className="text-white/60 text-sm mt-1">{t("Coverage across all UAE regions")}</p>
            </GlassCard>
          </StaggerItem>
          <StaggerItem>
            <GlassCard hoverEffect={false} className="border border-white/10 h-full">
              <div className="text-3xl font-bold">
                <span className="text-cyan-400">1000+</span> {t("devices/month")}
              </div>
              <p className="text-white/60 text-sm mt-1">{t("Enterprise-grade servicing capacity")}</p>
            </GlassCard>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </section>
  )
}

