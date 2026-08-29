import { ContactContent } from "@/components/contact-content"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact KBI Services | Device Repair Across the UAE",
  description: "Contact KBI Services for professional on-site device repair and IT support across Abu Dhabi, Dubai, Sharjah, Ajman, Ras Al Khaimah, Fujairah and Umm Al Quwain.",
  alternates: {
    canonical: "/contact",
  },
}

import { getSiteContact } from "@/lib/site-contact"

export default async function ContactPage() {
  const contact = await getSiteContact()

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-cyan-500/30 pb-16 lg:pb-0">
      <ContactContent contact={contact} />
    </main>
  )
}
