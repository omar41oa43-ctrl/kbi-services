
"use client"

import Script from "next/script"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export function GoogleAnalytics({ GA_MEASUREMENT_ID }: { GA_MEASUREMENT_ID?: string }) {
    const pathname = usePathname()
    const [mounted, setMounted] = useState(false)

    const measurementId = GA_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (mounted && window.gtag && measurementId) {
            window.gtag("config", measurementId, {
                page_path: pathname,
            })
        }
    }, [pathname, mounted, measurementId])

    if (!mounted) return null
    if (!measurementId) {
        console.warn("Google Analytics: NEXT_PUBLIC_GA_MEASUREMENT_ID is missing")
        return null
    }
    if (process.env.NODE_ENV === "development") return null

    return (
        <>
            {/* Google Consent Mode Default Configuration */}
            <Script
                id="google-analytics-consent"
                strategy="beforeInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            
            let localConsent = null;
            try {
              localConsent = localStorage.getItem("kbi_cookie_consent_v1");
            } catch (e) {}

            gtag('consent', 'default', {
              'ad_storage': localConsent === 'granted' ? 'granted' : 'denied',
              'analytics_storage': localConsent === 'granted' ? 'granted' : 'denied',
              'ad_user_data': localConsent === 'granted' ? 'granted' : 'denied',
              'ad_personalization': localConsent === 'granted' ? 'granted' : 'denied',
            });
          `,
                }}
            />
            {/* Google tag (gtag.js) - GA4 Integration */}
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
            />
            <Script
                id="google-analytics"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              page_path: window.location.pathname,
              transport_type: 'beacon',
            });
          `,
                }}
            />
        </>
    )
}

// Add gtag to window interface
declare global {
    interface Window {
        gtag: (...args: any[]) => void
        dataLayer: any[]
    }
}
