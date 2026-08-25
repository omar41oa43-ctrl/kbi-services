export type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum"

export type LoyaltyAccount = {
  customerId: string
  points: number
  tier: LoyaltyTier
  ordersCompleted: number
}

export const POINTS_CONFIG = {
  tierThresholds: {
    silver: 500,
    gold: 1500,
    platinum: 3000,
  },
  tierDiscounts: {
    bronze: 0,
    silver: 5,
    gold: 10,
    platinum: 15,
  },
}

function computeTier(points: number): LoyaltyTier {
  if (points >= POINTS_CONFIG.tierThresholds.platinum) return "platinum"
  if (points >= POINTS_CONFIG.tierThresholds.gold) return "gold"
  if (points >= POINTS_CONFIG.tierThresholds.silver) return "silver"
  return "bronze"
}

export function getTierColor(tier: LoyaltyTier) {
  switch (tier) {
    case "platinum":
      return "bg-gradient-to-br from-white/15 to-white/5 text-white"
    case "gold":
      return "bg-gradient-to-br from-amber-500/20 to-amber-500/5 text-amber-100"
    case "silver":
      return "bg-gradient-to-br from-slate-500/20 to-slate-500/5 text-slate-100"
    default:
      return "bg-gradient-to-br from-orange-500/20 to-orange-500/5 text-orange-100"
  }
}

export async function getOrCreateLoyaltyAccount(customerId: string): Promise<LoyaltyAccount> {
  const key = `kbi_loyalty_${customerId}`
  if (typeof window === "undefined") {
    return { customerId, points: 0, tier: "bronze", ordersCompleted: 0 }
  }

  try {
    const raw = window.localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LoyaltyAccount>
      const points = Number(parsed.points || 0)
      const ordersCompleted = Number(parsed.ordersCompleted || 0)
      const account: LoyaltyAccount = {
        customerId,
        points,
        ordersCompleted,
        tier: computeTier(points),
      }
      window.localStorage.setItem(key, JSON.stringify(account))
      return account
    }
  } catch { }

  const account: LoyaltyAccount = { customerId, points: 0, tier: "bronze", ordersCompleted: 0 }
  try {
    window.localStorage.setItem(key, JSON.stringify(account))
  } catch { }
  return account
}

