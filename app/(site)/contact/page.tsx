import { ContactContent } from "@/components/contact-content"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact KBI for professional on-site device repair in Abu Dhabi. Call +971502491034 or book online for mobile, laptop, and IT support.",
  alternates: {
    canonical: "/contact",
  },
}

import { getSiteContact } from "@/lib/site-contact"

export default async function ContactPage() {
  const contact = await getSiteContact()

  return (
    <main className="min-h-screen bg-black text-white selection:bg-cyan-500/30 pb-16 lg:pb-0">
      <ContactContent contact={contact} />
    </main>
  )
}
