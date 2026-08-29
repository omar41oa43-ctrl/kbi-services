
import { Hero } from "@/components/hero"
import { Services } from "@/components/services"
import { WhyChooseUs } from "@/components/why-choose-us"
import { HowItWorks } from "@/components/how-it-works"
import { CTASection } from "@/components/cta-section"
import { BrandsSection } from "@/components/brands-section"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    absolute: "On-Site Device Repair & IT Services Across the UAE | KBI Services",
  },
  description: "Professional on-site device repair and IT services across the UAE. KBI technicians come to your home or office for phones, laptops, PCs, printers, TVs, CCTV, gaming consoles and more.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "On-Site Device Repair & IT Services Across the UAE | KBI Services",
    description: "Professional on-site device repair and IT services across the UAE. KBI technicians come to your home or office for phones, laptops, PCs, printers, TVs, CCTV, gaming consoles and more.",
    url: "https://kbi.services/",
    type: "website",
  },
}

export const dynamic = "force-static"

export default async function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-cyan-500/30 pb-20 lg:pb-0">
      <Hero />
      <Services />
      <WhyChooseUs />
      <HowItWorks />
      <BrandsSection />
      <CTASection />
    </main>
  )
}
