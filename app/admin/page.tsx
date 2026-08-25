"use client"

import { useEffect, useState } from "react"
import { RepairOperationsHub } from "@/components/admin/repair-operations-hub"
import { useT } from "@/components/language-provider"
import { getDashboardStatsAction } from "@/app/actions/admin-dashboard"
import Link from "next/link"
import { ArrowRight, Loader2 } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { useRef } from "react"
import { cn } from "@/lib/utils"

import { auth } from "@/firebase/authClient"

export default function AdminDashboard() {
  const t = useT()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const isMounted = useRef(true)

  const [stats, setStats] = useState({
    totalOrders: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    todayOrders: 0,
    totalTechs: 0,
    totalDevices: 0,
    corpRequests: 0,
    totalRevenue: 0,
    avgTicket: 0,
  })

  useEffect(() => {
    isMounted.current = true
    setMounted(true)
    return () => {
      isMounted.current = false
    }
  }, [])

  const loadDashboard = async () => {
    // if (loading && stats.totalOrders > 0) return // Already loading
    setLoading(true)
    try {
      const user = auth.currentUser
      const idToken = user ? await user.getIdToken() : undefined
      const data = await getDashboardStatsAction(idToken)
      if (isMounted.current && data?.stats) {
        setStats(data.stats)
      }
    } catch (e: any) {
      if (!isMounted.current) return
      // Ignore abort errors - they happen when navigating away
      const errorStr = String(e?.message || e?.name || "").toLowerCase()
      if (errorStr.includes('abort') || errorStr.includes('cancelled') || errorStr.includes('aborted')) return
      // Handle other errors
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }

  useEffect(() => {
    if (!mounted) return
    loadDashboard()
  }, [refreshKey, mounted]) // Depend on refreshKey to allow manual refresh, and mounted to ensure we only run when ready

  const handleRefresh = () => {
    setRefreshKey(k => k + 1)
  }

  const hubData = {
    totalOrders: stats.totalOrders || 0,
    totalRevenue: stats.totalRevenue || 0,
    avgOrderValue: stats.avgTicket || 0,
    dailyAverage: Math.round((stats.todayOrders || 0)),
    orderBreakdown: [
      { type: "Device Repair", orders: Math.round((stats.totalOrders || 0) * 0.46), color: "#06b6d4" },
      { type: "Installation", orders: Math.round((stats.totalOrders || 0) * 0.25), color: "#8b5cf6" },
      { type: "Technical Support", orders: Math.round((stats.totalOrders || 0) * 0.20), color: "#f59e0b" },
      { type: "Other Services", orders: Math.round((stats.totalOrders || 0) * 0.09), color: "#6b7280" }
    ],
    trends: {
      todayVsYesterday: { current: stats.todayOrders || 38, previous: 32 },
      weekVsLastWeek: { current: Math.round((stats.totalOrders || 245) * 0.2), previous: 218 },
      monthVsLastMonth: { current: stats.totalOrders || 1248, previous: 1115 }
    },
    insights: {
      highestGrowing: "Device Repair (+18%)",
      lowestPerforming: "Other Services (-5%)",
      peakDay: "Monday"
    },
    alerts: stats.overdue > 0
      ? [{ type: "danger" as const, message: `${stats.overdue} overdue orders need attention`, metric: `${t("Requires action")}` }]
      : [{ type: "warning" as const, message: "Monitor completion rate", metric: `${t("Current")}: ${stats.completed}` }]
  }

  if (loading && !mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 p-4 sm:p-5">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -inset-1 rounded-2xl bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="absolute -bottom-28 -left-24 w-72 h-72 rounded-full bg-purple-500/10 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-cyan-200">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              {t("Admin Panel")}
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white">{t("Dashboard Overview")}</h2>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/orders"
              className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 hover:text-cyan-200 transition-all text-sm font-semibold shadow-[0_12px_30px_-18px_rgba(6,182,212,0.8)]"
            >
              <span className="text-lg">📦</span>
              {t("View All Orders")}
              <ArrowRight className={cn("w-4 h-4 transition-transform group-hover:translate-x-0.5")} />
            </Link>
          </div>
        </div>
      </div>

      <RepairOperationsHub
        data={hubData}
        loading={loading}
        onRefresh={handleRefresh}
      />
    </div>
  )
}
