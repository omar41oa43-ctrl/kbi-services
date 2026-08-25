"use client"

import { useEffect, useMemo, useState } from "react"
import { collection, limit, onSnapshot, query } from "firebase/firestore"
import {
  ArrowDownUp, ArrowRight, CalendarClock, Check, ChevronLeft, ChevronRight,
  CircleAlert, Clipboard, ClipboardCheck, Copy, DollarSign, Ellipsis, FileText, Filter,
  Mail, MapPin, MessageCircle, Phone, Plus, Search, Smartphone, User,
  UserRoundCog, Users, Wrench,
} from "lucide-react"

import { CreateOrderDialog } from "@/components/admin/orders/create-order-dialog"
import { OrderEditorDialog } from "@/components/admin/orders/order-editor-dialog"
import { OrderInvoiceModal } from "@/components/admin/orders/order-invoice-modal"
import {
  formatOrderDate, normalizeWorkOrder, toDate,
  type AdminTechnicianOption, type AdminWorkOrder,
} from "@/components/admin/orders/order-types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Toaster } from "@/components/ui/toaster"
import { auth, db } from "@/firebase/firebaseConfig"
import { useToast } from "@/hooks/use-toast"
import { ORDER_STATUSES, orderStatusLabel, orderStatusTone, type OrderStatus } from "@/lib/order-status"
import { isTechnicianProfile } from "@/lib/technician-profile"
import styles from "./orders.module.css"

const PAGE_SIZE = 7
const terminalStatuses: OrderStatus[] = ["COMPLETED", "CANCELLED", "REJECTED"]
const segmentOptions = ["ALL", "ACTIVE", "TODAY", "UPCOMING", "COMPLETED"] as const
type Segment = typeof segmentOptions[number]
type SortMode = "NEWEST" | "OLDEST" | "PRICE_HIGH" | "PRICE_LOW" | "PRIORITY"

const priorityRank: Record<AdminWorkOrder["priority"], number> = { LOW: 0, NORMAL: 1, HIGH: 2, URGENT: 3 }

const statusClass: Record<ReturnType<typeof orderStatusTone>, string> = {
  amber: styles.statusAmber,
  cyan: styles.statusBlue,
  emerald: styles.statusGreen,
  violet: styles.statusViolet,
  red: styles.statusRed,
}

const rawDate = (order: AdminWorkOrder, ...keys: string[]) => {
  for (const key of keys) {
    const parsed = toDate(order.rawData?.[key])
    if (parsed) return parsed
  }
  return null
}

const startOfToday = () => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

const isSameLocalDay = (left: Date | null, right: Date) => Boolean(
  left && left.getFullYear() === right.getFullYear()
  && left.getMonth() === right.getMonth() && left.getDate() === right.getDate(),
)

const scheduledDate = (order: AdminWorkOrder) => rawDate(order, "scheduledAt", "scheduledDate", "appointmentDate")
const completedDate = (order: AdminWorkOrder) => rawDate(order, "completedAt", "completionDate", "updatedAt")

