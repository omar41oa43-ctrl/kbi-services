import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Track Your Order",
  robots: { index: false, follow: true },
}

export default async function LegacyTrackingPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  redirect(`/track?orderId=${encodeURIComponent(orderId)}`)
}
