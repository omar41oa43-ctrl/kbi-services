"use client"

import { useState, useTransition } from "react"
import { useT } from "@/components/language-provider"
import { GlassCard } from "@/components/ui/glass-card"
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { submitCorporateBookingAction } from "@/app/actions/corporate-booking"
import { handleStaleServerActionError } from "@/lib/utils"

export function CorporateBookingForm() {
  const t = useT()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    companyName: "",
    companyEmail: "",
    contactName: "",
    mobileNumber: "",
    location: "",
    deviceCount: "",
    deviceTypes: "",
    urgency: "",
    preferredTime: "",
    notes: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      try {
        const result = await submitCorporateBookingAction(form)
        if (result.error) {
          setError(result.error)
        } else {
          if (typeof window !== "undefined" && (window as any).gtag) {
            (window as any).gtag("event", "generate_lead", {
              currency: "AED",
              value: 0,
              event_callback: () => {},
            })
          }
          setSubmitted(true)
        }
      } catch (err) {
        if (handleStaleServerActionError(err)) return
        setError("Something went wrong. Please refresh and try again.")
      }
    })
  }

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl opacity-20 group-hover:opacity-40 blur transition duration-500"></div>
      <GlassCard hoverEffect={false} className="relative border border-white/10 bg-black/50 backdrop-blur-xl">
        {submitted ? (
          <div className="text-center p-12 text-white">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">{t("Request Received")}</h3>
            <p className="text-white/60 max-w-md mx-auto leading-relaxed">{t("Thank you for choosing KBI Corporate. Our enterprise team has received your request and will contact you within 2 hours.")}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 text-white p-2">

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="group/input">
                <label className="block text-xs font-medium text-cyan-400/80 mb-2 uppercase tracking-wider ml-1">{t("Company Name")}</label>
                <input
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-cyan-500/50 focus:bg-cyan-500/5 transition-all duration-300 placeholder:text-white/20"
                  placeholder={t("e.g. Tech Solutions Ltd")}
                />
              </div>
              <div className="group/input">
                <label className="block text-xs font-medium text-cyan-400/80 mb-2 uppercase tracking-wider ml-1">{t("Company Email")}</label>
                <input
                  type="email"
                  name="companyEmail"
                  value={form.companyEmail}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-cyan-500/50 focus:bg-cyan-500/5 transition-all duration-300 placeholder:text-white/20"
                  placeholder={t("contact@company.com")}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="group/input">
                <label className="block text-xs font-medium text-cyan-400/80 mb-2 uppercase tracking-wider ml-1">{t("Contact Person")}</label>
                <input
                  name="contactName"
                  value={form.contactName}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-cyan-500/50 focus:bg-cyan-500/5 transition-all duration-300 placeholder:text-white/20"
                  placeholder={t("Full Name")}
                />
              </div>
              <div className="group/input">
                <label className="block text-xs font-medium text-cyan-400/80 mb-2 uppercase tracking-wider ml-1">{t("Mobile Number")}</label>
                <input
                  name="mobileNumber"
                  value={form.mobileNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-cyan-500/50 focus:bg-cyan-500/5 transition-all duration-300 placeholder:text-white/20"
                  placeholder={t("+971 50 000 0000")}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="group/input">
                <label className="block text-xs font-medium text-cyan-400/80 mb-2 uppercase tracking-wider ml-1">{t("Location")}</label>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-cyan-500/50 focus:bg-cyan-500/5 transition-all duration-300 placeholder:text-white/20"
                  placeholder={t("Office Location / Area")}
                />
              </div>
              <div className="group/input">
                <label className="block text-xs font-medium text-cyan-400/80 mb-2 uppercase tracking-wider ml-1">{t("Device Count")}</label>
                <input
                  name="deviceCount"
                  value={form.deviceCount}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-cyan-500/50 focus:bg-cyan-500/5 transition-all duration-300 placeholder:text-white/20"
                  placeholder={t("Approx. number of devices")}
                />
              </div>
            </div>

            <div className="group/input">
              <label className="block text-xs font-medium text-cyan-400/80 mb-2 uppercase tracking-wider ml-1">{t("Device Types")}</label>
              <input
                name="deviceTypes"
                value={form.deviceTypes}
                onChange={handleChange}
                placeholder={t("Phones, Laptops, PC / Desktop, Printers, CCTV, TVs")}
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-cyan-500/50 focus:bg-cyan-500/5 transition-all duration-300 placeholder:text-white/20"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="group/input">
                <label className="block text-xs font-medium text-cyan-400/80 mb-2 uppercase tracking-wider ml-1">{t("Urgency")}</label>
                <div className="relative">
                  <select
                    name="urgency"
                    value={form.urgency}
                    onChange={handleChange}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-cyan-500/50 focus:bg-cyan-500/5 transition-all duration-300 appearance-none text-white/80"
                  >
                    <option value="" className="bg-zinc-900">{t("Select Urgency Level")}</option>
                    <option value="Normal" className="bg-zinc-900">{t("Normal (24-48h)")}</option>
                    <option value="High" className="bg-zinc-900">{t("High (Same Day)")}</option>
                    <option value="Critical" className="bg-zinc-900">{t("Critical (Immediate - 2h)")}</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                  </div>
                </div>
              </div>
              <div className="group/input">
                <label className="block text-xs font-medium text-cyan-400/80 mb-2 uppercase tracking-wider ml-1">{t("Preferred Time")}</label>
                <input
                  name="preferredTime"
                  value={form.preferredTime}
                  onChange={handleChange}
                  placeholder={t("e.g. Tomorrow 10AM")}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-cyan-500/50 focus:bg-cyan-500/5 transition-all duration-300 placeholder:text-white/20"
                />
              </div>
            </div>

            <div className="group/input">
              <label className="block text-xs font-medium text-cyan-400/80 mb-2 uppercase tracking-wider ml-1">{t("Additional Notes")}</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-cyan-500/50 focus:bg-cyan-500/5 transition-all duration-300 placeholder:text-white/20 resize-none"
                placeholder={t("Describe specific issues or requirements...")}
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isPending}
                className="relative px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold tracking-wide hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("Submit Request")}
              </button>
            </div>
          </form>
        )}
      </GlassCard>
    </div>
  )
}
