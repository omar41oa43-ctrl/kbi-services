import type { Metadata } from "next"
import Link from "next/link"
import {
  Cctv,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Printer,
  ShieldCheck,
  Smartphone,
  Star,
  Tv,
  Wrench,
} from "lucide-react"

export const revalidate = 3600

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function toStr(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const sp = (await props.searchParams) || {}
  const lang = toStr(sp.lang) === "ar" ? "ar" : "en"

  const title =
    lang === "ar"
      ? "أفضل خدمات الصيانة في أبوظبي | KBI GLOBAL TECHNOLOGIES"
      : "Best Repair Services in Abu Dhabi | KBI GLOBAL TECHNOLOGIES"

  const description =
    lang === "ar"
      ? "خدمة صيانة منزلية في أبوظبي والإمارات: تصليح موبايل، صيانة لابتوب، تصليح طابعات، وتركيب كاميرات مراقبة. فنيين محترفين وخدمة في نفس اليوم."
      : "On-site repair services in Abu Dhabi, UAE: mobile repair, laptop repair, printer repair, and CCTV installation. Same-day doorstep service by expert technicians."

  return {
    title,
    description,
    alternates: {
      canonical: "/terms",
      languages: {
        en: "/terms?lang=en",
        ar: "/terms?lang=ar",
      },
    },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: "website",
      locale: lang === "ar" ? "ar_AE" : "en_AE",
      url: "/terms",
    },
  }
}

