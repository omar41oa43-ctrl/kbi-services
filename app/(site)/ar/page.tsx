import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, CheckCircle, MapPin, Wrench } from "lucide-react"
import { SERVICES_SEO_DATA } from "@/lib/services-seo-data"

export const metadata: Metadata = {
  title: { absolute: "صيانة الأجهزة والدعم التقني في جميع أنحاء الإمارات | KBI Services" },
  description: "خدمات صيانة ميدانية للهواتف واللابتوب والطابعات والتلفزيونات وكاميرات المراقبة ودعم تقنية المعلومات في جميع إمارات الدولة.",
  alternates: {
    canonical: "/ar",
    languages: { en: "/", ar: "/ar", "x-default": "/" },
  },
  openGraph: {
    title: "صيانة الأجهزة والدعم التقني في جميع أنحاء الإمارات | KBI Services",
    description: "خدمات صيانة ودعم تقني في المنازل والمكاتب عبر جميع إمارات الدولة.",
    url: "https://kbi.services/ar",
    locale: "ar_AE",
    alternateLocale: ["en_AE"],
    type: "website",
  },
}

const featuredSlugs = [
  "mobile-phone-repair",
  "laptop-repair",
  "printer-repair",
  "tv-repair",
  "gaming-console-repair",
  "cctv",
  "it-support",
]

export default function ArabicHomePage() {
  const featured = SERVICES_SEO_DATA.filter((service) => featuredSlugs.includes(service.slug))

  return (
    <main className="adaptive-theme-page min-h-screen bg-black pb-16 pt-28 text-white">
      <section className="container mx-auto mb-20 px-6 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-cyan-400">
          <MapPin className="h-4 w-4" />
          <span className="text-sm font-bold">نخدم جميع إمارات الدولة السبع</span>
        </div>
        <h1 className="mx-auto mb-6 max-w-5xl text-4xl font-black leading-tight md:text-6xl">
          صيانة الأجهزة والدعم التقني <span className="text-cyan-400">في موقعك</span>
        </h1>
        <p className="mx-auto mb-9 max-w-3xl text-lg leading-8 text-white/70 md:text-xl">
          اطلب فني KBI إلى منزلك أو مكتبك لصيانة الأجهزة أو تركيب الشبكات وكاميرات المراقبة. نفحص الطلب ونؤكد الموعد وعرض السعر قبل بدء أي عمل مدفوع.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link href="/book" className="rounded-full bg-cyan-500 px-8 py-4 text-lg font-bold text-black transition-colors hover:bg-cyan-400">احجز فنيًا</Link>
          <Link href="/ar/services" className="rounded-full border border-white/20 px-8 py-4 text-lg font-bold transition-colors hover:border-cyan-400 hover:text-cyan-400">عرض جميع الخدمات</Link>
        </div>
      </section>

      <section className="container mx-auto mb-20 px-6">
        <h2 className="mb-10 text-center text-3xl font-black md:text-4xl">الخدمات الرئيسية</h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((service) => (
            <Link key={service.slug} href={`/ar/services/${service.slug}`} className="group rounded-3xl border border-white/10 bg-white/5 p-7 transition-colors hover:border-cyan-500/40">
              <Wrench className="mb-5 h-8 w-8 text-cyan-400" />
              <h3 className="mb-3 text-xl font-bold">{service.arabic.name}</h3>
              <p className="mb-5 leading-7 text-white/65">{service.arabic.description}</p>
              <span className="inline-flex items-center gap-2 font-bold text-cyan-400">تفاصيل الخدمة <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-6">
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
          {["زيارة منزلية أو مكتبية حسب التغطية والتوفر", "تأكيد عرض السعر قبل بدء العمل المدفوع", "شروط ضمان مكتوبة للإصلاحات المؤهلة"].map((item) => (
            <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-5">
              <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-cyan-400" />
              <p className="leading-7 text-white/75">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
