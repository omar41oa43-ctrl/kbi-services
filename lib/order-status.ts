export const ORDER_STATUSES = [
  "PENDING",
  "REVIEWING",
  "QUOTED",
  "APPROVED",
  "ASSIGNED",
  "ACCEPTED",
  "ON_THE_WAY",
  "ARRIVED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
] as const

export type OrderStatus = typeof ORDER_STATUSES[number]

const aliases: Record<string, OrderStatus> = {
  CREATED: "PENDING",
  SEARCHING: "PENDING",
  QUOTE_APPROVAL: "QUOTED",
  EN_ROUTE: "ON_THE_WAY",
  "ON THE WAY": "ON_THE_WAY",
  INSPECTION: "IN_PROGRESS",
  REPAIRING: "IN_PROGRESS",
  ACTIVE: "IN_PROGRESS",
}

export function normalizeOrderStatus(value: unknown): OrderStatus {
  const normalized = String(value || "PENDING").trim().toUpperCase().replaceAll("-", "_")
  const aliased = aliases[normalized] || normalized
  return ORDER_STATUSES.includes(aliased as OrderStatus) ? aliased as OrderStatus : "PENDING"
}

export const orderStatusLabel = (status: OrderStatus) => status
  .toLowerCase()
  .split("_")
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(" ")

export const isActiveOrderStatus = (status: OrderStatus) => [
  "ASSIGNED", "ACCEPTED", "ON_THE_WAY", "ARRIVED", "IN_PROGRESS",
].includes(status)

export const orderStatusTone = (status: OrderStatus) => {
  if (status === "COMPLETED") return "emerald"
  if (status === "CANCELLED" || status === "REJECTED") return "red"
  if (status === "PENDING" || status === "REVIEWING") return "amber"
  if (status === "IN_PROGRESS" || status === "ON_THE_WAY") return "violet"
  return "cyan"
}
