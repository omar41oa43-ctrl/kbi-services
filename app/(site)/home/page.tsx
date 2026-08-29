import Home from "../page"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "On-Site Device Repair Across the UAE | KBI Repairs",
  description: "Fast, certified on-site device repairs and IT support across all 7 Emirates in the UAE. Mobile, laptop, PC, printer, and CCTV technician at your doorstep.",
  alternates: {
    canonical: "/home",
  },
}

export const dynamic = "force-static"

export default Home
