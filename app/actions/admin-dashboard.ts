"use server"

import { adminDb } from "@/lib/firebase-admin"
import { verifyAdmin } from "@/lib/server-auth"

export async function getDashboardStatsAction(idToken?: string) {
    const auth = await verifyAdmin(idToken || "")
    if (!auth) return { stats: {} }

    // Check if Firebase is ready (using isFirebaseReady like in server-auth)
    let isFirebaseOk = false;
    try {
        adminDb.collection("orders").doc("test");
        isFirebaseOk = true;
    } catch {
        isFirebaseOk = false;
    }
    if (!isFirebaseOk) return { stats: {}, chartData: [], lowStockItems: [], error: "Firebase Admin is not configured." }

    const cacheKey = "__kbi_admin_dashboard_v1"
    const nowMs = Date.now()
    const ttlMs = 120 * 1000 // Increase TTL to 2 minutes
    const backoffMs = 5 * 60 * 1000
    
    // Use a shared lock to prevent concurrent re-fetches
    const lockKey = "__kbi_admin_dashboard_lock"
    
    const cached = (globalThis as any)[cacheKey] as { value: any; ts: number; failedTs?: number } | undefined
    
    if (cached?.failedTs && nowMs - cached.failedTs < backoffMs) {
        return cached.value || { stats: {} }
    }
    
    if (cached && nowMs - cached.ts < ttlMs) {
        return cached.value
    }

    if ((globalThis as any)[lockKey]) {
        return cached?.value || { stats: {} }
    }

    (globalThis as any)[lockKey] = true

    try {
        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        // Fetch aggregation data in parallel
        const [
            totalOrdersAgg,
            completedAgg,
            inProgressAgg,
            // overdueAgg,
            todayAgg,
            techAgg,
            deviceAgg,
            corpAgg,
            recentOrdersSnap,
            lowStockSnap
        ] = await Promise.all([
            adminDb.collection("orders").count().get(),
            adminDb.collection("orders").where("status", "in", ["completed", "delivered"]).count().get(),
            adminDb.collection("orders").where("status", "in", ["in_progress", "waiting_parts"]).count().get(),
            // adminDb.collection("orders").where("isOverdue", "==", true).count().get(),
            adminDb.collection("orders").where("createdAt", ">=", startOfDay).count().get(),
            adminDb.collection("users").where("role", "==", "technician").count().get(),
            adminDb.collection("devices").count().get(),
            adminDb.collection("corporate_requests").count().get(),
            adminDb.collection("orders").orderBy("createdAt", "desc").limit(100).get(), // Increased limit slightly
            adminDb.collection("parts").orderBy("quantity", "asc").limit(15).get()
        ])

        const weeklyMap: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 }
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        const todayStr = now.toISOString().split("T")[0]

        let totalRevenue = 0
        recentOrdersSnap.forEach((doc: any) => {
            const data = doc.data() as any
            const status = String(data.status || "").toLowerCase()
            if (status.includes("completed") || status.includes("delivered")) {
                if (data.price) totalRevenue += Number(data.price)
            }
            let date: Date | null = null
            if (data.createdAt) {
                if (typeof (data.createdAt as any).toDate === "function") date = (data.createdAt as any).toDate()
                else if (data.createdAt instanceof Date) date = data.createdAt
                else if (typeof data.createdAt === "string") date = new Date(data.createdAt)
            }
            if (date) {
                const dateStr = date.toISOString().split("T")[0]
                if (dateStr !== todayStr) {
                    const dayName = days[date.getDay()]
                    if (weeklyMap[dayName] !== undefined) weeklyMap[dayName]++
                }
            }
        })

        const lowStockItems: any[] = []
        lowStockSnap.forEach((doc: any) => {
            const part = doc.data() as any
            const qty = Number(part.quantity || 0)
            const min = Number(part.minStock || 5)
            if (qty <= min) lowStockItems.push({ id: doc.id, name: part.name, quantity: qty, min })
        })

        const chartData = [
            { name: "Mon", orders: weeklyMap.Mon },
            { name: "Tue", orders: weeklyMap.Tue },
            { name: "Wed", orders: weeklyMap.Wed },
            { name: "Thu", orders: weeklyMap.Thu },
            { name: "Fri", orders: weeklyMap.Fri },
            { name: "Sat", orders: weeklyMap.Sat },
            { name: "Sun", orders: weeklyMap.Sun },
        ]

        const totalOrders = Number((totalOrdersAgg as any).data().count || 0)
        const completed = Number((completedAgg as any).data().count || 0)
        
        const value = {
            stats: {
                totalOrders,
                inProgress: Number((inProgressAgg as any).data().count || 0),
                completed,
                overdue: 0, // Number((overdueAgg as any).data().count || 0),
                todayOrders: Number((todayAgg as any).data().count || 0),
                totalTechs: Number((techAgg as any).data().count || 0),
                totalDevices: Number((deviceAgg as any).data().count || 0),
                corpRequests: Number((corpAgg as any).data().count || 0),
                totalRevenue,
                avgTicket: totalOrders > 0 ? totalRevenue / totalOrders : 0,
                lowStockCount: lowStockItems.length
            },
            chartData,
            lowStockItems: lowStockItems.slice(0, 5)
        }

        ;(globalThis as any)[cacheKey] = { value, ts: Date.now(), failedTs: 0 }
        return value
    } catch (error: any) {
        console.error("[Dashboard Action] Error:", error)
        const cached2 = (globalThis as any)[cacheKey] as { value: any; ts: number; failedTs?: number } | undefined
        if (cached2) {
            ;(globalThis as any)[cacheKey] = { value: cached2.value, ts: cached2.ts || nowMs, failedTs: Date.now() }
            return cached2.value
        }
        return { error: error.message }
    } finally {
        delete (globalThis as any)[lockKey]
    }
}

