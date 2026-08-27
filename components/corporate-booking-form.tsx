"use client"

import { useState, useTransition } from "react"
import { useT } from "@/components/language-provider"
import { GlassCard } from "@/components/ui/glass-card"
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { submitCorporateBookingAction } from "@/app/actions/corporate-booking"
import { handleStaleServerActionError } from "@/lib/utils"
import Link from "next/link"

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
    privacyConsent: false,
  })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleConsent = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, privacyConsent: e.target.checked }))
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
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl opacity-20 group-hover:opacity-30 blur transition duration-500"></div>
      <GlassCard hoverEffect={false} className="relative border border-border bg-card/95 dark:bg-card/40 backdrop-blur-xl shadow-xl p-4 md:p-6 rounded-3xl">
        {submitted ? (
          <div className="text-center p-8 md:p-12 text-foreground">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-foreground">{t("Request Received")}</h3>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">{t("Thank you for choosing KBI Corporate. Our team has received your request and will contact you using the details provided.")}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 text-foreground p-2">

            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="group/input">
                <label htmlFor="corporate-company" className="block text-xs font-bold text-cyan-700 dark:text-cyan-400 mb-2 uppercase tracking-wider ml-1">{t("Company Name")}</label>
                <input
                  id="corporate-company"
                  name="companyName"
                  autoComplete="organization"
                  value={form.companyName}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-3.5 bg-background border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-foreground transition-all placeholder:text-muted-foreground/60 text-sm font-medium"
                  placeholder={t("e.g. Tech Solutions Ltd")}
                />
              </div>
              <div className="group/input">
                <label htmlFor="corporate-email" className="block text-xs font-bold text-cyan-700 dark:text-cyan-400 mb-2 uppercase tracking-wider ml-1">{t("Company Email")}</label>
                <input
                  id="corporate-email"
                  type="email"
                  name="companyEmail"
                  autoComplete="email"
                  value={form.companyEmail}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-3.5 bg-background border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-foreground transition-all placeholder:text-muted-foreground/60 text-sm font-medium"
                  placeholder={t("contact@company.com")}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="group/input">
                <label htmlFor="corporate-contact" className="block text-xs font-bold text-cyan-700 dark:text-cyan-400 mb-2 uppercase tracking-wider ml-1">{t("Contact Person")}</label>
                <input
                  id="corporate-contact"
                  name="contactName"
                  autoComplete="name"
                  value={form.contactName}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-3.5 bg-background border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-foreground transition-all placeholder:text-muted-foreground/60 text-sm font-medium"
                  placeholder={t("Full Name")}
                />
              </div>
              <div className="group/input">
                <label htmlFor="corporate-mobile" className="block text-xs font-bold text-cyan-700 dark:text-cyan-400 mb-2 uppercase tracking-wider ml-1">{t("Mobile Number")}</label>
                <input
                  id="corporate-mobile"
                  type="tel"
                  name="mobileNumber"
                  inputMode="tel"
                  autoComplete="tel"
                  value={form.mobileNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-3.5 bg-background border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-foreground transition-all placeholder:text-muted-foreground/60 text-sm font-medium"
                  placeholder={t("+971 50 000 0000")}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="group/input">
                <label htmlFor="corporate-location" className="block text-xs font-bold text-cyan-700 dark:text-cyan-400 mb-2 uppercase tracking-wider ml-1">{t("Location")}</label>
                <input
                  id="corporate-location"
                  name="location"
                  autoComplete="street-address"
                  value={form.location}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-3.5 bg-background border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-foreground transition-all placeholder:text-muted-foreground/60 text-sm font-medium"
                  placeholder={t("Office Location / Area")}
                />
              </div>
              <div className="group/input">
                <label htmlFor="corporate-device-count" className="block text-xs font-bold text-cyan-700 dark:text-cyan-400 mb-2 uppercase tracking-wider ml-1">{t("Device Count")}</label>
                <input
                  id="corporate-device-count"
                  type="number"
                  min="1"
                  name="deviceCount"
                  value={form.deviceCount}
                  onChange={handleChange}
                  className="w-full px-5 py-3.5 bg-background border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-foreground transition-all placeholder:text-muted-foreground/60 text-sm font-medium"
                  placeholder={t("Approx. number of devices")}
                />
              </div>
            </div>

            <div className="group/input">
              <label htmlFor="corporate-device-types" className="block text-xs font-bold text-cyan-700 dark:text-cyan-400 mb-2 uppercase tracking-wider ml-1">{t("Device Types")}</label>
              <input
                id="corporate-device-types"
                name="deviceTypes"
                value={form.deviceTypes}
                onChange={handleChange}
                placeholder={t("Phones, Laptops, PC / Desktop, Printers, CCTV, TVs")}
                className="w-full px-5 py-3.5 bg-background border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-foreground transition-all placeholder:text-muted-foreground/60 text-sm font-medium"
              />
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              <input type="checkbox" checked={form.privacyConsent} onChange={handleConsent} required className="mt-1 h-4 w-4 accent-cyan-500" />
              <span>I agree to KBI using these details to respond to this corporate request under the <Link href="/privacy" target="_blank" className="font-semibold text-cyan-700 underline dark:text-cyan-300">Privacy Policy</Link> and <Link href="/terms" target="_blank" className="font-semibold text-cyan-700 underline dark:text-cyan-300">Terms</Link>.</span>
            </label>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="group/input">
                <label htmlFor="corporate-urgency" className="block text-xs font-bold text-cyan-700 dark:text-cyan-400 mb-2 uppercase tracking-wider ml-1">{t("Urgency")}</label>
                <div className="relative">
                  <select
                    id="corporate-urgency"
                    name="urgency"
                    value={form.urgency}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 bg-background border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-foreground transition-all text-sm font-medium appearance-none"
                  >
                    <option value="" className="bg-popover text-popover-foreground">{t("Select Urgency Level")}</option>
                    <option value="Normal" className="bg-popover text-popover-foreground">{t("Normal (24-48h)")}</option>
                    <option value="High" className="bg-popover text-popover-foreground">{t("High (Same Day)")}</option>
                    <option value="Critical" className="bg-popover text-popover-foreground">{t("Critical / production blocker")}</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                  </div>
                </div>
              </div>
              <div className="group/input">
                <label htmlFor="corporate-preferred-time" className="block text-xs font-bold text-cyan-700 dark:text-cyan-400 mb-2 uppercase tracking-wider ml-1">{t("Preferred Time")}</label>
                <input
                  id="corporate-preferred-time"
                  name="preferredTime"
                  value={form.preferredTime}
                  onChange={handleChange}
                  placeholder={t("e.g. Tomorrow 10AM")}
                  className="w-full px-5 py-3.5 bg-background border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-foreground transition-all placeholder:text-muted-foreground/60 text-sm font-medium"
                />
              </div>
            </div>

            <div className="group/input">
              <label htmlFor="corporate-notes" className="block text-xs font-bold text-cyan-700 dark:text-cyan-400 mb-2 uppercase tracking-wider ml-1">{t("Additional Notes")}</label>
              <textarea
                id="corporate-notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-5 py-3.5 bg-background border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-foreground transition-all placeholder:text-muted-foreground/60 text-sm font-medium resize-none"
                placeholder={t("Describe specific issues or requirements...")}
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isPending || !form.privacyConsent}
                className="relative px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold tracking-wide hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm shadow-md"
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
