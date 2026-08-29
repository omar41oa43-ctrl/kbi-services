import type React from "react"
import type { Metadata, Viewport } from "next"
import { Cairo } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { LanguageProvider } from "@/components/language-provider"
import { ThemeProvider } from "@/components/theme-provider"

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
  display: "swap",
})

export const revalidate = 600

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: {
      default: "On-Site Device Repair Across the UAE | KBI Repairs",
      template: "%s | KBI Repairs"
    },
    description:
      "On-site repair for phones, laptops, computers, printers, TVs, gaming consoles, networks, and CCTV across all 7 Emirates in the UAE.",
    metadataBase: new URL("https://kbi.services"),
    icons: {
      icon: '/favicon-32.png',
      apple: '/apple-touch-icon.png',
    },
    openGraph: {
      type: "website",
      locale: "en_AE",
      url: "https://kbi.services",
      siteName: "KBI Repairs",
      title: "KBI | On-Site Device Repair Across the UAE",
      description: "Book professional device repair at your home or office in Abu Dhabi, Dubai, Sharjah, and Ajman.",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "KBI on-site device repair services",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "KBI | On-Site Device Repair Across the UAE",
      description: "Professional repair at your home or office in Abu Dhabi, Dubai, Sharjah, and Ajman.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head />
      <body
        suppressHydrationWarning
        className={cn("min-h-screen font-sans antialiased selection:bg-cyan-500/20", cairo.variable)}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
