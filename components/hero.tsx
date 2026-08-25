"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { useT } from "@/components/language-provider"
import { useSiteContact } from "@/components/contact-provider"

export function Hero() {
  const t = useT()
  const contact = useSiteContact()



  return (
    <section className="relative flex items-center justify-center overflow-hidden py-20 md:py-32 brand-hero">

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Badge */}
            <div className="flex justify-center mb-10">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3, ease: "backOut" }}
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 cursor-default hover:bg-slate-900/10 dark:hover:bg-white/10 transition-all duration-300 shadow-xs"
              >
                <div className="relative flex h-3 w-3 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </div>
                <span className="text-sm font-semibold text-emerald-700 dark:text-green-300 tracking-wide transition-colors">
                  {t("Serving All of Abu Dhabi")}
                </span>
              </motion.div>
            </div>

            {/* Headings */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:via-blue-50 dark:to-white/60 mb-6 tracking-tighter text-balance leading-[1.1]" suppressHydrationWarning>
              <span>{t("We Come to You")}<br /><span className="text-cyan-600 dark:text-cyan-400 inline-block mt-2">{t("Best On-Site Repair in Abu Dhabi")}</span></span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 dark:text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal dark:font-light tracking-wide" suppressHydrationWarning>
              {t("Fast, professional, and guaranteed repairs at your home or office — anywhere in Abu Dhabi. Specialists in mobile, laptop, printer, and CCTV maintenance.")}
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                href="/book"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-slate-900 text-white dark:bg-white dark:text-black font-semibold text-lg hover:bg-slate-800 dark:hover:bg-gray-100 transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg"
              >
                {t("Book a Technician")}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href={`https://wa.me/${contact.whatsappRaw}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-slate-900/5 dark:bg-white/5 text-slate-800 dark:text-white font-medium text-lg hover:bg-slate-900/10 dark:hover:bg-white/10 border border-slate-900/10 dark:border-white/10 transition-all duration-300 flex items-center justify-center gap-2"
              >
                {t("Contact Us")}
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
