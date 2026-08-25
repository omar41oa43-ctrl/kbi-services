"use client"

import { motion } from "framer-motion"
import { GlassCard } from "@/components/ui/glass-card"
import { useT } from "@/components/language-provider"
import { ShieldCheck, Zap, HeartHandshake, Clock, Award, Star } from "lucide-react"

const features = [
  {
    title: "Certified Experts",
    description: "Our team consists of highly trained and certified technicians with years of experience.",
    icon: <Award className="w-8 h-8 text-cyan-400" />,
  },
  {
    title: "Same-Day Service",
    description: "We arrive at your location - home or office - the same day you book.",
    icon: <Clock className="w-8 h-8 text-blue-400" />,
  },
  {
    title: "Free Diagnostics",
    description: "No fix, no fee. Diagnostic check is free if you proceed with the repair.",
    icon: <Zap className="w-8 h-8 text-yellow-400" />,
  },
  {
    title: "Genuine Parts",
    description: "We only use high-quality, genuine parts for all our repairs.",
    icon: <ShieldCheck className="w-8 h-8 text-green-400" />,
  },
  {
    title: "Warranty Included",
    description: "All our repairs come with a solid 3-6 months warranty for your peace of mind.",
    icon: <Star className="w-8 h-8 text-purple-400" />,
  },
  {
    title: "Transparent Pricing",
    description: "Know the cost upfront. No hidden fees or surprises after the work is done.",
    icon: <HeartHandshake className="w-8 h-8 text-pink-400" />,
  },
]

export function WhyChooseUs() {
  const t = useT()
  return (
    <section className="py-24 relative overflow-hidden bg-black/50">
      {/* Background Decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] opacity-20" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] opacity-20" />
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="mb-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block mb-4 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-semibold tracking-wider uppercase"
          >
            {t("Why Choose Us")}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-8 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40 leading-[1.1] drop-shadow-[0_5px_15px_rgba(255,255,255,0.1)]"
          >
            {t("Why Choose KBI?")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-white/50 text-xl max-w-2xl mx-auto font-light leading-relaxed"
          >
            {t("We're committed to providing the best repair experience in Abu Dhabi with professional on-site service.")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: "120px" }}
            viewport={{ once: true }}
            className="h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto mt-8 shadow-[0_0_20px_rgba(6,182,212,0.6)]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -10 }}
              className="group"
            >
              <GlassCard 
                className="h-full p-8 text-center flex flex-col items-center justify-center transition-all duration-500 border-white/5 group-hover:border-cyan-500/40 group-hover:bg-white/[0.08] relative overflow-hidden" 
                hoverEffect={false}
              >
                {/* Card Glow Effect */}
                <div className="absolute -inset-24 bg-cyan-500/5 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <div className="relative mb-6 p-5 rounded-[2rem] bg-white/5 ring-1 ring-white/10 group-hover:ring-cyan-500/30 group-hover:bg-cyan-500/10 transition-all duration-500 group-hover:rotate-6">
                  {feature.icon}
                </div>
                
                <h3 className="text-2xl font-bold mb-4 tracking-tight group-hover:text-cyan-400 transition-colors duration-300 bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60 group-hover:from-cyan-400 group-hover:to-cyan-600">
                  {t(feature.title)}
                </h3>
                
                <p className="text-white/50 text-base leading-relaxed group-hover:text-white/80 transition-colors duration-300 font-medium">
                  {t(feature.description)}
                </p>

                {/* Bottom Bar Indicator */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
