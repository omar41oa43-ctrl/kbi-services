import type { Metadata } from "next"
import { Suspense } from "react"
import { BookingForm } from "@/components/booking-form"
import { LanguageProvider } from "@/components/language-provider"

export const metadata: Metadata = {
  title: { absolute: "احجز فني صيانة في الإمارات | KBI Services" },
  description: "احجز فني KBI لصيانة الأجهزة أو الدعم التقني في منزلك أو مكتبك في جميع أنحاء الإمارات.",
  alternates: {
    canonical: "/ar/book",
    languages: { en: "/book", ar: "/ar/book", "x-default": "/book" },
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "احجز فني صيانة في الإمارات | KBI Services",
    description: "حجز صيانة أجهزة ودعم تقني ميداني للمنازل والمكاتب في الإمارات.",
    url: "https://kbi.services/ar/book",
    locale: "ar_AE",
    alternateLocale: ["en_AE"],
    type: "website",
  },
}

export default function ArabicBookPage() {
  return (
    <LanguageProvider initialLang="ar">
      <main className="min-h-screen bg-background text-foreground selection:bg-cyan-500/30 pb-16 lg:pb-0">
        <Suspense fallback={<div className="min-h-screen pt-32 text-center text-muted-foreground">جارٍ تحميل نموذج الحجز…</div>}>
          <BookingForm />
        </Suspense>
      </main>
    </LanguageProvider>
  )
}
