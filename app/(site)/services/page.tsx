import type React from "react"

import { ServicesHero } from "@/components/services-hero"
import { ServiceCategory } from "@/components/service-category"
import { CTASection } from "@/components/cta-section"
import { devices } from "@/lib/data"
import { Smartphone, Laptop, Printer, Monitor, Tv, Watch, Gamepad2, Camera, MonitorUp } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Repair Services",
  description: "Explore on-site mobile, laptop, computer, printer, TV, CCTV, networking, and installation services in Abu Dhabi, Dubai, Sharjah, and Ajman.",
  alternates: {
    canonical: "/services",
  },
}

const iconMap: Record<string, React.ReactNode> = {
  Smartphone: <Smartphone className="w-8 h-8" />,
  Laptop: <Laptop className="w-8 h-8" />,
  Printer: <Printer className="w-8 h-8" />,
  Monitor: <Monitor className="w-8 h-8" />,
  Tv: <Tv className="w-8 h-8" />,
  Watch: <Watch className="w-8 h-8" />,
  Gamepad2: <Gamepad2 className="w-8 h-8" />,
  Camera: <Camera className="w-8 h-8" />,
  MonitorUp: <MonitorUp className="w-8 h-8" />,
}

const colorMap: Record<string, string> = {
  mobile: "cyan",
  laptop: "blue",
  pc: "cyan",
  printer: "teal",
  monitor: "indigo",
  tv: "purple",
  "apple-watch": "pink",
  gaming: "red",
  cctv: "orange",
  "tv-install": "green",
}

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-cyan-500/30 pb-16 lg:pb-0">
      <ServicesHero />

      <div className="container mx-auto px-6 py-12">
        {devices.map((device) => (
          <ServiceCategory
            key={device.id}
            id={device.id}
            name={device.name}
            icon={iconMap[device.icon]}
            brands={device.brands}
            issues={device.issues}
            accentColor={colorMap[device.id] || "cyan"}
          />
        ))}
      </div>

      <CTASection />
    </main>
  )
}
