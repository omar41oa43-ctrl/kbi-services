import { devices } from "@/lib/data"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { Wrench, Clock, CheckCircle, ShieldCheck, Cpu, ArrowRight } from "lucide-react"

interface Props {
    params: Promise<{ slug: string }>
}

export const revalidate = 86400 // Revalidate once a day (ISR)

export async function generateStaticParams() {
    return devices.map((device) => ({
        slug: device.id,
    }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const device = devices.find((d) => d.id === slug)
    if (!device) return {}

    const serviceName = device.name.includes("Repair") || device.name.includes("Support") || device.name.includes("Installation") ? device.name : `${device.name} Repair`
    const issueSummary = device.issues.slice(0, 3).join(", ")
    return {
        title: `${serviceName} Across the UAE | KBI Services`,
        description: `On-site ${serviceName.toLowerCase()} for ${issueSummary}. Available across all 7 Emirates in the UAE, with a quote confirmed before paid work.`,
        alternates: {
            canonical: `/services/${device.id}`,
        },
    }
}

export default async function ServicePage({ params }: Props) {
    const { slug } = await params
    const device = devices.find((d) => d.id === slug)

    if (!device) {
        notFound()
    }

    // Extract top issues for display
    const topIssues = device.issues.slice(0, 6)
    const serviceName = device.name.includes("Repair") || device.name.includes("Support") || device.name.includes("Installation") ? device.name : `${device.name} Repair`
    const schema = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Service",
        "name": `${serviceName} Service`,
        "provider": { "@type": "LocalBusiness", "name": "KBI Services", "url": "https://kbi.services" },
        "description": `On-site ${serviceName.toLowerCase()} for ${device.issues.slice(0, 3).join(", ")}. Available across all 7 Emirates in the UAE.`,
        "areaServed": ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"].map((name) => ({ "@type": "AdministrativeArea", name })),
    }).replace(/</g, "\\u003c")

    return (
        <main className="adaptive-theme-page min-h-screen bg-black text-white pt-24 pb-12">
            {/* Hero Section */}
            <section className="container mx-auto px-6 mb-16">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-6">
                        <Wrench className="w-4 h-4" />
                        <span className="font-semibold text-sm">On-Site Technical Service</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-white/70">
                        {serviceName} <br />
                        <span className="text-cyan-400">Across the UAE</span>
                    </h1>

                    <p className="text-xl text-white/70 mb-8 leading-relaxed max-w-2xl mx-auto">
                        Request on-site help for {device.brands.slice(0, 3).map(b => b.name).join(", ")} and other supported brands.
                        We diagnose the issue and confirm the quote and parts option before paid work begins.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button asChild size="lg" className="h-14 px-8 text-lg rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold w-full sm:w-auto">
                            <Link href={`/book?device=${device.id}`}>
                                Book {serviceName}
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Common Issues Section */}
            <section className="container mx-auto px-6 mb-16">
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-bold mb-4">Common {device.name} Service Requests</h2>
                    <p className="text-white/70">Final repairability, timing, and price are confirmed after diagnosis.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
                    {topIssues.map((issue, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors">
                            <CheckCircle className="w-5 h-5 text-cyan-400 shrink-0" />
                            <span className="font-medium text-white/90">{issue}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Process / Why Us */}
            <section className="container mx-auto px-6 mb-16">
                <div className="grid md:grid-cols-3 gap-6">
                    <GlassCard className="p-6">
                        <Clock className="w-10 h-10 text-cyan-400 mb-4" />
                        <h3 className="text-xl font-bold mb-2">Flexible Appointments</h3>
                        <p className="text-white/70">
                            Same-day slots may be available depending on location, technician capacity, and required parts.
                        </p>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <Cpu className="w-10 h-10 text-cyan-400 mb-4" />
                        <h3 className="text-xl font-bold mb-2">Clear Parts Options</h3>
                        <p className="text-white/70">
                            Where parts are needed, the available option and its price are described in your quote.
                        </p>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <ShieldCheck className="w-10 h-10 text-cyan-400 mb-4" />
                        <h3 className="text-xl font-bold mb-2">Written Warranty Terms</h3>
                        <p className="text-white/70">
                            Eligible repairs include written coverage and exclusions on the invoice or service record.
                        </p>
                    </GlassCard>
                </div>
            </section>

            {/* Brands We Service */}
            <section className="container mx-auto px-6 mb-16">
                <GlassCard className="p-8 text-center bg-gradient-to-br from-white/5 to-transparent">
                    <h3 className="text-lg font-semibold mb-6 text-white/80">Brands We Service</h3>
                    <div className="flex flex-wrap justify-center gap-4">
                        {device.brands.map(brand => (
                            <span key={brand.id} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm">
                                {brand.name}
                            </span>
                        ))}
                    </div>
                    <p className="mt-5 text-sm text-white/60">Brand names identify supported devices and do not imply manufacturer authorization or endorsement.</p>
                    <div className="mt-8">
                        <Button asChild variant="link" className="text-cyan-400">
                            <Link href={`/book?device=${device.id}`} className="flex items-center gap-2">
                                Start Your Repair <ArrowRight className="w-4 h-4" />
                            </Link>
                        </Button>
                    </div>
                </GlassCard>
            </section>

            {/* Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: schema
                }}
            />
        </main>
    )
}
