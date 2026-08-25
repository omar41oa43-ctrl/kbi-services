"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { useT } from "@/components/language-provider"
import { cn } from "@/lib/utils"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Wrench,
  Monitor,
  Headphones,
  MoreHorizontal,
  Clock,
  Calendar,
  RefreshCw,
  AlertTriangle,
  Zap,
  Award,
  Activity,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Loader2
} from "lucide-react"
import nextDynamic from "next/dynamic"

const ResponsiveContainer = nextDynamic(() => import("recharts").then((m) => m.ResponsiveContainer as any), { ssr: false }) as any
const PieChart = nextDynamic(() => import("recharts").then((m) => m.PieChart as any), { ssr: false }) as any
const Pie = nextDynamic(() => import("recharts").then((m) => m.Pie as any), { ssr: false }) as any
const Cell = nextDynamic(() => import("recharts").then((m) => m.Cell as any), { ssr: false }) as any
const BarChart = nextDynamic(() => import("recharts").then((m) => m.BarChart as any), { ssr: false }) as any
const Bar = nextDynamic(() => import("recharts").then((m) => m.Bar as any), { ssr: false }) as any
const XAxis = nextDynamic(() => import("recharts").then((m) => m.XAxis as any), { ssr: false }) as any
const YAxis = nextDynamic(() => import("recharts").then((m) => m.YAxis as any), { ssr: false }) as any
const CartesianGrid = nextDynamic(() => import("recharts").then((m) => m.CartesianGrid as any), { ssr: false }) as any
const Tooltip = nextDynamic(() => import("recharts").then((m) => m.Tooltip as any), { ssr: false }) as any

interface MetricCardProps {
  title: string
  value: number | string
  icon: React.ElementType
  trend?: {
    value: number
    isPositive: boolean
  }
  prefix?: string
  suffix?: string
  sparklineData?: number[]
  colorClass?: string
  onClick?: () => void
  loading?: boolean
}

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number, prefix?: string, suffix?: string }) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    const duration = 1000
    const steps = 30
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayed(value)
        clearInterval(timer)
      } else {
        setDisplayed(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])

  return <span>{prefix}{displayed.toLocaleString()}{suffix}</span>
}

function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  prefix = "",
  suffix = "",
  colorClass = "text-cyan-400",
  onClick,
  loading = false
}: MetricCardProps) {
  const t = useT()

  if (loading) {
    return (
      <GlassCard className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-24 bg-white/10 rounded" />
          <div className="h-8 w-32 bg-white/10 rounded" />
          <div className="h-3 w-20 bg-white/10 rounded" />
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard
      as={onClick ? "button" : "div"}
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden bg-gradient-to-br from-white/5 to-white/2 border border-white/10 p-5 cursor-pointer text-start w-full",
        "hover:border-cyan-500/30 hover:shadow-[0_12px_40px_-20px_rgba(6,182,212,0.5)] transition-all duration-300 active:scale-95"
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(6,182,212,0.05)_0%,transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60 font-medium">{title}</span>
          <div className={cn("p-2 rounded-lg bg-white/5", colorClass)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>

        <div className="text-3xl font-bold text-white tracking-tight">
          {typeof value === "number" ? (
            <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
          ) : (
            <>{prefix}{value}{suffix}</>
          )}
        </div>

        {trend && (
          <div className={cn(
            "inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            trend.isPositive
              ? "bg-green-500/15 text-green-400"
              : "bg-red-500/15 text-red-400"
          )}>
            {trend.isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{trend.isPositive ? "+" : ""}{trend.value}%</span>
            <span className="text-white/40">{t("vs last month")}</span>
          </div>
        )}
      </div>
    </GlassCard>
  )
}

interface DonutChartProps {
  data: { name: string; value: number; color: string }[]
  centerLabel?: string
  centerValue?: string
}

function DonutChart({ data, centerLabel, centerValue }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15, 15, 15, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              padding: "12px"
            }}
            itemStyle={{ color: "#fff" }}
            formatter={(value: number, name: string) => [
              `${((value / total) * 100).toFixed(1)}%`,
              name
            ]}
          />
        </PieChart>
      </ResponsiveContainer>

      {centerValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-3xl font-bold text-white">{centerValue}</div>
          <div className="text-xs text-white/50">{centerLabel}</div>
        </div>
      )}
    </div>
  )
}

interface TrendComparisonProps {
  label: string
  current: number
  previous: number
}

