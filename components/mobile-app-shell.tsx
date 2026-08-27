"use client"

import Link from "next/link"
import { ArrowRight, CalendarDays, ChevronRight, Clock3, Laptop, MapPin, Smartphone, Truck } from "lucide-react"
import { useT } from "@/components/language-provider"

const devices = [
  { name: "Mobile Phone", icon: Smartphone, tone: "bg-cyan-50 text-cyan-700 border-cyan-100" },
  { name: "Laptop", icon: Laptop, tone: "bg-violet-50 text-violet-700 border-violet-100" },
]

export function MobileAppShell() {
  const t = useT()

  return (
    <section className="md:hidden min-h-[calc(100vh-4rem)] bg-[#f6f9fb] px-4 pb-8 pt-24 text-slate-950">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">KBI Repair</p>
            <h1 className="mt-2 text-[2.15rem] font-black leading-[1.05] tracking-[-0.05em]">Repair in minutes</h1>
            <div className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-slate-500">
              <MapPin className="h-3.5 w-3.5 text-cyan-600" /> Abu Dhabi · Dubai · Sharjah · Ajman
            </div>
          </div>
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-lg font-black shadow-sm">
            K<span className="text-cyan-600">.</span>
          </div>
        </div>

        <div className="grid gap-3">
          <Link href="/book" className="group flex items-center gap-4 rounded-[1.65rem] border border-cyan-100 bg-cyan-50 p-5 shadow-sm transition-transform active:scale-[0.98]">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-cyan-600 shadow-sm"><CalendarDays className="h-6 w-6" /></span>
            <span className="min-w-0 flex-1"><span className="block text-lg font-extrabold tracking-tight">{t("Book a repair")}</span><span className="mt-1 block text-xs text-slate-600">Choose a device and a time that works for you.</span></span>
            <ArrowRight className="h-5 w-5 text-cyan-600 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="/track" className="group flex items-center gap-4 rounded-[1.65rem] border border-violet-100 bg-violet-50 p-5 shadow-sm transition-transform active:scale-[0.98]">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-violet-600 shadow-sm"><Truck className="h-6 w-6" /></span>
            <span className="min-w-0 flex-1"><span className="block text-lg font-extrabold tracking-tight">{t("Track your order")}</span><span className="mt-1 block text-xs text-slate-600">See your appointment and technician status.</span></span>
            <ArrowRight className="h-5 w-5 text-violet-600 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="rounded-[1.65rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Next appointment</p><p className="mt-1 text-base font-extrabold">Ready when you are</p></div>
            <Clock3 className="h-5 w-5 text-cyan-600" />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">Book an on-site visit and we’ll confirm the quote before any paid repair begins.</p>
          <Link href="/book" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-cyan-700">Start a booking <ChevronRight className="h-4 w-4" /></Link>
        </div>

        <div>
          <div className="mb-3 flex items-end justify-between"><h2 className="text-xl font-black tracking-tight">Popular repairs</h2><Link href="/services" className="text-xs font-bold text-cyan-700">View all</Link></div>
          <div className="grid grid-cols-2 gap-3">
            {devices.map(({ name, icon: Icon, tone }) => (
              <Link key={name} href={`/book?device=${name === "Mobile Phone" ? "mobile" : "laptop"}`} className={`rounded-[1.35rem] border p-4 shadow-sm transition-transform active:scale-[0.98] ${tone}`}>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/80"><Icon className="h-5 w-5" /></span>
                <span className="mt-5 block text-sm font-extrabold">{name}</span>
                <span className="mt-1 block text-[11px] font-medium opacity-70">Book now <ArrowRight className="ml-1 inline h-3 w-3" /></span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[1.65rem] bg-slate-950 p-5 text-white shadow-lg shadow-slate-900/10">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">Simple, clear service</p>
          <h2 className="mt-2 text-xl font-black tracking-tight">You stay in control.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">We diagnose first, explain the options, and only start paid work after your approval.</p>
          <Link href="/about" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-cyan-300">How it works <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </section>
  )
}
