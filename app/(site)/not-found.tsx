import Link from "next/link"
import { AlertCircle, Home } from "lucide-react"

export default function NotFound() {
  return (
    <main className="adaptive-theme-page min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center relative overflow-hidden font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-cyan-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.05),transparent_60%)]" />
      </div>

      <div className="relative z-10 max-w-lg w-full rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 md:p-12 shadow-[0_30px_90px_-55px_rgba(6,182,212,0.45)] ring-1 ring-white/10">
        <div className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-8 animate-pulse">
          <AlertCircle className="w-10 h-10 text-cyan-400" />
        </div>

        <h1 className="text-7xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-white/70 mb-4">
          404
        </h1>

        <h2 className="text-2xl font-bold mb-3 text-white">
          Page Not Found / الصفحة غير موجودة
        </h2>

        <p className="text-white/60 mb-8 max-w-md mx-auto leading-relaxed text-sm">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          <span className="block mt-2 font-arabic" dir="rtl">
            الصفحة التي تبحث عنها قد تكون حُذفت، تم تغيير اسمها، أو أنها غير متاحة مؤقتاً.
          </span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-cyan-500 text-black font-semibold hover:bg-cyan-400 transition-colors shadow-[0_0_15px_-3px_rgba(6,182,212,0.5)] text-sm"
          >
            <Home className="w-4 h-4" />
            Go to Homepage / الرئيسية
          </Link>
          <a
            href="https://wa.me/971502491034"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-sm"
          >
            Support / الدعم الفني
          </a>
        </div>
      </div>
    </main>
  )
}
