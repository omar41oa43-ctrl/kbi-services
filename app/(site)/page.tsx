
import { Hero } from "@/components/hero"
import { Services } from "@/components/services"
import { WhyChooseUs } from "@/components/why-choose-us"
import { HowItWorks } from "@/components/how-it-works"
import { CTASection } from "@/components/cta-section"
import { SlidingLogoMarquee } from "@/components/sliding-logo-marquee"
import { SiSamsung, SiApple, SiDell, SiHp, SiLenovo, SiSony } from "react-icons/si"
import type { Metadata } from "next"

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
}


export const dynamic = "force-static"

export default async function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-cyan-500/30 pb-16 lg:pb-0">
      <Hero />
      <Services />
      <WhyChooseUs />
      <HowItWorks />
      <section className="container mx-auto px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Brands We Service</h2>
        <p className="text-sm text-muted-foreground mb-6">Brand names identify devices we repair and do not imply manufacturer authorization.</p>
        <SlidingLogoMarquee
          items={[
            { id: "apple", label: "Apple", content: <SiApple aria-hidden="true" className="w-12 h-12 text-slate-800 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors" />, href: "https://www.apple.com" },
            { id: "samsung", label: "Samsung", content: <SiSamsung aria-hidden="true" className="w-16 h-16 text-slate-800 dark:text-white/70 hover:text-[#1428A0] transition-colors" />, href: "https://www.samsung.com" },
            { id: "dell", label: "Dell", content: <SiDell aria-hidden="true" className="w-12 h-12 text-slate-800 dark:text-white/70 hover:text-[#0076CE] transition-colors" />, href: "https://www.dell.com" },
            { id: "hp", label: "HP", content: <SiHp aria-hidden="true" className="w-12 h-12 text-slate-800 dark:text-white/70 hover:text-[#0096D6] transition-colors" />, href: "https://www.hp.com" },
            { id: "lenovo", label: "Lenovo", content: <SiLenovo aria-hidden="true" className="w-16 h-16 text-slate-800 dark:text-white/70 hover:text-[#E2231A] transition-colors" />, href: "https://www.lenovo.com" },
            { id: "sony", label: "Sony", content: <SiSony aria-hidden="true" className="w-16 h-16 text-slate-800 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors" />, href: "https://www.sony.com" },
          ]}
          speed={40}
          pauseOnHover
          enableBlur={false}
          blurIntensity={0}
          height="110px"
          width="100%"
          gap="1rem"
          scale={1}
          direction="horizontal"
          autoPlay
          showGridBackground={false}
          enableSpillEffect={false}
          animationSteps={8}
          showControls
        />
      </section>
      <CTASection />

    </main>
  )
}
