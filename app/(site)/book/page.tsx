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
      <Suspense
        fallback={
          <div className="pt-24 sm:pt-28 pb-20 min-h-screen container mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mx-auto text-center mb-8 animate-pulse">
              <div className="w-44 h-7 mx-auto rounded-full bg-cyan-500/15 mb-3" />
              <div className="w-64 h-9 mx-auto rounded-xl bg-muted/60 mb-2" />
              <div className="w-80 h-4 mx-auto rounded-lg bg-muted/40" />
            </div>
            <div className="max-w-xl mx-auto mb-8 animate-pulse">
              <div className="h-14 rounded-2xl bg-card/60 border border-white/5" />
            </div>
            <div className="max-w-2xl mx-auto animate-pulse">
              <div className="h-[460px] rounded-[32px] bg-card/70 border border-white/5" />
            </div>
          </div>
        }
      >
        <BookingForm />
      </Suspense>
    </main>
  )
}
