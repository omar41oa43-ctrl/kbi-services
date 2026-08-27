import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Corporate Support",
  robots: { index: false, follow: true },
}

export default function CorporatePortalPage() {
  redirect("/corporate#corporate-form")
}
