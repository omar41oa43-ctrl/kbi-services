"use client"

import { useT } from "@/components/language-provider"
import { SlidingLogoMarquee } from "@/components/sliding-logo-marquee"
import { SiApple, SiSamsung, SiDell, SiHp, SiLenovo, SiSony } from "react-icons/si"

export function BrandsSection() {
  const t = useT()

  return (
    <section className="container mx-auto px-6 py-12 md:py-16">
      <h2 className="mb-6 text-2xl font-bold text-foreground md:text-3xl" suppressHydrationWarning>
        {t("Brands We Service")}
      </h2>
      <SlidingLogoMarquee
        items={[
          { id: "apple", label: "Apple", content: <SiApple aria-hidden="true" className="w-10 h-10 text-white fill-white hover:text-cyan-400 transition-colors" />, href: "https://www.apple.com" },
          { id: "samsung", label: "Samsung", content: <SiSamsung aria-hidden="true" className="w-28 h-8 text-white fill-white hover:text-cyan-400 transition-colors" />, href: "https://www.samsung.com" },
          { id: "dell", label: "Dell", content: <SiDell aria-hidden="true" className="w-10 h-10 text-white fill-white hover:text-cyan-400 transition-colors" />, href: "https://www.dell.com" },
          { id: "hp", label: "HP", content: <SiHp aria-hidden="true" className="w-10 h-10 text-white fill-white hover:text-cyan-400 transition-colors" />, href: "https://www.hp.com" },
          { id: "lenovo", label: "Lenovo", content: <SiLenovo aria-hidden="true" className="w-28 h-7 text-white fill-white hover:text-cyan-400 transition-colors" />, href: "https://www.lenovo.com" },
          { id: "sony", label: "Sony", content: <SiSony aria-hidden="true" className="w-24 h-6 text-white fill-white hover:text-cyan-400 transition-colors" />, href: "https://www.sony.com" },
        ]}
        speed={40}
        pauseOnHover
        enableBlur={false}
        blurIntensity={0}
        height="110px"
        width="100%"
        gap="1rem"
        scale={1}
      />
    </section>
  )
}
