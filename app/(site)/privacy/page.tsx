import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Lock, Eye, Phone, Mail } from "lucide-react";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Privacy Policy | KBI Repairs & Technology Services Abu Dhabi",
  description: "Privacy Policy and Data Protection Terms for KBI Repairs and Field Services in Abu Dhabi & UAE.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="adaptive-theme-page min-h-screen bg-[#070B14] text-slate-200 py-12 sm:py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            Official Policy Document
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">Privacy Policy</h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            How KBI Repairs (&quot;KBI.Services&quot;, &quot;we&quot;, &quot;us&quot;) collects, protects, and handles your information across our on-site services, mobile applications, and online portals.
          </p>
          <p className="text-xs text-slate-500">Last Updated: August 2026 • Abu Dhabi, United Arab Emirates</p>
        </div>

        {/* Core Principles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 w-fit">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">End-to-End Encryption</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              All personal data, locations, and service order histories are encrypted in transit and at rest.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 w-fit">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Zero Data Selling</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              We never sell or monetize your phone number, device info, or repair records to third-party advertisers.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 w-fit">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">UAE Cyber Law Compliance</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Fully compliant with UAE Federal Decree-Law No. 45 of 2021 on Personal Data Protection (PDPL).
            </p>
          </div>
        </div>

        {/* Policy Content Sections */}
        <div className="bg-[#0F172A] border border-slate-800/80 rounded-3xl p-6 sm:p-10 space-y-8 text-sm leading-relaxed text-slate-300">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">1.</span> Information We Collect
            </h2>
            <p>
              When you book a service or use the KBI Technician mobile application, we collect essential operational data:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
              <li><strong>Contact Details:</strong> Customer name, phone number, and delivery / service address in UAE.</li>
              <li><strong>Device & Repair Information:</strong> Device model (e.g. iPhone, MacBook), reported fault, diagnostic checklist, and before/after repair photos for quality assurance.</li>
              <li><strong>Geolocation Data:</strong> Real-time GPS location of dispatched technicians to compute accurate arrival times (ETA) and route optimization.</li>
              <li><strong>Digital Sign-Off:</strong> Customer digital signature recorded on device handover to activate 6-month warranty.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">2.</span> How We Use Your Information
            </h2>
            <p>Your information is used strictly to:</p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
              <li>Dispatch certified technicians to your doorstep in Abu Dhabi and across the UAE.</li>
              <li>Send real-time appointment updates and WhatsApp warranty receipts.</li>
              <li>Maintain warranty verification records for replacement parts (6-month warranty).</li>
              <li>Improve service quality through customer reviews and technician ratings.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">3.</span> Device Data & Privacy during Repair
            </h2>
            <p>
              Our technicians operate under strict non-disclosure and privacy protocols. Technicians will <strong>never access personal photos, messages, files, or applications</strong> on your device during screen, battery, or hardware repairs. You are always welcome to observe the entire repair process on-site.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">4.</span> Contact Operations & Data Controller
            </h2>
            <p>If you have any questions regarding your data or wish to request data deletion:</p>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs font-mono">
              <p className="flex items-center gap-2 text-cyan-400">
                <Mail className="w-4 h-4" /> support@kbi.services / operations@kbi.services
              </p>
              <p className="flex items-center gap-2 text-emerald-400">
                <Phone className="w-4 h-4" /> +971 50 249 1034 (Abu Dhabi Headquarters)
              </p>
            </div>
          </section>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition"
          >
            ← Return to KBI Repairs Home
          </Link>
        </div>
      </div>
    </main>
  );
}
