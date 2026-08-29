import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Rate Service",
  robots: { index: false, follow: false },
}

export default function RateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
