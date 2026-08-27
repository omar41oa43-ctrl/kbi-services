import type React from "react"
import { ContactProvider } from "@/components/contact-provider"
import { getSiteContact } from "@/lib/site-contact"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { JsonLd } from "@/components/json-ld"
import { SiteRuntime } from "@/components/site-runtime"

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const contact = await getSiteContact()

  return (
    <ContactProvider contact={contact}>
      <div className="site-shell">
        <a className="skip-link" href="#main-content">Skip to content</a>
        <JsonLd contact={contact} />
        <Navbar contact={contact} />
        <main id="main-content" className="min-h-[calc(100vh-theme(spacing.16))]" tabIndex={-1}>
          {children}
        </main>
        <Footer contact={contact} />
        <SiteRuntime />
      </div>
    </ContactProvider>
  )
}
