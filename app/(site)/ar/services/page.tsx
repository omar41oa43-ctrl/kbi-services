import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Wrench } from "lucide-react"
import { SERVICES_SEO_DATA } from "@/lib/services-seo-data"

export const metadata: Metadata = {
  title: "خدمات صيانة الأجهزة والدعم التقني في الإمارات",
  description: "تعرّف على خدمات KBI لصيانة الهواتف واللابتوب والطابعات والتلفزيونات وأجهزة الألعاب وتركيب CCTV والشبكات ودعم الشركات في الإمارات.",
  alternates: {
    canonical: "/ar/services",
    languages: { en: "/services", ar: "/ar/services", "x-default": "/services" },
  },
  openGraph: {
    title: "خدمات صيانة الأجهزة والدعم التقني في الإمارات | KBI Services",
    description: "صفحات عربية مستقلة لجميع خدمات الصيانة والدعم التقني التي تقدمها KBI في الإمارات.",
    url: "https://kbi.services/ar/services",
    locale: "ar_AE",
    type: "website",
  },
}

export default function ArabicServicesPage() {
  return (
    <main className="adaptive-theme-page min-h-screen bg-black pb-16 pt-28 text-white">
      <section className="container mx-auto px-6">
        <div className="mx-auto mb-14 max-w-4xl text-center">
          <h1 className="mb-5 text-4xl font-black md:text-6xl">خدمات KBI في جميع أنحاء الإمارات</h1>
          <p className="text-lg leading-8 text-white/70">اختر الخدمة المناسبة للاطلاع على الأعطال الشائعة والعلامات المدعومة وطريقة طلب فني إلى منزلك أو مكتبك.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES_SEO_DATA.map((service) => (
            <Link key={service.slug} href={`/ar/services/${service.slug}`} className="group rounded-3xl border border-white/10 bg-white/5 p-7 transition-colors hover:border-cyan-500/40">
              <Wrench className="mb-5 h-8 w-8 text-cyan-400" />
              <h2 className="mb-3 text-xl font-bold">{service.arabic.name}</h2>
              <p className="mb-5 leading-7 text-white/65">{service.arabic.description}</p>
              <span className="inline-flex items-center gap-2 font-bold text-cyan-400">عرض التفاصيل <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /></span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
