import { BookingForm } from "@/components/booking-form"
import { Suspense } from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Book a Technician in UAE | KBI Services",
  description: "Book a professional KBI technician for on-site device repair at your home or office anywhere in the UAE.",
  alternates: {
    canonical: "/book",
  },
  robots: { index: true, follow: true },
}

// export const dynamic = "force-static"

export default function BookPage() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-cyan-500/30 pb-16 lg:pb-0">
      <Suspense fallback={<div className="container mx-auto px-6 pt-24 md:pt-32 pb-16 text-muted-foreground">Loading booking form...</div>}>
        <BookingForm />
      </Suspense>
    </main>
  )
}