function TrendComparison({ label, current, previous }: TrendComparisonProps) {
  const change = previous !== 0 ? ((current - previous) / previous) * 100 : 0
  const isPositive = change >= 0

  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-white/40" />
        <span className="text-sm text-white/70">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-white">{current}</span>
        <div className={cn(
          "flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full",
          isPositive ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
        )}>
          {isPositive ? (
            <ArrowUpRight className="w-3 h-3" />
          ) : (
            <ArrowDownRight className="w-3 h-3" />
          )}
          {Math.abs(change).toFixed(1)}%
        </div>
      </div>
    </div>
  )
}

interface InsightCardProps {
  type: "success" | "warning" | "info"
  title: string
  description: string
  icon: React.ElementType
}

function InsightCard({ type, title, description, icon: Icon }: InsightCardProps) {
  const colors = {
    success: "from-green-500/20 to-green-500/5 border-green-500/20",
    warning: "from-yellow-500/20 to-yellow-500/5 border-yellow-500/20",
    info: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/20"
  }
  const icons = {
    success: "text-green-400",
    warning: "text-yellow-400",
    info: "text-cyan-400"
  }

  return (
    <div className={cn(
      "p-4 rounded-xl bg-gradient-to-br border backdrop-blur-sm",
      colors[type]
    )}>
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg bg-white/5", icons[type])}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-white/50 mt-0.5">{description}</p>
        </div>
      </div>
    </div>
  )
}

interface AlertCardProps {
  type: "danger" | "warning"
  message: string
  metric?: string
}

function AlertCard({ type, message, metric }: AlertCardProps) {
  const colors = {
    danger: "from-red-500/15 to-red-500/5 border-red-500/30",
    warning: "from-yellow-500/15 to-yellow-500/5 border-yellow-500/30"
  }
  const icons = {
    danger: "text-red-400",
    warning: "text-yellow-400"
  }

  return (
    <div className={cn(
      "p-3 rounded-lg border backdrop-blur-sm flex items-center gap-3",
      colors[type]
    )}>
      <AlertTriangle className={cn("w-4 h-4 shrink-0", icons[type])} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/90">{message}</p>
        {metric && <p className="text-xs text-white/40 mt-0.5">{metric}</p>}
      </div>
    </div>
  )
}

interface BreakdownItem {
  type: string
  orders: number
  color: string
  trend?: number
}

