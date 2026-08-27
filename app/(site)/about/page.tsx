import { AboutContent } from "@/components/about-content"
import type { Metadata } from "next"
import { getSiteContact } from "@/lib/site-contact"

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about KBI's on-site device repair and technical support for homes and businesses in Abu Dhabi, Dubai, Sharjah, and Ajman.",
  alternates: {
    canonical: "/about",
  },
}

export default async function AboutPage() {
  const contact = await getSiteContact()
  const pdfUrl = contact.companyPresentationUrl || ""
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-cyan-500/30 pb-16 lg:pb-0">
      <AboutContent pdfUrl={pdfUrl} />
    </main>
  )
}
