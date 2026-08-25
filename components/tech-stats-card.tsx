"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Star, CheckCircle, TrendingUp, Zap } from "lucide-react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/firebase/firebaseConfig"

interface TechStatsCardProps {
    technicianId: string
}

interface Stats {
    totalJobs: number
    completedToday: number
    avgRating: number
    avgRepairTime: number // in minutes
    earningsToday: number
    earningsWeek: number
}

export function TechStatsCard({ technicianId }: TechStatsCardProps) {
    const [stats, setStats] = useState<Stats>({
        totalJobs: 0,
        completedToday: 0,
        avgRating: 0,
        avgRepairTime: 0,
        earningsToday: 0,
        earningsWeek: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            if (!technicianId) return

            try {
                const ordersQuery = query(
                    collection(db, "orders"),
                    where("technicianId", "==", technicianId)
                )
                const snapshot = await getDocs(ordersQuery)

                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const weekAgo = new Date(today)
                weekAgo.setDate(weekAgo.getDate() - 7)

                let totalRating = 0
                let ratingCount = 0
                let totalRepairTime = 0
                let repairTimeCount = 0
                let earningsToday = 0
                let earningsWeek = 0
                let completedToday = 0

                snapshot.docs.forEach(doc => {
                    const order = doc.data()
                    const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt)

                    // Rating
                    if (order.rating?.score) {
                        totalRating += order.rating.score
                        ratingCount++
                    }

                    // Completed orders
                    if (order.status === "completed" || order.status === "delivered") {
                        // Earnings
                        const price = order.price || 0

                        if (orderDate >= today) {
                            completedToday++
                            earningsToday += price
                        }

                        if (orderDate >= weekAgo) {
                            earningsWeek += price
                        }

                        // Repair time (if tracked)
                        if (order.repairTime) {
                            totalRepairTime += order.repairTime
                            repairTimeCount++
                        }
                    }
                })

                setStats({
                    totalJobs: snapshot.docs.length,
                    completedToday,
                    avgRating: ratingCount > 0 ? totalRating / ratingCount : 0,
                    avgRepairTime: repairTimeCount > 0 ? Math.round(totalRepairTime / repairTimeCount) : 0,
                    earningsToday,
                    earningsWeek
                })
            } catch (error) {
                console.error("Failed to fetch tech stats:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [technicianId])

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-pulse">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="bg-white/5 border-white/10">
                        <CardContent className="p-4 h-20" />
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-green-400/70">Today&apos;s Earnings</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{stats.earningsToday.toLocaleString()} <span className="text-sm font-normal">AED</span></p>
                </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs text-white/50">Completed Today</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.completedToday} <span className="text-sm font-normal text-white/50">jobs</span></p>
                </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs text-white/50">Avg Rating</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                        {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—"}
                        <span className="text-sm font-normal text-white/50">/5</span>
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-white/50">Week Earnings</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.earningsWeek.toLocaleString()} <span className="text-sm font-normal text-white/50">AED</span></p>
                </CardContent>
            </Card>
        </div>
    )
}
