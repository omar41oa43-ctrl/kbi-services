"use client"

import { useEffect, useState, useRef } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import {
    TrendingUp,
    DollarSign,
    Users,
    ShoppingCart,
    BarChart3,
    PieChart as PieChartIcon,
    Calendar,
    Loader2
} from "lucide-react"
import nextDynamic from "next/dynamic"

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

import { useT } from "@/components/language-provider"
import { Button } from "@/components/ui/button"

import { getAdminOrdersAction } from "@/app/actions/admin-orders"

import { auth } from "@/firebase/authClient"

export default function AdminAnalyticsPage() {
    const t = useT()
    const [mounted, setMounted] = useState(false)
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const isMounted = useRef(true)

    useEffect(() => {
        setMounted(true)
        return () => { isMounted.current = false }
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const user = auth.currentUser
            const idToken = user ? await user.getIdToken() : undefined
            const ordersData = await getAdminOrdersAction(idToken)
            if (isMounted.current) {
                setOrders(ordersData)
            }
        } catch (e: any) {
            if (!isMounted.current) return
            if (e?.name === 'AbortError' || e?.message?.includes('aborted')) return
        } finally {
            if (isMounted.current) setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    // Calculate metrics
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.price) || 0), 0)
    const completedOrders = orders.filter(o => ["completed", "delivered"].includes(o.status?.toLowerCase()))
    const completionRate = orders.length > 0 ? Math.round((completedOrders.length / orders.length) * 100) : 0
    const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0

    // Weekly data
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        return date.toISOString().split('T')[0]
    })

    const weeklyData = last7Days.map(date => {
        const dayOrders = orders.filter(o => {
            const orderDate = o.createdAt ? String(o.createdAt).split('T')[0] : ""
            return orderDate === date
        })
        return {
            name: new Date(date).toLocaleDateString('en', { weekday: 'short' }),
            orders: dayOrders.length,
            revenue: dayOrders.reduce((sum, o) => sum + (Number(o.price) || 0), 0)
        }
    })

    // Status distribution
    const statusCounts = {
        pending: orders.filter(o => ["pending", "order created"].includes(o.status?.toLowerCase())).length,
        inProgress: orders.filter(o => ["in_progress", "in progress"].includes(o.status?.toLowerCase())).length,
        completed: completedOrders.length,
        cancelled: orders.filter(o => o.status === "cancelled").length
    }

    const statusData = [
        { name: t("Pending"), value: statusCounts.pending, color: "#EAB308" },
        { name: t("In Progress"), value: statusCounts.inProgress, color: "#3B82F6" },
        { name: t("Completed"), value: statusCounts.completed, color: "#22C55E" },
        { name: t("Cancelled"), value: statusCounts.cancelled, color: "#EF4444" }
    ].filter(s => s.value > 0)

    // Top devices
    const deviceCounts: Record<string, number> = {}
    orders.forEach(o => {
        const device = o.deviceType || o.device || "Unknown"
        deviceCounts[device] = (deviceCounts[device] || 0) + 1
    })
    const topDevices = Object.entries(deviceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">{t("Analytics")}</h1>
                <div className="flex items-center gap-4 text-sm text-white/50">
                    <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{t("Last 7 Days")}</span>
                    </span>
                    <Button variant="ghost" size="icon" onClick={fetchData} title="Refresh">
                        <Loader2 className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <GlassCard className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 ring-1 ring-white/10 border border-white/10">
                    <div className="flex flex-row items-center justify-between">
                        <div className="text-sm font-medium text-white/70">{t("Total Revenue")}</div>
                        <DollarSign className="h-4 w-4 text-green-400" />
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-bold text-white">AED {totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-white/50">{t("From")} {orders.length} {t("orders")}</p>
                    </div>
                </GlassCard>

                <GlassCard className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 ring-1 ring-white/10 border border-white/10">
                    <div className="flex flex-row items-center justify-between">
                        <div className="text-sm font-medium text-white/70">{t("Total Orders")}</div>
                        <ShoppingCart className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-bold text-white">{orders.length}</div>
                        <p className="text-xs text-white/50">{completedOrders.length} {t("completed")}</p>
                    </div>
                </GlassCard>

                <GlassCard className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 ring-1 ring-white/10 border border-white/10">
                    <div className="flex flex-row items-center justify-between">
                        <div className="text-sm font-medium text-white/70">{t("Completion Rate")}</div>
                        <TrendingUp className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-bold text-white">{completionRate}%</div>
                        <p className="text-xs text-white/50">{t("Of all orders")}</p>
                    </div>
                </GlassCard>

                <GlassCard className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 ring-1 ring-white/10 border border-white/10">
                    <div className="flex flex-row items-center justify-between">
                        <div className="text-sm font-medium text-white/70">{t("Avg Order Value")}</div>
                        <BarChart3 className="h-4 w-4 text-orange-400" />
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-bold text-white">AED {avgOrderValue}</div>
                        <p className="text-xs text-white/50">{t("Per order")}</p>
                    </div>
                </GlassCard>
            </div>

            {/* Charts Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Weekly Orders Chart */}
                <GlassCard className="col-span-2 ring-1 ring-white/10 border border-white/10">
                    <div className="text-white flex items-center gap-2 mb-4">
                        <BarChart3 className="w-5 h-5 text-cyan-400" />
                        <span className="font-semibold">{t("Weekly Orders & Revenue")}</span>
                    </div>
                    {mounted && (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="name" stroke="#888" />
                                <YAxis stroke="#888" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                                    labelStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="orders" fill="#06b6d4" name={t("Orders")} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </GlassCard>

                {/* Status Distribution */}
                <GlassCard className="ring-1 ring-white/10 border border-white/10">
                    <div className="text-white flex items-center gap-2 mb-4">
                        <PieChartIcon className="w-5 h-5 text-cyan-400" />
                        <span className="font-semibold">{t("Order Status")}</span>
                    </div>
                    {mounted && (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={70}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                        {statusData.map((s, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-white/70">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                                <span>{s.name}: {s.value}</span>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>

            {/* Bottom Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Top Devices */}
                <GlassCard className="lg:col-span-2 ring-1 ring-white/10 border border-white/10">
                    <div className="text-white font-semibold mb-4">{t("Top Devices")}</div>
                    <div className="space-y-4">
                        {topDevices.map((device, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm font-bold">
                                        {i + 1}
                                    </div>
                                    <span className="text-white">{device.name}</span>
                                </div>
                                <span className="text-white/50">{device.value} {t("orders")}</span>
                            </div>
                        ))}
                        {topDevices.length === 0 && (
                            <p className="text-white/40 text-center">{t("No data available")}</p>
                        )}
                    </div>
                </GlassCard>
            </div>
        </div>
    )
}
