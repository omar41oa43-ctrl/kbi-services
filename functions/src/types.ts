export type UserRole = "admin" | "super_admin" | "technician" | "customer"

export type SubscriptionStatus = "active" | "inactive"

export type ServiceRequestStatus =
  | "new"
  | "assigned"
  | "accepted"
  | "in_progress"
  | "completed"
  | "paid"
  | "cancelled"

export type TechnicianRequestStatus = "pending" | "approved" | "rejected"

export type GeoPoint = {
  lat: number
  lng: number
}

export type TechnicianDoc = {
  name: string
  phone: string
  skills: string[]
  location?: GeoPoint
  isApproved: boolean
  isActive: boolean
  subscriptionStatus: SubscriptionStatus
  rating: number
  activeJobs?: string[]
  fcmToken?: string
  updatedAt?: FirebaseFirestore.Timestamp
  createdAt?: FirebaseFirestore.Timestamp
}

export type TechnicianRequestDoc = {
  userId: string
  name: string
  phone: string
  skills: string[]
  status: TechnicianRequestStatus
  createdAt: FirebaseFirestore.Timestamp
  updatedAt?: FirebaseFirestore.Timestamp
}

export type ServiceRequestDoc = {
  type: string
  description: string
  location: GeoPoint & { address?: string }
  locationValid?: boolean
  status: ServiceRequestStatus
  assignedTo: string[]
  offers?: string[]
  offeredAt?: FirebaseFirestore.Timestamp
  technicianId?: string
  createdAt: FirebaseFirestore.Timestamp
  updatedAt?: FirebaseFirestore.Timestamp
  assignmentAttempt?: number
  lastOfferedTo?: string[]
  orderId?: string
}

export type AuditLogDoc = {
  actorUid?: string
  actorRole?: UserRole
  action: string
  targetCollection?: string
  targetId?: string
  requestId?: string
  orderId?: string
  details?: Record<string, unknown>
  createdAt: FirebaseFirestore.Timestamp
}
