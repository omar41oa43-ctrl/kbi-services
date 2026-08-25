"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Crown, Award, Sparkles } from "lucide-react"
import { getOrCreateLoyaltyAccount, POINTS_CONFIG, getTierColor, type LoyaltyAccount } from "@/lib/loyaltyService"
import { cn } from "@/lib/utils"

interface LoyaltyCardProps {
    customerId: string
}

export function LoyaltyCard({ customerId }: LoyaltyCardProps) {
    const [account, setAccount] = useState<LoyaltyAccount | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAccount = async () => {
            try {
                const acc = await getOrCreateLoyaltyAccount(customerId)
                setAccount(acc)
            } catch {
            } finally {
                setLoading(false)
            }
        }

        if (customerId) {
            fetchAccount()
        }
    }, [customerId])

    if (loading) {
        return (
            <Card className="bg-white/5 border-white/10 animate-pulse">
                <CardContent className="h-32" />
            </Card>
        )
    }

    if (!account) return null

    const nextTier = account.tier === "bronze" ? "silver"
        : account.tier === "silver" ? "gold"
            : account.tier === "gold" ? "platinum"
                : null

    const nextTierThreshold = nextTier ? POINTS_CONFIG.tierThresholds[nextTier] : null
    const progress = nextTierThreshold
        ? (account.points / nextTierThreshold) * 100
        : 100

    const discount = POINTS_CONFIG.tierDiscounts[account.tier]

    const tierIcons = {
        bronze: Award,
        silver: Star,
        gold: Crown,
        platinum: Sparkles
    }
    const TierIcon = tierIcons[account.tier]

    return (
        <Card className={cn(
            "relative overflow-hidden border-0",
            getTierColor(account.tier)
        )}>
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
            </div>

            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <TierIcon className="w-5 h-5" />
                        {account.tier.charAt(0).toUpperCase() + account.tier.slice(1)} Member
                    </CardTitle>
                    {discount > 0 && (
                        <Badge className="bg-white/20 text-inherit border-0">
                            {discount}% OFF
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent>
                <div className="flex items-end justify-between mb-4">
                    <div>
                        <p className="text-4xl font-bold">{account.points.toLocaleString()}</p>
                        <p className="text-sm opacity-70">Points Balance</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-semibold">{account.ordersCompleted}</p>
                        <p className="text-xs opacity-70">Orders Completed</p>
                    </div>
                </div>

                {nextTier && nextTierThreshold && (
                    <div>
                        <div className="flex justify-between text-xs mb-1 opacity-70">
                            <span>Progress to {nextTier}</span>
                            <span>{nextTierThreshold - account.points} pts needed</span>
                        </div>
                        <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white/50 rounded-full transition-all"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                {account.tier === "platinum" && (
                    <div className="flex items-center gap-2 mt-2 text-sm">
                        <Sparkles className="w-4 h-4" />
                        <span>You&apos;ve reached the highest tier!</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
