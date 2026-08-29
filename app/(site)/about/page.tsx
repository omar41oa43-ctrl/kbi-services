import { AboutContent } from "@/components/about-content"
import type { Metadata } from "next"
import { getSiteContact } from "@/lib/site-contact"

export const metadata: Metadata = {
  title: "About KBI Services | On-Site Repair Across the UAE",
  description: "Learn about KBI Services, providing professional on-site device repair and IT solutions across all seven Emirates of the UAE.",
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
