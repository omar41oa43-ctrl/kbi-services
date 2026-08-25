import type React from "react"
import type { Metadata, Viewport } from "next"
import { Cairo } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { LanguageProvider } from "@/components/language-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { cookies } from "next/headers"

const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-sans" })

export const revalidate = 0

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: {
      default: "Best On-Site Mobile & Laptop Repair Abu Dhabi | KBI Repairs",
      template: "%s | KBI Repairs Abu Dhabi"
    },
    description:
      "Top-rated on-site repair services in Abu Dhabi. We fix iPhone screens, laptops, printers, TVs, and CCTV at your doorstep. Same-day service in Khalifa City, Al Reem, MBZ, and all Abu Dhabi areas.",
    keywords: ["best mobile repair abu dhabi", "top rated laptop repair abu dhabi", "iphone screen replacement abu dhabi", "on-site printer repair", "CCTV installation abu dhabi", "TV repair services abu dhabi", "apple watch repair", "gaming console repair", "mobile repair near me", "laptop maintenance", "Abu Dhabi tech support"],
    metadataBase: new URL("https://kbi.services"),
    icons: {
      icon: '/pwa-icon.png',
      apple: '/pwa-icon.png',
    },
    openGraph: {
      type: "website",
      locale: "en_AE",
      url: "https://kbi.services",
      siteName: "KBI Repairs",
      title: "KBI | Professional On-Site Repair Services Abu Dhabi",
      description: "Fast, certified on-site repair for all your devices in Abu Dhabi. Home or office service within the same day.",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "KBI Repairs Abu Dhabi",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "KBI | On-Site Repair Services Abu Dhabi",
      description: "Professional on-site device repair in Abu Dhabi. We come to you!",
      images: ["/og-image.png"],
    },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f9fc' },
    { media: '(prefers-color-scheme: dark)', color: '#080b0f' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const cookieLang = (cookieStore.get("kbi_lang")?.value as "en" | "ar") || "en"

  return (
    <html lang={cookieLang} dir={cookieLang === "ar" ? "rtl" : "ltr"} suppressHydrationWarning>
      <head />
      <body
        suppressHydrationWarning
        className={cn("min-h-screen font-sans antialiased selection:bg-cyan-500/20", cairo.variable)}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
          <LanguageProvider initialLang={cookieLang}>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
