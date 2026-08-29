import type { Metadata } from "next"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function NoCacheExample() {
  return <div>No Cache Example</div>
}
