import { OrderTracker } from "@/components/order-tracker"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Track Your Order",
  description: "Check the real-time status of your repair order. Enter your tracking number for live updates on your mobile, laptop, or IT service request.",
  alternates: {
    canonical: "/track",
  },
}

export const dynamic = "force-static"

export default function TrackPage() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-cyan-500/30 pb-16 lg:pb-0">
      <OrderTracker />
    </main>
  )
}
