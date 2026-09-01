import { SlidingLogoMarquee } from "@/components/sliding-logo-marquee"
import { GlassCard } from "@/components/ui/glass-card"
import { CorporateBookingForm } from "@/components/corporate-booking-form"
import Link from "next/link"

import { PageEntrance, FadeIn, StaggerContainer, StaggerItem, HoverScale } from "@/components/ui/animations"
import type { Metadata } from "next"
import Image from "next/image"
import fs from "node:fs"
import path from "node:path"
import {
  Building2,
  Smartphone,
  Laptop,
  Printer,
  Monitor,
  Camera,
  Tv,
  Shield,
  Users,
  Rocket,
  Truck,
  CalendarClock,
  ClipboardList,
  FileText,
  Phone,
  MessageCircle,
  Mail,
  ArrowRight,
  Stethoscope,
  GraduationCap,
  Landmark,
  Coins,
  Briefcase,
} from "lucide-react"
import { CorporateContractsSection } from "@/components/corporate-contracts"
import { T } from "@/components/i18n-text"
import { getSiteContact } from "@/lib/site-contact"

export const metadata: Metadata = {
  title: "Corporate IT Support & Maintenance Across the UAE",
  description: "Professional corporate IT support, device maintenance, networking, CCTV and on-site technical services for businesses across the UAE.",
  alternates: {
    canonical: "/corporate",
    languages: { en: "/corporate", ar: "/ar/corporate", "x-default": "/corporate" },
  },
  openGraph: {
    title: "Corporate IT Support & Maintenance Across the UAE | KBI Services",
    description: "Professional corporate IT support, device maintenance, networking, CCTV and on-site technical services for businesses across the UAE.",
    url: "https://kbi.services/corporate",
    type: "website",
  },
}

export const dynamic = "force-static"

