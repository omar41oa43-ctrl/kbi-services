import { Timestamp } from "firebase/firestore";

export type UserRole = "super_admin" | "admin" | "technician" | "customer";

export type OrderStatus = "pending" | "assigned" | "in_progress" | "on_way" | "completed" | "cancelled";

export interface User {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  mustChangePassword?: boolean;
  phone?: string;
  address?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;

  technicianId?: string;
  technicianName?: string;

  device: string;
  deviceBrand?: string;
  deviceModel?: string;
  issue: string;
  description?: string;

  status: OrderStatus;
  priority?: "low" | "medium" | "high";

  price: number;
  estimatedDuration?: string;

  location?: string;
  scheduledDate?: Timestamp;
  assignedAt?: Timestamp;
  completedDate?: Timestamp;

  images?: string[]; // Storage URLs
  notes?: string;

  isOverdue?: boolean;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Technician {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;

  specialization?: string[];
  experience?: string;
  rating?: number;
  totalJobs?: number;

  isAvailable: boolean;
  currentLocation?: string;

  profileImage?: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Device {
  id: string;
  brand: string;
  model: string;
  category: "phone" | "tablet" | "laptop" | "desktop" | "other";
  commonIssues?: string[];

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CorporateRequest {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  message: string;

  status: "pending" | "contacted" | "closed";

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Notification {
  id: string;
  userId: string;
  role: UserRole;

  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";

  read: boolean;
  link?: string;

  createdAt: Timestamp;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;

  quantity: number;
  minQuantity: number;

  price: number;
  supplier?: string;

  sku?: string;
  description?: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SiteSettings {
  companyName: string
  mainPhone: string
  whatsapp: string
  email: string
  address: string
  addressAr: string
  footerText: string
  footerTextAr: string
  socialLinks: {
    facebook: string
    instagram: string
    twitter: string
    linkedin: string
    tiktok: string
  }
  socialLinksEnabled: {
    facebook: boolean
    instagram: boolean
    tiktok: boolean
  }
  enableCountdown: boolean
  enableCorporatePage: boolean
  enableOtherModel: boolean
  companyPresentationUrl?: string
  allowRegistration?: boolean

  // Dynamic Contact Page
  serviceAreas?: string
  workingHoursWeekdays?: string
  workingHoursFriday?: string

  // SEO
  googleSiteVerification?: string
}
