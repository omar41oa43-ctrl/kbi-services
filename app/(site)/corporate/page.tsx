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
  CheckCircle2,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  ArrowRight,
  Stethoscope,
  GraduationCap,
  Landmark,
  Coins,
  Briefcase,
} from "lucide-react"
import { CorporateContractsSection } from "@/components/corporate-contracts"
import { T } from "@/components/i18n-text"

export const metadata: Metadata = {
  title: "Corporate IT Support & Maintenance",
  description: "Enterprise-grade on-site repair and IT maintenance contracts for businesses in Abu Dhabi and UAE. Priority SLA, secure data handling, and dedicated support for corporate fleets.",
  alternates: {
    canonical: "/corporate",
  },
}

export const dynamic = "force-static"

export default function CorporatePage() {
  const hasHandshake = fs.existsSync(path.join(process.cwd(), "public", "handshake.jpg"))
  return (
    <PageEntrance className="min-h-screen bg-black text-white selection:bg-cyan-500/30 pb-16 lg:pb-0 font-sans text-start">

      <section className="relative pt-24 md:pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/10 rounded-full blur-[140px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] bg-cyan-600/10 rounded-full blur-[140px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-radial-gradient from-transparent to-black" />
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1">
              <FadeIn delay={0.1}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-8 backdrop-blur-sm shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-cyan-100"><T k="Enterprise-grade On-Site Repair" /></span>
                </div>
              </FadeIn>
              <FadeIn delay={0.2}>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
                  <span className="text-white"><T k="Corporate" /></span> <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 animate-gradient-x"><T k="Repair Solutions" /></span>
                </h1>
              </FadeIn>
              <FadeIn delay={0.3}>
                <p className="text-lg md:text-xl text-white/70 mb-10 max-w-xl leading-relaxed">
                  <T k="Corporate hero description" />
                </p>
              </FadeIn>

              <StaggerContainer delay={0.4} className="grid grid-cols-2 gap-x-6 gap-y-8 mb-12">
                <StaggerItem className="flex items-start gap-4 group">
                  <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20 group-hover:bg-cyan-500/20 transition-colors"><CalendarClock className="w-6 h-6" /></div>
                  <div>
                    <h3 className="font-semibold text-white mb-1"><T k="Priority SLA" /></h3>
                    <p className="text-sm text-white/50"><T k="Guaranteed response times" /></p>
                  </div>
                </StaggerItem>
                <StaggerItem className="flex items-start gap-4 group">
                  <div className="p-3 rounded-2xl bg-green-500/10 text-green-400 ring-1 ring-green-500/20 group-hover:bg-green-500/20 transition-colors"><Shield className="w-6 h-6" /></div>
                  <div>
                    <h3 className="font-semibold text-white mb-1"><T k="Secure Handling" /></h3>
                    <p className="text-sm text-white/50"><T k="Data privacy compliant" /></p>
                  </div>
                </StaggerItem>
                <StaggerItem className="flex items-start gap-4 group">
                  <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20 group-hover:bg-blue-500/20 transition-colors"><FileText className="w-6 h-6" /></div>
                  <div>
                    <h3 className="font-semibold text-white mb-1"><T k="Contract-Based" /></h3>
                    <p className="text-sm text-white/50"><T k="Flexible monthly plans" /></p>
                  </div>
                </StaggerItem>
                <StaggerItem className="flex items-start gap-4 group">
                  <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20 group-hover:bg-purple-500/20 transition-colors"><Truck className="w-6 h-6" /></div>
                  <div>
                    <h3 className="font-semibold text-white mb-1"><T k="24/7 Ops" /></h3>
                    <p className="text-sm text-white/50"><T k="Critical infrastructure support" /></p>
                  </div>
                </StaggerItem>
              </StaggerContainer>


              <FadeIn delay={0.5} className="flex flex-wrap gap-4">
                <HoverScale>
                  <a href="#corporate-form" className="px-8 py-4 rounded-full bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] block"><T k="Request Partnership" /></a>
                </HoverScale>
                <HoverScale>
                  <Link href="/book" className="px-8 py-4 rounded-full border border-white/20 text-white font-semibold hover:bg-white/10 transition-colors hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] block"><T k="Book Technician" /></Link>
                </HoverScale>
                <HoverScale>
                  <a href="https://wa.me/971507313446" target="_blank" rel="noopener noreferrer" className="px-8 py-4 rounded-full bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_35px_rgba(34,197,94,0.6)] flex items-center gap-2"><MessageCircle className="w-5 h-5" /> <T k="WhatsApp" /></a>
                </HoverScale>
              </FadeIn>
            </div>

            <FadeIn delay={0.4} className="relative h-[500px] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl order-1 lg:order-2 group">
              {hasHandshake && (
                <Image
                  src="/handshake.jpg"
                  alt="Corporate partnership handshake"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center scale-105 group-hover:scale-100 transition-transform duration-1000"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="grid grid-cols-3 divide-x divide-white/10 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-4">
                  <div className="text-center px-2">
                    <div className="text-3xl font-bold text-cyan-400 mb-1">2h</div>
                    <div className="text-xs text-white/60 uppercase tracking-wider"><T k="Response" /></div>
                  </div>
                  <div className="text-center px-2">
                    <div className="text-3xl font-bold text-cyan-400 mb-1">100+</div>
                    <div className="text-xs text-white/60 uppercase tracking-wider"><T k="Techs" /></div>
                  </div>
                  <div className="text-center px-2">
                    <div className="text-3xl font-bold text-cyan-400 mb-1">1k+</div>
                    <div className="text-xs text-white/60 uppercase tracking-wider"><T k="Devices/Mo" /></div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-blue-950/10 to-black pointer-events-none" />
        <div className="absolute right-0 top-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-0 bottom-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <FadeIn>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                <span className="text-white"><T k="Built for" /></span>{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  <T k="Critical Industries" />
                </span>
              </h2>
              <p className="text-lg text-white/60 max-w-2xl mx-auto">
                <T k="Critical industries description" />
              </p>
            </FadeIn>
          </div>

          <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: Building2, label: "Enterprise", color: "text-blue-400" },
              { icon: Stethoscope, label: "Healthcare", color: "text-red-400" },
              { icon: GraduationCap, label: "Education", color: "text-yellow-400" },
              { icon: Truck, label: "Logistics", color: "text-orange-400" },
              { icon: Briefcase, label: "Hospitality", color: "text-purple-400" },
              { icon: Landmark, label: "Government", color: "text-green-400" },
              { icon: Coins, label: "Banking", color: "text-emerald-400" },
              { icon: Users, label: "Retail", color: "text-cyan-400" },
            ].map((item, i) => (
              <StaggerItem key={i} className="h-full">
                <div className="group relative h-full p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 overflow-hidden">
                  <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${item.color}`}>
                    <item.icon className="w-24 h-24 -mr-4 -mt-4 rotate-12" />
                  </div>

                  <div className="relative z-10 flex flex-col h-full">
                    <div className={`w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 ${item.color}`}>
                      <item.icon className="w-6 h-6" />
                    </div>

                    <h3 className="text-lg font-bold text-white mb-1"><T k={item.label} /></h3>
                    <p className="text-sm text-white/50"><T k="Select Service" /></p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <section className="container mx-auto px-6 py-12">
        <FadeIn>
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            <span><T k="The entities we deal with" /></span>
          </h2>
        </FadeIn>
        <SlidingLogoMarquee
          items={[
            { id: "government", content: <div className="text-center"><div className="text-white/70"><T k="Government" /></div></div> },
            { id: "hospitals", content: <div className="text-center"><div className="text-white/70"><T k="Hospitals" /></div></div> },
            { id: "universities", content: <div className="text-center"><div className="text-white/70"><T k="Universities" /></div></div> },
            { id: "banks", content: <div className="text-center"><div className="text-white/70"><T k="Banks" /></div></div> },
            { id: "school", content: <div className="text-center"><div className="text-white/70"><T k="School" /></div></div> },
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
          showControls={true}
        />
      </section>












      <section className="py-24 relative">
        <div className="absolute inset-0 bg-white/5 skew-y-3 transform origin-top-left -z-10" />

        <div className="container mx-auto px-6">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold mb-12">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white"><T k="Comprehensive Device Support" /></span>
            </h2>
          </FadeIn>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Mobile Devices */}
            <StaggerItem>
              <GlassCard className="h-full group relative overflow-hidden border-white/10 hover:border-cyan-500/50 transition-colors duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                    <Smartphone className="w-6 h-6 text-cyan-400" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors"><T k="Mobile Fleet" /></h3>
                  <p className="text-white/60 text-sm mb-4"><T k="iPhone – Samsung – Huawei – Tablets" /></p>

                  <div className="space-y-2">
                    {["Screen Replacement", "Battery Service", "Charging Port", "Data Migration"].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-white/80">
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
              <GlassCard className="h-full group relative overflow-hidden border-white/10 hover:border-blue-500/50 transition-colors duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400/20 to-indigo-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                    <Laptop className="w-6 h-6 text-blue-400" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors"><T k="Laptops & Workstations" /></h3>
                  <p className="text-white/60 text-sm mb-4"><T k="Dell – HP – Lenovo – MacBook" /></p>

                  <div className="space-y-2">
                    {["Hardware Repair", "SSD/RAM Upgrades", "OS Troubleshooting", "Performance Tuning"].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-white/80">
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
              <GlassCard className="h-full group relative overflow-hidden border-white/10 hover:border-purple-500/50 transition-colors duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400/20 to-pink-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                    <Printer className="w-6 h-6 text-purple-400" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors"><T k="Office Equipment" /></h3>
                  <p className="text-white/60 text-sm mb-4"><T k="Printers – Scanners – Plotters" /></p>

                  <div className="space-y-2">
                    {["Paper Jam Fix", "Toner/Cartridge", "Network Setup", "Annual Maintenance"].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-white/80">
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
              <GlassCard className="h-full group relative overflow-hidden border-white/10 hover:border-green-500/50 transition-colors duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400/20 to-emerald-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(34,197,94,0.15)]">
                    <Monitor className="w-6 h-6 text-green-400" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors"><T k="Displays & Signage" /></h3>
                  <p className="text-white/60 text-sm mb-4"><T k="Monitors – Video Walls – Kiosks" /></p>

                  <div className="space-y-2">
                    {["Panel Replacement", "Power Issues", "Color Calibration", "Mounting"].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-white/80">
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
              <GlassCard className="h-full group relative overflow-hidden border-white/10 hover:border-red-500/50 transition-colors duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400/20 to-orange-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                    <Camera className="w-6 h-6 text-red-400" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-400 transition-colors"><T k="Security Systems" /></h3>
                  <p className="text-white/60 text-sm mb-4"><T k="CCTV – Access Control – Biometrics" /></p>

                  <div className="space-y-2">
                    {["Camera Installation", "DVR/NVR Config", "Cabling", "System Upgrades"].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <T k={item} />
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </StaggerItem>

            {/* TVs */}
            <StaggerItem>
              <GlassCard className="h-full group relative overflow-hidden border-white/10 hover:border-yellow-500/50 transition-colors duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400/20 to-orange-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(234,179,8,0.15)]">
                    <Tv className="w-6 h-6 text-yellow-400" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors"><T k="Meeting Rooms" /></h3>
                  <p className="text-white/60 text-sm mb-4"><T k="Smart TVs – Projectors – Audio" /></p>

                  <div className="space-y-2">
                    {["Connectivity Issues", "Mounting Service", "Sound Systems", "Conference Setup"].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
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



      <section className="py-16">
        <div className="container mx-auto px-6">
          <FadeIn>
            <h2 className="text-2xl md:text-3xl font-bold mb-8"><T k="Corporate Advantages" /></h2>
          </FadeIn>
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: ClipboardList, title: "Dedicated Account Manager", color: "text-blue-400", bg: "bg-blue-500/10", border: "group-hover:border-blue-500/50", gradient: "from-blue-500/5" },
              { icon: Rocket, title: "Priority Service", color: "text-purple-400", bg: "bg-purple-500/10", border: "group-hover:border-purple-500/50", gradient: "from-purple-500/5" },
              { icon: Truck, title: "On-Site Repairs", color: "text-green-400", bg: "bg-green-500/10", border: "group-hover:border-green-500/50", gradient: "from-green-500/5" },
              { icon: CalendarClock, title: "Maintenance Contracts", color: "text-orange-400", bg: "bg-orange-500/10", border: "group-hover:border-orange-500/50", gradient: "from-orange-500/5" },
              { icon: FileText, title: "Asset Reporting", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "group-hover:border-cyan-500/50", gradient: "from-cyan-500/5" },
              { icon: Shield, title: "Data Security", color: "text-red-400", bg: "bg-red-500/10", border: "group-hover:border-red-500/50", gradient: "from-red-500/5" },
            ].map((item, i) => (
              <StaggerItem key={i} className="h-full">
                <GlassCard className={`p-6 border border-white/10 h-full group relative overflow-hidden transition-colors duration-500 ${item.border}`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`p-3 rounded-xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform duration-300`}>
                        <item.icon className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-lg leading-tight group-hover:text-white transition-colors"><T k={item.title} /></span>
                    </div>
                    {/* Removed fixed Arabic description to follow 100% bilingual rule */}
                    <p className="text-white/60 text-sm leading-relaxed border-t border-white/5 pt-4 mt-2"><T k={item.title + " Desc"} /></p>
                  </div>
                </GlassCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <section id="corporate-form" className="py-24 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-cyan-950/10 to-black pointer-events-none" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute right-0 bottom-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto">
            <FadeIn>
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  <span className="text-white"><T k="Schedule a" /></span>{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                    <T k="Corporate Technician" />
                  </span>
                </h2>
                <p className="text-white/60"><T k="Corporate form description" /></p>
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-3xl blur-lg opacity-50" />
                <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-1 md:p-2">
                  <CorporateBookingForm />
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <CorporateContractsSection />

      <section className="container mx-auto px-6 py-12">
        <FadeIn>
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            <span><T k="Trusted by" /></span>
          </h2>
        </FadeIn>
        <SlidingLogoMarquee
          items={[
            { id: "samsung", content: <span className="text-white/70">Samsung</span>, href: "https://www.samsung.com" },
            { id: "apple", content: <span className="text-white/70">Apple</span>, href: "https://www.apple.com" },
            { id: "dell", content: <span className="text-white/70">Dell</span>, href: "https://www.dell.com" },
            { id: "hp", content: <span className="text-white/70">HP</span>, href: "https://www.hp.com" },
            { id: "lg", content: <span className="text-white/70">LG</span>, href: "https://www.lg.com" },
            { id: "sony", content: <span className="text-white/70">Sony</span>, href: "https://www.sony.com" },
            { id: "xiaomi", content: <span className="text-white/70">Xiaomi</span>, href: "https://www.mi.com" },
            { id: "lenovo", content: <span className="text-white/70">Lenovo</span>, href: "https://www.lenovo.com" },
          ]}
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
          showControls={true}
        />
      </section>

      <section className="py-20">
        <div className="container mx-auto px-6">
          <FadeIn>
            <div className="group relative rounded-[3rem] overflow-hidden border border-white/10 bg-gradient-to-br from-white/5 to-black/50 backdrop-blur-xl shadow-2xl">
              <div className="absolute inset-0 opacity-20 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:30px_30px]" />
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent animate-pulse" />

              <div className="grid lg:grid-cols-2 relative z-10 items-stretch">
                <div className="relative bg-black/20 p-8 md:p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col justify-center rounded-2xl overflow-hidden text-start items-start order-2 lg:order-1">
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5" />
                    <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="absolute right-0 top-6 bottom-6 w-px bg-gradient-to-b from-cyan-500/20 via-transparent to-blue-500/20" />
                  </div>
                  <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                    <span className="w-8 h-1 rounded-full bg-cyan-500 block" /> <T k="Contact Information" />
                  </h3>
                  <div className="flex items-center gap-2 mb-6">
                    <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] tracking-wide text-white/70"><T k="24/7" /></span>
                    <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] tracking-wide text-white/70"><T k="All UAE" /></span>
                  </div>
                  <div className="space-y-6 w-full">
                    <a href="tel:+971502491034" className="relative overflow-hidden flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group hover:ring-1 hover:ring-cyan-500/30">
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Phone className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div>
                        <div className="text-sm text-white/50 mb-1"><T k="Call Us (24/7)" /></div>
                        <div className="text-lg font-semibold group-hover:text-cyan-400 transition-colors" dir="ltr">+971 50 249 1034</div>
                      </div>
                    </a>

                    <a href="https://wa.me/971502491034" target="_blank" rel="noopener noreferrer" className="relative overflow-hidden flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group hover:ring-1 hover:ring-green-500/30">
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <MessageCircle className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <div className="text-sm text-white/50 mb-1"><T k="WhatsApp Support" /></div>
                        <div className="text-lg font-semibold group-hover:text-green-400 transition-colors"><T k="Chat Instantly" /></div>
                      </div>
                    </a>

                    <a href="mailto:omar.41@hotmail.com" className="relative overflow-hidden flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group hover:ring-1 hover:ring-blue-500/30">
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Mail className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-sm text-white/50 mb-1"><T k="Email Us" /></div>
                        <div className="text-lg font-semibold group-hover:text-blue-400 transition-colors">omar.41@hotmail.com</div>
                      </div>
                    </a>
                  </div>

                  <div className="mt-8 flex items-center gap-4 text-sm text-white/50 pt-8 border-t border-white/10 w-full">
                    <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-cyan-400" /> <T k="All UAE" /></div>
                    <div className="w-1 h-1 rounded-full bg-white/20" />
                    <div className="flex items-center gap-2"><CalendarClock className="w-4 h-4 text-cyan-400" /> <T k="24/7 Available" /></div>
                  </div>
                </div>

                <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center text-start items-start order-1 lg:order-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 w-fit mb-6">
                    <Shield className="w-3 h-3 text-cyan-400" />
                    <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider"><T k="Priority Support" /></span>
                  </div>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight tracking-tight text-start">
                    <T k="Ready to Upgrade Your Corporate Maintenance?" />
                  </h2>
                  <p className="text-lg text-white/70 mb-8 leading-relaxed text-start">
                    <T k="Corporate CTA description" />
                  </p>
                  <div className="flex flex-wrap gap-4 justify-start">
                    <HoverScale>
                      <a href="tel:+971502491034" className="px-8 py-4 rounded-full bg-white text-black font-bold hover:bg-gray-200 transition-colors shadow-lg flex items-center gap-2 ring-1 ring-white/10">
                        <Phone className="w-4 h-4" /> <T k="Call Now" />
                      </a>
                    </HoverScale>
                    <HoverScale>
                      <a href="#corporate-form" className="px-8 py-4 rounded-full bg-white/10 text-white font-semibold border border-white/20 hover:bg-white/20 transition-colors backdrop-blur-sm flex items-center gap-2 ring-1 ring-white/10">
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
