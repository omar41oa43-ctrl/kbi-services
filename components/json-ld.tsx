
import { SiteContact } from "@/lib/site-contact"

export function JsonLd({ contact }: { contact: SiteContact }) {
    const businessSchema = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": contact.companyName || "KBI Repairs",
        "image": "https://kbi.services/og-image.png",
        "@id": "https://kbi.services",
        "url": "https://kbi.services",
        "telephone": contact.phoneDisplay,
        "email": contact.email,
        "address": {
            "@type": "PostalAddress",
            "streetAddress": contact.address,
            "addressLocality": "Abu Dhabi",
            "addressRegion": "Abu Dhabi",
            "addressCountry": "AE"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": 24.4539,
            "longitude": 54.3773
        },
        "openingHoursSpecification": [
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Saturday", "Sunday"],
                "opens": "08:00",
                "closes": "22:00"
            },
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": "Friday",
                "opens": "14:00",
                "closes": "22:00"
            }
        ],
        "areaServed": {
            "@type": "GeoCircle",
            "geoMidpoint": {
                "@type": "GeoCoordinates",
                "latitude": 24.4539,
                "longitude": 54.3773
            },
            "geoRadius": "50000"
        },
        "priceRange": "$$",
        "sameAs": [
            `https://wa.me/${contact.whatsappRaw}`
        ]
    }

    const servicesSchema = {
        "@context": "https://schema.org",
        "@type": "Service",
        "serviceType": "Electronic Repair",
        "provider": {
            "@type": "LocalBusiness",
            "name": "KBI Repairs Abu Dhabi"
        },
        "areaServed": {
            "@type": "State",
            "name": "Abu Dhabi"
        },
        "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Repair Services",
            "itemListElement": [
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Mobile Phone & iPhone Screen Repair"
                    }
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Laptop & MacBook Repair"
                    }
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Printer Maintenance & IT Support"
                    }
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "TV Repair & Wall Mounting"
                    }
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "CCTV Installation & Security"
                    }
                }
            ]
        }
    }

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://kbi.services"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Services",
                "item": "https://kbi.services/services"
            }
        ]
    }

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "Do you offer home service in Abu Dhabi?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, we provide professional on-site repair services for phones, laptops, and more throughout Abu Dhabi including Khalifa City, Al Reem Island, and MBZ."
                }
            },
            {
                "@type": "Question",
                "name": "How fast is the repair?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Most mobile screen and battery replacements are done within 45 minutes at your location."
                }
            }
        ]
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
        </>
    )
}
