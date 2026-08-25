"use client"

import { useEffect, useState, useRef } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { AppSelect } from "@/components/ui/app-select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Search,
  MoreHorizontal,
  User,
  Clock,
  Calendar,
  Trash2,
  Eye,
  CheckCircle,
  AlertTriangle,
  FileDown,
  Plus,
  MessageCircle,
  Smartphone,
  LayoutGrid,
  List,
  Filter,
  ArrowRight,
  Download,
  Share2,
  ChevronRight,
  MapPin,
  Tag,
  CreditCard,
  FileText,
  ShoppingCart
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { logAction, AuditActions } from "@/lib/auditService"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { auth } from "@/firebase/authClient"
import { onAuthStateChanged } from "firebase/auth"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { useT, useLanguage } from "@/components/language-provider"
import { useToast } from "@/hooks/use-toast"
import { FinalInvoice } from "@/components/ui/invoice"
import {
  createOrderAction,
  deleteOrderAction,
  finalizeInvoiceAction,
  getAdminOrdersPageAction,
  getNextInvoiceNumberAction,
  overrideInvoiceAction,
  updateEtaAction,
  updateOrderPriceAction,
  updateOrderStatusAction,
} from "@/app/actions/admin-orders"

type Order = {
  id: string
  orderId: string
  customerName: string
  customerPhone: string
  deviceType: string
  brand: string
  model: string
  issue: string
  status: "pending" | "in_progress" | "waiting_parts" | "completed" | "delivered" | "cancelled"
  technicianId?: string
  technicianName?: string
  createdAt: any
  estimatedCompletion?: any
  price?: number
  notes?: string
  statusHistory?: {
    status: string
    timestamp: any
    note?: string
  }[]
}

const statusColors = {
  pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500/50",
  in_progress: "bg-blue-500/20 text-blue-500 border-blue-500/50",
  waiting_parts: "bg-orange-500/20 text-orange-500 border-orange-500/50",
  completed: "bg-green-500/20 text-green-500 border-green-500/50",
  delivered: "bg-purple-500/20 text-purple-500 border-purple-500/50",
  cancelled: "bg-red-500/20 text-red-500 border-red-500/50",
}

