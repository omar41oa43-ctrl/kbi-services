"use client"

import { motion } from "framer-motion"
import { ClipboardList, UserCheck, Truck, Search, Wrench, CreditCard, Zap } from "lucide-react"
import { useT } from "@/components/language-provider"

export function HowItWorks() {
  const t = useT()

  const steps = [
    { icon: <ClipboardList className="w-8 h-8" />, title: t("Submit Request"), description: t("Book via site or WhatsApp with device details") },
    { icon: <UserCheck className="w-8 h-8" />, title: t("Assign Technician"), description: t("We assign a certified technician for your request") },
    { icon: <Truck className="w-8 h-8" />, title: t("We Come to Your Location"), description: t("Technician arrives at your home or office") },
    { icon: <Search className="w-8 h-8" />, title: t("Instant Diagnosis"), description: t("Free diagnosis to identify the problem") },
    { icon: <Wrench className="w-8 h-8" />, title: t("Complete Repair"), description: t("Professional repair using high-quality parts") },
    { icon: <CreditCard className="w-8 h-8" />, title: t("Pay After Repair"), description: t("Pay only when you are satisfied with the work") },
  ]

  return (
    <section className="py-24 relative overflow-hidden bg-[#030712]">
      <div className="max-w-7xl mx-auto px-4 relative">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6"
          >
            <Zap className="w-4 h-4" />
            {t("How Our Service Works")}
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            {t("Simple, fast, and hassle-free repair process")}
          </h2>
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent -translate-y-1/2" />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center text-center"
              >
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -end-2 w-7 h-7 rounded-full bg-cyan-500 text-black text-sm font-bold flex items-center justify-center">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-base font-semibold mb-1" suppressHydrationWarning>{step.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed" suppressHydrationWarning>{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
