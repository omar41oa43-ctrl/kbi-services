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

const serviceMetaMap: Record<string, { title: string; description: string }> = {
    mobile: {
        title: "Mobile Phone Repair Across the UAE",
        description: "Professional on-site mobile phone repair across the UAE for iPhone, Samsung, Google, Xiaomi and other devices. Book a KBI technician to your home or office.",
    },
    laptop: {
        title: "Laptop Repair Across the UAE",
        description: "Professional on-site laptop repair across the UAE for MacBook, Dell, HP, Lenovo, ASUS and more. Screen, battery, keyboard and motherboard repairs at your location.",
    },
    pc: {
        title: "Computer & PC Repair Across the UAE",
        description: "Expert on-site desktop PC and computer repair across the UAE. Hardware diagnostics, OS troubleshooting, power supply and performance upgrades at your home or office.",
    },
    printer: {
        title: "Printer Repair & Maintenance Across the UAE",
        description: "On-site printer repair and maintenance across the UAE for HP, Canon, Epson, and Brother printers. Paper jams, connectivity, toner and hardware servicing.",
    },
    tv: {
        title: "TV Repair Across the UAE",
        description: "Professional on-site TV repair across the UAE for Samsung, LG, Sony, TCL and OLED/QLED screens. Screen, backlight, board and audio repairs at your doorstep.",
    },
    monitor: {
        title: "Monitor Repair Across the UAE",
        description: "On-site monitor repair and diagnostics across the UAE for gaming, curved, 4K and office monitors. Fast technician dispatch to your home or office.",
    },
    tablet: {
        title: "Tablet & iPad Repair Across the UAE",
        description: "Expert on-site tablet and iPad repair across the UAE. Screen replacement, battery fixes, charging ports and diagnostics at your location.",
    },
    "apple-watch": {
        title: "Apple Watch & Smartwatch Repair Across the UAE",
        description: "On-site smartwatch and Apple Watch repair across the UAE. Screen replacements, battery fixes, sensor diagnostics and repairs at your home or office.",
    },
    gaming: {
        title: "PlayStation & Xbox Console Repair Across the UAE",
        description: "Professional gaming console repair across the UAE for PlayStation 5, Xbox Series X, Nintendo Switch and controllers. HDMI port, overheating and power fixes.",
    },
    cctv: {
        title: "CCTV Installation & Maintenance Across the UAE",
        description: "Professional CCTV security camera installation, maintenance, wiring and mobile viewing setup for homes and businesses across all seven Emirates.",
    },
    networking: {
        title: "Network Installation & Support Across the UAE",
        description: "On-site Wi-Fi, mesh network, router configuration, office cabling and network troubleshooting across the UAE. Fast on-site technician dispatch.",
    },
    "tech-support": {
        title: "IT Support & Tech Assistance Across the UAE",
        description: "On-demand IT support and technical assistance for homes and offices across the UAE. Virus removal, software configuration, cloud backup and diagnostics.",
    },
    "tv-install": {
        title: "TV Wall Mounting & Installation Across the UAE",
        description: "Professional TV wall mounting and concealed cabling installation across the UAE for all screen sizes and bracket types. Safe, secure on-site installation.",
    },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const device = devices.find((d) => d.id === slug)
    if (!device) return {}

    const custom = serviceMetaMap[slug]
    const serviceName =
        device.id === "networking" ? "Network Installation & Support" :
        device.id === "tech-support" ? "IT Support" :
        device.id === "tv-install" ? "TV Installation" :
        device.id === "cctv" ? "CCTV Installation & Maintenance" :
        device.name.includes("Repair") || device.name.includes("Support") || device.name.includes("Installation") ? device.name : `${device.name} Repair`

    const title = custom?.title || `${serviceName} Across the UAE`
    const description = custom?.description || `On-site ${serviceName.toLowerCase()} across all 7 Emirates in the UAE with clear quotes confirmed before paid work.`

    return {
        title,
        description,
        alternates: {
            canonical: `/services/${device.id}`,
        },
        openGraph: {
            title: `${title} | KBI Services`,
            description,
            url: `https://kbi.services/services/${device.id}`,
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: `${title} | KBI Services`,
            description,
        },
    }
}

export default async function ServicePage({ params }: Props) {
    const { slug } = await params
    const device = devices.find((d) => d.id === slug)

    if (!device) {
        notFound()
    }

    const serviceName =
        device.id === "networking" ? "Network Installation & Support" :
        device.id === "tech-support" ? "IT Support" :
        device.id === "tv-install" ? "TV Installation" :
        device.id === "cctv" ? "CCTV Installation & Maintenance" :
        device.name.includes("Repair") || device.name.includes("Support") || device.name.includes("Installation") ? device.name : `${device.name} Repair`

    const topIssues = device.issues.slice(0, 6)
    const custom = serviceMetaMap[slug]
    const description = custom?.description || `Professional on-site ${serviceName.toLowerCase()} across all 7 Emirates of the UAE.`

    const serviceSchema = {
        "@context": "https://schema.org",
        "@type": "Service",
        "@id": `https://kbi.services/services/${device.id}#service`,
        "name": serviceName,
        "serviceType": serviceName,
        "provider": {
            "@id": "https://kbi.services/#organization",
        },
        "description": description,
        "areaServed": {
            "@type": "Country",
            "name": "United Arab Emirates",
        },
    }

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://kbi.services",
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Services",
                "item": "https://kbi.services/services",
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": serviceName,
                "item": `https://kbi.services/services/${device.id}`,
            },
        ],
    }

    const schemaJson = JSON.stringify([serviceSchema, breadcrumbSchema]).replace(/</g, "\\u003c")

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
                                {serviceName === "Network Installation & Support" ? "Book Network Service" : `Book ${serviceName}`}
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
                                Book a Technician <ArrowRight className="w-4 h-4" />
                            </Link>
                        </Button>
                    </div>
                </GlassCard>
            </section>

            {/* Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: schemaJson
                }}
            />
        </main>
    )
}
