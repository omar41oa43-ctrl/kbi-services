import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CheckCircle, Clock, MapPin, ShieldCheck, Wrench } from "lucide-react"
import { locations, UAE_EMIRATES } from "@/lib/locations"

interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return locations.map((location) => ({ slug: location.slug }))
}

export const dynamicParams = false

function getLocationContext(slug: string) {
  const location = locations.find((item) => item.slug === slug)
  if (!location) return null

  const parentEmirate = UAE_EMIRATES.find((emirate) =>
    emirate.id === location.id || emirate.areas.some((area) => area.id === location.id),
  )

  return {
    location,
    emirateAr: parentEmirate?.nameAr || location.nameAr,
    emirateEn: parentEmirate?.nameEn || location.name,
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const context = getLocationContext(slug)
  if (!context) return {}

  const { location, emirateAr } = context
  const title = `صيانة الأجهزة في ${location.nameAr} | KBI Services`
  const description = `صيانة ميدانية للهواتف واللابتوب والكمبيوتر والطابعات والتلفزيونات ودعم تقنية المعلومات في ${location.nameAr}، ${emirateAr}.`

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `/ar/locations/${location.slug}`,
      languages: {
        en: `/locations/${location.slug}`,
        ar: `/ar/locations/${location.slug}`,
        "x-default": `/locations/${location.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `https://kbi.services/ar/locations/${location.slug}`,
      locale: "ar_AE",
      alternateLocale: ["en_AE"],
      type: "website",
    },
  }
}

export default async function ArabicLocationPage({ params }: Props) {
  const { slug } = await params
  const context = getLocationContext(slug)
  if (!context) notFound()

  const { location, emirateAr, emirateEn } = context
  const canonicalUrl = `https://kbi.services/ar/locations/${location.slug}`
  const serviceNames = [
    "صيانة الهواتف وiPhone",
    "صيانة اللابتوب وMacBook",
    "صيانة الكمبيوتر والطابعات",
    "صيانة التلفزيونات والشاشات",
    "صيانة PlayStation وXbox",
    "تركيب الشبكات وكاميرات المراقبة",
  ]
  const nearbyLocations = locations.filter((item) => item.slug !== location.slug).slice(0, 6)

  const schema = JSON.stringify([
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${canonicalUrl}#service`,
      name: `صيانة الأجهزة في ${location.nameAr}`,
      description: `خدمات تشخيص وصيانة أجهزة ودعم تقني ميداني في ${location.nameAr}، ${emirateAr}.`,
      provider: { "@id": "https://kbi.services/#organization" },
      areaServed: {
        "@type": "AdministrativeArea",
        name: `${location.nameAr}، ${emirateAr}، الإمارات العربية المتحدة`,
      },
      availableLanguage: ["ar", "en"],
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "الرئيسية", item: "https://kbi.services/ar" },
        { "@type": "ListItem", position: 2, name: location.nameAr, item: canonicalUrl },
      ],
    },
  ]).replace(/</g, "\\u003c")

  return (
    <main className="adaptive-theme-page min-h-screen bg-black pb-16 pt-28 text-white">
      <section className="container mx-auto mb-16 px-6 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-cyan-400">
          <MapPin className="h-4 w-4" />
          <span className="text-sm font-bold">خدمة ميدانية في {location.nameAr}</span>
        </div>
        <h1 className="mx-auto mb-6 max-w-4xl text-4xl font-black leading-tight md:text-6xl">صيانة الأجهزة في <span className="text-cyan-400">{location.nameAr}</span></h1>
        <p className="mx-auto mb-9 max-w-3xl text-lg leading-8 text-white/70">اطلب فني KBI إلى منزلك أو مكتبك في {location.nameAr}، {emirateAr}. نراجع نوع الجهاز والعطل والعنوان ثم نؤكد التغطية وموعد الزيارة وعرض السعر قبل بدء العمل المدفوع.</p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link href={`/ar/book?address=${encodeURIComponent(`${location.nameAr}، ${emirateAr}`)}`} className="rounded-full bg-cyan-500 px-8 py-4 font-bold text-black hover:bg-cyan-400">احجز فنيًا في {location.nameAr}</Link>
          <Link href="/ar/services" className="rounded-full border border-white/20 px-8 py-4 font-bold hover:border-cyan-400">عرض الخدمات</Link>
        </div>
      </section>

      <section className="container mx-auto mb-16 px-6">
        <h2 className="mb-8 text-center text-3xl font-black">الخدمات المتاحة في {location.nameAr}</h2>
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2 lg:grid-cols-3">
          {serviceNames.map((service) => (
            <div key={service} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-5">
              <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-cyan-400" />
              <span className="font-semibold leading-7">{service}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto mb-16 px-6">
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
          <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <Clock className="mb-4 h-8 w-8 text-cyan-400" />
            <h2 className="mb-3 text-xl font-bold">موعد وصول مؤكد</h2>
            <p className="leading-7 text-white/65">نؤكد نافذة الموعد بعد مراجعة التغطية وتوفر الفني وقطع الغيار.</p>
          </article>
          <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <Wrench className="mb-4 h-8 w-8 text-cyan-400" />
            <h2 className="mb-3 text-xl font-bold">تشخيص قبل الإصلاح</h2>
            <p className="leading-7 text-white/65">نفحص المشكلة ونشرح خيارات الإصلاح والتكلفة قبل أي عمل مدفوع.</p>
          </article>
          <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <ShieldCheck className="mb-4 h-8 w-8 text-cyan-400" />
            <h2 className="mb-3 text-xl font-bold">شروط خدمة واضحة</h2>
            <p className="leading-7 text-white/65">نوثّق الرسوم النهائية وشروط الضمان المكتوبة للإصلاحات المؤهلة.</p>
          </article>
        </div>
      </section>

      {location.landmarks.length > 0 && (
        <section className="container mx-auto mb-16 px-6 text-center">
          <h2 className="mb-4 text-2xl font-black">مناطق ومعالم قريبة</h2>
          <p className="mx-auto max-w-3xl leading-8 text-white/65">تشمل طلبات التغطية في {location.nameAr} المناطق القريبة من {location.landmarks.join("، ")}. يتم تأكيد العنوان والتوفر عند الحجز.</p>
        </section>
      )}

      <section className="container mx-auto px-6">
        <h2 className="mb-7 text-center text-2xl font-black">مناطق خدمة أخرى</h2>
        <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-3">
          {nearbyLocations.map((item) => (
            <Link key={item.slug} href={`/ar/locations/${item.slug}`} className="rounded-full border border-white/15 px-5 py-2.5 text-white/70 hover:border-cyan-400 hover:text-cyan-400">{item.nameAr}</Link>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-white/45" dir="ltr">{location.name}, {emirateEn}, UAE</p>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema }} />
    </main>
  )
}
