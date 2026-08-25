"use client"

import { motion } from "framer-motion"
import { GlassCard } from "@/components/ui/glass-card"
import { ChevronRight, ChevronLeft } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"
import { useLanguage, useT } from "@/components/language-provider"

interface ServiceCategoryProps {
  id: string
  name: string
  icon: ReactNode
  brands: { id: string; name: string; models: string[] }[]
  issues: string[]
  accentColor: string
}

export function ServiceCategory({ id, name, icon, brands, issues, accentColor }: ServiceCategoryProps) {
  const { lang } = useLanguage()
  const isAr = lang === "ar"
  const t = useT()
  const colorClasses: Record<string, { text: string; bg: string; border: string }> = {
    cyan: { text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30" },
    blue: { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
    teal: { text: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/30" },
    indigo: { text: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/30" },
    purple: { text: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
    pink: { text: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/30" },
    red: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
    orange: { text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
    green: { text: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
  }

  const colors = colorClasses[accentColor] || colorClasses.cyan

  return (
    <section id={id} className="py-12 scroll-mt-24" suppressHydrationWarning>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 rounded-2xl ${colors.bg} ${colors.text}`}>{icon}</div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">{isAr ? t(name) : name}</h2>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services/Issues */}
        <GlassCard hoverEffect={false}>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className={colors.text}>{t("Services We Offer")}</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {issues.map((issue, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.03 }}
                className={`flex items-center gap-2 p-3 rounded-xl ${colors.bg} border ${colors.border}`}
              >
                {isAr ? <ChevronLeft className={`w-4 h-4 ${colors.text}`} /> : <ChevronRight className={`w-4 h-4 ${colors.text}`} />}
                <span className="text-sm font-medium text-foreground/90">{isAr ? t(issue) : issue}</span>
              </motion.div>
            ))}
          </div>
          <Link
            href={`/book?device=${id}`}
            className={`mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm ${colors.bg} ${colors.text} border ${colors.border} hover:bg-muted transition-colors shadow-xs`}
          >
            {isAr ? `احجز إصلاح ${t(name)}` : `Book ${name} Repair`}
            {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Link>
        </GlassCard>

        {/* Brands */}
        <GlassCard hoverEffect={false}>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className={colors.text}>{t("Brands We Service")}</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {brands.map((brand, index) => (
              <motion.div
                key={brand.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.03 }}
                className="px-4 py-2 rounded-full bg-black/5 dark:bg-white/5 border border-border text-sm text-foreground/80 font-medium hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-default"
              >
                {brand.name}
              </motion.div>
            ))}
          </div>

          {/* Sample models preview */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3 font-medium">{t("Popular models we repair:")}</p>
            <div className="flex flex-wrap gap-2">
              {brands.slice(0, 3).flatMap((brand) =>
                brand.models.slice(0, 2).map((model, idx) => (
                  <span key={`${brand.id}-${idx}`} className="text-xs text-foreground/70 px-2.5 py-1 bg-black/5 dark:bg-white/5 border border-border rounded-lg font-medium">
                    {model}
                  </span>
                )),
              )}
              <span className="text-xs text-muted-foreground px-2 py-1">{t("+ many more")}</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </section>
  )
}
