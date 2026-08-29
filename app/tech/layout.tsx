import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Technician Portal",
  robots: { index: false, follow: false },
}

export default function TechLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
