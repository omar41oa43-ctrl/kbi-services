
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
        <h2 className="text-2xl md:text-3xl font-bold mb-6">Trusted by</h2>
        <SlidingLogoMarquee
          items={[
            { id: "apple", content: <SiApple className="w-12 h-12 text-white/70 hover:text-white transition-colors" />, href: "https://www.apple.com" },
            { id: "samsung", content: <SiSamsung className="w-16 h-16 text-white/70 hover:text-[#1428A0] transition-colors" />, href: "https://www.samsung.com" },
            { id: "dell", content: <SiDell className="w-12 h-12 text-white/70 hover:text-[#0076CE] transition-colors" />, href: "https://www.dell.com" },
            { id: "hp", content: <SiHp className="w-12 h-12 text-white/70 hover:text-[#0096D6] transition-colors" />, href: "https://www.hp.com" },
            { id: "lenovo", content: <SiLenovo className="w-16 h-16 text-white/70 hover:text-[#E2231A] transition-colors" />, href: "https://www.lenovo.com" },
            { id: "sony", content: <SiSony className="w-16 h-16 text-white/70 hover:text-white transition-colors" />, href: "https://www.sony.com" },
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
          showControls={true}
        />
      </section>
      <CTASection />

    </main>
  )
}
