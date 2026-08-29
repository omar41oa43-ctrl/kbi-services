"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { useT } from "@/components/language-provider"
import { ShieldCheck, Zap, HeartHandshake, Clock, Award, Star } from "lucide-react"

const features = [
  {
    title: "Experienced Technicians",
    description: "Your request is matched with a technician experienced in the relevant device category.",
    icon: <Award className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />,
    bg: "bg-cyan-500/10",
  },
  {
    title: "Same-Day Service Available",
    description: "Same-day appointments are available in many areas, subject to technician and parts availability.",
    icon: <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
    bg: "bg-blue-500/10",
  },
  {
    title: "Pay After Successful Repair",
    description: "Diagnosis comes first, then you approve the quote. Payment is due only after approved repair is completed.",
    icon: <Zap className="w-8 h-8 text-amber-500 dark:text-yellow-400" />,
    bg: "bg-amber-500/10",
  },
  {
    title: "Quality Parts Options Available",
    description: "Genuine and quality-matched parts available depending on device model and parts availability.",
    icon: <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-green-400" />,
    bg: "bg-emerald-500/10",
  },
  {
    title: "3–6 Month Warranty on Eligible Repairs",
    description: "Eligible repairs include a clear 3–6 month written service warranty confirmed before repair.",
    icon: <Star className="w-8 h-8 text-purple-600 dark:text-purple-400" />,
    bg: "bg-purple-500/10",
  },
  {
    title: "Transparent Pricing",
    description: "Diagnosis comes first, then you approve the final quote before any paid repair begins.",
    icon: <HeartHandshake className="w-8 h-8 text-rose-600 dark:text-pink-400" />,
    bg: "bg-rose-500/10",
  },
]

export function WhyChooseUs() {
  const t = useT()
  return (
    <section className="home-deferred py-24 relative overflow-hidden bg-slate-50/60 dark:bg-black/50 transition-colors">
      {/* Background Decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] opacity-30" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] opacity-30" />
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="mb-20 text-center">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-400 text-sm font-bold tracking-wider uppercase shadow-xs">
            {t("Why Choose Us")}
          </div>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tighter text-foreground leading-[1.1]">
            {t("Why Choose KBI?")}
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            {t("We focus on convenient on-site service, clear quotes, and careful handling of your devices.")}
          </p>
          <div className="h-1 w-[120px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto mt-8 shadow-[0_0_20px_rgba(6,182,212,0.6)]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group"
            >
              <GlassCard 
                className="h-full p-8 text-center flex flex-col items-center justify-center transition-all duration-300 border-border bg-card hover:border-cyan-500/50 hover:shadow-lg relative overflow-hidden shadow-xs" 
                hoverEffect={false}
              >
                {/* Card Glow Effect */}
                <div className="absolute -inset-24 bg-cyan-500/5 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <div className={`relative mb-6 p-5 rounded-[2rem] ${feature.bg} ring-1 ring-border group-hover:ring-cyan-500/30 group-hover:scale-110 transition-all duration-300`}>
                  {feature.icon}
                </div>
                
                <h3 className="text-2xl font-bold mb-3 tracking-tight text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors duration-300">
                  {t(feature.title)}
                </h3>
                
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed font-medium">
                  {t(feature.description)}
                </p>

                {/* Bottom Bar Indicator */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              </GlassCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
