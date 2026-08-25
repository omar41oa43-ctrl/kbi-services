"use client"

import { useEffect, useState } from "react"
import nextDynamic from "next/dynamic"
import { collection, onSnapshot, query } from "firebase/firestore"
import {
  BarChart3,
  CheckCircle2,
  DollarSign,
  Laptop,
  PieChart as PieChartIcon,
  ShoppingCart,
  TrendingUp,
  Wrench,
} from "lucide-react"

import { getAdminOrdersAction } from "@/app/actions/admin-orders"
import { useT } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { auth } from "@/firebase/authClient"
import { db } from "@/firebase/firebaseConfig"

const ResponsiveContainer = nextDynamic(() => import("recharts").then((m) => m.ResponsiveContainer as any), { ssr: false }) as any
const BarChart = nextDynamic(() => import("recharts").then((m) => m.BarChart as any), { ssr: false }) as any
const Bar = nextDynamic(() => import("recharts").then((m) => m.Bar as any), { ssr: false }) as any
const CartesianGrid = nextDynamic(() => import("recharts").then((m) => m.CartesianGrid as any), { ssr: false }) as any
const XAxis = nextDynamic(() => import("recharts").then((m) => m.XAxis as any), { ssr: false }) as any
const YAxis = nextDynamic(() => import("recharts").then((m) => m.YAxis as any), { ssr: false }) as any
const Tooltip = nextDynamic(() => import("recharts").then((m) => m.Tooltip as any), { ssr: false }) as any
const PieChart = nextDynamic(() => import("recharts").then((m) => m.PieChart as any), { ssr: false }) as any
const Pie = nextDynamic(() => import("recharts").then((m) => m.Pie as any), { ssr: false }) as any
const Cell = nextDynamic(() => import("recharts").then((m) => m.Cell as any), { ssr: false }) as any

interface OrderAnalyticsItem {
  id: string
  status: string
  price: number
  deviceType: string
  createdAt: string | null
}

