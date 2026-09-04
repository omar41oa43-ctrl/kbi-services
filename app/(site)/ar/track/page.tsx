import type { Metadata } from "next"
import { LanguageProvider } from "@/components/language-provider"
import { OrderTracker } from "@/components/order-tracker"

export const metadata: Metadata = {
  title: { absolute: "تتبع طلب الصيانة | KBI Services" },
  description: "تابع حالة طلب الصيانة أو موعد الفني لدى KBI Services بأمان باستخدام بيانات الطلب.",
  alternates: {
    canonical: "/ar/track",
    languages: { en: "/track", ar: "/ar/track", "x-default": "/track" },
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "تتبع طلب الصيانة | KBI Services",
    description: "تابع آخر تحديثات طلب الصيانة أو موعد الفني لدى KBI Services.",
    url: "https://kbi.services/ar/track",
    locale: "ar_AE",
    alternateLocale: ["en_AE"],
    type: "website",
  },
}

export default function ArabicTrackPage() {
  return (
    <LanguageProvider initialLang="ar">
      <main className="min-h-screen bg-background pb-16 text-foreground selection:bg-cyan-500/30 lg:pb-0">
        <OrderTracker />
      </main>
    </LanguageProvider>
  )
}
