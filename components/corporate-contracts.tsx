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
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
      gradient: "from-blue-500/10",
      border: "hover:border-blue-500/50",
      popular: false,
    },
    {
      title: t("Yearly Contract"),
      icon: ClipboardList,
      features: [t("Discounted pricing"), t("Full IT Support"), t("Replacement options")],
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-500/10",
      gradient: "from-purple-500/10",
      border: "hover:border-purple-500/50",
      popular: true,
    },
    {
      title: t("Pay-Per-Visit"),
      icon: Truck,
      features: [t("One-time repair"), t("Standard rates"), t("Ideal for occasional needs")],
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      gradient: "from-emerald-500/10",
      border: "hover:border-emerald-500/50",
      popular: false,
    },
  ]

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-6" data-dir={isAr ? "rtl" : "ltr"}>
        <FadeIn>
          <div className="text-center md:text-start mb-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{t("Corporate Maintenance Contracts")}</h2>
            <p className="text-muted-foreground mt-2 text-base max-w-2xl">{t("Tailored enterprise service level agreements to keep your organization running without disruption.")}</p>
          </div>
        </FadeIn>
        <StaggerContainer className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <StaggerItem key={i} className="h-full">
              <GlassCard className={`h-full border border-border bg-card/90 dark:bg-card/40 group relative overflow-hidden transition-all duration-300 shadow-sm ${plan.border} ${plan.popular ? "ring-2 ring-cyan-500 shadow-md shadow-cyan-500/10" : ""}`}>
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[11px] font-extrabold px-3 py-1 rounded-bl-xl shadow-xs uppercase tracking-wider">
                    {t("POPULAR")}
                  </div>
                )}
                <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

                <div className="relative z-10 p-2 flex flex-col h-full justify-between">
                  <div>
                    <div className={`w-12 h-12 rounded-2xl ${plan.bg} flex items-center justify-center mb-5 ${plan.color} group-hover:scale-110 transition-transform duration-300 ring-1 ring-border`}>
                      <plan.icon className="w-6 h-6" />
                    </div>

                    <h3 className="text-xl font-bold text-foreground mb-4">{plan.title}</h3>

                    <ul className="space-y-3">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-center gap-3 text-sm text-foreground/80 font-medium">
                          <CheckCircle2 className={`w-4 h-4 shrink-0 ${plan.color}`} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 pt-4 border-t border-border">
                    <a
                      href="#corporate-form"
                      className="block w-full py-2.5 px-4 text-center rounded-xl bg-accent text-accent-foreground font-semibold hover:bg-cyan-500 hover:text-white transition-colors text-xs"
                    >
                      {t("Select Plan")}
                    </a>
                  </div>
                </div>
              </GlassCard>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <StaggerContainer delay={0.2} className="grid md:grid-cols-3 gap-6 mt-8">
          <StaggerItem>
            <GlassCard hoverEffect={false} className="border border-border bg-card/80 dark:bg-card/40 h-full p-6 shadow-xs">
              <div className="text-3xl font-extrabold text-foreground">
                <span className="text-cyan-600 dark:text-cyan-400">2h</span> <span className="text-lg font-bold">{t("avg response")}</span>
              </div>
              <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{t("Priority dispatch for corporate clients")}</p>
            </GlassCard>
          </StaggerItem>
          <StaggerItem>
            <GlassCard hoverEffect={false} className="border border-border bg-card/80 dark:bg-card/40 h-full p-6 shadow-xs">
              <div className="text-3xl font-extrabold text-foreground">
                <span className="text-cyan-600 dark:text-cyan-400">100+</span> <span className="text-lg font-bold">{t("technicians")}</span>
              </div>
              <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{t("Coverage across all UAE regions")}</p>
            </GlassCard>
          </StaggerItem>
          <StaggerItem>
            <GlassCard hoverEffect={false} className="border border-border bg-card/80 dark:bg-card/40 h-full p-6 shadow-xs">
              <div className="text-3xl font-extrabold text-foreground">
                <span className="text-cyan-600 dark:text-cyan-400">1000+</span> <span className="text-lg font-bold">{t("devices/month")}</span>
              </div>
              <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{t("Enterprise-grade servicing capacity")}</p>
            </GlassCard>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </section>
  )
}