export default function AdminAnalyticsPage() {
  const t = useT()
  const [mounted, setMounted] = useState(false)
  const [orders, setOrders] = useState<OrderAnalyticsItem[]>([])
  const [, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("7d")

  useEffect(() => {
    setMounted(true)

    // Listen to real-time client Firestore orders
    const ordersQuery = query(collection(db, "orders"))
    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      const liveList: OrderAnalyticsItem[] = snapshot.docs.map((doc) => {
        const raw = doc.data()
        const createdAtDate = raw.createdAt?.toDate ? raw.createdAt.toDate().toISOString() : String(raw.createdAt || "")
        return {
          id: doc.id,
          status: String(raw.status || "pending").toLowerCase(),
          price: Number(raw.price || raw.totalAmount || raw.amount || 0),
          deviceType: String(raw.deviceType || raw.device || raw.service || "Device"),
          createdAt: createdAtDate || null,
        }
      })

      if (liveList.length > 0) {
        setOrders(liveList)
        setLoading(false)
      }
    }, (err) => {
      console.warn("Analytics Firestore listener notice:", err)
    })

    // Fallback: Fetch via admin Server Action
    const fetchAdminOrders = async () => {
      try {
        const user = auth.currentUser
        const idToken = user ? await user.getIdToken() : undefined
        const adminData = await getAdminOrdersAction(idToken)
        if (Array.isArray(adminData) && adminData.length > 0) {
          const mappedAdminList: OrderAnalyticsItem[] = adminData.map((raw: any) => ({
            id: raw.id,
            status: String(raw.status || "pending").toLowerCase(),
            price: Number(raw.price || 0),
            deviceType: String(raw.deviceType || raw.brand || "Device"),
            createdAt: raw.createdAt || null,
          }))
          setOrders((prev) => (prev.length === 0 ? mappedAdminList : prev))
        }
      } catch (err) {
        console.warn("Admin orders action notice:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchAdminOrders()

    return () => {
      unsubOrders()
    }
  }, [])

  // Filter orders by selected time range
  const filteredOrders = orders.filter((o) => {
    if (timeRange === "all" || !o.createdAt) return true
    const date = new Date(o.createdAt)
    const now = new Date()
    const diffDays = (now.getTime() - date.getTime()) / (1000 * 3600 * 24)
    return timeRange === "7d" ? diffDays <= 7 : diffDays <= 30
  })

  // Metrics Calculations
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.price || 0), 0)
  const completedOrders = filteredOrders.filter((o) => ["completed", "delivered", "done"].includes(o.status))
  const completionRate = filteredOrders.length > 0 ? Math.round((completedOrders.length / filteredOrders.length) * 100) : 0
  const avgOrderValue = filteredOrders.length > 0 ? Math.round(totalRevenue / filteredOrders.length) : 0

  // Weekly Trend Chart Data
  const daysCount = timeRange === "7d" ? 7 : 14
  const trendDays = Array.from({ length: daysCount }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (daysCount - 1 - i))
    return d.toISOString().split("T")[0]
  })

  const weeklyData = trendDays.map((dateStr) => {
    const dayOrders = filteredOrders.filter((o) => {
      if (!o.createdAt) return false
      return o.createdAt.split("T")[0] === dateStr
    })
    return {
      name: new Date(dateStr).toLocaleDateString("en", { weekday: "short", day: "numeric" }),
      orders: dayOrders.length,
      revenue: dayOrders.reduce((sum, o) => sum + (o.price || 0), 0),
    }
  })

  // Status Distribution
  const statusCounts = {
    pending: filteredOrders.filter((o) => ["pending", "order created", "new"].includes(o.status)).length,
    inProgress: filteredOrders.filter((o) => ["in_progress", "in progress", "assigned"].includes(o.status)).length,
    completed: completedOrders.length,
    cancelled: filteredOrders.filter((o) => ["cancelled", "rejected"].includes(o.status)).length,
  }

  const statusData = [
    { name: t("Pending"), value: statusCounts.pending, color: "#ffb703" },
    { name: t("In Progress"), value: statusCounts.inProgress, color: "#38bdf8" },
    { name: t("Completed"), value: statusCounts.completed, color: "#00f5c4" },
    { name: t("Cancelled"), value: statusCounts.cancelled, color: "#ff4d6d" },
  ].filter((s) => s.value > 0)

  // Top Serviced Devices Breakdown
  const deviceCounts: Record<string, number> = {}
  filteredOrders.forEach((o) => {
    const name = o.deviceType?.trim() || "Unspecified"
    deviceCounts[name] = (deviceCounts[name] || 0) + 1
  })

  const topDevices = Object.entries(deviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }))

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Header Bar */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div className="flex items-start gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
            <BarChart3 className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">{t("Analytics & Revenue")}</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Real-time financial performance, work order metrics, and service demand insights.
            </p>
          </div>
        </div>

        {/* Time Filter Controls */}
        <div className="flex items-center gap-1.5 bg-card border border-border p-1 rounded-xl shadow-xs">
          {(["7d", "30d", "all"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                timeRange === range
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {range === "7d" ? "Last 7 Days" : range === "30d" ? "Last 30 Days" : "All Time"}
            </button>
          ))}
        </div>
      </section>

      {/* Key Metric Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Revenue */}
        <Card className="bg-card border-border/80 p-5 shadow-xs space-y-3 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Revenue</span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <DollarSign className="size-4" />
            </span>
          </div>
          <div>
            <p className="text-2xl font-black text-foreground tabular-nums tracking-tight font-mono">AED {totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">From {filteredOrders.length} recorded orders</p>
          </div>
        </Card>

        {/* Card 2: Orders */}
        <Card className="bg-card border-border/80 p-5 shadow-xs space-y-3 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Work Orders</span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              <ShoppingCart className="size-4" />
            </span>
          </div>
          <div>
            <p className="text-2xl font-black text-foreground tabular-nums tracking-tight font-mono">{filteredOrders.length}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="size-3" /> {completedOrders.length} successfully completed
            </p>
          </div>
        </Card>

        {/* Card 3: Completion Rate */}
        <Card className="bg-card border-border/80 p-5 shadow-xs space-y-3 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Completion Rate</span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <TrendingUp className="size-4" />
            </span>
          </div>
          <div>
            <p className="text-2xl font-black text-primary tabular-nums tracking-tight font-mono">{completionRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">Fulfillment efficiency score</p>
          </div>
        </Card>

        {/* Card 4: Average Order Value */}
        <Card className="bg-card border-border/80 p-5 shadow-xs space-y-3 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Avg Order Value</span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Wrench className="size-4" />
            </span>
          </div>
          <div>
            <p className="text-2xl font-black text-foreground tabular-nums tracking-tight font-mono">AED {avgOrderValue}</p>
            <p className="text-xs text-muted-foreground mt-1">Average ticket price</p>
          </div>
        </Card>
      </section>

      {/* Main Charts Area */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly Trend Bar Chart (2 Columns) */}
        <Card className="lg:col-span-2 bg-card border-border/80 shadow-xs p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BarChart3 className="size-4" />
              </span>
              <h3 className="text-base font-bold text-foreground">Daily Orders & Revenue Trend</h3>
            </div>
            <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary font-mono text-xs">
              {timeRange === "7d" ? "7 Days" : "30 Days"} Stream
            </Badge>
          </div>

          {mounted && (
            <div className="h-[280px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", borderRadius: "12px", color: "hsl(var(--popover-foreground))", fontSize: "12px" }}
                    labelStyle={{ color: "#32CBE9", fontWeight: "bold" }}
                  />
                  <Bar dataKey="orders" fill="#32CBE9" name="Orders" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Order Status Breakdown Pie Chart (1 Column) */}
        <Card className="bg-card border-border/80 shadow-xs p-6 rounded-2xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 border-b border-border/60 pb-4">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <PieChartIcon className="size-4" />
              </span>
              <h3 className="text-base font-bold text-foreground">Job Status Distribution</h3>
            </div>

            {mounted && statusData.length > 0 ? (
              <div className="h-[200px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", borderRadius: "12px", color: "hsl(var(--popover-foreground))", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-xs text-muted-foreground">
                No status data available.
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
            {statusData.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/40 p-2 rounded-lg border border-border/60">
                <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="truncate">{s.name}: <strong className="text-foreground">{s.value}</strong></span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top Serviced Devices */}
      <Card className="bg-card border-border/80 shadow-xs p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Laptop className="size-4" />
            </span>
            <h3 className="text-base font-bold text-foreground">Top Serviced Device Categories</h3>
          </div>
          <span className="text-xs text-muted-foreground">Ranked by repair demand</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {topDevices.length === 0 ? (
            <p className="text-xs text-muted-foreground col-span-full text-center py-6">No device service records available.</p>
          ) : (
            topDevices.map((device, i) => (
              <div key={i} className="bg-muted/30 border border-border/70 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold font-mono">
                    #{i + 1}
                  </span>
                  <Badge variant="outline" className="bg-card border-border text-[10px] text-primary font-mono">
                    {device.value} Job{device.value === 1 ? "" : "s"}
                  </Badge>
                </div>
                <p className="font-bold text-foreground text-xs truncate pt-1">{device.name}</p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
