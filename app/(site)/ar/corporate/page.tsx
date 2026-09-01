import type { Metadata } from "next"
import Link from "next/link"
import { Building2, Camera, Laptop, Network, ShieldCheck, Wrench } from "lucide-react"
import { CorporateBookingForm } from "@/components/corporate-booking-form"
import { LanguageProvider } from "@/components/language-provider"
import { getSiteContact } from "@/lib/site-contact"

export const metadata: Metadata = {
  title: { absolute: "الدعم التقني وصيانة أجهزة الشركات في الإمارات | KBI Services" },
  description: "خدمات دعم تقنية المعلومات وصيانة أجهزة الشركات والشبكات وكاميرات المراقبة في موقع العمل بجميع أنحاء الإمارات.",
  alternates: {
    canonical: "/ar/corporate",
    languages: { en: "/corporate", ar: "/ar/corporate", "x-default": "/corporate" },
  },
  openGraph: {
    title: "الدعم التقني للشركات في الإمارات | KBI Services",
    description: "صيانة ميدانية ودعم تقني وشبكات وكاميرات مراقبة للشركات في الإمارات.",
    url: "https://kbi.services/ar/corporate",
    locale: "ar_AE",
    alternateLocale: ["en_AE"],
    type: "website",
  },
}

const services = [
  { icon: Laptop, title: "صيانة أجهزة الموظفين", text: "تشخيص وصيانة أجهزة الكمبيوتر واللابتوب والطابعات في موقع الشركة." },
  { icon: Network, title: "الشبكات والاتصال", text: "تركيب شبكات LAN وWi-Fi ومعالجة مشكلات التغطية والاستقرار." },
  { icon: Camera, title: "كاميرات المراقبة", text: "تركيب وصيانة أنظمة CCTV ومراجعة الاتصال والتسجيل." },
  { icon: ShieldCheck, title: "تعامل واضح وآمن", text: "توثيق الطلب وعرض السعر وخيارات التنفيذ قبل بدء العمل المدفوع." },
]

export default async function ArabicCorporatePage() {
  const contact = await getSiteContact()

  return (
    <main className="adaptive-theme-page min-h-screen bg-black pb-20 pt-28 text-white">
      <section className="container mx-auto mb-20 px-6">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-cyan-400">
            <Building2 className="h-4 w-4" />
            <span className="text-sm font-bold">حلول تقنية للشركات في الإمارات</span>
          </div>
          <h1 className="mb-6 text-4xl font-black leading-tight md:text-6xl">دعم تقني وصيانة ميدانية <span className="text-cyan-400">لشركتك</span></h1>
          <p className="mx-auto mb-9 max-w-3xl text-lg leading-8 text-white/70">ندعم الشركات والمكاتب بخدمات صيانة الأجهزة والشبكات وكاميرات المراقبة. نراجع احتياجك ونحدد نطاق الخدمة ووقت الاستجابة في العرض أو اتفاقية مستوى الخدمة.</p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <a href="#corporate-form" className="rounded-full bg-cyan-500 px-8 py-4 font-bold text-black hover:bg-cyan-400">اطلب عرضًا للشركة</a>
            <Link href={`https://wa.me/${contact.whatsappRaw}`} target="_blank" className="rounded-full border border-white/20 px-8 py-4 font-bold hover:border-cyan-400">تواصل عبر واتساب</Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto mb-20 px-6">
        <h2 className="mb-10 text-center text-3xl font-black">خدمات الشركات</h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <article key={service.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <service.icon className="mb-5 h-8 w-8 text-cyan-400" />
              <h3 className="mb-3 text-xl font-bold">{service.title}</h3>
              <p className="leading-7 text-white/65">{service.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="corporate-form" className="container mx-auto px-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <Wrench className="mx-auto mb-4 h-9 w-9 text-cyan-400" />
            <h2 className="mb-3 text-3xl font-black">اطلب عرض دعم للشركات</h2>
            <p className="text-white/65">أرسل تفاصيل المواقع والأجهزة والخدمة المطلوبة، وسيتواصل معك فريق KBI بالبيانات التي تقدمها.</p>
          </div>
          <LanguageProvider initialLang="ar">
            <CorporateBookingForm />
          </LanguageProvider>
        </div>
      </section>
    </main>
  )
}
