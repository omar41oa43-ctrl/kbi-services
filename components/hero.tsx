import { ArrowRight, MessageCircle } from "lucide-react"
import Link from "next/link"
import type { SiteContact } from "@/lib/site-contact"

export function Hero({ contact }: { contact: SiteContact }) {
  return (
    <section className="relative flex items-center justify-center overflow-hidden pt-28 pb-16 sm:py-24 md:py-32 brand-hero">

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <div>
            {/* Badge */}
            <div className="flex justify-center mb-6 sm:mb-10">
              <div
                className="inline-flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-emerald-500/10 border border-emerald-500/25 cursor-default hover:bg-emerald-500/15 transition-all duration-300 shadow-sm backdrop-blur-md"
              >
                <div className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-300">
                  AVAILABLE ACROSS THE UAE
                </span>
              </div>
            </div>

            {/* Headings */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:via-blue-50 dark:to-white/60 mb-5 sm:mb-6 tracking-tighter text-balance leading-[1.1]" suppressHydrationWarning>
              <span>Tech Repair at Your Doorstep<br /><span className="text-cyan-600 dark:text-cyan-400 inline-block mt-1.5 sm:mt-2">Across the UAE</span></span>
            </h1>

            <p className="text-sm sm:text-lg md:text-xl text-slate-600 dark:text-gray-300 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed font-normal dark:font-light tracking-wide px-2 sm:px-0" suppressHydrationWarning>
              On-site device repair and IT support at your home or office across the UAE. Appointment timing depends on technician and parts availability.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 w-full max-w-xs sm:max-w-none mx-auto">
              <Link
                href="/book"
                className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-base sm:text-lg hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 flex items-center justify-center gap-2.5 group shadow-[0_0_25px_rgba(6,182,212,0.35)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Book a Technician</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </Link>
              <a
                href={`https://wa.me/${contact.whatsappRaw}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-base sm:text-lg border border-emerald-500/30 hover:border-emerald-500/50 transition-all duration-300 flex items-center justify-center gap-2.5 shadow-sm backdrop-blur-md hover:-translate-y-0.5 active:translate-y-0"
              >
                <MessageCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-500/20" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>

            {/* Emirates List */}
            <div className="mt-8 pt-4 border-t border-slate-200/40 dark:border-white/5 max-w-xl mx-auto">
              <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 font-medium tracking-wide">
                Abu Dhabi · Dubai · Sharjah · Ajman · Ras Al Khaimah · Fujairah · Umm Al Quwain
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
