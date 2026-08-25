import { locations } from "@/lib/locations"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { MapPin, Clock, Star, ShieldCheck } from "lucide-react"

interface Props {
    params: Promise<{ slug: string }>
}

// generateStaticParams removed to force dynamic rendering

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const loc = locations.find((l) => l.slug === slug)
    if (!loc) return {}

    return {
        title: `Mobile & Phone Repair in ${loc.name}`,
        description: `Expert mobile, laptop, and electronics repair in ${loc.name}, Abu Dhabi. Professional on-site service at your home or office. Same-day repair available for all major brands.`,
        alternates: {
            canonical: `https://kbi.services/locations/${loc.slug}`,
            languages: {
                "en-AE": `https://kbi.services/en/locations/${loc.slug}`,
                "ar-AE": `https://kbi.services/ar/locations/${loc.slug}`,
            }
        },
    }
}

export default async function LocationPage({ params }: Props) {
    const { slug } = await params
    const loc = locations.find((l) => l.slug === slug)

    if (!loc) {
        notFound()
    }

    return (
        <main className="adaptive-theme-page min-h-screen bg-black text-white pt-24 pb-12">
            {/* Hero Section */}
            <section className="container mx-auto px-6 mb-16">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-6">
                        <MapPin className="w-4 h-4" />
                        <span className="font-semibold text-sm">Serving {loc.name} & Surroundings</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-white/70">
                        Expert Device Repair in <br />
                        <span className="text-cyan-400">{loc.name}</span>
                    </h1>

                    <p className="text-xl text-white/70 mb-8 leading-relaxed max-w-2xl mx-auto">
                        {loc.description} Don't waste time in traffic. KBI technicians come directly to your home or office in {loc.name}.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button asChild size="lg" className="h-14 px-8 text-lg rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold w-full sm:w-auto">
                            <a href={`/book?address=${encodeURIComponent(loc.name)}`}>
                                Book Technician in {loc.name}
                            </a>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-white/20 hover:bg-white/10 w-full sm:w-auto">
                            <a href="/services">
                                View All Services
                            </a>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Why Choose Us in Location */}
            <section className="container mx-auto px-6 mb-16">
                <div className="grid md:grid-cols-3 gap-6">
                    <GlassCard className="p-6">
                        <Clock className="w-10 h-10 text-cyan-400 mb-4" />
                        <h3 className="text-xl font-bold mb-2">Fast Arrival</h3>
                        <p className="text-white/60">
                            Our technicians are patrolling {loc.name} daily. We can often arrive within 45-60 minutes of your booking.
                        </p>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <ShieldCheck className="w-10 h-10 text-cyan-400 mb-4" />
                        <h3 className="text-xl font-bold mb-2">On-Site Privacy</h3>
                        <p className="text-white/60">
                            Your device never leaves your sight. We repair it right in front of you at your {loc.name} location.
                        </p>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <Star className="w-10 h-10 text-cyan-400 mb-4" />
                        <h3 className="text-xl font-bold mb-2">Certified Experts</h3>
                        <p className="text-white/60">
                            Highly trained technicians capable of fixing screens, batteries, motherboard issues, and more.
                        </p>
                    </GlassCard>
                </div>
            </section>

            {/* Structured SEO Data for Area */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Service",
                        "name": `Mobile Repair in ${loc.name}`,
                        "provider": {
                            "@type": "LocalBusiness",
                            "name": "KBI Repairs",
                            "image": "https://kbi.services/pwa-icon.png"
                        },
                        "areaServed": {
                            "@type": "Place",
                            "name": loc.name
                        },
                        "description": `Professional mobile and computer repair services available in ${loc.name}.`
                    })
                }}
            />
        </main>
    )
}
