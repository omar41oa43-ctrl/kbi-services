import type { Metadata } from "next"
import { CheckCircle2, ShieldCheck } from "lucide-react"

import { AccountDeletionForm } from "@/components/account-deletion-form"

export const metadata: Metadata = {
  title: "Delete KBI Technician Account",
  description: "Request permanent deletion of a KBI Technician account and associated profile data.",
  alternates: { canonical: "/account-deletion" },
  robots: { index: true, follow: true },
}

export default function AccountDeletionPage() {
  return (
    <main className="min-h-screen bg-[#030405] px-4 py-24 text-white sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-[#1ECBC7]" />
          <h1 className="text-3xl font-extrabold sm:text-5xl">Delete your KBI Technician account</h1>
          <p className="mt-4 text-lg text-slate-300">حذف حساب تطبيق فني KBI نهائيًا</p>
        </div>

        <div className="mb-8 space-y-4 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-6 sm:p-8">
          <p className="leading-7 text-slate-200">You can delete your account immediately in the app from Profile → Settings &amp; Security → Delete Account. If you cannot access the app, submit the form below. We verify ownership before deletion.</p>
          <p dir="rtl" className="leading-7 text-slate-200">يمكنك حذف الحساب مباشرة من التطبيق عبر الملف الشخصي ← الإعدادات والأمان ← حذف الحساب. إذا تعذر دخول التطبيق، أرسل الطلب أدناه وسنتحقق من ملكية الحساب قبل الحذف.</p>
          <div className="flex gap-3 text-sm text-slate-300"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1ECBC7]" /><p>Profile, registration documents, device tokens and authentication account are deleted. Financial, invoice or work records may be retained only where required for accounting, disputes, fraud prevention or UAE law.</p></div>
        </div>

        <AccountDeletionForm />
      </div>
    </main>
  )
}
