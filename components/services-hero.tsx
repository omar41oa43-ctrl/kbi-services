"use client"

import { motion } from "framer-motion"
import { Zap } from "lucide-react"
import { useT } from "@/components/language-provider"

export function ServicesHero() {
  const t = useT()
  return (
    <section className="relative pt-32 pb-16 overflow-hidden" suppressHydrationWarning>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6">
            <Zap className="w-4 h-4 fill-current" />
            {t("Professional Repair Services")}
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-foreground mb-6 tracking-tight">
            {t("Our")} <span className="text-cyan-500 dark:text-cyan-400">{t("Services")}</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed" suppressHydrationWarning>
            {t("Professional on-site repair for all your devices. Choose your device below to see the services we offer and brands we support.")}
          </p>
        </motion.div>
      </div>
    </section>
  )
}
