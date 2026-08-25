import { BookingForm } from "@/components/booking-form"
import { Suspense } from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Book a Technician",
  description: "Schedule a same-day on-site repair technician in Abu Dhabi. Easy online booking for mobile, laptop, and IT support services.",
  alternates: {
    canonical: "/book",
  },
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
