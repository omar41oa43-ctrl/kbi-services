import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CheckCircle, ChevronLeft, MapPin, ShieldCheck, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { ARABIC_SERVICE_REQUESTS } from "@/lib/services-seo-ar"
import { getAllServiceSlugs, getServiceBySlug } from "@/lib/services-seo-data"

interface Props {
  params: Promise<{ slug: string }>
}

const SITE_URL = "https://kbi.services"
const UAE_LOCATIONS = [
  ["أبوظبي", "abu-dhabi"],
  ["دبي", "dubai"],
  ["الشارقة", "sharjah"],
  ["عجمان", "ajman"],
  ["رأس الخيمة", "ras-al-khaimah"],
  ["الفجيرة", "fujairah"],
  ["أم القيوين", "umm-al-quwain"],
] as const

export const revalidate = 86400

export function generateStaticParams() {
  return getAllServiceSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const service = getServiceBySlug(slug)
  if (!service) return {}

  const arabicPath = `/ar/services/${service.slug}`
  const englishPath = `/services/${service.slug}`
  const title = `${service.arabic.name} في جميع أنحاء الإمارات`

  return {
    title,
    description: service.arabic.description,
    alternates: {
      canonical: arabicPath,
      languages: { en: englishPath, ar: arabicPath, "x-default": englishPath },
    },
    openGraph: {
      title: `${title} | KBI Services`,
      description: service.arabic.description,
      url: `${SITE_URL}${arabicPath}`,
      locale: "ar_AE",
      alternateLocale: ["en_AE"],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | KBI Services`,
      description: service.arabic.description,
    },
  }
}

export default async function ArabicServicePage({ params }: Props) {
  const { slug } = await params
  const service = getServiceBySlug(slug)
  if (!service) notFound()

  const requests = ARABIC_SERVICE_REQUESTS[service.slug] ?? []
  const canonicalUrl = `${SITE_URL}/ar/services/${service.slug}`
  const faqItems = [
    {
      question: `هل تقدم KBI خدمة ${service.arabic.name} في منطقتي؟`,
      answer: "نستقبل طلبات الزيارة المنزلية والمكتبية في جميع إمارات الدولة السبع. يتم تأكيد الموعد بعد مراجعة الموقع وتوفر الفني والقطع المطلوبة.",
    },
    {
      question: "هل يتم تأكيد السعر قبل بدء العمل؟",
      answer: "نعم. يبدأ الفني بتشخيص المشكلة وشرح الخيارات المتاحة، ثم يتم تأكيد عرض السعر قبل تنفيذ أي عمل مدفوع.",
    },
    {
      question: "هل يمكن إكمال الخدمة خلال زيارة واحدة؟",
      answer: "يمكن إكمال كثير من الطلبات الشائعة في الموقع، لكن المدة تعتمد على نتيجة الفحص وحالة الجهاز وتوفر القطع. يتم توضيح مسار الخدمة بعد التشخيص.",
    },
    {
      question: "هل يوجد ضمان على الخدمة؟",
      answer: "قد تشمل الإصلاحات المؤهلة شروط ضمان مكتوبة. يتم تسجيل مدة التغطية والاستثناءات المطبقة في عرض السعر أو الفاتورة أو سجل الخدمة.",
    },
  ]

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${canonicalUrl}#service`,
      name: service.arabic.name,
      serviceType: service.arabic.name,
      url: canonicalUrl,
      description: service.arabic.description,
      inLanguage: "ar-AE",
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: { "@type": "Country", name: "الإمارات العربية المتحدة" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "الرئيسية", item: `${SITE_URL}/ar` },
        { "@type": "ListItem", position: 2, name: "الخدمات", item: `${SITE_URL}/ar/services` },
        { "@type": "ListItem", position: 3, name: service.arabic.name, item: canonicalUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: "ar-AE",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ]

  return (
    <main className="adaptive-theme-page min-h-screen bg-black pb-16 pt-24 text-white">
      <nav aria-label="مسار الصفحة" className="container mx-auto mb-8 px-6">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-white/60">
          <li><Link href="/ar" className="hover:text-cyan-400">الرئيسية</Link></li>
          <li aria-hidden="true"><ChevronLeft className="h-4 w-4" /></li>
          <li><Link href="/ar/services" className="hover:text-cyan-400">الخدمات</Link></li>
          <li aria-hidden="true"><ChevronLeft className="h-4 w-4" /></li>
          <li aria-current="page" className="text-white/90">{service.arabic.name}</li>
        </ol>
      </nav>

      <section className="container mx-auto mb-16 px-6 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-cyan-400">
          <Wrench className="h-4 w-4" /><span className="text-sm font-bold">خدمة تقنية في موقع العميل</span>
        </div>
        <h1 className="mx-auto mb-6 max-w-5xl text-4xl font-black leading-tight md:text-6xl">{service.arabic.h1}</h1>
        <p className="mx-auto mb-9 max-w-3xl text-lg leading-8 text-white/70 md:text-xl">{service.arabic.description} نفحص الطلب ونوضح الخيارات المتاحة ونؤكد عرض السعر قبل بدء العمل المدفوع.</p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="h-14 rounded-full bg-cyan-500 px-8 text-lg font-bold text-black hover:bg-cyan-400"><Link href={`/book?device=${service.bookingParam}`}>احجز {service.arabic.name}</Link></Button>
          <Button asChild variant="outline" size="lg" className="h-14 rounded-full border-white/20 px-8 text-lg hover:bg-white/10"><Link href={`/services/${service.slug}`}>English</Link></Button>
        </div>
      </section>

      <section className="container mx-auto mb-16 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-center text-3xl font-black">الخدمات والأعطال الشائعة</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {requests.map((request) => (
              <div key={request} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-5">
                <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-cyan-400" /><p className="leading-7 text-white/80">{request}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto mb-16 px-6">
        <GlassCard className="mx-auto max-w-6xl p-8">
          <h2 className="mb-3 text-3xl font-black">العلامات والأجهزة التي يمكن فحصها</h2>
          <p className="mb-8 text-sm leading-7 text-white/60">تُذكر أسماء العلامات لتوضيح الأجهزة التي يمكننا تقييمها، ولا تعني وجود اعتماد أو تفويض من الشركات المصنّعة.</p>
          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {service.supportedBrands.map((brand) => (
              <div key={brand.name}>
                <h3 className="mb-3 font-bold text-cyan-400">{brand.name}</h3>
                <ul className="space-y-2 text-sm text-white/70">
                  {brand.models?.map((model) => <li key={model}>{model}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      <section className="container mx-auto mb-16 px-6 text-center">
        <h2 className="mb-3 text-3xl font-black">التغطية في جميع أنحاء الإمارات</h2>
        <p className="mx-auto mb-7 max-w-3xl leading-8 text-white/70">يمكنك طلب الخدمة إلى المنزل أو المكتب، ويتم تأكيد الموعد بعد مراجعة المنطقة وتوفر الفني.</p>
        <div className="flex flex-wrap justify-center gap-3">
          {UAE_LOCATIONS.map(([name, locationSlug]) => (
            <Link key={locationSlug} href={`/locations/${locationSlug}`} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold hover:border-cyan-400 hover:text-cyan-400"><MapPin className="h-4 w-4" />{name}</Link>
          ))}
        </div>
      </section>

      <section className="container mx-auto mb-16 px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-3xl font-black">الأسئلة الشائعة</h2>
          <div className="space-y-4">
            {faqItems.map((item) => (
              <details key={item.question} className="rounded-2xl border border-white/10 bg-white/5 p-6 open:border-cyan-500/30">
                <summary className="cursor-pointer font-bold">{item.question}</summary>
                <p className="mt-4 leading-8 text-white/70">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6">
        <div className="mx-auto max-w-5xl rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-8 text-center">
          <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-cyan-400" />
          <h2 className="mb-4 text-2xl font-black">هل تحتاج إلى فحص جهازك؟</h2>
          <p className="mb-7 text-white/70">أرسل تفاصيل الجهاز والمشكلة والموقع، وسيتواصل الفريق لتأكيد الخطوة التالية.</p>
          <Link href={`/book?device=${service.bookingParam}`} className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-8 py-4 font-black text-black hover:bg-cyan-400">احجز الآن <ArrowLeft className="h-4 w-4" /></Link>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
    </main>
  )
}