function BreakdownList({ items, totalOrders }: { items: BreakdownItem[], totalOrders: number }) {
  const t = useT()

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm font-medium text-white">{item.type}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/70">{item.orders} {t("orders")}</span>
              <span className="text-xs font-semibold text-white/50">
                {totalOrders > 0 ? ((item.orders / totalOrders) * 100).toFixed(1) : "0.0"}%
              </span>
              {item.trend !== undefined && (
                <span className={cn(
                  "text-xs font-medium",
                  item.trend >= 0 ? "text-green-400" : "text-red-400"
                )}>
                  {item.trend >= 0 ? "+" : ""}{item.trend}%
                </span>
              )}
            </div>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${totalOrders > 0 ? (item.orders / totalOrders) * 100 : 0}%`,
                backgroundColor: item.color
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

interface FilterBarProps {
  dateRange: string
  setDateRange: (v: string) => void
  serviceFilter: string
  setServiceFilter: (v: string) => void
  onRefresh: () => void
  loading?: boolean
}

function FilterBar({
  dateRange,
  setDateRange,
  serviceFilter,
  setServiceFilter,
  onRefresh,
  loading = false
}: FilterBarProps) {
  const t = useT()
  const dateOptions = [
    { value: "today", label: t("Today") },
    { value: "week", label: t("This Week") },
    { value: "month", label: t("This Month") },
    { value: "quarter", label: t("This Quarter") },
    { value: "year", label: t("This Year") }
  ]
  const serviceOptions = [
    { value: "all", label: t("All Services") },
    { value: "repair", label: t("Repair") },
    { value: "installation", label: t("Installation") },
    { value: "support", label: t("Technical Support") },
    { value: "other", label: t("Other") }
  ]

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
      <div className="flex items-center gap-2 text-white/50">
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">{t("Filters")}:</span>
      </div>

      <div className="relative group">
        <select
          value={dateRange}
          onChange={(e) => {
            setDateRange(e.target.value)
            onRefresh()
          }}
          className="appearance-none pl-8 pr-8 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white cursor-pointer hover:bg-white/10 focus:outline-none focus:border-cyan-500/50"
        >
          {dateOptions.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-zinc-900 text-white">{opt.label}</option>
          ))}
        </select>
        <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
      </div>

      <div className="relative group">
        <select
          value={serviceFilter}
          onChange={(e) => {
            setServiceFilter(e.target.value)
            onRefresh()
          }}
          className="appearance-none pl-8 pr-8 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white cursor-pointer hover:bg-white/10 focus:outline-none focus:border-cyan-500/50"
        >
          {serviceOptions.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-zinc-900 text-white">{opt.label}</option>
          ))}
        </select>
        <Wrench className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          onRefresh()
        }}
        disabled={loading}
        className="ml-auto inline-flex items-center gap-2 px-3 py-2 bg-cyan-500/15 border border-cyan-500/30 rounded-lg text-sm text-cyan-400 hover:bg-cyan-500/25 active:scale-95 transition-all disabled:opacity-50 z-10"
      >
        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        {t("Refresh")}
      </button>
    </div>
  )
}

interface OperationsHubProps {
  data?: {
    totalOrders?: number
    totalRevenue?: number
    avgOrderValue?: number
    dailyAverage?: number
    orderBreakdown?: { type: string; orders: number; color: string }[]
    trends?: {
      todayVsYesterday?: { current: number; previous: number }
      weekVsLastWeek?: { current: number; previous: number }
      monthVsLastMonth?: { current: number; previous: number }
    }
    insights?: {
      highestGrowing?: string
      lowestPerforming?: string
      peakDay?: string
    }
    alerts?: { type: "danger" | "warning"; message: string; metric?: string }[]
  }
  loading?: boolean
  onRefresh?: () => void
}

export function RepairOperationsHub({ data, loading, onRefresh }: OperationsHubProps) {
  const t = useT()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [dateRange, setDateRange] = useState("month")
  const [serviceFilter, setServiceFilter] = useState("all")

  useEffect(() => {
    setMounted(true)
  }, [])

  const mockData = useMemo(() => ({
    totalOrders: 1248,
    totalRevenue: 54320,
    avgOrderValue: 435,
    dailyAverage: 42,
    orderBreakdown: [
      { type: "Device Repair", orders: 574, color: "#06b6d4" },
      { type: "Installation", orders: 312, color: "#8b5cf6" },
      { type: "Technical Support", orders: 249, color: "#f59e0b" },
      { type: "Other Services", orders: 113, color: "#6b7280" }
    ],
    trends: {
      todayVsYesterday: { current: 38, previous: 32 },
      weekVsLastWeek: { current: 245, previous: 218 },
      monthVsLastMonth: { current: 1248, previous: 1115 }
    },
    insights: {
      highestGrowing: "Device Repair (+18%)",
      lowestPerforming: "Other Services (-5%)",
      peakDay: "Monday"
    },
    alerts: [
      { type: "warning", message: "Installation requests increased", metric: "+23% this week" },
      { type: "danger", message: "Support tickets spike detected", metric: "47 pending" }
    ]
  }), [])

  const finalData = data || mockData

  const breakdownItems: BreakdownItem[] = finalData.orderBreakdown?.map(item => ({
    type: item.type,
    orders: item.orders,
    color: item.color,
    trend: item.type.includes("Repair") ? 18 : item.type.includes("Installation") ? 23 : item.type.includes("Support") ? -8 : -5
  })) || []

  const donutData = finalData.orderBreakdown?.map(item => ({
    name: item.type,
    value: item.orders,
    color: item.color
  })) || []

  const chartColors = ["#06b6d4", "#8b5cf6", "#f59e0b", "#6b7280"]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20">
              <Activity className="w-6 h-6 text-cyan-400" />
            </div>
            {t("Repair Operations Hub")}
          </h2>
          <p className="text-sm text-white/50 mt-1">{t("Real-time insights and performance metrics")}</p>
        </div>
      </div>

      <FilterBar
        dateRange={dateRange}
        setDateRange={setDateRange}
        serviceFilter={serviceFilter}
        setServiceFilter={setServiceFilter}
        onRefresh={onRefresh || (() => {})}
        loading={loading}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title={t("Total Orders")}
          value={finalData.totalOrders || 0}
          icon={ShoppingCart}
          trend={{ value: 12, isPositive: true }}
          colorClass="text-blue-400"
          loading={loading}
          onClick={() => router.push("/admin/orders")}
        />
        <MetricCard
          title={t("Total Revenue")}
          value={finalData.totalRevenue || 0}
          icon={DollarSign}
          prefix="AED "
          trend={{ value: 8, isPositive: true }}
          colorClass="text-emerald-400"
          loading={loading}
          onClick={() => router.push("/admin/analytics")}
        />
        <MetricCard
          title={t("Avg Order Value")}
          value={finalData.avgOrderValue || 0}
          icon={Award}
          prefix="AED "
          trend={{ value: 3, isPositive: true }}
          colorClass="text-purple-400"
          loading={loading}
          onClick={() => router.push("/admin/analytics")}
        />
        <MetricCard
          title={t("Daily Average")}
          value={finalData.dailyAverage || 0}
          icon={Zap}
          trend={{ value: 5, isPositive: true }}
          colorClass="text-yellow-400"
          loading={loading}
          onClick={() => router.push("/admin/orders?filter=today")}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2 bg-gradient-to-br from-white/5 to-white/2 border border-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">{t("Service Distribution")}</h3>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <span className="px-2 py-1 bg-white/5 rounded-full">{t("Donut Chart")}</span>
            </div>
          </div>

          {mounted && (
            <DonutChart
              data={donutData.length > 0 ? donutData : [
                { name: "Device Repair", value: 574, color: "#06b6d4" },
                { name: "Installation", value: 312, color: "#8b5cf6" },
                { name: "Technical Support", value: 249, color: "#f59e0b" },
                { name: "Other", value: 113, color: "#6b7280" }
              ]}
              centerLabel={t("Total")}
              centerValue={String(finalData.totalOrders || 0)}
            />
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            {(donutData.length > 0 ? donutData : [
              { name: "Device Repair", value: 574, color: "#06b6d4" },
              { name: "Installation", value: 312, color: "#8b5cf6" },
              { name: "Technical Support", value: 249, color: "#f59e0b" },
              { name: "Other", value: 113, color: "#6b7280" }
            ]).map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-white/70">{item.name}</span>
                <span className="ml-auto text-xs font-semibold text-white/50">
                  {finalData.totalOrders && finalData.totalOrders > 0 
                    ? ((item.value / finalData.totalOrders) * 100).toFixed(0) 
                    : 0}%
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 p-5">
          <h3 className="text-lg font-semibold text-white mb-4">{t("Time Comparison")}</h3>
          <div className="space-y-3">
            <TrendComparison
              label={t("Today vs Yesterday")}
              current={finalData.trends?.todayVsYesterday?.current || 38}
              previous={finalData.trends?.todayVsYesterday?.previous || 32}
            />
            <TrendComparison
              label={t("This Week vs Last")}
              current={finalData.trends?.weekVsLastWeek?.current || 245}
              previous={finalData.trends?.weekVsLastWeek?.previous || 218}
            />
            <TrendComparison
              label={t("This Month vs Last")}
              current={finalData.trends?.monthVsLastMonth?.current || 1248}
              previous={finalData.trends?.monthVsLastMonth?.previous || 1115}
            />
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 p-5">
          <h3 className="text-lg font-semibold text-white mb-4">{t("Service Breakdown")}</h3>
          <BreakdownList items={breakdownItems.length > 0 ? breakdownItems : [
            { type: "Device Repair", orders: 574, color: "#06b6d4", trend: 18 },
            { type: "Installation", orders: 312, color: "#8b5cf6", trend: 23 },
            { type: "Technical Support", orders: 249, color: "#f59e0b", trend: -8 },
            { type: "Other Services", orders: 113, color: "#6b7280", trend: -5 }
          ]} totalOrders={finalData.totalOrders || 0} />
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 p-5">
          <h3 className="text-lg font-semibold text-white mb-4">{t("Smart Insights")}</h3>
          <div className="space-y-3">
            <InsightCard
              type="success"
              title={t("Highest Growing")}
              description={finalData.insights?.highestGrowing || "Device Repair (+18%)"}
              icon={TrendingUp}
            />
            <InsightCard
              type="warning"
              title={t("Needs Attention")}
              description={finalData.insights?.lowestPerforming || "Other Services (-5%)"}
              icon={AlertTriangle}
            />
            <InsightCard
              type="info"
              title={t("Peak Performance")}
              description={`${t("Busiest day")}: ${finalData.insights?.peakDay || "Monday"}`}
              icon={Zap}
            />
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 p-5">
          <h3 className="text-lg font-semibold text-white mb-4">{t("Smart Alerts")}</h3>
          <div className="space-y-3">
            {finalData.alerts && finalData.alerts.length > 0 ? (
              finalData.alerts.map((alert, i) => (
                <AlertCard key={i} type={alert.type as "warning" | "danger"} message={alert.message} metric={alert.metric} />
              ))
            ) : (
              <>
                <AlertCard
                  type="warning"
                  message="Installation requests increased"
                  metric="+23% this week"
                />
                <AlertCard
                  type="danger"
                  message="Support tickets spike detected"
                  metric="47 pending"
                />
              </>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
