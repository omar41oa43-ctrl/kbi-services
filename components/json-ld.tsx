import type { SiteContact } from "@/lib/site-contact"

const serializeJsonLd = (value: unknown) =>
  JSON.stringify(value).replace(/</g, "\\u003c")

export function JsonLd({ contact }: { contact: SiteContact }) {
  const socialProfiles = [
    contact.socialLinks.instagram,
    contact.socialLinks.facebook,
    contact.socialLinks.tiktok,
  ].filter(Boolean)

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://kbi.services/#organization",
    name: "KBI Services",
    legalName: "KBI GLOBAL TECHNOLOGIES",
    url: "https://kbi.services",
    logo: "https://kbi.services/apple-touch-icon.png",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+971502491034",
      contactType: "customer support",
      areaServed: "AE",
      availableLanguage: ["en", "ar"],
    },
    sameAs: socialProfiles,
  }

  const businessSchema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": "https://kbi.services/#business",
    name: "KBI Services",
    legalName: "KBI GLOBAL TECHNOLOGIES",
    image: "https://kbi.services/og-image.png",
    url: "https://kbi.services/",
    parentOrganization: {
      "@id": "https://kbi.services/#organization",
    },
    telephone: "+971502491034",
    email: "support@kbi.services",
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
    name: "On-Site Device Repair & IT Services Across the UAE",
    serviceType: "Electronic repair and technical support",
    provider: { "@id": "https://kbi.services/#organization" },
    areaServed: {
      "@type": "Country",
      name: "United Arab Emirates",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "On-Site Device Repair & IT Services",
      itemListElement: [
        "Mobile Phone Repair",
        "Laptop Repair",
        "Desktop Computer & PC Repair",
        "Printer Maintenance & Repair",
        "TV Repair",
        "Monitor Repair",
        "Tablet & iPad Repair",
        "Apple Watch & Smartwatch Repair",
        "Gaming Console Repair",
        "CCTV Installation & Maintenance",
        "Network Installation & Support",
        "IT Support & Technical Assistance",
        "TV Wall Mounting & Installation",
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
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationSchema) }}
      />
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
