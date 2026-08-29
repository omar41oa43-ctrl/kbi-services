import { OrderTracker } from "@/components/order-tracker"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    absolute: "Track Your Repair Order | KBI Services",
  },
  description: "Track the latest status of your KBI Services repair or technician appointment securely using your order details.",
  alternates: {
    canonical: "/track",
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Track Your Repair Order | KBI Services",
    description: "Track the latest status of your KBI Services repair or technician appointment securely using your order details.",
    url: "https://kbi.services/track",
    type: "website",
  },
}

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ orderId?: string }> }) {
  const { orderId = "" } = await searchParams
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-cyan-500/30 pb-16 lg:pb-0">
      <OrderTracker initialOrderId={orderId} />
    </main>
  )
}
