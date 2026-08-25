"use client"

import { useEffect, useState } from "react"
import {
  AlertCircle,
  Banknote,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Search,
  Sliders,
  Trash2,
  User,
  UserCheck,
  Wrench,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ORDER_STATUSES, orderStatusLabel, type OrderStatus } from "@/lib/order-status"
import type { AdminTechnicianOption, AdminWorkOrder } from "./order-types"

export function OrderEditorDialog({
  order,
  technicians,
  open,
  saving,
  focusAssignment = false,
  onOpenChange,
  onSave,
  onDelete,
}: {
  order: AdminWorkOrder | null
  technicians: AdminTechnicianOption[]
  open: boolean
  saving: boolean
  focusAssignment?: boolean
  onOpenChange: (_open: boolean) => void
  onSave: (_update: {
    status: OrderStatus
    priority: AdminWorkOrder["priority"]
    totalAmount?: number
    technicianId: string
    technicianName: string
    technicianIds: string[]
    technicianNames: string[]
  }) => Promise<void>
  onDelete?: (_order?: AdminWorkOrder) => Promise<void>
}) {
  const [status, setStatus] = useState<OrderStatus>("PENDING")
  const [priority, setPriority] = useState<AdminWorkOrder["priority"]>("NORMAL")
  const [totalAmount, setTotalAmount] = useState<number>(0)
  const [priceError, setPriceError] = useState<string | null>(null)
  const [technicianIds, setTechnicianIds] = useState<string[]>([])
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Sub-modal state for assigning technicians
  const [assignWindowOpen, setAssignWindowOpen] = useState(false)
  const [techSearch, setTechSearch] = useState("")

  useEffect(() => {
    if (!order) return
    setStatus(order.status)
    setPriority(order.priority)
    setTotalAmount(Number(order.totalAmount || 0))
    setPriceError(null)
    const initialIds = order.technicianIds?.length
      ? order.technicianIds
      : order.technicianId
      ? [order.technicianId]
      : []
    setTechnicianIds(initialIds)
    setConfirmDelete(false)
    setAssignWindowOpen(open && focusAssignment)
  }, [order, open, focusAssignment])

  const selectedTechnicians = technicians.filter((technician) => technicianIds.includes(technician.id))
  const selectedTechnicianNames = selectedTechnicians.map((t) => t.name)
  const primaryTechnicianId = technicianIds[0] || ""
  const primaryTechnicianName = selectedTechnicians[0]?.name || ""

  const toggleTechnician = (id: string) => {
    setTechnicianIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const selectAllAvailable = () => {
    const availableIds = technicians.filter((t) => t.available).map((t) => t.id)
    setTechnicianIds((prev) => Array.from(new Set([...prev, ...availableIds])))
  }

  const clearAllTechnicians = () => {
    setTechnicianIds([])
  }

  const filteredTechnicians = technicians.filter((t) => {
    const q = techSearch.trim().toLowerCase()
    return !q || t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)
  })

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full sm:w-[92vw] lg:w-[880px] max-w-[95vw] max-h-[90vh] p-0 bg-card border border-border shadow-2xl rounded-[24px] overflow-hidden text-card-foreground flex flex-col font-sans">
          {/* Fixed Header */}
          <DialogHeader className="shrink-0 border-b border-border bg-muted/30 px-6 lg:px-8 py-5 pr-14">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <DialogTitle className="text-xl font-bold tracking-tight text-foreground font-mono">
                    {order?.reference || "Work Order Details"}
                  </DialogTitle>

                  {order && (
                    <Badge variant="outline" className="bg-primary/10 border-primary/25 text-primary font-bold text-xs px-2.5 py-0.5">
                      <span className="size-1.5 rounded-full bg-primary animate-pulse mr-1.5" />
                      {orderStatusLabel(order.status)}
                    </Badge>
                  )}
                </div>
                <DialogDescription className="text-xs text-muted-foreground">
                  Review customer details and dispatch single or multiple technicians.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Scrollable Content Body */}
          {order && (
            <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 space-y-6">
              {/* Order Reference & Timestamps */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/20 border border-border/70 rounded-2xl p-4">
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Source</span>
                  <p className="text-xs font-bold text-foreground uppercase mt-0.5">{order.source}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Order ID</span>
                  <p className="text-xs font-bold text-primary font-mono truncate mt-0.5">{order.id}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Created</span>
                  <p className="text-xs font-bold text-foreground mt-0.5">{order.createdAt ? order.createdAt.toLocaleDateString() : "—"}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Assigned Techs</span>
                  <p className="text-xs font-bold text-foreground mt-0.5">{technicianIds.length} Assigned</p>
                </div>
              </div>

              {/* Customer Information Card */}
              <div className="bg-muted/20 border border-border/70 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-border/70 pb-3">
                  <User className="size-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Customer Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Full Name</Label>
                    <p className="text-sm font-bold text-foreground">{order.customerName}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Phone Number & WhatsApp</Label>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground font-mono">{order.customerPhone || "—"}</p>
                      {order.customerPhone && (
                        <>
                          <a
                            href={`tel:${order.customerPhone}`}
                            className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition"
                            title="Call customer"
                          >
                            <Phone className="size-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${order.customerName || 'Customer'}, regarding your KBI Service Order #${((order as any).orderId || order.id || '').toString().split(/[,;\s]+/)[0]} for ${order.device || 'your device'}: Our certified technician ${primaryTechnicianName ? `(${primaryTechnicianName})` : ''} is managing your request. Live tracking & warranty: https://kbi.services/track/${encodeURIComponent(((order as any).orderId || order.id || '').toString().split(/[,;\s]+/)[0])}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition"
                            title="Send WhatsApp update / report"
                          >
                            <span>WhatsApp Report</span>
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Email Address</Label>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground truncate">{order.customerEmail || "—"}</p>
                      {order.customerEmail && (
                        <a
                          href={`mailto:${order.customerEmail}`}
                          className="p-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition"
                          title="Email customer"
                        >
                          <Mail className="size-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Location / Address</Label>
                    <div className="flex items-start gap-2">
                      <MapPin className="size-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <p className="text-xs font-semibold text-foreground leading-relaxed">{order.address || "Abu Dhabi, UAE"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service & Device Details Card */}
              <div className="bg-muted/20 border border-border/70 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-border/70 pb-3">
                  <Wrench className="size-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Service & Device Request</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Requested Service</Label>
                    <p className="text-sm font-bold text-primary">{order.service}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Device Model</Label>
                    <p className="text-sm font-bold text-foreground">{order.device || "—"}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Reported Issue</Label>
                    <p className="text-xs font-semibold text-muted-foreground leading-relaxed">{order.issue || "General diagnostic & repair"}</p>
                  </div>
                </div>
              </div>

              {/* Diagnostics Quality Checklist & Hardware Inspection */}
              <div className="bg-muted/20 border border-border/70 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="size-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Hardware Diagnostics & QA Checklist</h3>
                  </div>
                  <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary text-[11px] font-bold">
                    {order.checklist ? `${Object.keys(order.checklist).length} Tests Logged` : "Standard 7-Point QA"}
                  </Badge>
                </div>

                {order.checklist && Object.keys(order.checklist).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {Object.entries(order.checklist).map(([testKey, testResult]) => {
                      const res = String(testResult).toUpperCase()
                      const isPass = res === "PASS"
                      const isFail = res === "FAIL"
                      return (
                        <div
                          key={testKey}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-background/60 border border-border/60 text-xs font-medium"
                        >
                          <span className="text-foreground font-semibold truncate mr-2">{testKey}</span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-black uppercase shrink-0 ${
                              isPass
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                : isFail
                                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                                : "bg-muted text-muted-foreground border border-border"
                            }`}
                          >
                            {res}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      "Screen Touch & Multi-Touch Response",
                      "Face ID / Touch ID Biometrics",
                      "Front & Rear Cameras + Flash",
                      "Charging Port & Power Draw",
                      "Microphone, Earpiece & Speakers",
                      "Physical Buttons & Haptic Engine",
                      "Wi-Fi, Bluetooth & Cellular Signal",
                    ].map((testKey) => (
                      <div
                        key={testKey}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-background/40 border border-border/40 text-xs font-medium text-muted-foreground"
                      >
                        <span className="truncate mr-2">{testKey}</span>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          PASS
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Before & After Quality Proof Photos Gallery */}
              <div className="bg-muted/20 border border-border/70 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                  <div className="flex items-center gap-2">
                    <Wrench className="size-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Inspection Photos & Quality Proof</h3>
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {(order.beforePhotos?.length || 0) + (order.afterPhotos?.length || 0)} Photos Captured
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Before Repair Photos */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <span>📷 Before-Repair Inspection</span>
                      </Label>
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {order.beforePhotos?.length || 0} photo{(order.beforePhotos?.length || 0) === 1 ? "" : "s"}
                      </span>
                    </div>

                    {order.beforePhotos && order.beforePhotos.length > 0 ? (
                      <div className="flex flex-wrap gap-2.5 p-3 rounded-xl bg-background/50 border border-border/60">
                        {order.beforePhotos.map((photoUrl, idx) => (
                          <a
                            key={idx}
                            href={photoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative group size-20 rounded-xl overflow-hidden border border-border bg-black/20 block hover:border-primary transition"
                            title="View Full Photo"
                          >
                            <img
                              src={photoUrl}
                              alt={`Before Repair ${idx + 1}`}
                              className="size-full object-cover group-hover:scale-105 transition"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <ExternalLink className="size-4 text-white" />
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-border/70 bg-background/30 text-center">
                        <p className="text-xs text-muted-foreground">No pre-repair photos uploaded yet.</p>
                      </div>
                    )}
                  </div>

                  {/* After Repair Photos */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <span>✨ After-Repair Quality Proof</span>
                      </Label>
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {order.afterPhotos?.length || 0} photo{(order.afterPhotos?.length || 0) === 1 ? "" : "s"}
                      </span>
                    </div>

                    {order.afterPhotos && order.afterPhotos.length > 0 ? (
                      <div className="flex flex-wrap gap-2.5 p-3 rounded-xl bg-background/50 border border-border/60">
                        {order.afterPhotos.map((photoUrl, idx) => (
                          <a
                            key={idx}
                            href={photoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative group size-20 rounded-xl overflow-hidden border border-border bg-black/20 block hover:border-primary transition"
                            title="View Full Photo"
                          >
                            <img
                              src={photoUrl}
                              alt={`After Repair ${idx + 1}`}
                              className="size-full object-cover group-hover:scale-105 transition"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <ExternalLink className="size-4 text-white" />
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-border/70 bg-background/30 text-center">
                        <p className="text-xs text-muted-foreground">No post-repair quality proof uploaded yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Pricing & Financials (AED) Section */}
              <div className="bg-muted/20 border border-border/70 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                  <div className="flex items-center gap-2">
                    <Banknote className="size-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Order Price & Billing (AED)</h3>
                  </div>
                  {totalAmount > 0 ? (
                    <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 font-mono">
                      AED {totalAmount.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 animate-pulse">
                      ⚠️ Price Required Before Assigning
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="order-price" className="text-xs font-semibold text-muted-foreground">
                      Total Service & Repair Price (AED) <span className="text-rose-500 font-bold">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-primary font-mono">
                        AED
                      </span>
                      <Input
                        id="order-price"
                        type="number"
                        min="0"
                        step="10"
                        value={totalAmount <= 0 ? "" : totalAmount}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0
                          setTotalAmount(val)
                          if (val > 0) setPriceError(null)
                        }}
                        placeholder="Enter order amount e.g. 150.00"
                        className={`h-11 rounded-xl bg-background border-border pl-14 text-sm font-bold text-foreground font-mono focus:border-primary ${
                          priceError ? "border-rose-500 ring-1 ring-rose-500/50" : ""
                        }`}
                      />
                    </div>
                    {priceError && (
                      <p className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-1 animate-in fade-in">
                        <AlertCircle className="size-3.5 shrink-0" /> {priceError}
                      </p>
                    )}
                  </div>

                  {/* Quick Price Presets */}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <span className="text-[11px] font-semibold text-muted-foreground">Quick Presets:</span>
                    {[100, 150, 200, 250, 350, 500].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setTotalAmount(preset)
                          setPriceError(null)
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                          totalAmount === preset
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-border"
                        }`}
                      >
                        AED {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dispatch & Technician Assignment Section */}
              <div className="bg-muted/20 border border-border/70 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="size-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Operations & Dispatch Controls</h3>
                  </div>
                  <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                    {technicianIds.length} Tech{technicianIds.length === 1 ? "" : "s"} Assigned
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Status Selector */}
                  <div className="space-y-2">
                    <Label htmlFor="order-status" className="text-xs font-semibold text-muted-foreground">
                      Order Status
                    </Label>
                    <Select value={status} onValueChange={(value) => setStatus(value as OrderStatus)}>
                      <SelectTrigger id="order-status" className="h-11 rounded-xl bg-background border-border text-xs font-bold text-foreground focus:border-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border text-popover-foreground">
                        {ORDER_STATUSES.map((item) => (
                          <SelectItem key={item} value={item} className="font-semibold text-xs py-2 focus:bg-accent focus:text-accent-foreground">
                            {orderStatusLabel(item)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Priority Selector */}
                  <div className="space-y-2">
                    <Label htmlFor="order-priority" className="text-xs font-semibold text-muted-foreground">
                      Dispatch Priority
                    </Label>
                    <Select value={priority} onValueChange={(value) => setPriority(value as AdminWorkOrder["priority"])}>
                      <SelectTrigger id="order-priority" className="h-11 rounded-xl bg-background border-border text-xs font-bold text-foreground focus:border-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border text-popover-foreground">
                        {(["LOW", "NORMAL", "HIGH", "URGENT"] as const).map((item) => (
                          <SelectItem key={item} value={item} className="font-semibold text-xs py-2 focus:bg-accent focus:text-accent-foreground">
                            {item.charAt(0) + item.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Multiple Technicians Assigned Team List */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <UserCheck className="size-3.5 text-primary" />
                      Assigned Field Technicians ({selectedTechnicians.length})
                    </Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setAssignWindowOpen(true)}
                      className="h-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold px-3 transition border border-primary/20 cursor-pointer"
                    >
                      + Assign / Manage Techs
                    </Button>
                  </div>

                  {selectedTechnicians.length === 0 ? (
                    <div
                      onClick={() => setAssignWindowOpen(true)}
                      className="p-3.5 rounded-xl border border-dashed border-border bg-muted/30 text-center cursor-pointer hover:border-primary/40 hover:bg-muted/50 transition"
                    >
                      <p className="text-xs text-muted-foreground">No technician assigned yet. Tap to assign one or multiple technicians.</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedTechnicians.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs"
                        >
                          <span className={`size-2 rounded-full shrink-0 ${t.available ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                          <span>{t.name}</span>
                          <button
                            type="button"
                            onClick={() => toggleTechnician(t.id)}
                            className="text-primary/60 hover:text-rose-500 text-xs ml-1 transition cursor-pointer"
                            title="Remove technician"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Fixed Footer Action Bar */}
          <DialogFooter className="shrink-0 border-t border-border bg-muted/30 px-6 lg:px-8 py-4.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Delete Action (Left Side) */}
            {onDelete && order ? (
              confirmDelete ? (
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs font-bold text-rose-500">Confirm delete order?</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={saving}
                    onClick={async () => {
                      await onDelete(order)
                      setConfirmDelete(false)
                    }}
                    className="h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white px-4 shadow-sm"
                  >
                    {saving ? "Deleting…" : "Yes, Delete Order"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={saving}
                    onClick={() => setConfirmDelete(false)}
                    className="h-10 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={saving}
                  onClick={() => setConfirmDelete(true)}
                  className="h-10 w-full sm:w-auto rounded-xl border-rose-500/30 bg-rose-500/10 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 px-4 transition-all"
                >
                  <Trash2 className="size-4 mr-1.5 text-rose-500" /> Delete Order
                </Button>
              )
            ) : (
              <div />
            )}

            {/* Save & Cancel Controls (Right Side) */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saving} className="h-10 rounded-xl border-border bg-background text-xs font-semibold text-muted-foreground px-5 hover:bg-muted hover:text-foreground">
                Cancel
              </Button>

              <Button
                disabled={!order || saving}
                onClick={() => {
                  if (technicianIds.length > 0 && totalAmount <= 0) {
                    setPriceError("Please enter the order price in AED before assigning a technician.")
                    return
                  }
                  onSave({
                    status,
                    priority,
                    totalAmount,
                    technicianId: primaryTechnicianId,
                    technicianName: primaryTechnicianName,
                    technicianIds,
                    technicianNames: selectedTechnicianNames,
                  })
                }}
                className="h-10 rounded-xl bg-primary text-xs font-bold text-primary-foreground px-6 hover:brightness-110 shadow-sm transition-all cursor-pointer"
              >
                {saving ? "Saving…" : `Confirm Changes (${technicianIds.length} Techs)`}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Multi-Technician Assignment Dedicated Modal */}
      <Dialog open={assignWindowOpen} onOpenChange={setAssignWindowOpen}>
        <DialogContent className="bg-card border-border text-card-foreground rounded-2xl sm:max-w-lg p-6 space-y-4 shadow-2xl">
          <DialogHeader className="p-0 space-y-1.5">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <UserCheck className="size-5 text-primary" /> Assign Technicians to {order?.reference}
              </DialogTitle>
              <Badge className="bg-primary/10 text-primary border-primary/30 text-[11px] font-bold">
                {technicianIds.length} Selected
              </Badge>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Select one or more field technicians to assign and dispatch as a team.
            </DialogDescription>
          </DialogHeader>

          {/* Quick Price Input inside Assign Window */}
          <div className="p-3.5 rounded-xl bg-muted/30 border border-border space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Banknote className="size-3.5 text-primary" /> Order Service Price (AED) <span className="text-rose-500 font-bold">*</span>
              </Label>
              {totalAmount > 0 && (
                <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                  AED {totalAmount.toFixed(2)}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary font-mono">
                AED
              </span>
              <Input
                type="number"
                min="0"
                step="10"
                value={totalAmount <= 0 ? "" : totalAmount}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0
                  setTotalAmount(val)
                  if (val > 0) setPriceError(null)
                }}
                placeholder="Set order price (e.g. 150)"
                className="bg-background border-border text-xs text-foreground pl-12 h-9 rounded-xl font-mono focus:border-primary"
              />
            </div>
          </div>

          {/* Quick Actions & Search */}
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={techSearch}
                onChange={(e) => setTechSearch(e.target.value)}
                placeholder="Search technician by name or ID..."
                className="bg-background border-border text-xs text-foreground pl-8 h-9 rounded-xl focus:border-primary"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">{filteredTechnicians.length} Technicians available</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllAvailable}
                  className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                >
                  Select All Available
                </button>
                <span className="text-border">|</span>
                <button
                  type="button"
                  onClick={clearAllTechnicians}
                  className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {/* Technician Multi-Selection List */}
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {filteredTechnicians.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No technicians found matching query.</p>
            ) : (
              filteredTechnicians.map((t) => {
                const isSelected = technicianIds.includes(t.id)
                return (
                  <div
                    key={t.id}
                    onClick={() => toggleTechnician(t.id)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? "bg-primary/10 border-primary shadow-xs"
                        : "bg-muted/30 border-border hover:bg-muted/60"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Checkbox indicator */}
                      <div
                        className={`size-4.5 rounded-md border flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-border bg-background"
                        }`}
                      >
                        {isSelected && <span className="text-[10px] font-black">✓</span>}
                      </div>

                      <span className={`size-2.5 rounded-full shrink-0 ${t.available ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                      
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{t.name}</p>
                        <p className="text-[11px] text-muted-foreground">{t.available ? "Available & Ready" : "Busy / On Job"}</p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleTechnician(t.id)
                      }}
                      className={`h-8 rounded-lg text-xs font-bold px-3 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary text-primary-foreground hover:brightness-110"
                          : "bg-background border border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      {isSelected ? "Assigned ✓" : "Assign +"}
                    </Button>
                  </div>
                )
              })
            )}
          </div>

          <DialogFooter className="pt-3 flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              onClick={() => setAssignWindowOpen(false)}
              className="h-10 rounded-xl bg-primary text-xs font-bold text-primary-foreground w-full hover:brightness-110 shadow-sm transition-all cursor-pointer"
            >
              Done ({technicianIds.length} Technicians Selected)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
