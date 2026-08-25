import { AboutContent } from "@/components/about-content"
import type { Metadata } from "next"
import { getSiteContact } from "@/lib/site-contact"

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn more about KBI Repairs Abu Dhabi. Our mission is to provide professional, convenient, and reliable on-site technical support and repair services for homes and businesses.",
  alternates: {
    canonical: "/about",
  },
}

export default async function AboutPage() {
  const contact = await getSiteContact()
  const pdfUrl = contact.companyPresentationUrl || ""
  return (
    <main className="min-h-screen bg-black text-white selection:bg-cyan-500/30 pb-16 lg:pb-0">
      <AboutContent pdfUrl={pdfUrl} />
    </main>
  )
}
