import Home from "../page"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    absolute: "On-Site Device Repair & IT Services Across the UAE | KBI Services",
  },
  description: "Professional on-site device repair and IT services across the UAE. KBI technicians come to your home or office for phones, laptops, PCs, printers, TVs, CCTV, gaming consoles and more.",
  alternates: {
    canonical: "/",
  },
}

export const dynamic = "force-static"

export default Home