const etaLabel = (order: AdminWorkOrder) => {
  const slot = String(order.rawData?.timeSlot || order.rawData?.scheduledTime || "").trim()
  if (/asap|immediate/i.test(slot)) return "ASAP"
  const date = scheduledDate(order)
  if (!date) return slot || "—"
  const today = startOfToday()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (isSameLocalDay(date, today)) return slot || "Today"
  if (isSameLocalDay(date, tomorrow)) return "Tomorrow"
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

const formatMoney = (amount: number) => new Intl.NumberFormat("en-AE", {
  style: "currency", currency: "AED", maximumFractionDigits: 0,
}).format(amount)

const keyFor = (order: AdminWorkOrder) => `${order.source}:${order.id}`

export default function OrdersPage() {
  const { toast } = useToast()
  const [bookings, setBookings] = useState<AdminWorkOrder[]>([])
  const [orders, setOrders] = useState<AdminWorkOrder[]>([])
  const [technicians, setTechnicians] = useState<AdminTechnicianOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [segment, setSegment] = useState<Segment>("ALL")
  const [status, setStatus] = useState<"ALL" | OrderStatus>("ALL")
  const [priority, setPriority] = useState<"ALL" | AdminWorkOrder["priority"]>("ALL")
  const [sortMode, setSortMode] = useState<SortMode>("NEWEST")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [focusedKey, setFocusedKey] = useState("")
  const [editorOrder, setEditorOrder] = useState<AdminWorkOrder | null>(null)
  const [focusAssignment, setFocusAssignment] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)

  useEffect(() => {
    const queryValue = new URLSearchParams(window.location.search).get("q")
    if (queryValue) setSearch(queryValue)
    const receiveGlobalSearch = (event: Event) => setSearch(String((event as CustomEvent).detail || ""))
    window.addEventListener("kbi:order-search", receiveGlobalSearch)
    return () => window.removeEventListener("kbi:order-search", receiveGlobalSearch)
  }, [])

  useEffect(() => {
    const readySources = new Set<string>()
    const markReady = (source: string) => {
      readySources.add(source)
      if (readySources.size === 3) setLoading(false)
      setLastSyncedAt(new Date())
    }
    const fail = (source: string, cause?: unknown) => {
      setError(cause instanceof Error ? cause.message : "Unable to load one or more live order sources.")
      markReady(source)
    }

    const bookingStream = onSnapshot(query(collection(db, "bookings"), limit(250)), (snapshot) => {
      setBookings(snapshot.docs.map((doc) => normalizeWorkOrder("bookings", doc.id, doc.data())))
      markReady("bookings")
    }, (cause) => fail("bookings", cause))
    const orderStream = onSnapshot(query(collection(db, "orders"), limit(250)), (snapshot) => {
      setOrders(snapshot.docs.map((doc) => normalizeWorkOrder("orders", doc.id, doc.data())))
      markReady("orders")
    }, (cause) => fail("orders", cause))
    const technicianStream = onSnapshot(query(collection(db, "technicians"), limit(150)), (snapshot) => {
      setTechnicians(snapshot.docs.filter((doc) => isTechnicianProfile(doc.data())).map((doc) => {
        const data = doc.data()
        const online = data.isOnline === true || data.online === true
        return {
          id: doc.id,
          name: String(data.name || data.displayName || data.email || "Unnamed technician"),
          online,
          available: online && (data.isAvailable === true || data.available === true) && !data.currentJob,
        }
      }).sort((left, right) => Number(right.available) - Number(left.available) || left.name.localeCompare(right.name)))
      markReady("technicians")
    }, (cause) => fail("technicians", cause))

    return () => { bookingStream(); orderStream(); technicianStream() }
  }, [])

  const allOrders = useMemo(() => {
    const records = new Map<string, AdminWorkOrder>()
    for (const item of bookings) records.set(item.reference, item)
    for (const item of orders) records.set(item.reference, item)
    return [...records.values()]
  }, [bookings, orders])

  const metrics = useMemo(() => {
    const today = new Date()
    return {
      active: allOrders.filter((order) => !terminalStatuses.includes(order.status)).length,
      unassigned: allOrders.filter((order) => !terminalStatuses.includes(order.status) && order.technicianIds.length === 0).length,
      inProgress: allOrders.filter((order) => order.status === "IN_PROGRESS").length,
      revenue: allOrders.filter((order) => order.status === "COMPLETED" && isSameLocalDay(completedDate(order) || order.createdAt, today))
        .reduce((sum, order) => sum + order.totalAmount, 0),
    }
  }, [allOrders])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const today = startOfToday()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return allOrders.filter((order) => {
      const searchable = [order.reference, order.customerName, order.customerPhone, order.customerEmail,
        order.service, order.device, order.address, order.technicianName, ...order.technicianNames].join(" ").toLowerCase()
      if (needle && !searchable.includes(needle)) return false
      if (status !== "ALL" && order.status !== status) return false
      if (priority !== "ALL" && order.priority !== priority) return false
      const scheduled = scheduledDate(order)
      if (segment === "ACTIVE" && terminalStatuses.includes(order.status)) return false
      if (segment === "TODAY" && !isSameLocalDay(scheduled || order.createdAt, today)) return false
      if (segment === "UPCOMING" && (!scheduled || scheduled < tomorrow || terminalStatuses.includes(order.status))) return false
      if (segment === "COMPLETED" && order.status !== "COMPLETED") return false
      return true
    }).sort((left, right) => {
      if (sortMode === "OLDEST") return (left.createdAt?.getTime() || 0) - (right.createdAt?.getTime() || 0)
      if (sortMode === "PRICE_HIGH") return right.totalAmount - left.totalAmount
      if (sortMode === "PRICE_LOW") return left.totalAmount - right.totalAmount
      if (sortMode === "PRIORITY") return priorityRank[right.priority] - priorityRank[left.priority]
      return (right.createdAt?.getTime() || 0) - (left.createdAt?.getTime() || 0)
    })
  }, [allOrders, priority, search, segment, sortMode, status])

  useEffect(() => setPage(1), [search, segment, status, priority, sortMode])
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pages)
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => {
    if (visible.length === 0) { setFocusedKey(""); return }
    if (!visible.some((order) => keyFor(order) === focusedKey)) setFocusedKey(keyFor(visible[0]))
  }, [focusedKey, visible])

  const focusedOrder = visible.find((order) => keyFor(order) === focusedKey) || visible[0] || null
  const hasAdvancedFilters = status !== "ALL" || priority !== "ALL"

  const clearFilters = () => { setStatus("ALL"); setPriority("ALL"); setSegment("ALL"); setSearch("") }
  const openEditor = (order: AdminWorkOrder, assignment = false) => { setFocusAssignment(assignment); setEditorOrder(order) }

  const saveOrder = async (update: {
    status: OrderStatus; priority: AdminWorkOrder["priority"]; totalAmount?: number
    technicianId: string; technicianName: string; technicianIds: string[]; technicianNames: string[]
  }) => {
    if (!editorOrder || !auth.currentUser) return
    setSaving(true)
    try {
      const token = await auth.currentUser.getIdToken(true)
      const response = await fetch(`/api/admin/work-orders/${editorOrder.source}/${editorOrder.id}`, {
        method: "PATCH", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(update),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || "The order could not be updated.")
      toast({ title: "Order updated", description: `${editorOrder.reference} was saved and synced.` })
      setEditorOrder(null)
    } catch (cause) {
      toast({ variant: "destructive", title: "Update failed", description: cause instanceof Error ? cause.message : "Try again." })
    } finally { setSaving(false) }
  }

  const deleteOrder = async (orderToDelete?: AdminWorkOrder) => {
    const target = orderToDelete || editorOrder
    if (!target || !auth.currentUser) return
    setSaving(true)
    try {
      const token = await auth.currentUser.getIdToken(true)
      const response = await fetch(`/api/admin/work-orders/${target.source}/${target.id}`, {
        method: "DELETE", headers: { authorization: `Bearer ${token}` },
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || "The order could not be deleted.")
      toast({ title: "Order deleted", description: `${target.reference} was removed from synchronized order sources.` })
      if (editorOrder?.id === target.id) setEditorOrder(null)
    } catch (cause) {
      toast({ variant: "destructive", title: "Delete failed", description: cause instanceof Error ? cause.message : "Try again." })
    } finally { setSaving(false) }
  }

  const createOrder = async (data: Record<string, unknown>) => {
    if (!auth.currentUser) return false
    setSaving(true)
    try {
      const token = await auth.currentUser.getIdToken(true)
      const response = await fetch("/api/admin/work-orders", {
        method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(data),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result.ok) throw new Error(result.error || "The order could not be created.")
      toast({ title: "Order created", description: `${result.reference} is live and synchronized with assigned technicians.` })
      setCreateModalOpen(false)
      return true
    } catch (cause) {
      toast({ variant: "destructive", title: "Creation failed", description: cause instanceof Error ? cause.message : "Try again." })
      return false
    } finally { setSaving(false) }
  }

  const copyReference = async (order: AdminWorkOrder) => {
    await navigator.clipboard.writeText(order.reference)
    toast({ title: "Reference copied", description: order.reference })
  }

  return (
    <main className={styles.workspace}>
      <section className={styles.titleRow}>
        <div><p className={styles.eyebrow}>Operations workspace</p><h1>Orders</h1><p>Dispatch, monitor, and complete field repairs.</p></div>
        <Button className={styles.newOrderButton} onClick={() => setCreateModalOpen(true)}><Plus />New Order</Button>
      </section>

      <section className={styles.metrics} aria-label="Order summary">
        <Metric icon={<ClipboardCheck />} label="Active Orders" value={String(metrics.active)} tone="blue" />
        <Metric icon={<Users />} label="Unassigned" value={String(metrics.unassigned)} tone="orange" />
        <Metric icon={<Wrench />} label="In Progress" value={String(metrics.inProgress)} tone="violet" />
        <Metric icon={<DollarSign />} label="Today Revenue" value={formatMoney(metrics.revenue)} tone="green" wide />
      </section>

      {error && <Alert variant="destructive" className={styles.alert}><CircleAlert /><AlertTitle>Live sync notice</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

      <section className={styles.glassPanel}>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}><Search /><span className="sr-only">Search orders</span>
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, customer, device..." />
          </label>
          <div className={styles.segments} aria-label="Order segments">
            {segmentOptions.map((option) => <button type="button" key={option} className={segment === option ? styles.segmentActive : ""}
              onClick={() => setSegment(option)} aria-pressed={segment === option}>{option.charAt(0) + option.slice(1).toLowerCase()}</button>)}
          </div>
          <div className={styles.toolbarActions}>
            <button type="button" className={hasAdvancedFilters ? styles.controlActive : ""} onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen}>
              <Filter />Filters{hasAdvancedFilters && <span className={styles.filterCount}>{Number(status !== "ALL") + Number(priority !== "ALL")}</span>}
            </button>
            <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
              <SelectTrigger className={styles.sortTrigger} aria-label="Sort orders"><ArrowDownUp /><SelectValue /></SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="NEWEST">Newest</SelectItem><SelectItem value="OLDEST">Oldest</SelectItem>
                <SelectItem value="PRICE_HIGH">Price: high to low</SelectItem><SelectItem value="PRICE_LOW">Price: low to high</SelectItem>
                <SelectItem value="PRIORITY">Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtersOpen && <div className={styles.filterDrawer}>
          <div><label htmlFor="orders-status-filter">Status</label><Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
            <SelectTrigger id="orders-status-filter"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All statuses</SelectItem>
              {ORDER_STATUSES.map((item) => <SelectItem key={item} value={item}>{orderStatusLabel(item)}</SelectItem>)}</SelectContent></Select></div>
          <div><label htmlFor="orders-priority-filter">Priority</label><Select value={priority} onValueChange={(value) => setPriority(value as typeof priority)}>
            <SelectTrigger id="orders-priority-filter"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All priorities</SelectItem>
              {(["LOW", "NORMAL", "HIGH", "URGENT"] as const).map((item) => <SelectItem key={item} value={item}>{item.charAt(0) + item.slice(1).toLowerCase()}</SelectItem>)}</SelectContent></Select></div>
          <button type="button" onClick={clearFilters} disabled={!search && !hasAdvancedFilters && segment === "ALL"}>Clear all</button>
        </div>}

        <div className={styles.contentGrid}>
          <div className={styles.orderList}>
            <div className={styles.tableHeader} aria-hidden="true"><span>Reference</span><span>Customer</span><span>Service</span><span>Technician</span><span>ETA</span><span>Status</span><span>Price</span></div>
            <div className={styles.rows} aria-live="polite">
              {loading ? Array.from({ length: PAGE_SIZE }).map((_, index) => <Skeleton key={index} className={styles.skeleton} />)
                : visible.length === 0 ? <div className={styles.emptyState}><span><Clipboard /></span><h2>No matching orders</h2><p>Try another search or clear the active filters.</p><button type="button" onClick={clearFilters}>Clear filters</button></div>
                : visible.map((order) => {
                  const active = keyFor(order) === focusedKey
                  const eta = etaLabel(order)
                  return <button type="button" key={keyFor(order)} className={`${styles.orderRow} ${active ? styles.orderRowActive : ""}`}
                    onClick={() => setFocusedKey(keyFor(order))} aria-pressed={active} aria-label={`Inspect ${order.reference} for ${order.customerName}`}>
                    <span className={styles.reference}>{order.reference}</span>
                    <span className={styles.customerCell}><strong>{order.customerName}</strong><small>{order.device || "Device not recorded"}</small></span>
                    <span className={styles.serviceCell}>{order.service}</span>
                    <span className={styles.techCell}>{order.technicianNames.length > 1 ? `${order.technicianNames[0]} +${order.technicianNames.length - 1}` : order.technicianName || "Unassigned"}</span>
                    <span className={eta === "ASAP" ? styles.etaUrgent : styles.eta}>{eta}</span>
                    <span><StatusPill status={order.status} /></span>
                    <span className={styles.price}>{order.totalAmount > 0 ? `AED ${order.totalAmount.toLocaleString("en-AE")}` : "Unpriced"}</span>
                  </button>
                })}
            </div>
            <footer className={styles.pagination}>
              <span>{filtered.length === 0 ? "No orders" : `Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(currentPage * PAGE_SIZE, filtered.length)} of ${filtered.length} orders`}</span>
              <div><button type="button" aria-label="Previous page" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft /></button>
                {Array.from({ length: Math.min(pages, 3) }).map((_, index) => {
                  const pageNumber = pages <= 3 ? index + 1 : Math.min(Math.max(currentPage - 1, 1) + index, pages)
                  return <button type="button" key={pageNumber} className={currentPage === pageNumber ? styles.currentPage : ""} onClick={() => setPage(pageNumber)}>{pageNumber}</button>
                })}
                <button type="button" aria-label="Next page" disabled={currentPage >= pages} onClick={() => setPage((value) => Math.min(pages, value + 1))}><ChevronRight /></button></div>
            </footer>
          </div>
          <OrderInspector order={focusedOrder} onCopy={copyReference} onEdit={(order) => openEditor(order)} onReassign={(order) => openEditor(order, true)} />
        </div>
      </section>

      <p className={styles.syncNote}><span />Live Firebase sync {lastSyncedAt ? `• updated ${lastSyncedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "• connecting"}</p>

      <OrderEditorDialog order={editorOrder} technicians={technicians} open={Boolean(editorOrder)} saving={saving} focusAssignment={focusAssignment}
        onOpenChange={(open) => { if (!open) { setEditorOrder(null); setFocusAssignment(false) } }} onSave={saveOrder} onDelete={deleteOrder} />
      <CreateOrderDialog open={createModalOpen} technicians={technicians} saving={saving} onOpenChange={setCreateModalOpen} onCreate={createOrder} />
      <Toaster />
    </main>
  )
}

function Metric({ icon, label, value, tone, wide = false }: {
  icon: React.ReactNode; label: string; value: string; tone: "blue" | "orange" | "violet" | "green"; wide?: boolean
}) {
  const toneClass = tone === "blue" ? styles.metricBlue : tone === "orange" ? styles.metricOrange : tone === "violet" ? styles.metricViolet : styles.metricGreen
  return <article className={styles.metric}><span className={`${styles.metricIcon} ${toneClass}`}>{icon}</span><div><p>{label}</p><strong className={wide ? styles.metricWide : ""}>{value}</strong></div></article>
}

function StatusPill({ status }: { status: OrderStatus }) {
  return <span className={`${styles.statusPill} ${statusClass[orderStatusTone(status)]}`}>{orderStatusLabel(status)}</span>
}

function InspectorDetail({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return <div className={styles.inspectorDetail}><span>{icon}</span><div><small>{label}</small><p>{children}</p></div></div>
}

function OrderInspector({ order, onCopy, onEdit, onReassign }: {
  order: AdminWorkOrder | null; onCopy: (_order: AdminWorkOrder) => Promise<void>
  onEdit: (_order: AdminWorkOrder) => void; onReassign: (_order: AdminWorkOrder) => void
}) {
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  if (!order) return <aside className={styles.inspectorEmpty}><ClipboardCheck /><p>Select an order to inspect its live details.</p></aside>

  const phoneDigits = order.customerPhone.replace(/[^0-9]/g, "")
  const defaultMsg = encodeURIComponent(`Hello ${order.customerName}, this is KBI regarding order ${order.reference} for ${order.device || "your device"}.`)
  const enRouteMsg = encodeURIComponent(`Hello ${order.customerName}, our certified KBI technician is on the way to your location for order ${order.reference}.`)
  const readyMsg = encodeURIComponent(`Hello ${order.customerName}, your device repair for order ${order.reference} has been successfully completed!`)

  const stages: Array<{ status: OrderStatus; label: string }> = [
    { status: "ACCEPTED", label: "Accepted" }, { status: "ON_THE_WAY", label: "En Route" },
    { status: "ARRIVED", label: "Arrived" }, { status: "IN_PROGRESS", label: "Working" },
  ]
  const progressOrder: OrderStatus[] = ["PENDING", "REVIEWING", "QUOTED", "APPROVED", "ASSIGNED", "ACCEPTED", "ON_THE_WAY", "ARRIVED", "IN_PROGRESS", "COMPLETED"]
  const currentProgress = progressOrder.indexOf(order.status)

  return (
    <>
      <aside className={styles.inspector} aria-label={`Selected order ${order.reference}`}>
        <header className={styles.inspectorHeader}>
          <div>
            <p>Order</p>
            <h2>{order.reference}</h2>
          </div>
          <div>
            <StatusPill status={order.status} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className={styles.moreButton} aria-label="More order actions"><Ellipsis /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onCopy(order)}><Copy className="w-4 h-4 mr-2" />Copy reference</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setInvoiceOpen(true)}><FileText className="w-4 h-4 mr-2" />View Tax Invoice (PDF)</DropdownMenuItem>
                {order.customerPhone && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <a href={`https://wa.me/${phoneDigits}?text=${enRouteMsg}`} target="_blank" rel="noreferrer">
                        <MessageCircle className="w-4 h-4 mr-2 text-emerald-600" />Send &quot;On The Way&quot;
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={`https://wa.me/${phoneDigits}?text=${readyMsg}`} target="_blank" rel="noreferrer">
                        <MessageCircle className="w-4 h-4 mr-2 text-emerald-600" />Send &quot;Completed&quot;
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={`tel:${order.customerPhone}`}><Phone className="w-4 h-4 mr-2" />Call customer</a>
                    </DropdownMenuItem>
                  </>
                )}
                {order.customerEmail && <DropdownMenuItem asChild><a href={`mailto:${order.customerEmail}`}><Mail className="w-4 h-4 mr-2" />Email customer</a></DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(order)}><ArrowRight className="w-4 h-4 mr-2" />Open order</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className={styles.inspectorDetails}>
          <InspectorDetail icon={<User />} label="Customer">{order.customerName}</InspectorDetail>
          <InspectorDetail icon={<Smartphone />} label="Device">{order.device || "Not recorded"}</InspectorDetail>
          <InspectorDetail icon={<Wrench />} label="Service">{order.service}</InspectorDetail>
          <InspectorDetail icon={<UserRoundCog />} label="Technician">{order.technicianNames.length > 0 ? order.technicianNames.join(", ") : "Unassigned"}</InspectorDetail>
          <InspectorDetail icon={<MapPin />} label="Location">{order.address || "Not recorded"}</InspectorDetail>
          <InspectorDetail icon={<CalendarClock />} label="Created">{formatOrderDate(order.createdAt)}</InspectorDetail>
        </div>

        <div className={styles.progress}>
          {stages.map((stage) => {
            const reached = order.status === "COMPLETED" || currentProgress >= progressOrder.indexOf(stage.status)
            return (
              <div key={stage.status} className={`${styles.progressStep} ${reached ? styles.progressReached : ""} ${order.status === stage.status ? styles.progressCurrent : ""}`}>
                <span>{reached ? <Check /> : null}</span>
                <strong>{stage.label}</strong>
              </div>
            )
          })}
        </div>

        <div className={styles.inspectorActions}>
          {phoneDigits ? (
            <a href={`https://wa.me/${phoneDigits}?text=${defaultMsg}`} target="_blank" rel="noreferrer">
              <MessageCircle />Message
            </a>
          ) : (
            <button type="button" disabled><MessageCircle />Message</button>
          )}
          <button type="button" onClick={() => setInvoiceOpen(true)}><FileText />Invoice</button>
          <button type="button" onClick={() => onReassign(order)}><UserRoundCog />Reassign</button>
          <button type="button" className={styles.primaryAction} onClick={() => onEdit(order)}>Open Order<ArrowRight /></button>
        </div>
      </aside>

      <OrderInvoiceModal order={order} open={invoiceOpen} onOpenChange={setInvoiceOpen} />
    </>
  )
}
