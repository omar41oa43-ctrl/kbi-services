import type { Metadata } from "next"
import { AboutContent } from "@/components/about-content"
import { LanguageProvider } from "@/components/language-provider"
import { getSiteContact } from "@/lib/site-contact"

export const metadata: Metadata = {
  title: { absolute: "من نحن | KBI Services لصيانة الأجهزة في الإمارات" },
  description: "تعرّف على KBI Services وخدمات صيانة الأجهزة والدعم التقني الميداني للمنازل والشركات في جميع إمارات الدولة.",
  alternates: {
    canonical: "/ar/about",
    languages: { en: "/about", ar: "/ar/about", "x-default": "/about" },
  },
  openGraph: {
    title: "من نحن | KBI Services",
    description: "صيانة أجهزة ودعم تقني ميداني للمنازل والشركات في جميع أنحاء الإمارات.",
    url: "https://kbi.services/ar/about",
    locale: "ar_AE",
    alternateLocale: ["en_AE"],
    type: "website",
  },
}

export default async function ArabicAboutPage() {
  const contact = await getSiteContact()

  return (
    <LanguageProvider initialLang="ar">
      <main className="min-h-screen bg-background text-foreground selection:bg-cyan-500/30 pb-16 lg:pb-0">
        <AboutContent pdfUrl={contact.companyPresentationUrl || ""} />
      </main>
    </LanguageProvider>
  )
}
