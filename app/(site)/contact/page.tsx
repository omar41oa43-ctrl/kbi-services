import { ContactContent } from "@/components/contact-content"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact KBI to request on-site mobile, laptop, electronics, and IT support in Abu Dhabi, Dubai, Sharjah, or Ajman.",
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
