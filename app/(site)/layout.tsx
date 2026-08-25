import type React from "react"
import { cn } from "@/lib/utils"
import { ContactProvider } from "@/components/contact-provider"
import { getSiteContact } from "@/lib/site-contact"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { JsonLd } from "@/components/json-ld"
import { GoogleAnalytics } from "@/components/google-analytics"
import { CookieConsent } from "@/components/cookie-consent"
import { UpdateNotification } from "@/components/update-notification"
import { SafeAnalytics } from "@/components/safe-analytics"

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const contact = await getSiteContact()

  return (
    <ContactProvider contact={contact}>
      <JsonLd contact={contact} />
      <Navbar contact={contact} />
      <div className="flex-1 min-h-[calc(100vh-theme(spacing.16))]">
        {children}
      </div>
      <Footer contact={contact} />
      <SafeAnalytics />
      <GoogleAnalytics />
      <CookieConsent />
      <UpdateNotification />
    </ContactProvider>
  )
}
