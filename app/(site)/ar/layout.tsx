import type { ReactNode } from "react"
import { Cairo } from "next/font/google"
import { ArabicRouteLanguage } from "@/components/arabic-route-language"

const cairoArabic = Cairo({
  subsets: ["arabic"],
  display: "swap",
})

export default function ArabicLayout({ children }: { children: ReactNode }) {
  return (
    <div dir="rtl" lang="ar" className={cairoArabic.className}>
      <ArabicRouteLanguage />
      {children}
    </div>
  )
}
