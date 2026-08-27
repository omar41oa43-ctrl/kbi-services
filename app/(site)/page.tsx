
import { Hero } from "@/components/hero"
import { Services } from "@/components/services"
import { WhyChooseUs } from "@/components/why-choose-us"
import { HowItWorks } from "@/components/how-it-works"
import { CTASection } from "@/components/cta-section"
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
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" aria-label="Supported brands">
          {["Apple", "Samsung", "Dell", "HP", "Lenovo", "Sony"].map((brand) => (
            <li key={brand} className="rounded-xl border border-border bg-card px-4 py-6 text-center text-lg font-bold text-foreground/80 shadow-xs">{brand}</li>
          ))}
        </ul>
      </section>
      <CTASection />

    </main>
  )
}
