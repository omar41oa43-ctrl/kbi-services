import type React from "react"
import type { Metadata, Viewport } from "next"
import { Cairo } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { LanguageProvider } from "@/components/language-provider"
import { ThemeProvider } from "@/components/theme-provider"

const cairo = Cairo({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "optional",
})

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: {
      default: "On-Site Device Repair & IT Services Across the UAE | KBI Services",
      template: "%s | KBI Services"
    },
    description:
      "Professional on-site device repair and IT services across the UAE. KBI technicians come to your home or office for phones, laptops, PCs, printers, TVs, CCTV, gaming consoles and more.",
    metadataBase: new URL("https://kbi.services"),
    icons: {
      icon: '/favicon-32.png',
      apple: '/apple-touch-icon.png',
    },
    openGraph: {
      type: "website",
      locale: "en_AE",
      url: "https://kbi.services",
      siteName: "KBI Services",
      title: "On-Site Device Repair & IT Services Across the UAE | KBI Services",
      description: "Professional on-site device repair and IT services across the UAE. KBI technicians come to your home or office for phones, laptops, PCs, printers, TVs, CCTV, gaming consoles and more.",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: "KBI Services on-site device repair and IT support across the UAE",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "On-Site Device Repair & IT Services Across the UAE | KBI Services",
      description: "Professional on-site device repair and IT services across the UAE. KBI technicians come to your home or office for phones, laptops, PCs, printers, TVs, CCTV, gaming consoles and more.",
      images: ["/opengraph-image"],
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
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="kbi-theme">
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