export default async function TermsPage(props: PageProps) {
  const sp = (await props.searchParams) || {}
  const activeLang = toStr(sp.lang) === "ar" ? "ar" : "en"

  const whatsappHref = "https://wa.me/971502491034"
  const phone = "+971502491034"
  const website = "https://kbi.services"

  const services = [
    {
      icon: Smartphone,
      enTitle: "Mobile Repair",
      arTitle: "صيانة الموبايل",
      enDesc:
        "Screen, battery, charging, and software fixes with fast diagnostics in Abu Dhabi. Doorstep mobile repair with quality parts and warranty options.",
      arDesc:
        "تصليح شاشة وبطارية وشحن ومشاكل النظام بسرعة داخل أبوظبي. صيانة موبايل في الموقع مع قطع عالية الجودة وخيارات ضمان.",
    },
    {
      icon: Wrench,
      enTitle: "Laptop Repair",
      arTitle: "صيانة اللابتوب",
      enDesc:
        "Laptop repair near you for performance issues, overheating, storage upgrades, and OS problems. Home service in Abu Dhabi with expert technicians.",
      arDesc:
        "صيانة لابتوب قريب مني لمشاكل البطء وارتفاع الحرارة وترقيات الهارد ومشاكل النظام. خدمة منزلية في أبوظبي بفنيين محترفين.",
    },
    {
      icon: Printer,
      enTitle: "Printer Repair",
      arTitle: "صيانة الطابعات",
      enDesc:
        "Printer repair UAE for inkjet and laser: paper jam, lines, connectivity, and maintenance. On-site support for homes and offices.",
      arDesc:
        "تصليح طابعات الإمارات (إنكجت وليزر): انحشار الورق، خطوط بالطباعة، مشاكل الاتصال، وصيانة دورية. خدمة في الموقع للمنزل والمكاتب.",
    },
    {
      icon: Cctv,
      enTitle: "CCTV Installation",
      arTitle: "تركيب كاميرات المراقبة",
      enDesc:
        "CCTV installation Abu Dhabi for villas, apartments, and businesses. Smart placement, clean wiring, and secure setup with remote viewing.",
      arDesc:
        "تركيب كاميرات مراقبة أبوظبي للفلل والشقق والشركات. توزيع احترافي، تمديد نظيف، وضبط آمن مع مشاهدة عن بعد.",
    },
    {
      icon: Tv,
      enTitle: "TV Repair",
      arTitle: "صيانة التلفزيون",
      enDesc:
        "TV repair for display, backlight, power, and connectivity. Reliable troubleshooting and quick fixes at your location in Abu Dhabi.",
      arDesc:
        "صيانة التلفزيون لمشاكل الشاشة والإضاءة الخلفية والطاقة والاتصال. تشخيص موثوق وإصلاح سريع في موقعك داخل أبوظبي.",
    },
  ] as const

  const locations = [
    { en: "Abu Dhabi", ar: "أبوظبي" },
    { en: "Mussafah", ar: "مصفح" },
    { en: "Khalifa City", ar: "مدينة خليفة" },
    { en: "Yas Island", ar: "جزيرة ياس" },
    { en: "Al Reem Island", ar: "جزيرة الريم" },
  ] as const

  const faqs = [
    {
      enQ: "How fast is your repair service in Abu Dhabi?",
      arQ: "كم يستغرق وقت الصيانة؟",
      enA:
        "Most issues are diagnosed quickly and many repairs can be completed the same day, depending on parts availability and the device condition.",
      arA:
        "غالباً يتم التشخيص بسرعة، والعديد من الأعطال يتم إصلاحها في نفس اليوم حسب توفر القطع وحالة الجهاز.",
    },
    {
      enQ: "Do you provide doorstep / home service in Abu Dhabi?",
      arQ: "هل تقدمون خدمة صيانة منزلية في أبوظبي؟",
      enA:
        "Yes. We provide on-site repair and installation services across Abu Dhabi, including homes and offices.",
      arA:
        "نعم، نقدم خدمة صيانة في الموقع للمنزل والمكاتب في مناطق أبوظبي المختلفة.",
    },
    {
      enQ: "What areas do you cover in the UAE?",
      arQ: "ما هي المناطق التي تخدمونها في الإمارات؟",
      enA:
        "Our primary coverage is Abu Dhabi, and we can support nearby areas depending on availability. Contact us on WhatsApp for confirmation.",
      arA:
        "تغطيتنا الأساسية أبوظبي، ويمكننا دعم مناطق قريبة حسب توفر المواعيد. تواصل معنا عبر واتساب للتأكيد.",
    },
    {
      enQ: "Is there a warranty on repair services?",
      arQ: "هل يوجد ضمان على الصيانة؟",
      enA:
        "Warranty depends on the repair type and parts used. We clarify warranty terms before starting any work.",
      arA:
        "الضمان يعتمد على نوع الصيانة والقطع المستخدمة. نوضح شروط الضمان قبل بدء العمل.",
    },
  ] as const

  const reviews = {
    en: [
      {
        name: "Sarah",
        text: "Fast on-site repair in Abu Dhabi. Technician arrived on time and fixed my laptop the same day.",
      },
      {
        name: "Ahmed",
        text: "Great mobile repair service. Clear pricing, clean work, and professional support.",
      },
      {
        name: "Mariam",
        text: "Printer repair was quick and reliable. Highly recommended for office support.",
      },
    ],
    ar: [
      {
        name: "سارة",
        text: "خدمة ممتازة في أبوظبي. الفني وصل في الوقت المحدد وتم إصلاح اللابتوب بسرعة.",
      },
      {
        name: "أحمد",
        text: "تصليح موبايل احترافي وأسعار واضحة. شغل نظيف وتعامل راقي.",
      },
      {
        name: "مريم",
        text: "صيانة الطابعة كانت سريعة وفعّالة. أنصح بها خصوصاً للمكاتب.",
      },
    ],
  } as const

  const jsonLdLocalBusiness = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "KBI GLOBAL TECHNOLOGIES",
    url: website,
    telephone: phone,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Abu Dhabi",
      addressCountry: "AE",
    },
    areaServed: ["Abu Dhabi", "United Arab Emirates", "Mussafah", "Khalifa City", "Yas Island", "Al Reem Island"],
    sameAs: ["https://www.instagram.com/kbi.services", "https://www.tiktok.com/@kbi.services"],
  }

  const jsonLdFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: `${f.enQ} / ${f.arQ}`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `${f.enA}\n\n${f.arA}`,
      },
    })),
  }

  const Section = ({
    lang,
    children,
  }: {
    lang: "en" | "ar"
    children: React.ReactNode
  }) => (
    <section lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} className={activeLang === lang ? "block" : "hidden"}>
      {children}
    </section>
  )

  return (
    <main className="min-h-screen bg-black text-white selection:bg-[#2EC4B6]/30">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdLocalBusiness) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(70%_60%_at_50%_0%,rgba(46,196,182,0.18),rgba(0,0,0,0)_60%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),rgba(255,255,255,0)_28%)]" />

      <div className="container mx-auto px-6 pt-24 pb-16">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="text-white/80 hover:text-white font-semibold tracking-tight">
            KBI<span className="text-[#2EC4B6]">.</span>
          </Link>
          <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
            <Link
              href="/terms?lang=en"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${activeLang === "en" ? "bg-[#2EC4B6] text-black shadow-[0_0_15px_-3px_rgba(46,196,182,0.5)]" : "text-white/50 hover:text-white"}`}
            >
              EN
            </Link>
            <Link
              href="/terms?lang=ar"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${activeLang === "ar" ? "bg-[#2EC4B6] text-black shadow-[0_0_15px_-3px_rgba(46,196,182,0.5)]" : "text-white/50 hover:text-white"}`}
            >
              AR
            </Link>
          </div>
        </div>

        <Section lang="en">
          <header className="mt-12 rounded-[28px] border border-white/10 bg-white/[0.05] backdrop-blur-xl p-8 sm:p-10 shadow-[0_30px_90px_-55px_rgba(46,196,182,0.65)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/70">
              <MapPin className="h-3.5 w-3.5 text-[#2EC4B6]" />
              Abu Dhabi, United Arab Emirates
            </div>
            <h1 className="mt-4 text-3xl sm:text-5xl font-semibold tracking-tight">
              Best Repair Services in Abu Dhabi
            </h1>
            <p className="mt-4 max-w-3xl text-white/70 leading-relaxed">
              KBI GLOBAL TECHNOLOGIES provides premium on-site repair services across Abu Dhabi and the UAE: mobile repair,
              laptop repair near me, printer repair UAE, and CCTV installation Abu Dhabi. Fast response, expert technicians,
              and doorstep service with clear pricing.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2EC4B6] px-6 py-4 text-black font-semibold text-base hover:bg-[#35d4c6] transition-colors"
              >
                Book Now
                <CheckCircle2 className="h-5 w-5" />
              </a>
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-white font-semibold text-base hover:bg-white/10 transition-colors"
              >
                Call {phone}
                <Phone className="h-5 w-5 text-[#2EC4B6]" />
              </a>
            </div>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Clock className="h-4 w-4 text-[#2EC4B6]" />
                  Same-day service
                </div>
                <div className="mt-1 text-xs text-white/60">Fast diagnosis & quick scheduling</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Wrench className="h-4 w-4 text-[#2EC4B6]" />
                  Expert technicians
                </div>
                <div className="mt-1 text-xs text-white/60">Professional on-site support</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4 text-[#2EC4B6]" />
                  Trusted service
                </div>
                <div className="mt-1 text-xs text-white/60">Transparent updates & handling</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <MapPin className="h-4 w-4 text-[#2EC4B6]" />
                  Doorstep repair
                </div>
                <div className="mt-1 text-xs text-white/60">Home & office visits in Abu Dhabi</div>
              </div>
            </div>
          </header>

          <section className="mt-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Services in Abu Dhabi (UAE)</h2>
            <p className="mt-3 text-white/70 max-w-3xl">
              High-demand repair services Abu Dhabi for homes and businesses. Optimized for “near me” searches with fast scheduling.
            </p>
            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((s) => {
                const Icon = s.icon
                return (
                  <div key={s.enTitle} className="rounded-[22px] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 hover:border-[#2EC4B6]/40 hover:shadow-[0_24px_70px_-55px_rgba(46,196,182,0.55)] transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-[#2EC4B6]" />
                      </div>
                      <div>
                        <div className="text-base font-semibold">{s.enTitle}</div>
                        <div className="text-xs text-white/60">Book in minutes • on-site support</div>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-white/70 leading-relaxed">{s.enDesc}</p>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Service Areas</h2>
            <p className="mt-3 text-white/70 max-w-3xl">
              We cover Abu Dhabi neighborhoods and popular areas for on-site repair and installation.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {locations.map((l) => (
                <span key={l.en} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
                  {l.en}
                </span>
              ))}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Customer Reviews</h2>
            <p className="mt-3 text-white/70 max-w-3xl">
              Real feedback helps us improve and helps customers find trusted repair services in Abu Dhabi.
            </p>
            <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-4">
              {reviews.en.map((r) => (
                <div key={r.name} className="rounded-[22px] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6">
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-[#2EC4B6]" fill="currentColor" />
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-white/70 leading-relaxed">{r.text}</p>
                  <div className="mt-4 text-sm font-semibold text-white">{r.name}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">FAQ</h2>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {faqs.map((f) => (
                <details key={f.enQ} className="group rounded-[22px] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6">
                  <summary className="cursor-pointer list-none font-semibold text-white flex items-center justify-between gap-3">
                    <span>{f.enQ}</span>
                    <span className="text-[#2EC4B6] group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-white/70 leading-relaxed">{f.enA}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="mt-12 rounded-[28px] border border-white/10 bg-white/[0.05] backdrop-blur-xl p-8 sm:p-10">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Contact</h2>
            <p className="mt-3 text-white/70 max-w-3xl">
              For repair services Abu Dhabi, mobile repair Abu Dhabi, laptop repair near me, printer repair UAE, and CCTV installation Abu Dhabi:
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2EC4B6] px-6 py-4 text-black font-semibold text-base hover:bg-[#35d4c6] transition-colors"
              >
                WhatsApp
              </a>
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-white font-semibold text-base hover:bg-white/10 transition-colors"
              >
                Call {phone}
              </a>
              <a
                href={website}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-white font-semibold text-base hover:bg-white/10 transition-colors"
              >
                {website}
              </a>
            </div>
          </section>
        </Section>

        <Section lang="ar">
          <header className="mt-12 rounded-[28px] border border-white/10 bg-white/[0.05] backdrop-blur-xl p-8 sm:p-10 shadow-[0_30px_90px_-55px_rgba(46,196,182,0.65)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/70">
              <MapPin className="h-3.5 w-3.5 text-[#2EC4B6]" />
              أبوظبي، الإمارات العربية المتحدة
            </div>
            <h1 className="mt-4 text-3xl sm:text-5xl font-semibold tracking-tight">
              أفضل خدمات الصيانة في أبوظبي
            </h1>
            <p className="mt-4 max-w-3xl text-white/70 leading-relaxed">
              تقدم KBI GLOBAL TECHNOLOGIES خدمة صيانة في أبوظبي والإمارات: تصليح موبايل أبوظبي، صيانة لابتوب قريب مني،
              تصليح طابعات الإمارات، وتركيب كاميرات مراقبة أبوظبي. خدمة في الموقع بأسعار واضحة وفنيين محترفين.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:flex-row-reverse">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2EC4B6] px-6 py-4 text-black font-semibold text-base hover:bg-[#35d4c6] transition-colors"
              >
                احجز الآن
                <CheckCircle2 className="h-5 w-5" />
              </a>
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-white font-semibold text-base hover:bg-white/10 transition-colors"
              >
                اتصل {phone}
                <Phone className="h-5 w-5 text-[#2EC4B6]" />
              </a>
            </div>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Clock className="h-4 w-4 text-[#2EC4B6]" />
                  خدمة في نفس اليوم
                </div>
                <div className="mt-1 text-xs text-white/60">تشخيص سريع ومواعيد مرنة</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Wrench className="h-4 w-4 text-[#2EC4B6]" />
                  فنيين محترفين
                </div>
                <div className="mt-1 text-xs text-white/60">خبرة عملية وخدمة ميدانية</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4 text-[#2EC4B6]" />
                  موثوقية عالية
                </div>
                <div className="mt-1 text-xs text-white/60">تحديثات واضحة وتعامل آمن</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <MapPin className="h-4 w-4 text-[#2EC4B6]" />
                  خدمة في الموقع
                </div>
                <div className="mt-1 text-xs text-white/60">للمنزل والمكاتب داخل أبوظبي</div>
              </div>
            </div>
          </header>

          <section className="mt-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">الخدمات</h2>
            <p className="mt-3 text-white/70 max-w-3xl">
              خدمات صيانة منزلية في أبوظبي مع تركيز على كلمات البحث مثل “قريب مني” لضمان وصول أسرع وحجز أسهل.
            </p>
            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((s) => {
                const Icon = s.icon
                return (
                  <div key={s.arTitle} className="rounded-[22px] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 hover:border-[#2EC4B6]/40 hover:shadow-[0_24px_70px_-55px_rgba(46,196,182,0.55)] transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-[#2EC4B6]" />
                      </div>
                      <div>
                        <div className="text-base font-semibold">{s.arTitle}</div>
                        <div className="text-xs text-white/60">احجز خلال دقائق • خدمة ميدانية</div>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-white/70 leading-relaxed">{s.arDesc}</p>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">مناطق الخدمة</h2>
            <p className="mt-3 text-white/70 max-w-3xl">
              نغطي مناطق أبوظبي الرئيسية لخدمة الصيانة في الموقع والتركيب.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {locations.map((l) => (
                <span key={l.ar} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
                  {l.ar}
                </span>
              ))}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">آراء العملاء</h2>
            <p className="mt-3 text-white/70 max-w-3xl">
              تقييمات العملاء تساعدنا نطور خدماتنا وتساعد العملاء يختارون خدمة صيانة موثوقة في أبوظبي.
            </p>
            <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-4">
              {reviews.ar.map((r) => (
                <div key={r.name} className="rounded-[22px] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6">
                  <div className="flex items-center gap-1.5 justify-end">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-[#2EC4B6]" fill="currentColor" />
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-white/70 leading-relaxed">{r.text}</p>
                  <div className="mt-4 text-sm font-semibold text-white">{r.name}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">الأسئلة الشائعة</h2>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {faqs.map((f) => (
                <details key={f.arQ} className="group rounded-[22px] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6">
                  <summary className="cursor-pointer list-none font-semibold text-white flex items-center justify-between gap-3">
                    <span>{f.arQ}</span>
                    <span className="text-[#2EC4B6] group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-white/70 leading-relaxed">{f.arA}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="mt-12 rounded-[28px] border border-white/10 bg-white/[0.05] backdrop-blur-xl p-8 sm:p-10">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">تواصل معنا</h2>
            <p className="mt-3 text-white/70 max-w-3xl">
              لخدمة صيانة منزلية أبوظبي، صيانة في أبوظبي، تصليح موبايل أبوظبي، صيانة لابتوب قريب مني، تصليح طابعات الإمارات،
              وتركيب كاميرات مراقبة أبوظبي:
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:flex-row-reverse">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2EC4B6] px-6 py-4 text-black font-semibold text-base hover:bg-[#35d4c6] transition-colors"
              >
                واتساب
              </a>
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-white font-semibold text-base hover:bg-white/10 transition-colors"
              >
                اتصل {phone}
              </a>
              <a
                href={website}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-white font-semibold text-base hover:bg-white/10 transition-colors"
              >
                {website}
              </a>
            </div>
          </section>
        </Section>
      </div>
    </main>
  )
}