export default async function CorporatePage() {
  const hasHandshake = fs.existsSync(path.join(process.cwd(), "public", "handshake-mobile.webp"))
  const contact = await getSiteContact()
  return (
    <PageEntrance className="min-h-screen bg-background text-foreground selection:bg-cyan-500/30 pb-16 lg:pb-0 font-sans text-start">

      <section className="relative pt-24 md:pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/10 rounded-full blur-[140px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] bg-cyan-600/10 rounded-full blur-[140px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-radial-gradient from-transparent to-background" />
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1">
              <FadeIn delay={0.1}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-8 backdrop-blur-sm shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:text-cyan-300"><T k="Enterprise-grade On-Site Repair" /></span>
                </div>
              </FadeIn>
              <FadeIn delay={0.2}>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
                  <span className="text-foreground"><T k="Corporate" /></span> <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 dark:from-cyan-400 dark:via-blue-500 dark:to-cyan-400 animate-gradient-x"><T k="Repair Solutions" /></span>
                </h1>
              </FadeIn>
              <FadeIn delay={0.3}>
                <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed">
                  <T k="Corporate hero description" />
                </p>
              </FadeIn>

              <StaggerContainer delay={0.4} className="grid grid-cols-2 gap-x-6 gap-y-8 mb-12">
                <StaggerItem className="flex items-start gap-4 group">
                  <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 ring-1 ring-cyan-500/20 group-hover:bg-cyan-500/20 transition-colors"><CalendarClock className="w-6 h-6" /></div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1"><T k="Priority SLA" /></h3>
                    <p className="text-sm text-muted-foreground"><T k="Response targets defined in your SLA" /></p>
                  </div>
                </StaggerItem>
                <StaggerItem className="flex items-start gap-4 group">
                  <div className="p-3 rounded-2xl bg-green-500/10 text-green-500 dark:text-green-400 ring-1 ring-green-500/20 group-hover:bg-green-500/20 transition-colors"><Shield className="w-6 h-6" /></div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1"><T k="Secure Handling" /></h3>
                    <p className="text-sm text-muted-foreground"><T k="Data privacy compliant" /></p>
                  </div>
                </StaggerItem>
                <StaggerItem className="flex items-start gap-4 group">
                  <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 dark:text-blue-400 ring-1 ring-blue-500/20 group-hover:bg-blue-500/20 transition-colors"><FileText className="w-6 h-6" /></div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1"><T k="Contract-Based" /></h3>
                    <p className="text-sm text-muted-foreground"><T k="Flexible monthly plans" /></p>
                  </div>
                </StaggerItem>
                <StaggerItem className="flex items-start gap-4 group">
                  <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500 dark:text-purple-400 ring-1 ring-purple-500/20 group-hover:bg-purple-500/20 transition-colors"><Truck className="w-6 h-6" /></div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1"><T k="24/7 Ops" /></h3>
                    <p className="text-sm text-muted-foreground"><T k="Critical infrastructure support" /></p>
                  </div>
                </StaggerItem>
              </StaggerContainer>


              <FadeIn delay={0.5} className="flex flex-wrap items-center gap-4">
                <HoverScale>
                  <a href="#corporate-form" className="px-8 py-4 rounded-full bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] flex items-center justify-center gap-2"><T k="Request Partnership" /> <ArrowRight className="w-4 h-4 rtl:rotate-180" /></a>
                </HoverScale>
                <HoverScale>
                  <a href={`https://wa.me/${contact.whatsappRaw}`} target="_blank" rel="noopener noreferrer" className="px-8 py-4 rounded-full bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_35px_rgba(34,197,94,0.6)] flex items-center justify-center gap-2"><MessageCircle className="w-5 h-5" /> <T k="WhatsApp" /></a>
                </HoverScale>
              </FadeIn>
            </div>

            <FadeIn delay={0.4} className="relative h-[500px] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl order-1 lg:order-2 group">
              {hasHandshake && (
                <Image
                  src="/handshake-mobile.webp"
                  alt="Corporate partnership handshake"
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 767px) 92vw, (max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center scale-105 group-hover:scale-100 transition-transform duration-1000"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="grid grid-cols-3 divide-x divide-white/10 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-4">
                  <div className="text-center px-2">
                    <div className="text-3xl font-bold text-cyan-400 mb-1">Priority</div>
                    <div className="text-xs text-white/60 uppercase tracking-wider">SLA targets</div>
                  </div>
                  <div className="text-center px-2">
                    <div className="text-3xl font-bold text-cyan-400 mb-1">Multi-site</div>
                    <div className="text-xs text-white/60 uppercase tracking-wider">Coverage</div>
                  </div>
                  <div className="text-center px-2">
                    <div className="text-3xl font-bold text-cyan-400 mb-1">Flexible</div>
                    <div className="text-xs text-white/60 uppercase tracking-wider">Service plans</div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Critical Industries */}
      <section className="py-24 relative overflow-hidden bg-slate-50/70 dark:bg-black/80 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-cyan-950/5 dark:via-cyan-950/20 to-background pointer-events-none" />
        <div className="absolute right-0 top-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-0 bottom-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <FadeIn>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                <span><T k="Built for" /></span>{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-500">
                  <T k="Critical Industries" />
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                <T k="Critical industries description" />
              </p>
            </FadeIn>
          </div>

          <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: Building2, label: "Enterprise", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
              { icon: Stethoscope, label: "Healthcare", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10" },
              { icon: GraduationCap, label: "Education", color: "text-amber-600 dark:text-yellow-400", bg: "bg-amber-500/10" },
              { icon: Truck, label: "Logistics", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10" },
              { icon: Briefcase, label: "Hospitality", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10" },
              { icon: Landmark, label: "Government", color: "text-emerald-600 dark:text-green-400", bg: "bg-emerald-500/10" },
              { icon: Coins, label: "Banking", color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-500/10" },
              { icon: Users, label: "Retail", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-500/10" },
            ].map((item, i) => (
              <StaggerItem key={i} className="h-full">
                <div className="group relative h-full p-6 rounded-2xl bg-card border border-border hover:border-cyan-500/50 hover:shadow-md transition-all duration-300 overflow-hidden">
                  <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${item.color}`}>
                    <item.icon className="w-24 h-24 -mr-4 -mt-4 rotate-12" />
                  </div>

                  <div className="relative z-10 flex flex-col h-full">
                    <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 ${item.color} ring-1 ring-border`}>
                      <item.icon className="w-6 h-6" />
                    </div>

                    <h3 className="text-lg font-bold text-foreground mb-1"><T k={item.label} /></h3>
                    <p className="text-sm text-muted-foreground"><T k="Select Service" /></p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Logos Marquee */}
      <section className="container mx-auto px-6 py-12">
        <FadeIn>
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">
            <span><T k="The entities we deal with" /></span>
          </h2>
        </FadeIn>
        <SlidingLogoMarquee
          items={[
            { id: "government", label: "Government", content: <span className="text-foreground font-semibold"><T k="Government" /></span> },
            { id: "hospitals", label: "Hospitals", content: <span className="text-foreground font-semibold"><T k="Hospitals" /></span> },
            { id: "universities", label: "Universities", content: <span className="text-foreground font-semibold"><T k="Universities" /></span> },
            { id: "banks", label: "Banks", content: <span className="text-foreground font-semibold"><T k="Banks" /></span> },
            { id: "schools", label: "Schools", content: <span className="text-foreground font-semibold"><T k="Schools" /></span> },
          ]}
          speed={40}
          pauseOnHover
          enableBlur={false}
          blurIntensity={1}
          height="110px"
          width="100%"
          gap="1rem"
          scale={1}
          direction="horizontal"
          autoPlay
          showGridBackground
          enableSpillEffect={false}
          animationSteps={3}
          showControls
        />
      </section>

      {/* Comprehensive Device Support */}
      <section className="py-24 relative bg-slate-100/60 dark:bg-black/60 transition-colors">
        <div className="absolute inset-0 bg-slate-200/20 dark:bg-white/5 skew-y-3 transform origin-top-left -z-10" />

        <div className="container mx-auto px-6">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-foreground">
              <span><T k="Comprehensive Device Support" /></span>
            </h2>
          </FadeIn>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Mobile Devices */}
            <StaggerItem>
              <GlassCard className="h-full group relative overflow-hidden bg-card border-border hover:border-cyan-500/50 transition-colors duration-500 shadow-xs">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 ring-1 ring-cyan-500/20">
                    <Smartphone className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors"><T k="Mobile Fleet" /></h3>
                  <p className="text-muted-foreground text-sm mb-4"><T k="iPhone – Samsung – Huawei – Tablets" /></p>

                  <div className="space-y-2">
                    {["Screen Replacement", "Battery Service", "Charging Port", "Data Migration"].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-foreground/80 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                        <T k={item} />
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </StaggerItem>

            {/* Laptops */}
            <StaggerItem>
              <GlassCard className="h-full group relative overflow-hidden bg-card border-border hover:border-blue-500/50 transition-colors duration-500 shadow-xs">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 ring-1 ring-blue-500/20">
                    <Laptop className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"><T k="Laptops & Workstations" /></h3>
                  <p className="text-muted-foreground text-sm mb-4"><T k="Dell – HP – Lenovo – MacBook" /></p>

                  <div className="space-y-2">
                    {["Hardware Repair", "SSD/RAM Upgrades", "OS Troubleshooting", "Performance Tuning"].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-foreground/80 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <T k={item} />
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </StaggerItem>

            {/* Printers */}
            <StaggerItem>
              <GlassCard className="h-full group relative overflow-hidden bg-card border-border hover:border-purple-500/50 transition-colors duration-500 shadow-xs">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 ring-1 ring-purple-500/20">
                    <Printer className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"><T k="Office Equipment" /></h3>
                  <p className="text-muted-foreground text-sm mb-4"><T k="Printers – Scanners – Plotters" /></p>

                  <div className="space-y-2">
                    {["Paper Jam Fix", "Toner/Cartridge", "Network Setup", "Annual Maintenance"].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-foreground/80 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        <T k={item} />
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </StaggerItem>

            {/* Monitors */}
            <StaggerItem>
              <GlassCard className="h-full group relative overflow-hidden bg-card border-border hover:border-green-500/50 transition-colors duration-500 shadow-xs">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 ring-1 ring-green-500/20">
                    <Monitor className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors"><T k="Displays & Signage" /></h3>
                  <p className="text-muted-foreground text-sm mb-4"><T k="Monitors – Video Walls – Kiosks" /></p>

                  <div className="space-y-2">
                    {["Panel Replacement", "Power Issues", "Color Calibration", "Mounting"].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-foreground/80 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <T k={item} />
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </StaggerItem>

            {/* CCTV */}
            <StaggerItem>
              <GlassCard className="h-full group relative overflow-hidden bg-card border-border hover:border-rose-500/50 transition-colors duration-500 shadow-xs">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 ring-1 ring-rose-500/20">
                    <Camera className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors"><T k="Security Systems" /></h3>
                  <p className="text-muted-foreground text-sm mb-4"><T k="CCTV – Access Control – Biometrics" /></p>

                  <div className="space-y-2">
                    {["Camera Installation", "DVR/NVR Config", "Cabling", "System Upgrades"].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-foreground/80 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <T k={item} />
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </StaggerItem>

            {/* TVs */}
            <StaggerItem>
              <GlassCard className="h-full group relative overflow-hidden bg-card border-border hover:border-amber-500/50 transition-colors duration-500 shadow-xs">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 ring-1 ring-amber-500/20">
                    <Tv className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors"><T k="Meeting Rooms" /></h3>
                  <p className="text-muted-foreground text-sm mb-4"><T k="Smart TVs – Projectors – Audio" /></p>

                  <div className="space-y-2">
                    {["Connectivity Issues", "Mounting Service", "Sound Systems", "Conference Setup"].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-foreground/80 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <T k={item} />
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Corporate Advantages */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <FadeIn>
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-foreground"><T k="Corporate Advantages" /></h2>
          </FadeIn>
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: ClipboardList, title: "Dedicated Account Manager", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", border: "hover:border-blue-500/50", gradient: "from-blue-500/10" },
              { icon: Rocket, title: "Priority Service", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10", border: "hover:border-purple-500/50", gradient: "from-purple-500/10" },
              { icon: Truck, title: "On-Site Repairs", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "hover:border-emerald-500/50", gradient: "from-emerald-500/10" },
              { icon: CalendarClock, title: "Maintenance Contracts", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10", border: "hover:border-orange-500/50", gradient: "from-orange-500/10" },
              { icon: FileText, title: "Asset Reporting", color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-500/10", border: "hover:border-cyan-500/50", gradient: "from-cyan-500/10" },
              { icon: Shield, title: "Data Security", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10", border: "hover:border-rose-500/50", gradient: "from-rose-500/10" },
            ].map((item, i) => (
              <StaggerItem key={i} className="h-full">
                <GlassCard className={`p-6 border border-border bg-card h-full group relative overflow-hidden transition-all duration-300 shadow-xs ${item.border}`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`p-3 rounded-2xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform duration-300 ring-1 ring-border`}>
                        <item.icon className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-lg leading-tight text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors"><T k={item.title} /></span>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed border-t border-border pt-4 mt-2"><T k={item.title + " Desc"} /></p>
                  </div>
                </GlassCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Corporate Booking Form Section */}
      <section id="corporate-form" className="py-24 relative overflow-hidden bg-slate-50/50 dark:bg-black/60">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-cyan-950/5 dark:via-cyan-950/15 to-background pointer-events-none" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute right-0 bottom-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto">
            <FadeIn>
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                  <span><T k="Schedule a" /></span>{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-500">
                    <T k="Corporate Technician" />
                  </span>
                </h2>
                <p className="text-muted-foreground"><T k="Corporate form description" /></p>
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <CorporateBookingForm />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Contracts Section */}
      <CorporateContractsSection />

      {/* Brand Logos */}
      <section className="container mx-auto px-6 py-12">
        <FadeIn>
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">
            <span><T k="Brands and platforms we support" /></span>
          </h2>
        </FadeIn>
        <SlidingLogoMarquee
          items={["Samsung", "Apple", "Dell", "HP", "LG", "Sony", "Xiaomi", "Lenovo"].map((brand) => ({
            id: brand.toLowerCase(),
            label: brand,
            content: <span className="text-foreground/80 font-bold">{brand}</span>,
          }))}
          speed={40}
          pauseOnHover
          enableBlur
          blurIntensity={1}
          height="110px"
          width="100%"
          gap="1rem"
          scale={1}
          direction="horizontal"
          autoPlay
          showGridBackground
          enableSpillEffect={false}
          animationSteps={8}
          showControls
        />
        <p className="mt-4 text-sm text-muted-foreground"><T k="Brand names identify devices we service and do not imply manufacturer authorization or endorsement." /></p>
      </section>

      {/* CTA & Contact Information Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <FadeIn>
            <div className="group relative rounded-[2.5rem] overflow-hidden border border-border bg-card shadow-xl">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

              <div className="grid lg:grid-cols-2 relative z-10 items-stretch">
                <div className="relative bg-muted/40 p-8 md:p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-border flex flex-col justify-center rounded-2xl overflow-hidden text-start items-start order-2 lg:order-1">
                  <h3 className="text-xl font-bold mb-8 flex items-center gap-3 text-foreground">
                    <span className="w-8 h-1 rounded-full bg-cyan-500 block" /> <T k="Contact Information" />
                  </h3>
                  <div className="flex items-center gap-2 mb-6">
                    <span className="px-3 py-1 rounded-full bg-card border border-border text-[11px] font-bold tracking-wide text-foreground"><T k="24/7" /></span>
                    <span className="px-3 py-1 rounded-full bg-card border border-border text-[11px] font-bold tracking-wide text-foreground"><T k="All UAE" /></span>
                  </div>
                  <div className="space-y-4 w-full">
                    <a href={`tel:${contact.phone}`} className="relative overflow-hidden flex items-start gap-4 p-4 rounded-2xl bg-card border border-border hover:border-cyan-500/50 hover:shadow-sm transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Phone className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1"><T k="Call Us (24/7)" /></div>
                        <div className="text-lg font-bold text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" dir="ltr">{contact.phoneDisplay}</div>
                      </div>
                    </a>

                    <a href={`https://wa.me/${contact.whatsappRaw}`} target="_blank" rel="noopener noreferrer" className="relative overflow-hidden flex items-start gap-4 p-4 rounded-2xl bg-card border border-border hover:border-green-500/50 hover:shadow-sm transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1"><T k="WhatsApp Support" /></div>
                        <div className="text-lg font-bold text-foreground group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors"><T k="Chat Instantly" /></div>
                      </div>
                    </a>

                    <a href={`mailto:${contact.email}`} className="relative overflow-hidden flex items-start gap-4 p-4 rounded-2xl bg-card border border-border hover:border-blue-500/50 hover:shadow-sm transition-all group">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1"><T k="Email Us" /></div>
                        <div className="text-lg font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{contact.email}</div>
                      </div>
                    </a>
                  </div>

                  <div className="mt-8 flex items-center gap-4 text-sm text-muted-foreground pt-6 border-t border-border w-full">
                    <div className="flex items-center gap-2 font-medium"><Truck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> <T k="All UAE" /></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                    <div className="flex items-center gap-2 font-medium"><CalendarClock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> <T k="24/7 Available" /></div>
                  </div>
                </div>

                <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center text-start items-start order-1 lg:order-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 w-fit mb-6">
                    <Shield className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                    <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider"><T k="Priority Support" /></span>
                  </div>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6 leading-tight tracking-tight text-foreground text-start">
                    <T k="Ready to Upgrade Your Corporate Maintenance?" />
                  </h2>
                  <p className="text-base md:text-lg text-muted-foreground mb-8 leading-relaxed text-start">
                    <T k="Corporate CTA description" />
                  </p>
                  <div className="flex flex-wrap gap-4 justify-start">
                    <HoverScale>
                      <a href={`tel:${contact.phone}`} className="px-8 py-4 rounded-full bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition-colors shadow-md flex items-center gap-2">
                        <Phone className="w-4 h-4" /> <T k="Call Now" />
                      </a>
                    </HoverScale>
                    <HoverScale>
                      <a href="#corporate-form" className="px-8 py-4 rounded-full bg-accent text-accent-foreground font-semibold border border-border hover:bg-accent/80 transition-colors flex items-center gap-2">
                        <T k="Get a Quote" /> <ArrowRight className="w-4 h-4" />
                      </a>
                    </HoverScale>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

    </PageEntrance>
  )
}
