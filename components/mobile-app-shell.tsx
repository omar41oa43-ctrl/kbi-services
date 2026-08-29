"use client"

import Link from "next/link"
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  Laptop,
  MapPin,
  Smartphone,
  Truck,
  Printer,
  Tv,
  Tablet,
  Gamepad2,
  Watch,
  Camera,
  MonitorUp,
  Wifi,
  Headset,
  PcCase,
} from "lucide-react"
import { useLanguage, useT } from "@/components/language-provider"

const homeDevices = [
  { id: "mobile", name: "Mobile Phone", icon: Smartphone, tone: "bg-cyan-50 text-cyan-900 border-cyan-200/90 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800/50" },
  { id: "laptop", name: "Laptop", icon: Laptop, tone: "bg-blue-50 text-blue-900 border-blue-200/90 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50" },
  { id: "pc", name: "PC / Desktop Computer", icon: PcCase, tone: "bg-indigo-50 text-indigo-900 border-indigo-200/90 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/50", featured: true },
  { id: "printer", name: "Printer", icon: Printer, tone: "bg-teal-50 text-teal-900 border-teal-200/90 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/50" },
  { id: "tablet", name: "Tablet", icon: Tablet, tone: "bg-sky-50 text-sky-900 border-sky-200/90 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/50" },
  { id: "tv", name: "TV", icon: Tv, tone: "bg-purple-50 text-purple-900 border-purple-200/90 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50" },
  { id: "gaming", name: "PlayStation / Xbox", icon: Gamepad2, tone: "bg-rose-50 text-rose-900 border-rose-200/90 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50", featured: true },
  { id: "apple-watch", name: "Apple Watch", icon: Watch, tone: "bg-amber-50 text-amber-900 border-amber-200/90 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50" },
  { id: "cctv", name: "CCTV", icon: Camera, tone: "bg-emerald-50 text-emerald-900 border-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50" },
  { id: "monitor", name: "Monitor Repair", icon: MonitorUp, tone: "bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-800/60" },
  { id: "networking", name: "WiFi & Networking", icon: Wifi, tone: "bg-violet-50 text-violet-900 border-violet-200/90 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/50" },
  { id: "tech-support", name: "IT Support", icon: Headset, tone: "bg-cyan-50 text-cyan-900 border-cyan-200/90 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800/50" },
]

export function MobileAppShell() {
  const t = useT()
  const { lang } = useLanguage()
  const isAr = lang === "ar"

  return (
    <section className="md:hidden min-h-[calc(100vh-4rem)] bg-[#f6f9fb] dark:bg-slate-950 px-4 pb-12 pt-24 text-slate-950 dark:text-white">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">KBI Repair</p>
            <h1 className="mt-2 text-[2.15rem] font-black leading-[1.05] tracking-[-0.05em] text-slate-950 dark:text-white">
              {t("Repair in minutes")}
            </h1>
            <div className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <MapPin className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              {t("Abu Dhabi · Dubai · Sharjah · Ajman")}
            </div>
          </div>
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-lg font-black shadow-sm">
            K<span className="text-cyan-600 dark:text-cyan-400">.</span>
          </div>
        </div>

        <div className="grid gap-3">
          <Link href="/book" className="group flex items-center gap-4 rounded-[1.65rem] border border-cyan-100 dark:border-cyan-900/40 bg-cyan-50 dark:bg-cyan-950/30 p-5 shadow-sm transition-transform active:scale-[0.98]">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm"><CalendarDays className="h-6 w-6" /></span>
            <span className="min-w-0 flex-1"><span className="block text-lg font-extrabold tracking-tight">{t("Book a repair")}</span><span className="mt-1 block text-xs text-slate-600 dark:text-slate-300">{t("Choose a device and a time that works for you.")}</span></span>
            <ArrowRight className="h-5 w-5 text-cyan-600 dark:text-cyan-400 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="/track" className="group flex items-center gap-4 rounded-[1.65rem] border border-violet-100 dark:border-violet-900/40 bg-violet-50 dark:bg-violet-950/30 p-5 shadow-sm transition-transform active:scale-[0.98]">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm"><Truck className="h-6 w-6" /></span>
            <span className="min-w-0 flex-1"><span className="block text-lg font-extrabold tracking-tight">{t("Track your order")}</span><span className="mt-1 block text-xs text-slate-600 dark:text-slate-300">{t("See your appointment and technician status.")}</span></span>
            <ArrowRight className="h-5 w-5 text-violet-600 dark:text-violet-400 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Full Device Catalog Section */}
        <div>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                {t("Select Your Device")}
              </p>
              <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">
                {t("What needs repair today?")}
              </h2>
            </div>
            <Link href="/services" className="text-xs font-bold text-cyan-700 dark:text-cyan-400 hover:underline">
              {t("View all")}
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {homeDevices.map(({ id, name, icon: Icon, tone, featured }) => (
              <Link
                key={id}
                href={`/book?device=${id}`}
                className={`relative rounded-[1.35rem] border p-4 shadow-xs transition-all active:scale-[0.97] hover:shadow-md ${tone}`}
              >
                {featured ? (
                  <span className="absolute top-2.5 right-2.5 rounded-full bg-cyan-600 text-white dark:bg-cyan-500 text-[9px] font-extrabold px-2 py-0.5 tracking-wider uppercase shadow-xs">
                    {t("Popular")}
                  </span>
                ) : null}
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/90 dark:bg-slate-900/90 shadow-xs">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="mt-3.5 block text-sm font-extrabold leading-snug line-clamp-2">
                  {t(name)}
                </span>
                <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold opacity-75">
                  {t("Book now")} <ArrowRight className={`h-3 w-3 ${isAr ? "rotate-180" : ""}`} />
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[1.65rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{t("Next appointment")}</p><p className="mt-1 text-base font-extrabold">{t("Ready when you are")}</p></div>
            <Clock3 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {t("Book an on-site visit and we’ll confirm the quote before any paid repair begins.")}
          </p>
          <Link href="/book" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-cyan-700 dark:text-cyan-400">
            {t("Start a booking")} <ChevronRight className={`h-4 w-4 ${isAr ? "rotate-180" : ""}`} />
          </Link>
        </div>

        <div className="rounded-[1.65rem] bg-slate-950 p-5 text-white shadow-lg shadow-slate-900/10 border border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">{t("Simple, clear service")}</p>
          <h2 className="mt-2 text-xl font-black tracking-tight">{t("You stay in control.")}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{t("We diagnose first, explain the options, and only start paid work after your approval.")}</p>
          <Link href="/about" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-cyan-300">
            {t("How it works")} <ArrowRight className={`h-4 w-4 ${isAr ? "rotate-180" : ""}`} />
          </Link>
        </div>
      </div>
    </section>
  )
}