export async function getTechnicianPerformanceAction(timeRange: "week" | "month" | "all", idToken?: string) {
    const auth = await verifyAdmin(idToken || "")
    if (!auth) return []

    let isFirebaseOk = false;
    try {
        adminDb.collection("orders").doc("test");
        isFirebaseOk = true;
    } catch {
        isFirebaseOk = false;
    }
    if (!isFirebaseOk) return []

    const cacheKey = `__kbi_admin_tech_perf_v2_${timeRange}`
    const nowMs = Date.now()
    const ttlMs = 60 * 1000
    const backoffMs = 5 * 60 * 1000
    const cached = (globalThis as any)[cacheKey] as { value: any[]; ts: number; failedTs?: number } | undefined
    if (cached?.failedTs && nowMs - cached.failedTs < backoffMs) return cached.value || []
    if (cached && nowMs - cached.ts < ttlMs) return cached.value

    try {
        const now = new Date()
        const startDate =
            timeRange === "week"
                ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
                : timeRange === "month"
                    ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
                    : null

        const techQuery = adminDb.collection("technicians").limit(500)
        let ordersQuery: any = adminDb.collection("orders").orderBy("createdAt", "desc").limit(800)
        if (startDate) {
            ordersQuery = adminDb.collection("orders").where("createdAt", ">=", startDate).orderBy("createdAt", "desc").limit(800)
        }

        const [techSnap, ordersSnap] = await Promise.all([techQuery.get(), ordersQuery.get()])
        const orders = ordersSnap.docs.map((d: any) => d.data() as any)

        const techStats: any[] = []
        for (const techDoc of techSnap.docs as any[]) {
            const tech = techDoc.data()
            const techId = techDoc.id

            let totalRating = 0
            let ratingCount = 0
            let totalRepairTime = 0
            let repairTimeCount = 0
            let revenue = 0
            let completed = 0
            let active = 0

            for (const order of orders) {
                if (order.technicianId !== techId) continue

                if (order.status === "completed" || order.status === "delivered") {
                    completed++
                    if (order.price) revenue += Number(order.price)

                    if (Array.isArray(order.timeline)) {
                        const start = order.timeline.find((t: any) => t.status === "in_progress")
                        const end = order.timeline.find((t: any) => t.status === "completed")
                        if (start && end) {
                            const startTime = new Date(start.time || start.timestamp).getTime()
                            const endTime = new Date(end.time || end.timestamp).getTime()
                            totalRepairTime += (endTime - startTime) / 60000
                            repairTimeCount++
                        }
                    }
                } else if (["in_progress", "on_way", "technician_assigned", "waiting_parts"].includes(order.status)) {
                    active++
                }

                if (order.rating?.score) {
                    totalRating += Number(order.rating.score)
                    ratingCount++
                }
            }

            techStats.push({
                id: techDoc.id,
                name: tech.name || "Unknown",
                jobsCompleted: completed,
                avgRating: ratingCount > 0 ? totalRating / ratingCount : 0,
                avgRepairTime: repairTimeCount > 0 ? Math.round(totalRepairTime / repairTimeCount) : 0,
                revenueGenerated: revenue,
                activeJobs: active
            })
        }

        techStats.sort((a, b) => b.jobsCompleted - a.jobsCompleted)
        ;(globalThis as any)[cacheKey] = { value: techStats, ts: nowMs, failedTs: 0 }
        return techStats
    } catch {
        const cached2 = (globalThis as any)[cacheKey] as { value: any[]; ts: number; failedTs?: number } | undefined
        if (cached2) {
            ;(globalThis as any)[cacheKey] = { value: cached2.value || [], ts: cached2.ts || nowMs, failedTs: nowMs }
            return cached2.value || []
        }
        return []
    }
}
