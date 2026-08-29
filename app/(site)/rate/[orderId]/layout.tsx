import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Rate Your Repair Service",
  robots: { index: false, follow: false },
}

export default function OrderRateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
