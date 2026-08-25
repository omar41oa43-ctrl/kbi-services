export interface TechnicianPermissions {
  viewOrders: boolean
  editOrders: boolean
  updateStatus: boolean
  uploadAttachments: boolean
  chat: boolean
  viewCorporateRequests: boolean
}

export interface Technician {
  id: string
  uid?: string // Linked to Firebase Auth UID
  name: string
  email: string
  phone: string
  phone2?: string
  role: "technician"
  status: "Active" | "Inactive"
  specialization: string[]
  permissions: TechnicianPermissions
  avatar?: string
  assignedOrdersCount?: number
}

export interface Order {
  id: string
  orderId: string
  customerName: string
  customerPhone: string
  device: string
  brand: string
  model: string
  issue: string
  status: string
  technicianId?: string
  technicianName?: string
  notes?: string
  createdAt: any // Firestore Timestamp
  estimatedCompletion?: any
  price?: string
  statusHistory?: {
    status: string
    timestamp: any
    note?: string
    updatedBy?: string
  }[]
  attachments?: string[]
  invoiceItems?: {
    description: string
    category: "spare_part" | "additional_service"
    quantity: number
    unitPrice: number
    total: number
    addedBy?: string
    requestId?: string
    addedAt?: any
  }[]
  totalCost?: number
  pendingRequestsCount?: number
  invoice?: Invoice
}

export interface Invoice {
  invoiceNumber: string
  invoiceDate: any
  status: "draft" | "finalized" | "sent"
  generatedBy: string
  discount?: number
  vatRate?: number
  vatEnabled?: boolean
  warrantyPeriod?: string
  adminNotes?: string
  disclaimerText?: string
  subtotal?: number
  total?: number
  language?: "en" | "ar" | "both"
  history?: { action: string; by: string; at: any; note?: string }[]
}

export interface TechnicianRequest {
  id: string
  orderId: string
  technicianId: string
  technicianName?: string
  partOrServiceName: string
  category: "spare_part" | "additional_service"
  quantity: number
  estimatedPrice: number
  reason: string
  photoUrl?: string
  status: "pending" | "approved" | "rejected"
  createdAt: any
  updatedAt?: any
  adminNotes?: string
  finalPrice?: number
  priceChanges?: { oldPrice: number; newPrice: number; changedAt: any; changedBy: string }[]
  history?: { action: string; by: string; at: any; note?: string }[]
}
