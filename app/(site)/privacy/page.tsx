import type { Metadata } from "next"
import Link from "next/link"
import { LockKeyhole, Mail, Phone, ShieldCheck } from "lucide-react"
import { getSiteContact } from "@/lib/site-contact"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How KBI collects, uses, shares, retains, and protects personal information for bookings and on-site repair services in the UAE.",
  alternates: { canonical: "/privacy" },
}

const policySections = [
  {
    title: "1. Who controls your information",
    body: "KBI GLOBAL TECHNOLOGIES, trading as KBI Repairs, is responsible for the personal information described in this policy. The current contact details are listed below and on our Contact page.",
  },
  {
    title: "2. Information we collect",
    body: "We may collect your name, phone and WhatsApp number, service address, selected location, device type, brand, model, reported fault, booking preferences, communications, quotation and payment records, warranty details, service photos, signatures, and order-status history. If you choose Detect Location, the browser may provide coordinates after you grant permission. We also receive basic security and analytics data such as IP address, device/browser type, page interactions, and cookie preferences.",
  },
  {
    title: "3. Why we use it",
    body: "We use information to create and manage bookings, dispatch technicians, communicate about appointments, diagnose and complete approved work, issue quotations and invoices, provide order tracking and warranty support, prevent fraud and abuse, maintain security, comply with legal obligations, and improve our service. Marketing messages are sent only where permitted, and you can ask us to stop them at any time.",
  },
  {
    title: "4. Legal grounds",
    body: "Depending on the activity, processing is necessary to take steps at your request or perform a service contract, comply with law, protect legitimate operational and security interests, or act on your consent—for example, when you choose to share precise location or accept optional analytics cookies.",
  },
  {
    title: "5. Who receives information",
    body: "Information is shared only as reasonably necessary with assigned technicians, customer-support personnel, hosting and database providers, communications providers, payment or invoicing providers, analytics providers you consent to, professional advisers, and competent public authorities where legally required. We do not sell personal information.",
  },
  {
    title: "6. Device access and repair privacy",
    body: "Hardware work normally does not require access to personal files or accounts. If a diagnostic or software task requires unlocking the device, the technician should explain why and request your permission. You may enter account credentials yourself. Back up important data and remove highly confidential material before service where practical.",
  },
  {
    title: "7. Retention",
    body: "Booking, invoice, warranty, complaint, and security records are retained only for operational, warranty, accounting, dispute, fraud-prevention, and legal requirements. Retention periods vary by record type. When information is no longer needed, we delete or anonymize it where reasonably possible.",
  },
  {
    title: "8. Security and international processing",
    body: "We use access controls, encrypted network connections, role-based permissions, logging, backups, and service-provider safeguards appropriate to the information and risk. No system can be guaranteed completely secure. Some providers may process information outside the UAE; where this occurs, we use contractual or other safeguards required by applicable law.",
  },
  {
    title: "9. Your choices and rights",
    body: "Subject to applicable law, you may ask for access, correction, deletion, restriction, portability, withdrawal of consent, or information about how your data is handled. We may need to verify your identity and may retain information where law or an unresolved transaction requires it. Browser permissions and optional analytics cookies can be refused or withdrawn without preventing basic booking functionality.",
  },
  {
    title: "10. Children, updates, and complaints",
    body: "Our services are not directed to children acting without a parent or guardian. We may update this policy and will publish the effective date. Contact us first with privacy questions or complaints; you may also contact the competent UAE data-protection authority where applicable.",
  },
]

export default async function PrivacyPolicyPage() {
  const contact = await getSiteContact()

  return (
    <main className="adaptive-theme-page min-h-screen bg-[#070B14] px-4 py-20 text-slate-200 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-300">
            <ShieldCheck className="h-4 w-4" /> Privacy notice
          </div>
          <h1 className="text-3xl font-extrabold text-white sm:text-5xl">Privacy Policy</h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">A plain-language explanation of how information is handled when you use KBI websites, booking tools, tracking, communications, and repair services.</p>
          <p className="mt-3 text-xs text-slate-500">Effective 27 August 2026 · United Arab Emirates</p>
        </header>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            [LockKeyhole, "Purpose limited", "We use data for the service, security, legal obligations, and choices you approve."],
            [ShieldCheck, "Access controlled", "Only personnel and providers who need information for their role should receive it."],
            [Mail, "No data sales", "We do not sell personal information to advertisers or data brokers."],
          ].map(([Icon, title, text]) => {
            const CardIcon = Icon as typeof LockKeyhole
            return <div key={String(title)} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5"><CardIcon className="mb-3 h-5 w-5 text-cyan-300" /><h2 className="font-bold text-white">{String(title)}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{String(text)}</p></div>
          })}
        </div>

        <div className="space-y-6 rounded-3xl border border-slate-800 bg-slate-950/70 p-6 sm:p-10">
          {policySections.map((section) => (
            <section key={section.title} className="border-b border-slate-800 pb-6 last:border-0 last:pb-0">
              <h2 className="text-lg font-bold text-white">{section.title}</h2>
              <p className="mt-2 leading-7 text-slate-300">{section.body}</p>
            </section>
          ))}
        </div>

        <aside className="mt-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
          <h2 className="font-bold text-white">Privacy requests</h2>
          <p className="mt-2 text-sm text-slate-300">Include your name, phone number, request, and relevant order reference. Do not email device passwords or payment-card details.</p>
          <div className="mt-4 flex flex-col gap-2 text-sm text-slate-300 sm:flex-row sm:gap-6">
            <a className="inline-flex items-center gap-2 hover:text-cyan-300" href={`mailto:${contact.email}`}><Mail className="h-4 w-4" />{contact.email}</a>
            <a className="inline-flex items-center gap-2 hover:text-cyan-300" href={`tel:${contact.phone}`}><Phone className="h-4 w-4" />{contact.phoneDisplay}</a>
            <Link className="hover:text-cyan-300" href="/terms">Terms &amp; Conditions</Link>
          </div>
        </aside>
      </div>
    </main>
  )
}
