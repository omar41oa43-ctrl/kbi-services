import type { Metadata } from "next"
import { ContactContent } from "@/components/contact-content"
import { LanguageProvider } from "@/components/language-provider"
import { getSiteContact } from "@/lib/site-contact"

export const metadata: Metadata = {
  title: { absolute: "تواصل مع KBI Services | صيانة ودعم تقني في الإمارات" },
  description: "تواصل مع KBI Services لحجز صيانة أجهزة أو دعم تقني ميداني في أبوظبي ودبي والشارقة وعجمان ورأس الخيمة والفجيرة وأم القيوين.",
  alternates: {
    canonical: "/ar/contact",
    languages: { en: "/contact", ar: "/ar/contact", "x-default": "/contact" },
  },
  openGraph: {
    title: "تواصل مع KBI Services",
    description: "تواصل معنا لحجز صيانة ميدانية أو دعم تقني في جميع أنحاء الإمارات.",
    url: "https://kbi.services/ar/contact",
    locale: "ar_AE",
    alternateLocale: ["en_AE"],
    type: "website",
  },
}

export default async function ArabicContactPage() {
  const contact = await getSiteContact()

  return (
    <LanguageProvider initialLang="ar">
      <main className="min-h-screen bg-background text-foreground selection:bg-cyan-500/30 pb-16 lg:pb-0">
        <ContactContent contact={contact} />
      </main>
    </LanguageProvider>
  )
}
