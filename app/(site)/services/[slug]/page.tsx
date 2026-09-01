import type { Metadata } from "next"
import Link from "next/link"
import { notFound, permanentRedirect } from "next/navigation"
import {
  ArrowRight,
  CheckCircle,
  ChevronRight,
  CircleDollarSign,
  Clock,
  MapPin,
  ShieldCheck,
  Wrench,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import {
  getAllServiceSlugs,
  getLegacySlugRedirect,
  getServiceBySlug,
} from "@/lib/services-seo-data"

interface Props {
  params: Promise<{ slug: string }>
}

const SITE_URL = "https://kbi.services"
const UAE_LOCATIONS = [
  ["Abu Dhabi", "abu-dhabi"],
  ["Dubai", "dubai"],
  ["Sharjah", "sharjah"],
  ["Ajman", "ajman"],
  ["Ras Al Khaimah", "ras-al-khaimah"],
  ["Fujairah", "fujairah"],
  ["Umm Al Quwain", "umm-al-quwain"],
] as const

export const revalidate = 86400

export function generateStaticParams() {
  return getAllServiceSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const legacyDestination = getLegacySlugRedirect(slug)
  const service = getServiceBySlug(legacyDestination ?? slug)

  if (!service) return {}

  const canonicalPath = `/services/${service.slug}`

  return {
    title: service.seoTitle,
    description: service.metaDescription,
    alternates: {
      canonical: canonicalPath,
      languages: {
        en: canonicalPath,
        ar: `/ar${canonicalPath}`,
        "x-default": canonicalPath,
      },
    },
    openGraph: {
      title: `${service.seoTitle} | KBI Services`,
      description: service.metaDescription,
      url: `${SITE_URL}${canonicalPath}`,
      type: "website",
      locale: "en_AE",
    },
    twitter: {
      card: "summary_large_image",
      title: `${service.seoTitle} | KBI Services`,
      description: service.metaDescription,
    },
  }
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params
  const legacyDestination = getLegacySlugRedirect(slug)

  if (legacyDestination) {
    permanentRedirect(`/services/${legacyDestination}`)
  }

  const service = getServiceBySlug(slug)
  if (!service) notFound()

  const canonicalUrl = `${SITE_URL}/services/${service.slug}`
  const faqItems = [
    {
      question: `Does KBI provide ${service.name.toLowerCase()} at my location?`,
      answer:
        "KBI accepts home and office service requests across all seven Emirates. The appointment window is confirmed after checking your exact location, technician availability, and any parts required.",
    },
    {
      question: "Will I receive a quote before the work begins?",
      answer:
        "Yes. The technician diagnoses the reported issue, explains the available service or parts options, and confirms the quote before paid work begins.",
    },
    {
      question: "Can the service be completed during one visit?",
      answer:
        "Many common requests can be completed on site, but timing depends on diagnosis, device condition, location, and parts availability. KBI confirms the expected service path after inspection.",
    },
    {
      question: "Is warranty coverage available?",
      answer:
        "Eligible repairs may include written warranty terms. The applicable coverage and exclusions are recorded on the quote, invoice, or service record.",
    },
  ]

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${canonicalUrl}#service`,
      name: service.name,
      serviceType: service.name,
      url: canonicalUrl,
      description: service.metaDescription,
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: {
        "@type": "Country",
        name: "United Arab Emirates",
      },
      availableChannel: {
        "@type": "ServiceChannel",
        serviceLocation: {
          "@type": "Place",
          name: "Customer home or office in the UAE",
        },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Services", item: `${SITE_URL}/services` },
        { "@type": "ListItem", position: 3, name: service.name, item: canonicalUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ]

  const schemaJson = JSON.stringify(structuredData).replace(/</g, "\\u003c")

  return (
    <main className="adaptive-theme-page min-h-screen bg-black pb-16 pt-24 text-white">
      <nav aria-label="Breadcrumb" className="container mx-auto mb-8 px-6">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-white/60">
          <li><Link className="transition-colors hover:text-cyan-400" href="/">Home</Link></li>
          <li aria-hidden="true"><ChevronRight className="h-4 w-4" /></li>
          <li><Link className="transition-colors hover:text-cyan-400" href="/services">Services</Link></li>
          <li aria-hidden="true"><ChevronRight className="h-4 w-4" /></li>
          <li aria-current="page" className="text-white/90">{service.name}</li>
        </ol>
      </nav>

      <section className="container mx-auto mb-16 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-cyan-400">
            <Wrench className="h-4 w-4" />
            <span className="text-sm font-semibold">On-Site Technical Service</span>
          </div>
          <h1 className="mb-6 bg-gradient-to-r from-white via-cyan-100 to-white/70 bg-clip-text text-4xl font-bold text-transparent md:text-6xl">
            {service.h1}
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-lg leading-relaxed text-white/70 md:text-xl">
            {service.heroSubtitle}
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="h-14 w-full rounded-full bg-cyan-500 px-8 text-lg font-bold text-black hover:bg-cyan-400 sm:w-auto">
              <Link href={`/book?device=${service.bookingParam}`}>{service.ctaText}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 w-full rounded-full border-white/20 px-8 text-lg hover:bg-white/10 sm:w-auto">
              <Link href="/contact">Ask a Question</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto mb-16 px-6">
        <div className="mx-auto max-w-4xl space-y-5 text-base leading-8 text-white/75 md:text-lg">
          <h2 className="text-3xl font-bold text-white">About This Service</h2>
          <p>{service.overview.paragraph1}</p>
          <p>{service.overview.paragraph2}</p>
        </div>
      </section>

      <section className="container mx-auto mb-16 px-6">
        <div className="mb-10 text-center">
          <h2 className="mb-4 text-3xl font-bold">Common {service.name} Requests</h2>
          <p className="text-white/70">Diagnosis, repairability, timing, and price are confirmed for your specific device.</p>
        </div>
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2 lg:grid-cols-3">
          {service.commonProblems.map((problem) => (
            <GlassCard key={problem.title} className="p-6">
              <CheckCircle className="mb-4 h-6 w-6 text-cyan-400" />
              <h3 className="mb-2 text-lg font-bold">{problem.title}</h3>
              <p className="text-sm leading-6 text-white/70">{problem.description}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="container mx-auto mb-16 px-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {service.highlights.map((highlight, index) => {
            const Icon = [MapPin, Clock, CircleDollarSign, ShieldCheck][index % 4]
            return (
              <GlassCard key={highlight.title} className="p-6">
                <Icon className="mb-4 h-9 w-9 text-cyan-400" />
                <h3 className="mb-2 text-lg font-bold">{highlight.title}</h3>
                <p className="text-sm leading-6 text-white/70">{highlight.description}</p>
              </GlassCard>
            )
          })}
        </div>
      </section>

      <section className="container mx-auto mb-16 px-6">
        <GlassCard className="mx-auto max-w-6xl p-8">
          <h2 className="mb-3 text-3xl font-bold">Supported Brands and Devices</h2>
          <p className="mb-8 text-sm text-white/60">Brand names identify devices we can assess and do not imply manufacturer authorization or endorsement.</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {service.supportedBrands.map((brand) => (
              <div key={brand.name}>
                <h3 className="mb-3 font-bold text-cyan-400">{brand.name}</h3>
                {brand.models?.length ? (
                  <ul className="space-y-2 text-sm text-white/70">
                    {brand.models.map((model) => <li key={model}>{model}</li>)}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      <section className="container mx-auto mb-16 px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-3xl font-bold">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqItems.map((item) => (
              <details key={item.question} className="rounded-2xl border border-white/10 bg-white/5 p-6 open:border-cyan-500/30">
                <summary className="cursor-pointer font-bold text-white">{item.question}</summary>
                <p className="mt-4 leading-7 text-white/70">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto mb-16 px-6 text-center">
        <h2 className="mb-3 text-3xl font-bold">Service Coverage Across the UAE</h2>
        <p className="mx-auto mb-7 max-w-3xl text-white/70">
          Request {service.name.toLowerCase()} at your home or workplace. Appointment timing is confirmed after checking your exact area and technician availability.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {UAE_LOCATIONS.map(([name, locationSlug]) => (
            <Link key={locationSlug} href={`/locations/${locationSlug}`} className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold transition-colors hover:border-cyan-400 hover:text-cyan-400">
              {name}
            </Link>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-6">
        <div className="mx-auto max-w-5xl rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-8 text-center">
          <h2 className="mb-6 text-2xl font-bold">Related Services</h2>
          <div className="mb-8 flex flex-wrap justify-center gap-3">
            {service.relatedServices.map((related) => (
              <Link key={related.slug} href={`/services/${related.slug}`} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-5 py-3 text-sm font-semibold transition-colors hover:border-cyan-400 hover:text-cyan-400">
                {related.name}<ArrowRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
          <Button asChild size="lg" className="rounded-full bg-cyan-500 px-8 font-bold text-black hover:bg-cyan-400">
            <Link href={`/book?device=${service.bookingParam}`}>{service.ctaText}</Link>
          </Button>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaJson }} />
    </main>
  )
}
