import { normalizeOrderStatus, type OrderStatus } from "@/lib/order-status"

export type WorkOrderSource = "bookings" | "orders"

export type AdminWorkOrder = {
  id: string
  source: WorkOrderSource
  reference: string
  customerName: string
  customerPhone: string
  customerEmail: string
  service: string
  device: string
  issue: string
  address: string
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT"
  status: OrderStatus
  totalAmount: number
  technicianId: string
  technicianName: string
  technicianIds: string[]
  technicianNames: string[]
  createdAt: Date | null
  checklist?: Record<string, string>
  beforePhotos?: string[]
  afterPhotos?: string[]
  hasSignature?: boolean
  paymentMethod?: string
  notes?: string
  rawData?: Record<string, any>
}

export type AdminTechnicianOption = {
  id: string
  name: string
  online: boolean
  available: boolean
}

export const toDate = (value: any) => {
  if (!value) return null
  if (typeof value.toDate === "function") return value.toDate()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const normalizeWorkOrder = (
  source: WorkOrderSource,
  id: string,
  data: Record<string, any>,
): AdminWorkOrder => {
  const rawPriority = String(data.priority || "NORMAL").trim().toUpperCase()
  const priority = ["LOW", "NORMAL", "HIGH", "URGENT"].includes(rawPriority)
    ? rawPriority as AdminWorkOrder["priority"]
    : "NORMAL"

  const rawTechIds = Array.isArray(data.technicianIds)
    ? data.technicianIds
    : Array.isArray(data.assignedTechnicians)
    ? data.assignedTechnicians
    : Array.isArray(data.assignedTechIds)
    ? data.assignedTechIds
    : (data.technicianId || data.assignedTechnicianId || data.assignedTechnician)
    ? [String(data.technicianId || data.assignedTechnicianId || data.assignedTechnician)]
    : []

  const rawTechNames = Array.isArray(data.technicianNames)
    ? data.technicianNames
    : Array.isArray(data.assignedTechnicianNames)
    ? data.assignedTechnicianNames
    : data.technicianName
    ? [String(data.technicianName)]
    : []

  const technicianIds = rawTechIds.map(String).filter((t: string) => t.trim().length > 0)
  const technicianNames = rawTechNames.map(String).filter((t: string) => t.trim().length > 0)
  const technicianId = technicianIds[0] || String(data.technicianId || data.assignedTechnicianId || data.assignedTechnician || "")
  const technicianName = technicianNames[0] || String(data.technicianName || "")

  const beforePhotos = Array.isArray(data.beforePhotos)
    ? data.beforePhotos.map(String)
    : Array.isArray(data.photos?.before)
    ? data.photos.before.map(String)
    : []

  const afterPhotos = Array.isArray(data.afterPhotos)
    ? data.afterPhotos.map(String)
    : Array.isArray(data.photos?.after)
    ? data.photos.after.map(String)
    : []

  const checklist = (typeof data.checklist === 'object' && data.checklist !== null)
    ? data.checklist
    : (typeof data.diagnostics === 'object' && data.diagnostics !== null)
    ? data.diagnostics
    : undefined

  return {
    id,
    source,
    reference: String(data.orderId || data.bookingId || data.orderNumber || id),
    customerName: String(data.customerName || data.name || data.customer?.name || "Not recorded"),
    customerPhone: String(data.customerPhone || data.phone || data.customer?.phone || ""),
    customerEmail: String(data.customerEmail || data.email || data.customer?.email || ""),
    service: String(data.serviceName || data.service || data.deviceCategory || data.description || "Not recorded"),
    device: String(data.device || data.deviceModel || data.model || ""),
    issue: String(data.issue || data.description || ""),
    address: String(data.address || data.customerAddress || ""),
    priority,
    status: normalizeOrderStatus(data.status),
    totalAmount: Number(data.totalAmount ?? data.price ?? data.serviceAmount ?? data.amount ?? 0),
    technicianId,
    technicianName,
    technicianIds,
    technicianNames,
    createdAt: toDate(data.createdAt || data.date || data.scheduledDate || data.timestamp || data.updatedAt),
    checklist,
    beforePhotos,
    afterPhotos,
    hasSignature: Boolean(data.hasSignature || data.signature || data.customerSignature),
    paymentMethod: String(data.paymentMethod || data.paymentMode || ""),
    notes: String(data.notes || data.technicianNotes || ""),
    rawData: data,
  }
}

export const maskPhone = (phone: string) => phone.length > 4
  ? `${phone.slice(0, Math.min(3, phone.length - 4))}••••${phone.slice(-4)}`
  : phone || "—"

export const formatOrderDate = (value: Date | null) => value
  ? value.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })
  : "Not recorded"