export default function AdminOrdersPage() {
  const t = useT()
  const { lang } = useLanguage()
  const isAr = lang === "ar"
  const { toast } = useToast()
  const [authorized, setAuthorized] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [, setIsOnline] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"table" | "board">("table")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [etaMinutes, setEtaMinutes] = useState<string>("")
  const [priceInput, setPriceInput] = useState<string>("")
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
  const [invoiceNumber, setInvoiceNumber] = useState<string>("")
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [invoiceLang, setInvoiceLang] = useState<"en" | "ar" | "both">("ar")
  const [invoiceDiscount, setInvoiceDiscount] = useState<string>("0")
  const [vatEnabled, setVatEnabled] = useState<boolean>(false)
  const [vatRate, setVatRate] = useState<string>("0")
  const [invoiceSubtotalOverride, setInvoiceSubtotalOverride] = useState<string>("")
  const [invoiceTotalOverride, setInvoiceTotalOverride] = useState<string>("")
  const [invoiceManualRows, setInvoiceManualRows] = useState<any[]>([])
  const [warrantyPeriod, setWarrantyPeriod] = useState<string>("3 months")
  const [adminNotesInvoice, setAdminNotesInvoice] = useState<string>("")
  const [disclaimerText, setDisclaimerText] = useState<string>("Payment due upon completion of repair.")
  const [invoiceFinalized, setInvoiceFinalized] = useState<boolean>(false)
  const [overrideReason, setOverrideReason] = useState<string>("")
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newDeviceType, setNewDeviceType] = useState("")
  const [newBrand, setNewBrand] = useState("")
  const [newModel, setNewModel] = useState("")
  const [newIssue, setNewIssue] = useState("")
  const [newPrice, setNewPrice] = useState("")
  const [newLocation, setNewLocation] = useState("")
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState("")

  const [itemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersLoadError, setOrdersLoadError] = useState<string>("")
  const [hasMoreOrders, setHasMoreOrders] = useState(false)
  const [ordersCursor, setOrdersCursor] = useState<{ createdAtIso: string } | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  useEffect(() => {
    try {
      if (typeof navigator !== "undefined") setIsOnline(navigator.onLine)
    } catch { }
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    if (typeof window !== "undefined") {
      window.addEventListener("online", onOnline)
      window.addEventListener("offline", onOffline)
    }
    const hasFirebase =
      !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    const ordersCacheKey = "kbi_admin_orders_cache_v1"
    const ordersCacheTsKey = "kbi_admin_orders_cache_ts_v1"
    const ordersBackoffKey = "kbi_admin_orders_backoff_until_v1"
    const techsCacheKey = "kbi_admin_techs_cache_v1"

    const hydrateFromCache = () => {
      try {
        const rawOrders = localStorage.getItem(ordersCacheKey)
        if (rawOrders) {
          const parsed = JSON.parse(rawOrders) as { orders?: any[]; cursor?: any; hasMore?: boolean }
          if (Array.isArray(parsed.orders)) {
            const mapped = parsed.orders.map((d: any) => ({ ...d, status: normalizeStatus(d.status) })) as Order[]
            setOrders(mapped)
            setOrdersCursor(parsed.cursor || null)
            setHasMoreOrders(!!parsed.hasMore)
          }
        }
      } catch { }
    }

    const loadFirstPage = async () => {
      if (ordersLoading) return
      setOrdersLoading(true)
      setOrdersLoadError("")
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setOrdersLoading(false)
        setOrdersLoadError(t("No internet connection"))
        return
      }
      const now = Date.now()
      const backoffUntil = Number(localStorage.getItem(ordersBackoffKey) || 0)
      if (backoffUntil && now < backoffUntil) {
        setOrdersLoading(false)
        setOrdersLoadError("Firebase quota exceeded")
        return
      }
      try {
        const user = auth.currentUser
        const idToken = user ? await user.getIdToken() : undefined
        const res = await getAdminOrdersPageAction({ limit: 50, cursor: null, idToken })
        
        if (!isMounted.current) return

        if ((res as any)?.error) {
          const msg = String((res as any).error)
          setOrdersLoadError(msg)
          if (msg.toLowerCase().includes("quota")) {
            try { localStorage.setItem(ordersBackoffKey, String(Date.now() + 5 * 60 * 1000)) } catch { }
          }
        } else {
          try { localStorage.removeItem(ordersBackoffKey) } catch { }
        }
        const mapped = (res?.orders || []).map((d: any) => ({ ...d, status: normalizeStatus(d.status) })) as Order[]
        if (mapped.length > 0) {
          setOrders(mapped)
          setOrdersCursor(res?.nextCursor || null)
          setHasMoreOrders(!!res?.hasMore)
          setCurrentPage(1)
          try {
            localStorage.setItem(ordersCacheKey, JSON.stringify({ orders: res?.orders || [], cursor: res?.nextCursor || null, hasMore: !!res?.hasMore }))
            localStorage.setItem(ordersCacheTsKey, String(Date.now()))
          } catch { }
        }
      } catch (e: any) {
        if (!isMounted.current) return
        if (e?.name === 'AbortError' || e?.message?.includes('aborted')) return
        const msg = String(e?.message || "")
        setOrdersLoadError(msg || t("Failed to load orders"))
        if (msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("resource_exhausted")) {
          try { localStorage.setItem(ordersBackoffKey, String(Date.now() + 5 * 60 * 1000)) } catch { }
        }
      } finally {
        if (isMounted.current) setOrdersLoading(false)
      }
    }

    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        if (typeof window !== "undefined") {
          if (!hasFirebase) {
            setAuthorized(true)
            setNeedsLogin(false)
            setAuthChecked(true)
            hydrateFromCache()
            const ts = Number(localStorage.getItem(ordersCacheTsKey) || 0)
            const backoffUntil = Number(localStorage.getItem(ordersBackoffKey) || 0)
            if (!ts || Date.now() - ts > 2 * 60 * 1000) {
              if (!backoffUntil || Date.now() >= backoffUntil) void loadFirstPage()
            }
          } else {
            setAuthorized(false)
            setNeedsLogin(true)
            setAuthChecked(true)
          }
        }
      } else {
        setAuthorized(true)
        setNeedsLogin(false)
        setAuthChecked(true)
        hydrateFromCache()
        const ts = Number(localStorage.getItem(ordersCacheTsKey) || 0)
        const backoffUntil = Number(localStorage.getItem(ordersBackoffKey) || 0)
        if (!ts || Date.now() - ts > 2 * 60 * 1000) {
          if (!backoffUntil || Date.now() >= backoffUntil) void loadFirstPage()
        }
      }
    })

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", onOnline)
        window.removeEventListener("offline", onOffline)
      }
      unsub()
    }
  }, [])

  // Helper to normalize status strings
  const normalizeStatus = (status: string): Order["status"] => {
    if (!status) return "pending"
    const s = status.toLowerCase().replace(/\s+/g, "_")
    if (s === "order_created" || s === "pending") return "pending"
    if (s === "in_progress") return "in_progress"
    if (s === "waiting_parts") return "waiting_parts"
    if (s === "completed") return "completed"
    if (s === "delivered") return "delivered"
    if (s === "cancelled") return "cancelled"
    return "pending"
  }

  const getDate = (d: any) => {
    if (!d) return null
    if (typeof d === "string") return new Date(d)
    if (d.seconds) return new Date(d.seconds * 1000)
    return null
  }

  const getInvoiceItemsForOrder = (o: Order) => {
    const items: any[] = []
    const base = Number(o.price || 0)
    if (base > 0) {
      items.push({ description: o.issue || "Repair Service", category: "service", quantity: 1, unitPrice: base, total: base })
    }
    const extras = (o as any).invoiceItems || []
    return [...items, ...extras]
  }

  const getNextInvoiceNumber = async (): Promise<string> => {
    const res = await getNextInvoiceNumberAction()
    if ((res as any)?.error) throw new Error((res as any).error)
    return (res as any).invoiceNumber as string
  }

  const ensureMinInvoiceRows = (rows: any[]) => {
    return (rows || []).map((r) => ({
      description: r?.description || "",
      partNo: r?.partNo || "",
      quantity: Number.isFinite(Number(r?.quantity)) ? Number(r.quantity) : 0,
      total: Number.isFinite(Number(r?.total)) ? Number(r.total) : 0,
    }))
  }

  const loadMoreOrders = async () => {
    if (loadingMore || !hasMoreOrders) return
    setLoadingMore(true)
    setOrdersLoadError("")
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setLoadingMore(false)
      setOrdersLoadError(t("No internet connection"))
      return
    }
    try {
      const user = auth.currentUser
      const idToken = user ? await user.getIdToken() : undefined
      const res = await getAdminOrdersPageAction({ limit: 50, cursor: ordersCursor, idToken })
      if ((res as any)?.error) setOrdersLoadError(String((res as any).error))
      const next = (res?.orders || []).map((d: any) => ({ ...d, status: normalizeStatus(d.status) })) as Order[]
      setOrders((prev) => {
        const seen = new Set(prev.map((o) => o.id))
        const merged = [...prev, ...next.filter((o) => !seen.has(o.id))]
        try {
          localStorage.setItem(
            "kbi_admin_orders_cache_v1",
            JSON.stringify({ orders: merged, cursor: res?.nextCursor || null, hasMore: !!res?.hasMore })
          )
        } catch { }
        return merged
      })
      setOrdersCursor(res?.nextCursor || null)
      setHasMoreOrders(!!res?.hasMore)
    } catch (e: any) {
      if (e?.name === 'AbortError' || e?.message?.includes('aborted')) return
      setOrdersLoadError(e?.message || t("Failed to load orders"))
    } finally {
      setLoadingMore(false)
    }
  }

  const loadAllOrders = async () => {
    if (loadingMore || !hasMoreOrders) return
    setLoadingMore(true)
    setOrdersLoadError("")
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setLoadingMore(false)
      setOrdersLoadError(t("No internet connection"))
      return
    }
    try {
      const user = auth.currentUser
      const idToken = user ? await user.getIdToken() : undefined
      let cursor = ordersCursor as { createdAtIso: string } | null
      let finalHasMore: boolean = hasMoreOrders
      let pages = 0
      while (pages < 30) {
        const res = await getAdminOrdersPageAction({ limit: 50, cursor, idToken })
        if ((res as any)?.error) {
          setOrdersLoadError(String((res as any).error))
          break
        }
        const next = (res?.orders || []).map((d: any) => ({ ...d, status: normalizeStatus(d.status) })) as Order[]
        setOrders((prev) => {
          const seen = new Set(prev.map((o) => o.id))
          return [...prev, ...next.filter((o) => !seen.has(o.id))]
        })
        cursor = res?.nextCursor || null
        const nextHasMore = !!res?.hasMore
        finalHasMore = nextHasMore
        pages += 1
        if (!cursor || !nextHasMore) break
      }
      setOrdersCursor(cursor)
      setHasMoreOrders(finalHasMore)
    } catch (e: any) {
      if (e?.name === 'AbortError' || e?.message?.includes('aborted')) return
      setOrdersLoadError(e?.message || t("Failed to load orders"))
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    if (!selectedOrder) return
    setPriceInput(selectedOrder.price?.toString() || "0")
    const invoice = (selectedOrder as any).invoice
    if (!invoice) {
      setInvoiceFinalized(false)
      setOverrideReason("")
      setInvoiceManualRows(ensureMinInvoiceRows(getInvoiceItemsForOrder(selectedOrder)))
      return
    }

    if (invoice.invoiceNumber) setInvoiceNumber(invoice.invoiceNumber)
    if (invoice.invoiceDate?.seconds) setInvoiceDate(new Date(invoice.invoiceDate.seconds * 1000).toISOString().slice(0, 10))
    if (typeof invoice.discount === "number") setInvoiceDiscount(String(invoice.discount))
    if (typeof invoice.vatEnabled === "boolean") setVatEnabled(invoice.vatEnabled)
    if (typeof invoice.vatRate === "number") setVatRate(String(invoice.vatRate))
    if (typeof invoice.subtotal === "number") setInvoiceSubtotalOverride(String(invoice.subtotal))
    if (typeof invoice.total === "number") setInvoiceTotalOverride(String(invoice.total))
    if (Array.isArray(invoice.manualRows)) setInvoiceManualRows(ensureMinInvoiceRows(invoice.manualRows))
    else setInvoiceManualRows(ensureMinInvoiceRows(getInvoiceItemsForOrder(selectedOrder)))
    if (typeof invoice.warrantyPeriod === "string") setWarrantyPeriod(invoice.warrantyPeriod)
    if (typeof invoice.adminNotes === "string") setAdminNotesInvoice(invoice.adminNotes)
    if (typeof invoice.disclaimerText === "string") setDisclaimerText(invoice.disclaimerText)
    if (invoice.language === "en" || invoice.language === "ar" || invoice.language === "both") setInvoiceLang(invoice.language)
    setInvoiceFinalized(invoice.status === "finalized")
  }, [selectedOrder])

  const openInvoicePreview = async () => {
    if (!selectedOrder) return
    if (!invoiceNumber) {
      const num = await getNextInvoiceNumber()
      setInvoiceNumber(num)
    }
    if (!invoiceDate) {
      setInvoiceDate(new Date().toISOString().slice(0, 10))
    }
    setInvoiceDialogOpen(true)
  }

  const exportInvoice = async (opts?: { autoPrint?: boolean, autoDownload?: boolean }) => {
    if (!selectedOrder) return

    let nextInvoiceNumber = invoiceNumber
    if (!nextInvoiceNumber) {
      nextInvoiceNumber = await getNextInvoiceNumber()
      setInvoiceNumber(nextInvoiceNumber)
    }

    const nextInvoiceDate = invoiceDate || new Date().toISOString().slice(0, 10)
    setInvoiceDate(nextInvoiceDate)

    const orderForInvoice = {
      id: selectedOrder.id,
      orderId: selectedOrder.orderId,
      customerName: selectedOrder.customerName,
      customerPhone: selectedOrder.customerPhone,
      deviceType: selectedOrder.deviceType,
      brand: selectedOrder.brand,
      model: selectedOrder.model,
      issue: selectedOrder.issue,
      location: (selectedOrder as any).location,
      address: (selectedOrder as any).address,
      price: selectedOrder.price,
    }

    const payload = {
      order: orderForInvoice,
      items: invoiceManualRows,
      invoiceNumber: nextInvoiceNumber,
      invoiceDate: nextInvoiceDate,
      language: invoiceLang,
      discount: Number(invoiceDiscount || 0),
      vatEnabled,
      vatRate: Number(vatRate || 0),
      subtotalOverride: invoiceSubtotalOverride,
      totalOverride: invoiceTotalOverride,
      warrantyPeriod,
      adminNotes: adminNotesInvoice,
      disclaimerText,
      autoPrint: !!opts?.autoPrint,
      autoDownload: !!opts?.autoDownload,
      fileName: `${nextInvoiceNumber}${selectedOrder.orderId ? `-${selectedOrder.orderId}` : ""}`,
    }

    try {
      sessionStorage.setItem("kbi_invoice_export_v1", JSON.stringify(payload))
      window.open("/admin/invoice-export", "_blank", "noopener,noreferrer")
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to open invoice export" })
    }
  }

  const finalizeInvoice = async () => {
    if (!selectedOrder) return

    let nextInvoiceNumber = invoiceNumber
    if (!nextInvoiceNumber) {
      nextInvoiceNumber = await getNextInvoiceNumber()
      setInvoiceNumber(nextInvoiceNumber)
    }
    const nextInvoiceDate = invoiceDate || new Date().toISOString().slice(0, 10)
    setInvoiceDate(nextInvoiceDate)

    const user = auth.currentUser
    if (!user) throw new Error("Not logged in")
    const idToken = await user.getIdToken()

    const items = ensureMinInvoiceRows(invoiceManualRows)
    const res = await finalizeInvoiceAction({
      orderDocId: selectedOrder.id,
      invoiceNumber: nextInvoiceNumber,
      invoiceDate: nextInvoiceDate,
      language: invoiceLang,
      discount: Number(invoiceDiscount || 0),
      vatEnabled,
      vatRate: Number(vatRate || 0),
      warrantyPeriod,
      adminNotes: adminNotesInvoice,
      disclaimerText,
      subtotalOverride: invoiceSubtotalOverride,
      totalOverride: invoiceTotalOverride,
      manualRows: items,
      idToken
    })
    if ((res as any)?.error) throw new Error((res as any).error)
    setInvoiceFinalized(true)
  }

  const overrideInvoice = async () => {
    if (!selectedOrder || !overrideReason) return
    const res = await overrideInvoiceAction(selectedOrder.id, overrideReason)
    if ((res as any)?.error) throw new Error((res as any).error)
    setOverrideReason("")
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-lg font-semibold">{t("Loading...")}</div>
          <div className="text-sm text-gray-600 mt-1">{t("Checking access")}</div>
        </div>
      </div>
    )
  }

  if (!authorized && needsLogin) {
    return (
      <div className={cn("min-h-screen relative flex items-center justify-center p-6 overflow-hidden bg-black", isAr && "[direction:rtl]")}>
        {/* Animated background gradient - no external image needed */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.15),transparent_50%),radial-gradient(ellipse_at_bottom,rgba(139,92,246,0.1),transparent_50%)] animate-pulse" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        <div className="relative z-10 max-w-md w-full rounded-3xl border border-white/20 bg-black/40 backdrop-blur-xl p-8 text-center shadow-2xl">
          <div className="text-3xl mb-4">🚫</div>
          <div className="text-2xl font-bold text-white mb-2">{t("Not an admin? Nice try 😄")}</div>
          <div className="mt-2 text-sm text-white/70 mb-8">{t("Please sign in to view and manage orders.")}</div>
          <a
            href="/admin/login"
            className="w-full inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-6 py-3 text-black font-bold hover:bg-cyan-400 transition-all active:scale-95 shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)]"
          >
            {t("Go to Login")}
          </a>
        </div>
      </div>
    )
  }

  if (!authorized) return null as any
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.orderId.toLowerCase().includes(search.toLowerCase()) ||
      order.customerPhone.includes(search)

    const matchesStatus = statusFilter === "all" || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    const note = `${t("Status updated to")} ${newStatus === "in_progress" ? t("In Progress") :
      newStatus === "waiting_parts" ? t("Waiting Parts") :
        newStatus === "completed" ? t("Completed") :
          newStatus === "delivered" ? t("Delivered") :
            newStatus === "cancelled" ? t("Cancelled") :
              t("Pending")
      }`

    try {
      const user = auth.currentUser
      if (!user) throw new Error("Not logged in")
      const idToken = await user.getIdToken()

      await updateOrderStatusAction(orderId, newStatus, note, idToken)

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: normalizeStatus(newStatus) as any } : o))
      )
      setSelectedOrder((prev) =>
        prev && prev.id === orderId ? { ...prev, status: normalizeStatus(newStatus) as any } : prev
      )

      // Optimistic UI update (optional, or rely on snapshot/refresh)
      // Since we have snapshot listener, it depends if snapshot receives updates (it didn't before).
      // Server Action updates DB. Listeners usually trigger if they can READ.
      // We know READ works (maybe?). Initial fetch works via Server Action.
      // If snapshot implies permissions, we might need manual refresh or state update.
      // But let's assume successful action leads to DB update.

      // Audit log (Client side - might fail if permissions blocked, but non-critical)
      if (user) {
        logAction(AuditActions.ORDER_UPDATED, "order", user.uid, user.email || "", {
          targetId: orderId,
          targetType: "order",
          details: { newStatus } 
        })
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to update order status" })
    }
  }

  const handleDelete = async (orderId: string) => {
    if (confirm(String(t("Are you sure you want to delete this order?")))) {
      try {
        const user = auth.currentUser
        if (!user) throw new Error("Not logged in")
        const idToken = await user.getIdToken()

        const res = await deleteOrderAction(orderId, idToken)
        if ((res as any)?.error) {
          toast({ variant: "destructive", title: "Error", description: String((res as any)?.error || "Failed to delete order") })
          return
        }

        setOrders((prev) => prev.filter((o) => o.id !== orderId))
        setSelectedOrder((prev) => (prev?.id === orderId ? null : prev))
        setIsDetailsOpen((prev) => (selectedOrder?.id === orderId ? false : prev))
        toast({ title: "Deleted", description: "Order deleted successfully" })

        try {
          const ordersCacheKey = "kbi_admin_orders_cache_v1"
          const rawOrders = localStorage.getItem(ordersCacheKey)
          if (rawOrders) {
            const parsed = JSON.parse(rawOrders) as { orders?: any[]; cursor?: any; hasMore?: boolean }
            if (Array.isArray(parsed.orders)) {
              const nextOrders = parsed.orders.filter((o: any) => o?.id !== orderId)
              localStorage.setItem(ordersCacheKey, JSON.stringify({ ...parsed, orders: nextOrders }))
            }
          }
        } catch { }

        if (user) {
          logAction(AuditActions.ORDER_DELETED, "order", user.uid, user.email || "", {
            targetId: orderId,
            targetType: "order"
          })
        }
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete order" })
      }
    }
  }

  const handleWhatsAppNotify = (order: Order, messageType: string) => {
    if (!order.customerPhone) {
      alert(t("No phone number available"))
      return
    }
    let message = ""
    switch (messageType) {
      case "confirmation":
        message = `Hi ${order.customerName}, your order #${order.orderId} has been created successfully. We will contact you shortly. Thank you — KBI GLOBAL TECHNOLOGIES.`
        break
      case "complete":
        message = `Hi ${order.customerName}, your device repair is complete! Order #${order.orderId}. Please rate our service at kbi.ae/rate/${order.orderId}`
        break
      default:
        message = `Order #${order.orderId} update`
    }
    window.open(`https://wa.me/${order.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  const handleEtaUpdate = async () => {
    if (!selectedOrder || !etaMinutes) return
    const minutes = parseInt(etaMinutes, 10)
    if (isNaN(minutes) || minutes < 0) return
    const iso = new Date(Date.now() + minutes * 60000).toISOString()

    const user = auth.currentUser
    if (!user) throw new Error("Not logged in")
    const idToken = await user.getIdToken()

    const res = await updateEtaAction(selectedOrder.id, iso, idToken)
    if ((res as any)?.error) throw new Error((res as any).error)
    setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? { ...o, estimatedCompletion: iso } : o)))
    setSelectedOrder((prev) => (prev ? { ...prev, estimatedCompletion: iso } : prev))
    setEtaMinutes("")
  }

  const handlePriceUpdate = async () => {
    if (!selectedOrder || priceInput === "") return
    const price = parseFloat(priceInput)
    if (isNaN(price) || price < 0) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a valid price" })
      return
    }

    try {
      const user = auth.currentUser
      if (!user) throw new Error("Not logged in")
      const idToken = await user.getIdToken()

      const res = await updateOrderPriceAction(selectedOrder.id, price, idToken)
      if ((res as any)?.error) throw new Error((res as any).error)
      setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? { ...o, price: price } : o)))
      setSelectedOrder((prev) => (prev ? { ...prev, price: price } : prev))
      toast({ title: "Success", description: "Price updated successfully" })
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to update price" })
    }
  }

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const statusLabel = (s: Order["status"]) => (
    s === "in_progress" ? t("In Progress") :
      s === "waiting_parts" ? t("Waiting Parts") :
        s === "completed" ? t("Completed") :
          s === "delivered" ? t("Delivered") :
            s === "cancelled" ? t("Cancelled") :
              t("Pending")
  )

  const exportCSV = () => {
    const headers = [t("Order ID"), t("Customer"), t("Phone"), t("Device"), t("Issue"), t("Status"), t("Created"), t("Price")]
    const rows = filteredOrders.map(o => [
      o.orderId,
      o.customerName,
      o.customerPhone,
      `"${o.brand} ${o.model}"`, // Quote to handle commas
      `"${o.issue}"`,
      o.status,
      getDate(o.createdAt)?.toISOString() || "",
      o.price || ""
    ])

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `orders_export_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  const handleCreateOrder = async () => {
    setCreateLoading(true)
    setCreateError("")
    if (!newName || !newPhone || !newIssue) {
      setCreateError(t("Please fill required fields"))
      setCreateLoading(false)
      return
    }
    try {
      const priceNum = newPrice ? Number(newPrice) : undefined
      const res = await createOrderAction({
        customerName: newName,
        customerPhone: newPhone,
        deviceType: newDeviceType || "Device",
        brand: newBrand || "",
        model: newModel || "",
        issue: newIssue,
        price: Number.isFinite(priceNum as any) ? priceNum : undefined,
        location: newLocation || "",
      })
      if ((res as any)?.error) throw new Error((res as any).error)

      const nowIso = new Date().toISOString()
      const created: Order = {
        id: (res as any).id,
        orderId: (res as any).orderId,
        customerName: newName,
        customerPhone: newPhone,
        deviceType: newDeviceType || "Device",
        brand: newBrand || "",
        model: newModel || "",
        issue: newIssue,
        status: "pending",
        createdAt: nowIso,
        estimatedCompletion: null,
        price: Number.isFinite(priceNum as any) ? priceNum : 0,
        notes: "",
        statusHistory: [{ status: "pending", timestamp: nowIso, note: t("Order created") }],
      }
      setOrders((prev) => [created, ...prev])
      setCreateOpen(false)
      setNewName("")
      setNewPhone("")
      setNewDeviceType("")
      setNewBrand("")
      setNewModel("")
      setNewIssue("")
      setNewPrice("")
      setNewLocation("")
    } catch (e: any) {
      setCreateError(e?.message || t("Failed to create order"))
    } finally {
      setCreateLoading(false)
    }
  }

  const stats = {
    total: filteredOrders.length,
    pending: filteredOrders.filter(o => o.status === "pending").length,
    active: filteredOrders.filter(o => o.status === "in_progress" || o.status === "waiting_parts").length,
    completed: filteredOrders.filter(o => o.status === "completed" || o.status === "delivered").length
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-white tracking-tight">{t("Orders Management")}</h1>
          <p className="text-white/50 text-sm">{t("Manage and track all repair operations in real-time.")}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("table")}
              className={cn(
                "h-9 px-4 rounded-lg transition-all duration-200",
                viewMode === "table" 
                  ? "bg-cyan-500 text-black font-bold shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)]" 
                  : "text-white/60 hover:text-white"
              )}
            >
              <List className="w-4 h-4 mr-2" /> {t("List")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("board")}
              className={cn(
                "h-9 px-4 rounded-lg transition-all duration-200",
                viewMode === "board" 
                  ? "bg-cyan-500 text-black font-bold shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)]" 
                  : "text-white/60 hover:text-white"
              )}
            >
              <LayoutGrid className="w-4 h-4 mr-2" /> {t("Board")}
            </Button>
          </div>

          <Button 
            type="button" 
            variant="outline" 
            onClick={exportCSV}
            className="h-11 border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl"
          >
            <FileDown className="mr-2 h-4 w-4" /> {t("Export")}
          </Button>
          
          <Button 
            type="button" 
            onClick={() => setCreateOpen(true)}
            className="h-11 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl shadow-[0_0_20px_-5px_rgba(6,182,212,0.4)] transition-all active:scale-95"
          >
            <Plus className="mr-2 h-5 w-5" /> {t("New Order")}
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t("Total Orders"), value: stats.total, color: "text-white" },
          { label: t("Pending"), value: stats.pending, color: "text-yellow-400" },
          { label: t("Active"), value: stats.active, color: "text-blue-400" },
          { label: t("Finished"), value: stats.completed, color: "text-green-400" },
        ].map((s, idx) => (
          <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="text-xs text-white/40 font-medium mb-1 uppercase tracking-wider">{s.label}</div>
            <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters Area */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30 group-focus-within:text-cyan-400 transition-colors" />
          <Input
            placeholder={t("Search by customer, ID, or phone...")}
            className="h-12 pl-11 bg-white/5 border-white/10 text-white rounded-xl focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-3">
          <div className="w-full sm:w-[220px]">
            <AppSelect
              value={statusFilter}
              onValueChange={setStatusFilter}
              className="h-12 bg-white/5 border-white/10 rounded-xl"
              placeholder={t("Filter by Status")}
              items={[
                { value: "all", label: t("All Statuses") },
                { value: "pending", label: t("Pending") },
                { value: "in_progress", label: t("In Progress") },
                { value: "waiting_parts", label: t("Waiting Parts") },
                { value: "completed", label: t("Completed") },
                { value: "delivered", label: t("Delivered") },
                { value: "cancelled", label: t("Cancelled") },
              ]}
            />
          </div>
        </div>
      </div>

      {ordersLoadError ? (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-200 flex items-center gap-3"
        >
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
          {ordersLoadError}
        </motion.div>
      ) : null}

      <AnimatePresence mode="wait">
        {viewMode === "table" ? (
          <motion.div
            key="table-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Desktop Table */}
            <div className="hidden md:block rounded-2xl border border-white/10 bg-white/5 overflow-hidden backdrop-blur-md shadow-2xl">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/60 font-bold h-14">{t("Order ID")}</TableHead>
                    <TableHead className="text-white/60 font-bold h-14">{t("Customer")}</TableHead>
                    <TableHead className="text-white/60 font-bold h-14">{t("Device")}</TableHead>
                    <TableHead className="text-white/60 font-bold h-14">{t("Issue")}</TableHead>
                    <TableHead className="text-white/60 font-bold h-14">{t("Status")}</TableHead>
                    <TableHead className="text-white/60 font-bold h-14">{t("Created")}</TableHead>
                    <TableHead className="text-white/60 font-bold h-14 text-right">{t("Actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-20">
                        <div className="flex flex-col items-center gap-3 opacity-20">
                          <ShoppingCart className="w-12 h-12" />
                          <p className="text-lg font-medium">{t("No orders found")}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedOrders.map((order) => (
                      <TableRow 
                        key={order.id} 
                        className="border-white/5 hover:bg-white/[0.07] transition-colors group cursor-pointer"
                        onClick={() => { setSelectedOrder(order); setIsDetailsOpen(true) }}
                      >
                        <TableCell className="font-mono text-cyan-400 font-bold tracking-wider">
                          #{order.orderId}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white/70">
                              <User className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-white font-semibold">{order.customerName}</span>
                              <span className="text-xs text-white/40">{order.customerPhone}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-white/90">
                            <Smartphone className="w-4 h-4 text-white/30" />
                            <span className="font-medium">{order.brand}</span>
                            <span className="text-white/50">{order.model}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <p className="text-white/70 truncate text-sm italic">{order.issue}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border-0 shadow-lg", statusColors[order.status as keyof typeof statusColors])}>
                            {statusLabel(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white/40 text-xs">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Clock className="w-3 h-3" />
                            {getDate(order.createdAt) ? formatDistanceToNow(getDate(order.createdAt)!, { addSuffix: true }) : t("Just now")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 text-white/40 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg"
                              onClick={() => { setSelectedOrder(order); setIsDetailsOpen(true) }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button type="button" variant="ghost" className="h-9 w-9 p-0 text-white/40 hover:text-white rounded-lg">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-zinc-950 border-white/10 text-white min-w-[180px] rounded-xl shadow-2xl p-1.5 backdrop-blur-xl">
                                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-white/40 px-3 py-2 font-bold">{t("Quick Actions")}</DropdownMenuLabel>
                                <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer focus:bg-white/10" onClick={() => handleWhatsAppNotify(order, "confirmation")}>
                                  <MessageCircle className="w-4 h-4 text-green-400" /> {t("Send Confirmation")}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer focus:bg-white/10" onClick={() => handleWhatsAppNotify(order, "complete")}>
                                  <CheckCircle className="w-4 h-4 text-cyan-400" /> {t("Notify Complete")}
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator className="bg-white/5" />
                                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-white/40 px-3 py-2 font-bold">{t("Status")}</DropdownMenuLabel>
                                <DropdownMenuItem className="rounded-lg focus:bg-blue-500/20 focus:text-blue-400 cursor-pointer" onClick={() => handleStatusUpdate(order.id, "in_progress")}>
                                  {t("Mark In Progress")}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="rounded-lg focus:bg-green-500/20 focus:text-green-400 cursor-pointer" onClick={() => handleStatusUpdate(order.id, "completed")}>
                                  {t("Mark Completed")}
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator className="bg-white/5" />
                                <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 focus:text-red-400 rounded-lg gap-2 cursor-pointer font-medium" onClick={() => handleDelete(order.id)}>
                                  <Trash2 className="w-4 h-4" /> {t("Delete Order")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="py-20 text-center text-white/30 italic">{t("No orders found")}</div>
              ) : (
                paginatedOrders.map((order) => (
                  <motion.div
                    layout
                    key={order.id}
                    onClick={() => { setSelectedOrder(order); setIsDetailsOpen(true) }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 active:scale-[0.98] transition-all backdrop-blur-sm shadow-xl"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-mono">#{order.orderId}</div>
                        <h3 className="text-lg font-bold text-white">{order.customerName}</h3>
                      </div>
                      <Badge variant="outline" className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border-0 shadow-lg", statusColors[order.status as keyof typeof statusColors])}>
                        {statusLabel(order.status)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-2 border-y border-white/5">
                      <div className="space-y-1">
                        <div className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">{t("Device")}</div>
                        <div className="text-sm text-white/80 font-medium truncate">{order.brand} {order.model}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">{t("Created")}</div>
                        <div className="text-sm text-white/60 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getDate(order.createdAt) ? formatDistanceToNow(getDate(order.createdAt)!, { addSuffix: true }) : t("Just now")}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex gap-2">
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 bg-white/5 rounded-xl text-green-400"
                            onClick={(e) => { e.stopPropagation(); handleWhatsAppNotify(order, "confirmation") }}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 bg-white/5 rounded-xl text-cyan-400"
                            onClick={(e) => { e.stopPropagation(); handleWhatsAppNotify(order, "complete") }}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                      </div>
                      <Button variant="ghost" size="sm" className="text-white/40 hover:text-white rounded-xl h-9 px-4 font-bold uppercase tracking-widest text-[10px] bg-white/5">
                        {t("View Details")} <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between px-2">
                <p className="text-sm text-white/40">
                  {t("Showing")} <span className="text-white/80 font-bold">{paginatedOrders.length}</span> {t("of")} <span className="text-white/80 font-bold">{filteredOrders.length}</span> {t("orders")}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl"
                  >
                    {t("Previous")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl"
                  >
                    {t("Next")}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="board-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col lg:flex-row gap-6 overflow-x-auto pb-6"
          >
            {["pending", "in_progress", "waiting_parts", "completed"].map(status => {
              const statusOrders = filteredOrders.filter(o => {
                if (status === "completed") return ["completed", "delivered"].includes(o.status)
                if (status === "pending") return ["pending", "order_created"].includes(o.status)
                return o.status === status
              })

              return (
                <div key={status} className="flex-1 min-w-[320px] max-w-[400px] flex flex-col h-[calc(100vh-320px)] min-h-[600px]">
                  <div className={cn("mb-4 flex items-center justify-between px-1",
                    status === "pending" && "text-yellow-400",
                    status === "in_progress" && "text-blue-400",
                    status === "waiting_parts" && "text-orange-400",
                    status === "completed" && "text-green-400",
                  )}>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", 
                        status === "pending" && "bg-yellow-400",
                        status === "in_progress" && "bg-blue-400",
                        status === "waiting_parts" && "bg-orange-400",
                        status === "completed" && "bg-green-400",
                      )} />
                      <h3 className="font-bold uppercase tracking-widest text-xs">{t(status.replace("_", " "))}</h3>
                    </div>
                    <Badge variant="secondary" className="bg-white/5 text-white/50 border-white/10 rounded-lg px-2 py-0.5 font-mono text-[10px]">{statusOrders.length}</Badge>
                  </div>
                  
                  <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-3xl p-3 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 backdrop-blur-sm">
                    {statusOrders.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center opacity-10 py-20 italic text-sm">
                        {t("Empty Column")}
                      </div>
                    ) : (
                      statusOrders.map(order => (
                        <motion.div 
                          layout
                          key={order.id} 
                          onClick={() => { setSelectedOrder(order); setIsDetailsOpen(true) }}
                          className="bg-zinc-900/80 p-4 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-all group cursor-pointer shadow-xl relative overflow-hidden active:scale-[0.98]"
                        >
                          <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="w-4 h-4 text-cyan-400" />
                          </div>
                          
                          <div className="flex justify-between items-start mb-3">
                            <span className="font-mono text-[10px] text-white/30 font-bold uppercase tracking-tighter">#{order.orderId}</span>
                            <span className="text-[10px] text-white/20 font-medium">
                              {getDate(order.createdAt) ? formatDistanceToNow(getDate(order.createdAt)!, { addSuffix: true }) : ""}
                            </span>
                          </div>
                          
                          <h4 className="font-bold text-white mb-1 leading-tight group-hover:text-cyan-400 transition-colors">{order.customerName}</h4>
                          <p className="text-xs text-white/40 mb-4 font-medium flex items-center gap-1">
                            <Smartphone className="w-3 h-3" /> {order.brand} {order.model}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex -space-x-2">
                               <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-white/5 flex items-center justify-center text-cyan-400 text-[10px] font-bold uppercase">
                                  {order.customerName.charAt(0)}
                               </div>
                            </div>
                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                               <Button variant="ghost" size="icon" className="h-7 w-7 bg-white/5 rounded-lg text-white/40 hover:text-white" onClick={(e) => e.stopPropagation()}>
                                  <MoreHorizontal className="w-3 h-3" />
                               </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 flex items-center justify-center">
        {ordersLoading ? (
          <div className="text-sm text-white/60">{t("Loading...")}</div>
        ) : hasMoreOrders ? (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={loadMoreOrders} disabled={loadingMore} className="border-white/15 bg-white/5 text-white hover:bg-white/10">
              {loadingMore ? t("Loading...") : t("Load More")}
            </Button>
            <Button type="button" variant="outline" onClick={loadAllOrders} disabled={loadingMore} className="border-white/15 bg-white/5 text-white hover:bg-white/10">
              {loadingMore ? t("Loading...") : t("Load All")}
            </Button>
          </div>
        ) : null}
      </div>

      {/* Pagination (Alternative or Global) */}
      {totalPages > 1 && viewMode === "board" && (
        <div className="flex items-center justify-end gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
          >
            {t("Previous")}
          </Button>
          <span className="text-sm text-white/50">
            {t("Page")} {currentPage} {t("of")} {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
          >
            {t("Next")}
          </Button>
        </div>
      )}

      {/* Order Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="bg-zinc-950 text-white border-white/10 w-full sm:max-w-screen-md md:max-w-screen-lg lg:max-w-screen-xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 shadow-2xl backdrop-blur-2xl">
          <DialogHeader className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur-xl border-b border-white/10 px-6 py-4">
            <div className="flex items-center justify-between w-full">
              <div className="space-y-1">
                <DialogTitle className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                  <span className="text-cyan-400 font-mono">#{selectedOrder?.orderId}</span>
                  <span className="text-white/40 text-sm font-medium">|</span>
                  <span className="text-white">{t("Order Details")}</span>
                </DialogTitle>
                <div className="flex items-center gap-2">
                  {selectedOrder && (
                    <Badge variant="outline" className={cn("px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border-0 shadow-lg", statusColors[selectedOrder.status as keyof typeof statusColors])}>
                      {statusLabel(selectedOrder.status)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          {selectedOrder && (
            <div className="p-6 space-y-8">
              {/* Top Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                  <div className="text-[10px] text-white/30 uppercase font-bold tracking-widest flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-cyan-400" /> {t("Created At")}
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {getDate(selectedOrder.createdAt)?.toLocaleString() || t("Just now")}
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                  <div className="text-[10px] text-white/30 uppercase font-bold tracking-widest flex items-center gap-2">
                    <Smartphone className="w-3 h-3 text-cyan-400" /> {t("Device Info")}
                  </div>
                  <div className="text-sm font-semibold text-white truncate">
                    {selectedOrder.brand} {selectedOrder.model}
                  </div>
                </div>

                <div className="bg-white/5 border border-cyan-500/20 rounded-2xl p-4 space-y-1 group">
                  <div className="text-[10px] text-cyan-400 uppercase font-bold tracking-widest flex items-center gap-2">
                    <CreditCard className="w-3 h-3" /> {t("Order Total")}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-white">AED</span>
                    <Input
                      type="number"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      className="h-8 bg-transparent border-none focus:ring-0 p-0 text-xl font-bold text-white w-24"
                    />
                    <Button variant="ghost" size="sm" onClick={handlePriceUpdate} className="h-7 px-2 text-cyan-400 hover:bg-cyan-500/10 rounded-lg">
                      {t("Save")}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Main Info Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Customer & Issue */}
                <div className="lg:col-span-2 space-y-6">
                  <section className="space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
                      <User className="w-4 h-4" /> {t("Customer Information")}
                    </h4>
                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-[10px] text-white/20 uppercase font-bold">{t("Name")}</label>
                        <p className="text-lg font-semibold text-white">{selectedOrder.customerName}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-white/20 uppercase font-bold">{t("Phone Number")}</label>
                        <p className="text-lg font-semibold text-cyan-400">{selectedOrder.customerPhone}</p>
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] text-white/20 uppercase font-bold">{t("Location")}</label>
                        <p className="text-sm text-white/70 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-red-400" />
                          {(selectedOrder as any).location || t("No location provided")}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> {t("Repair Details")}
                    </h4>
                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-6">
                      <div className="space-y-1">
                        <label className="text-[10px] text-white/20 uppercase font-bold">{t("Issue Reported")}</label>
                        <div className="bg-zinc-900/50 rounded-xl p-4 border border-white/5">
                          <p className="text-white/90 leading-relaxed italic">"{selectedOrder.issue}"</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-xl p-4 space-y-3">
                          <label className="text-[10px] text-white/20 uppercase font-bold flex items-center gap-2">
                            <Clock className="w-3 h-3 text-cyan-400" /> {t("ETA (Minutes)")}
                          </label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              value={etaMinutes}
                              onChange={(e) => setEtaMinutes(e.target.value)}
                              className="h-10 bg-white/5 border-white/10 rounded-lg text-white"
                            />
                            <Button onClick={handleEtaUpdate} className="h-10 bg-cyan-500 text-black font-bold rounded-lg px-4">
                              {t("Set")}
                            </Button>
                          </div>
                        </div>

                        {selectedOrder.estimatedCompletion && (
                          <div className="bg-cyan-500/5 rounded-xl p-4 space-y-1 border border-cyan-500/10">
                            <label className="text-[10px] text-cyan-400 uppercase font-bold">{t("Expected Finish")}</label>
                            <div className="text-sm font-mono font-bold text-white">
                              {new Date(selectedOrder.estimatedCompletion).toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                </div>

                {/* Right Column: Timeline & Actions */}
                <div className="space-y-8">
                  <section className="space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> {t("Order Timeline")}
                    </h4>
                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
                      <div className="space-y-8 relative">
                        {/* Vertical Line */}
                        <div className="absolute left-[11px] top-2 bottom-4 w-[2px] bg-white/10" />

                        {[
                          { id: "pending", label: t("Placed"), desc: t("Order received") },
                          { id: "in_progress", label: t("Repairing"), desc: t("Work in progress") },
                          { id: "completed", label: t("Finished"), desc: t("Device fixed") },
                          { id: "delivered", label: t("Delivered"), desc: t("To customer") }
                        ].map((step, idx) => {
                          let currentIdx = 0
                          if (selectedOrder.status === "delivered") currentIdx = 3
                          else if (selectedOrder.status === "completed") currentIdx = 2
                          else if (selectedOrder.status === "in_progress" || selectedOrder.status === "waiting_parts") currentIdx = 1
                          
                          const isDone = idx < currentIdx
                          const isNow = idx === currentIdx
                          
                          return (
                            <div key={idx} className={cn("relative flex gap-4 transition-all", !isDone && !isNow && "opacity-30")}>
                              <div className={cn(
                                "z-10 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all",
                                isDone ? "bg-cyan-500 border-cyan-500 text-black" :
                                isNow ? "bg-cyan-500/20 border-cyan-500 text-cyan-400 animate-pulse" :
                                "bg-zinc-900 border-white/10 text-white/20"
                              )}>
                                {isDone ? <CheckCircle className="w-3 h-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                              </div>
                              <div className="space-y-0.5">
                                <p className={cn("text-xs font-bold uppercase tracking-widest", isNow ? "text-cyan-400" : "text-white")}>{step.label}</p>
                                <p className="text-[10px] text-white/40">{step.desc}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
                      <Share2 className="w-4 h-4" /> {t("Quick Actions")}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => handleWhatsAppNotify(selectedOrder, "confirmation")}
                        className="w-full justify-start border-white/10 bg-white/5 hover:bg-green-500/10 hover:text-green-400 rounded-xl"
                      >
                        <MessageCircle className="w-4 h-4 mr-3" /> {t("Confirm via WhatsApp")}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleWhatsAppNotify(selectedOrder, "complete")}
                        className="w-full justify-start border-white/10 bg-white/5 hover:bg-cyan-500/10 hover:text-cyan-400 rounded-xl"
                      >
                        <CheckCircle className="w-4 h-4 mr-3" /> {t("Notify Completion")}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start border-white/10 bg-white/5 hover:bg-red-500/10 hover:text-red-400 rounded-xl"
                        onClick={() => handleDelete(selectedOrder.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-3" /> {t("Delete Order")}
                      </Button>
                    </div>
                  </section>
                </div>
              </div>

              {/* Invoice Section */}
              <section className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> {t("Invoice Management")}
                  </h4>
                  <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-400 border-0 uppercase tracking-widest text-[10px]">
                    {((selectedOrder as any).invoice?.status || (invoiceFinalized ? "finalized" : "draft"))}
                  </Badge>
                </div>
                
                <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Invoice Controls */}
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-white/20 uppercase font-bold">{t("Invoice #")}</label>
                          <Input
                            placeholder="INV-2024-001"
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            disabled={invoiceFinalized || (selectedOrder as any).invoice?.status === "finalized"}
                            className="bg-white/5 border-white/10 rounded-xl"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-white/20 uppercase font-bold">{t("Date")}</label>
                          <Input
                            type="date"
                            value={invoiceDate}
                            onChange={(e) => setInvoiceDate(e.target.value)}
                            disabled={invoiceFinalized || (selectedOrder as any).invoice?.status === "finalized"}
                            className="bg-white/5 border-white/10 rounded-xl text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "en", label: "English" },
                          { id: "ar", label: "العربية" },
                          { id: "both", label: "Dual" }
                        ].map(lang => (
                          <Button
                            key={lang.id}
                            type="button"
                            variant="outline"
                            onClick={() => setInvoiceLang(lang.id as any)}
                            disabled={invoiceFinalized || (selectedOrder as any).invoice?.status === "finalized"}
                            className={cn(
                              "border-white/10 rounded-xl transition-all",
                              invoiceLang === lang.id ? "bg-cyan-500 text-black font-bold border-cyan-500" : "bg-white/5 text-white/60"
                            )}
                          >
                            {lang.label}
                          </Button>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-3 pt-2">
                        <Button
                          onClick={openInvoicePreview}
                          disabled={invoiceFinalized || (selectedOrder as any).invoice?.status === "finalized"}
                          className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl px-6"
                        >
                          <Eye className="w-4 h-4 mr-2" /> {t("Preview Invoice")}
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => exportInvoice({ autoPrint: true })}
                          className="border-white/10 bg-white/5 text-white rounded-xl"
                        >
                          <Download className="w-4 h-4 mr-2" /> {t("Print / PDF")}
                        </Button>
                        
                        <Button
                          onClick={finalizeInvoice}
                          disabled={invoiceFinalized || (selectedOrder as any).invoice?.status === "finalized"}
                          className="bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl px-6"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> {t("Finalize")}
                        </Button>
                      </div>
                    </div>

                    {/* Additional Options */}
                    <div className="space-y-4 bg-white/5 rounded-2xl p-5 border border-white/5">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-white/20 uppercase font-bold">{t("Discount (AED)")}</label>
                          <Input
                            placeholder="0.00"
                            value={invoiceDiscount}
                            onChange={(e) => setInvoiceDiscount(e.target.value)}
                            disabled={invoiceFinalized || (selectedOrder as any).invoice?.status === "finalized"}
                            className="bg-zinc-900 border-white/5 rounded-xl"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-white/20 uppercase font-bold">{t("Warranty")}</label>
                          <Input
                            placeholder="3 Months"
                            value={warrantyPeriod}
                            onChange={(e) => setWarrantyPeriod(e.target.value)}
                            disabled={invoiceFinalized || (selectedOrder as any).invoice?.status === "finalized"}
                            className="bg-zinc-900 border-white/5 rounded-xl"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                        <input
                          type="checkbox"
                          id="vat-toggle"
                          checked={vatEnabled}
                          onChange={(e) => setVatEnabled(e.target.checked)}
                          disabled={invoiceFinalized || (selectedOrder as any).invoice?.status === "finalized"}
                          className="w-4 h-4 rounded border-white/10 bg-white/5 text-cyan-500 focus:ring-cyan-500/20"
                        />
                        <label htmlFor="vat-toggle" className="text-sm text-white/60 cursor-pointer">{t("Enable 5% VAT")}</label>
                        <Input
                          placeholder="5"
                          value={vatRate}
                          onChange={(e) => setVatRate(e.target.value)}
                          disabled={!vatEnabled || invoiceFinalized || (selectedOrder as any).invoice?.status === "finalized"}
                          className="w-16 h-8 bg-zinc-900 border-white/5 rounded-lg text-xs ml-auto"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-white/20 uppercase font-bold">{t("Admin Notes")}</label>
                        <textarea
                          placeholder={t("Internal notes...")}
                          value={adminNotesInvoice}
                          onChange={(e) => setAdminNotesInvoice(e.target.value)}
                          className="w-full h-20 bg-zinc-900 border border-white/5 rounded-xl p-3 text-sm text-white/80 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-zinc-950 text-white border-white/10 sm:max-w-[700px] rounded-3xl shadow-2xl backdrop-blur-2xl">
          <DialogHeader className="pb-4 border-b border-white/10">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <Plus className="w-6 h-6 text-cyan-400" /> {t("New Repair Order")}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            {createError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> {createError}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{t("Customer Details")}</h4>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50 font-medium ml-1">{t("Full Name")}</label>
                    <Input placeholder="John Doe" value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-white/5 border-white/10 rounded-xl h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50 font-medium ml-1">{t("Phone Number")}</label>
                    <Input placeholder="050 123 4567" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="bg-white/5 border-white/10 rounded-xl h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50 font-medium ml-1">{t("Location (Area)")}</label>
                    <Input placeholder="Khalifa City" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} className="bg-white/5 border-white/10 rounded-xl h-11" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{t("Device Information")}</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-white/50 font-medium ml-1">{t("Brand")}</label>
                      <Input placeholder="Apple" value={newBrand} onChange={(e) => setNewBrand(e.target.value)} className="bg-white/5 border-white/10 rounded-xl h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-white/50 font-medium ml-1">{t("Model")}</label>
                      <Input placeholder="iPhone 15" value={newModel} onChange={(e) => setNewModel(e.target.value)} className="bg-white/5 border-white/10 rounded-xl h-11" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50 font-medium ml-1">{t("Issue Description")}</label>
                    <Input placeholder="Broken screen" value={newIssue} onChange={(e) => setNewIssue(e.target.value)} className="bg-white/5 border-white/10 rounded-xl h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/50 font-medium ml-1">{t("Quoted Price (AED)")}</label>
                    <Input type="number" placeholder="250" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="bg-white/5 border-white/10 rounded-xl h-11 font-bold text-cyan-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-white/10">
            <Button variant="ghost" onClick={() => setCreateOpen(false)} className="rounded-xl h-11 text-white/50 hover:text-white hover:bg-white/5">
              {t("Cancel")}
            </Button>
            <Button 
              onClick={handleCreateOrder} 
              disabled={createLoading}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl h-11 px-8 shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
            >
              {createLoading ? t("Creating...") : t("Create Order")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="bg-zinc-950 text-white border-white/10 sm:max-w-[950px] rounded-3xl shadow-2xl backdrop-blur-2xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 border-b border-white/10 sticky top-0 bg-zinc-950/80 backdrop-blur-md z-10">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <FileText className="w-6 h-6 text-cyan-400" /> {t("Invoice Preview")}
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6">
            {selectedOrder && (
              <div className="rounded-2xl overflow-hidden bg-white shadow-2xl">
                <FinalInvoice
                  order={selectedOrder}
                  items={invoiceManualRows as any}
                  invoiceNumber={invoiceNumber}
                  invoiceDate={invoiceDate}
                  language={invoiceLang}
                  discount={Number(invoiceDiscount || 0)}
                  vatEnabled={vatEnabled}
                  vatRate={Number(vatRate || 0)}
                  warrantyPeriod={warrantyPeriod}
                  adminNotes={adminNotesInvoice}
                  disclaimerText={disclaimerText}
                  editable
                  onInvoiceNumberChange={setInvoiceNumber}
                  onInvoiceDateChange={setInvoiceDate}
                  subtotalOverride={invoiceSubtotalOverride}
                  totalOverride={invoiceTotalOverride}
                  onSubtotalOverrideChange={setInvoiceSubtotalOverride}
                  onTotalOverrideChange={setInvoiceTotalOverride}
                  manualRows={invoiceManualRows as any}
                  onManualRowsChange={setInvoiceManualRows as any}
                />
              </div>
            )}
          </div>

          <DialogFooter className="p-6 border-t border-white/10 gap-3">
            <Button 
              variant="ghost" 
              onClick={() => exportInvoice({ autoPrint: true })}
              className="rounded-xl h-11 text-white/70 hover:text-white hover:bg-white/5 font-bold"
            >
              <Download className="w-4 h-4 mr-2" /> {t("Print Invoice")}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => exportInvoice({ autoDownload: true })}
              className="border-white/10 bg-white/5 text-white rounded-xl h-11 px-6 font-bold"
            >
              <FileDown className="w-4 h-4 mr-2" /> {t("PDF Download")}
            </Button>
            <Button 
              onClick={finalizeInvoice} 
              disabled={invoiceFinalized || (selectedOrder as any)?.invoice?.status === "finalized"}
              className="bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl h-11 px-8"
            >
              <CheckCircle className="w-4 h-4 mr-2" /> {t("Finalize & Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
