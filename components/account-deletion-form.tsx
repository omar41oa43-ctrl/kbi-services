"use client"

import { FormEvent, useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"

export function AccountDeletionForm() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [requestId, setRequestId] = useState("")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError("")
    const form = new FormData(event.currentTarget)
    try {
      const response = await fetch("/api/account-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          technicianId: form.get("technicianId"),
          reason: form.get("reason"),
          website: form.get("website"),
        }),
      })
      const result = await response.json()
      if (!response.ok || !result.ok) throw new Error(result.error || "Unable to submit request")
      setRequestId(String(result.requestId || "received"))
      event.currentTarget.reset()
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to submit request")
    } finally {
      setSubmitting(false)
    }
  }

  if (requestId) {
    return (
      <div role="status" className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-emerald-400" />
        <h2 className="text-xl font-extrabold text-white">Request received / تم استلام الطلب</h2>
        <p className="mt-2 text-sm text-slate-300">Keep this reference: {requestId}</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-3xl border border-slate-800 bg-slate-950/80 p-6 sm:p-8">
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="block">
        <span className="mb-2 block font-semibold text-white">Account email / البريد الإلكتروني للحساب</span>
        <input required type="email" name="email" autoComplete="email" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400" />
      </label>
      <label className="block">
        <span className="mb-2 block font-semibold text-white">Technician ID (optional) / رقم الفني (اختياري)</span>
        <input name="technicianId" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400" />
      </label>
      <label className="block">
        <span className="mb-2 block font-semibold text-white">Additional details (optional) / تفاصيل إضافية</span>
        <textarea name="reason" rows={4} className="w-full resize-y rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400" />
      </label>
      {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      <button disabled={submitting} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1ECBC7] px-5 py-3 font-extrabold text-[#030405] disabled:opacity-60">
        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        {submitting ? "Submitting…" : "Request permanent deletion / طلب الحذف النهائي"}
      </button>
    </form>
  )
}
