"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function TechnicianRequestsPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/admin/technicians")
  }, [router])

  return (
    <div className="p-8 text-center text-slate-400">
      Redirecting to Technicians Management Center...
    </div>
  )
}
