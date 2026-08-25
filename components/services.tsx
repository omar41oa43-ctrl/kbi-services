"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Smartphone, Laptop, Printer, Tv, Gamepad2, Camera, MonitorUp, Wifi, Headset } from "lucide-react"
import { useLanguage, useT } from "@/components/language-provider"
import { devices } from "@/lib/data"

export function Services() {
  const { lang } = useLanguage()
  const t = useT()
  const isAr = lang === "ar"

  const iconMap: Record<string, React.ReactNode> = {
    Smartphone: <Smartphone className="w-6 h-6" />,
    Laptop: <Laptop className="w-6 h-6" />,
    Printer: <Printer className="w-6 h-6" />,
    Monitor: <MonitorUp className="w-6 h-6" />,
    Tv: <Tv className="w-6 h-6" />,
    Watch: <Gamepad2 className="w-6 h-6" />,
    Gamepad2: <Gamepad2 className="w-6 h-6" />,
    Camera: <Camera className="w-6 h-6" />,
    MonitorUp: <MonitorUp className="w-6 h-6" />,
    Wifi: <Wifi className="w-6 h-6" />,
    Headset: <Headset className="w-6 h-6" />,
  }

  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    mobile: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400" },
    laptop: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
    pc: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400" },
    printer: { bg: "bg-teal-500/10", border: "border-teal-500/30", text: "text-teal-400" },
    monitor: { bg: "bg-indigo-500/10", border: "border-indigo-500/30", text: "text-indigo-400" },
    tv: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400" },
    "apple-watch": { bg: "bg-pink-500/10", border: "border-pink-500/30", text: "text-pink-400" },
    gaming: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400" },
    cctv: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400" },
    "tv-install": { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400" },
    tablet: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
    networking: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400" },
    "tech-support": { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400" },
  }

  return (
    <section className="py-20">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            {t("Our Services")}
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            {t("Professional on-site repair and maintenance services for all your devices")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.slice(0, 9).map((device, index) => {
            const colors = colorMap[device.id] || colorMap.mobile
            return (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -8 }}
                className="group"
              >
                <Link href={`/book?device=${device.id}`}>
                  <div className={`h-full p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 ${colors.bg} border-2 border-transparent hover:${colors.border}`}>
                    <div className={`p-4 rounded-2xl ${colors.bg} mb-4 inline-block`}>
                      <div className={colors.text}>
                        {iconMap[device.icon] || <Smartphone className="w-6 h-6" />}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      {isAr ? t(device.name) : device.name}
                    </h3>
                    <p className="text-white/60 text-sm mb-4">
                      {device.issues.slice(0, 3).map((issue, i) => (
                        <span key={i}>
                          {isAr ? t(issue) : issue}
                          {i < 2 && ", "}
                        </span>
                      ))}
                    </p>
                    <div className={`flex items-center gap-2 ${colors.text} font-semibold text-sm group-hover:gap-3 transition-all`}>
                      {t("Book Now")}
                      {isAr ? <ArrowRight className="w-4 h-4 rotate-180" /> : <ArrowRight className="w-4 h-4" />}
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            href="/services"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 font-semibold"
          >
            {t("View All Services")}
            {isAr ? <ArrowRight className="w-5 h-5 rotate-180" /> : <ArrowRight className="w-5 h-5" />}
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
