import type { SiteContact } from "@/lib/site-contact"

const serializeJsonLd = (value: unknown) =>
  JSON.stringify(value).replace(/</g, "\\u003c")

export function JsonLd({ contact }: { contact: SiteContact }) {
  const socialProfiles = [
    contact.socialLinks.instagram,
    contact.socialLinks.facebook,
    contact.socialLinks.tiktok,
  ].filter(Boolean)

  const businessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://kbi.services/#business",
    name: contact.companyName || "KBI GLOBAL TECHNOLOGIES",
    alternateName: "KBI Repairs",
    image: "https://kbi.services/og-image.png",
    url: "https://kbi.services/",
    telephone: contact.phone,
    email: contact.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Abu Dhabi",
      addressCountry: "AE",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
        opens: "08:00",
        closes: "22:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Friday",
        opens: "14:00",
        closes: "22:00",
      },
    ],
    areaServed: ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"].map((name) => ({
      "@type": "AdministrativeArea",
      name,
    })),
    priceRange: "Quote provided before repair",
    sameAs: socialProfiles,
  }

  const servicesSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "On-site device repair and IT support",
    serviceType: "Electronic repair and technical support",
    provider: { "@id": "https://kbi.services/#business" },
    areaServed: ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Repair services",
      itemListElement: [
        "Mobile phone repair",
        "Laptop and computer repair",
        "Printer maintenance",
        "TV and monitor repair",
        "Gaming console repair",
        "CCTV installation and maintenance",
        "Network installation and technical support",
      ].map((name) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name },
      })),
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(businessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(servicesSchema) }}
      />
    </>
  )
}
