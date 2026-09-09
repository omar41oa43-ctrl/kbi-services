import { BookingForm } from "@/components/booking-form"
import { Suspense } from "react"
import type { Metadata } from "next"
import { BookingSkeleton } from "@/components/booking-skeleton"

export const metadata: Metadata = {
  title: "Book a Technician Across the UAE",
  description: "Book a professional KBI technician for on-site device repair or IT support at your home or office anywhere across the UAE.",
  alternates: {
    canonical: "/book",
    languages: { en: "/book", ar: "/ar/book", "x-default": "/book" },
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Book a Technician Across the UAE | KBI Services",
    description: "Book a professional KBI technician for on-site device repair or IT support at your home or office anywhere across the UAE.",
    url: "https://kbi.services/book",
    type: "website",
  },
}

// export const dynamic = "force-static"

export default function BookPage() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-cyan-500/30 pb-16 lg:pb-0">
      <Suspense
        fallback={<BookingSkeleton />}
      >
        <BookingForm />
      </Suspense>
    </main>
  )
}
