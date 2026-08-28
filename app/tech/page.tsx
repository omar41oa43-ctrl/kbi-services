"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth"
import { AlertCircle, ArrowRight, CalendarDays, CheckCircle2, Clock3, LogOut, MapPin, MessageCircle, Phone, RefreshCw, Settings2, Truck, UserRound, Wrench } from "lucide-react"
import { auth } from "@/firebase/authClient"

type Job = {
  id: string
  orderNumber?: string
  customer?: { name?: string; phone?: string; address?: string }
  device?: string
  service?: string
  status?: string
  scheduledAt?: string
  address?: string
  totalCost?: number
}

const statusLabel: Record<string, string> = { PENDING: "New request", REVIEWING: "Needs review", ASSIGNED: "Assigned", ON_THE_WAY: "On the way", ARRIVED: "Arrived", IN_PROGRESS: "In progress", COMPLETED: "Completed" }

export default function TechnicianAppPage() {
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [tab, setTab] = useState<"today" | "jobs" | "profile">("today")
  const [actionId, setActionId] = useState<string | null>(null)

  useEffect(() => onAuthStateChanged(auth, (next) => { setUser(next); setLoading(false) }), [])

  const loadJobs = async (currentUser: User) => {
    setRefreshing(true); setError("")
    try {
      const token = await currentUser.getIdToken()
      const response = await fetch("/api/technician/jobs", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "Unable to load jobs")
      setJobs(Array.isArray(body.jobs) ? body.jobs : [])
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load jobs") }
    finally { setRefreshing(false) }
  }

  useEffect(() => { if (user) void loadJobs(user) }, [user])

  const activeJob = useMemo(() => jobs.find((job) => !["COMPLETED", "CANCELLED"].includes(String(job.status).toUpperCase())), [jobs])
  const availableJobs = jobs.filter((job) => ["PENDING", "REVIEWING"].includes(String(job.status).toUpperCase()))

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault(); setError("")
    try { await signInWithEmailAndPassword(auth, email.trim(), password) }
    catch { setError("Check your email and password, then try again.") }
  }

  const updateJob = async (job: Job, action: "accept" | "status", nextStatus?: string) => {
    if (!user) return
    setActionId(job.id); setError("")
    try {
      const token = await user.getIdToken()
      const endpoint = action === "accept" ? `/api/technician/jobs/${job.id}/accept` : `/api/technician/jobs/${job.id}/status`
      const response = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: action === "status" ? JSON.stringify({ status: nextStatus }) : undefined })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "Unable to update job")
      await loadJobs(user)
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update job") }
    finally { setActionId(null) }
  }

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#f6f9fb] text-slate-500"><RefreshCw className="h-5 w-5 animate-spin" /></main>
  if (!user) return <main className="min-h-screen bg-[#f6f9fb] px-5 py-12 text-slate-950"><div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-sm flex-col justify-center"><div className="mb-8"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-lg font-black text-white">K<span className="text-cyan-400">.</span></div><p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Technician workspace</p><h1 className="mt-2 text-4xl font-black tracking-[-0.05em]">Ready for your next job?</h1><p className="mt-3 text-sm leading-6 text-slate-600">Sign in to view assignments, navigate to customers, and close work orders.</p></div><form onSubmit={handleLogin} className="space-y-3 rounded-[1.65rem] border border-slate-200 bg-white p-5 shadow-sm"><label className="block text-xs font-bold text-slate-600">Work email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-cyan-500" /></label><label className="block text-xs font-bold text-slate-600">Password<input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-cyan-500" /></label>{error && <p className="flex items-center gap-2 text-xs font-semibold text-red-600"><AlertCircle className="h-4 w-4" />{error}</p>}<button className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white transition-transform active:scale-[0.98]">Sign in <ArrowRight className="h-4 w-4" /></button></form></div></main>

  const initials = (user.displayName || user.email || "KBI").slice(0, 2).toUpperCase()
  return <main className="min-h-screen bg-[#f6f9fb] pb-8 text-slate-950"><div className="mx-auto w-full max-w-xl px-4 pb-10 pt-8"><header className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">KBI Field Ops</p><h1 className="mt-1 text-3xl font-black tracking-[-0.05em]">Good to see you.</h1><p className="mt-1 text-sm text-slate-500">Your day at a glance</p></div><div className="flex items-center gap-2"><button onClick={() => user && void loadJobs(user)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600" aria-label="Refresh jobs"><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /></button><button onClick={() => setTab("profile")} className="grid h-10 w-10 overflow-hidden place-items-center rounded-xl bg-slate-950 text-xs font-black text-white" aria-label="Open profile">{user.photoURL ? <img src={user.photoURL} alt="" className="h-full w-full object-cover" /> : initials}</button></div></header>
      <section className="mt-6 grid grid-cols-3 gap-2"><div className="rounded-2xl bg-slate-950 p-4 text-white"><p className="text-2xl font-black">{jobs.filter((j) => !["COMPLETED", "CANCELLED"].includes(String(j.status).toUpperCase())).length}</p><p className="mt-1 text-[11px] font-semibold text-slate-300">Active jobs</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-2xl font-black text-cyan-700">{availableJobs.length}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">New requests</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-2xl font-black text-violet-700">{jobs.filter((j) => String(j.status).toUpperCase() === "COMPLETED").length}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">Completed</p></div></section>
      {error && <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-700"><AlertCircle className="h-4 w-4" />{error}</div>}
      {tab === "profile" ? <section className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-4"><div className="grid h-16 w-16 overflow-hidden place-items-center rounded-2xl bg-slate-950 text-lg font-black text-white">{user.photoURL ? <img src={user.photoURL} alt="" className="h-full w-full object-cover" /> : initials}</div><div><h2 className="text-lg font-black">{user.displayName || "KBI Technician"}</h2><p className="text-sm text-slate-500">{user.email}</p></div></div><div className="mt-6 grid gap-3"><button className="flex h-11 items-center gap-3 rounded-xl bg-slate-50 px-4 text-sm font-bold text-slate-700"><UserRound className="h-4 w-4 text-cyan-700" />Profile settings</button><button onClick={() => void signOut(auth)} className="flex h-11 items-center gap-3 rounded-xl bg-red-50 px-4 text-sm font-bold text-red-700"><LogOut className="h-4 w-4" />Sign out</button></div></section> : <><section className="mt-6"><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-black tracking-tight">Current job</h2><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">{activeJob ? "Live" : "Standby"}</span></div>{activeJob ? <JobCard job={activeJob} featured actionId={actionId} onAction={updateJob} /> : <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-6 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-cyan-50 text-cyan-700"><Wrench className="h-6 w-6" /></div><p className="mt-3 font-extrabold">No active job</p><p className="mt-1 text-sm text-slate-500">New assignments will appear here automatically.</p></div>}</section><section className="mt-7"><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-black tracking-tight">Requests to review</h2><span className="text-xs font-bold text-slate-400">{availableJobs.length} total</span></div><div className="space-y-3">{availableJobs.length ? availableJobs.map((job) => <JobCard key={job.id} job={job} actionId={actionId} onAction={updateJob} />) : <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">You’re all caught up.</p>}</div></section></>}
      <nav className="mt-8 grid grid-cols-3 gap-2"><button onClick={() => setTab("today")} className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-bold ${tab === "today" ? "bg-cyan-50 text-cyan-800" : "bg-white text-slate-500"}`}><CalendarDays className="h-4 w-4" />Today</button><button onClick={() => setTab("jobs")} className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-bold ${tab === "jobs" ? "bg-violet-50 text-violet-800" : "bg-white text-slate-500"}`}><Truck className="h-4 w-4" />Jobs</button><button onClick={() => setTab("profile")} className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-bold ${tab === "profile" ? "bg-slate-100 text-slate-800" : "bg-white text-slate-500"}`}><Settings2 className="h-4 w-4" />Profile</button></nav>
    </div></main>
}

function JobCard({ job, featured = false, actionId, onAction }: { job: Job; featured?: boolean; actionId?: string | null; onAction?: (job: Job, action: "accept" | "status", nextStatus?: string) => void }) {
  const status = String(job.status || "PENDING").toUpperCase()
  const customer = job.customer?.name || "Customer"
  const location = job.address || job.customer?.address || "Customer location"
  const isNew = ["PENDING", "REVIEWING"].includes(status)
  const nextStatus = status === "ASSIGNED" ? "ON_THE_WAY" : status === "ON_THE_WAY" ? "ARRIVED" : status === "ARRIVED" ? "IN_PROGRESS" : status === "IN_PROGRESS" ? "COMPLETED" : undefined
  return <article className={`rounded-[1.5rem] border p-5 shadow-sm ${featured ? "border-cyan-200 bg-cyan-50" : "border-slate-200 bg-white"}`}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{job.orderNumber || `Job #${job.id.slice(0, 8)}`}</p><h3 className="mt-1 text-lg font-black">{job.device || "Device repair"}</h3><p className="mt-1 text-sm font-semibold text-slate-600">{job.service || "On-site service"} · {customer}</p></div><span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-cyan-700 shadow-sm">{statusLabel[status] || status}</span></div><div className="mt-4 grid gap-2 text-xs font-medium text-slate-600"><span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-cyan-600" />{location}</span><span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-cyan-600" />{job.scheduledAt ? new Date(job.scheduledAt).toLocaleString() : "Schedule to be confirmed"}</span></div><div className="mt-5 grid grid-cols-2 gap-2"><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`} target="_blank" rel="noreferrer" className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800"><MapPin className="h-4 w-4" />Navigate</a>{job.customer?.phone ? <a href={`tel:${job.customer.phone}`} className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800"><Phone className="h-4 w-4" />Call</a> : null}</div>{isNew && onAction ? <button onClick={() => onAction(job, "accept")} disabled={actionId === job.id} className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-xs font-bold text-white disabled:opacity-60">{actionId === job.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Accept job</button> : nextStatus && onAction ? <button onClick={() => onAction(job, "status", nextStatus)} disabled={actionId === job.id} className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 text-xs font-bold text-white disabled:opacity-60">{actionId === job.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}Mark {statusLabel[nextStatus]}</button> : null}</article>
}
