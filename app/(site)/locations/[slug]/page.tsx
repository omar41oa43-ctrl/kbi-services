import { locations, UAE_EMIRATES } from "@/lib/locations"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
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
    const emirate = UAE_EMIRATES.find((item) => item.id === loc.id || item.areas.some((area) => area.id === loc.id))?.nameEn || loc.name

    return {
        title: `Mobile & Phone Repair in ${loc.name}`,
        description: `On-site mobile, laptop, and electronics service in ${loc.name}, ${emirate}. Request a home or office appointment and approve the quote before paid repair.`,
        alternates: {
            canonical: `/locations/${loc.slug}`,
        },
    }
}

export default async function LocationPage({ params }: Props) {
    const { slug } = await params
    const loc = locations.find((l) => l.slug === slug)

    if (!loc) {
        notFound()
    }
    const emirate = UAE_EMIRATES.find((item) => item.id === loc.id || item.areas.some((area) => area.id === loc.id))?.nameEn || loc.name
    const schema = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Service",
        "name": `On-site device service in ${loc.name}`,
        "provider": { "@type": "LocalBusiness", "name": "KBI Services", "url": "https://kbi.services" },
        "areaServed": { "@type": "Place", "name": `${loc.name}, ${emirate}, UAE` },
        "description": `On-site device diagnosis and repair appointments in ${loc.name}.`,
    }).replace(/</g, "\\u003c")

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
                        {loc.description} Request a home or office visit in {loc.name}; we confirm the appointment window after checking coverage and availability.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button asChild size="lg" className="h-14 px-8 text-lg rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold w-full sm:w-auto">
                            <Link href={`/book?address=${encodeURIComponent(loc.name)}`}>
                                Book Technician in {loc.name}
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-white/20 hover:bg-white/10 w-full sm:w-auto">
                            <Link href="/services">
                                View All Services
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Why Choose Us in Location */}
            <section className="container mx-auto px-6 mb-16">
                <h2 className="mb-8 text-center text-3xl font-bold">What to expect from your visit</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <GlassCard className="p-6">
                        <Clock className="w-10 h-10 text-cyan-400 mb-4" />
                        <h3 className="text-xl font-bold mb-2">Confirmed Arrival Window</h3>
                        <p className="text-white/70">
                            We confirm the available appointment window for {loc.name} after reviewing your request and location.
                        </p>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <ShieldCheck className="w-10 h-10 text-cyan-400 mb-4" />
                        <h3 className="text-xl font-bold mb-2">On-Site Privacy</h3>
                        <p className="text-white/70">
                            When the service can be completed on site, the device remains at your {loc.name} location during the work.
                        </p>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <Star className="w-10 h-10 text-cyan-400 mb-4" />
                        <h3 className="text-xl font-bold mb-2">Experienced Technicians</h3>
                        <p className="text-white/70">
                            We diagnose the reported issue first, explain the available service path, and request approval before paid work.
                        </p>
                    </GlassCard>
                </div>
            </section>

            {/* Structured SEO Data for Area */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: schema
                }}
            />
        </main>
    )
}
