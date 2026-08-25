"use client"

import { useEffect, useMemo, useState } from "react"
import { addDoc, collection, doc, onSnapshot, orderBy, query, Timestamp, updateDoc, where } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db, isMockMode } from "@/firebase/firebaseConfig"
import { useT } from "@/components/language-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AppSelect } from "@/components/ui/app-select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type ServiceRequestStatus =
  | "new"
  | "assigned"
  | "accepted"
  | "in_progress"
  | "completed"
  | "paid"
  | "cancelled"

type ServiceRequest = {
  id: string
  type: string
  description: string
  status: ServiceRequestStatus
  technicianId?: string
  assignedTo?: string[]
  offers?: string[]
  createdAt?: any
  location?: { lat: number; lng: number; address?: string }
  orderId?: string
  isFromOrdersTable?: boolean
  originalOrderDocId?: string
  customerName?: string
  customerPhone?: string
}

type Technician = {
  id: string
  name: string
  phone?: string
  isApproved: boolean
  isActive: boolean
  subscriptionStatus: "active" | "inactive"
}

const statusStyle: Record<string, string> = {
  new: "text-cyan-300 border-cyan-400/40",
  assigned: "text-blue-300 border-blue-400/40",
  accepted: "text-emerald-300 border-emerald-400/40",
  in_progress: "text-yellow-300 border-yellow-400/40",
  completed: "text-green-300 border-green-400/40",
  paid: "text-purple-300 border-purple-400/40",
  cancelled: "text-red-300 border-red-400/40",
}

export default function AdminServiceRequestsPage() {
  const t = useT()
  const [authorized, setAuthorized] = useState(false)
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [pendingOrders, setPendingOrders] = useState<any[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [selectedTech, setSelectedTech] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (isMockMode) {
      const u = typeof window !== "undefined" ? window.localStorage.getItem("mock_admin_user") : null
      if (!u) {
        if (typeof window !== "undefined") window.location.replace("/admin/login")
        return
      }
      setAuthorized(true)
      return
    }
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        if (typeof window !== "undefined") window.location.replace("/admin/login")
      } else {
        setAuthorized(true)
      }
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!authorized) return
    if (isMockMode) {
      setTechnicians([
        { id: "tech-1", name: "Ahmed", phone: "+97150...", isApproved: true, isActive: true, subscriptionStatus: "active" },
        { id: "tech-2", name: "Sara", phone: "+97155...", isApproved: true, isActive: true, subscriptionStatus: "active" },
      ])
      setRequests([
        {
          id: "sr-1",
          type: "smartphone",
          description: "Apple iPhone 15 - Screen",
          status: "new",
          createdAt: new Date().toISOString(),
          location: { lat: 24.4539, lng: 54.3773, address: "Abu Dhabi" },
          orderId: "KBI-1001",
        },
        {
          id: "sr-2",
          type: "laptop",
          description: "HP Pavilion - Keyboard",
          status: "assigned",
          technicianId: "tech-1",
          assignedTo: ["tech-1", "tech-2"],
          offers: ["tech-1"],
          createdAt: new Date().toISOString(),
          location: { lat: 24.4539, lng: 54.3773, address: "Abu Dhabi" },
          orderId: "KBI-1002",
        },
      ])
      return
    }

    const reqQ = query(collection(db, "service_requests"), orderBy("createdAt", "desc"))
    const unsubReq = onSnapshot(reqQ, (snap) => {
      setRequests(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    })

    const ordersQ = query(collection(db, "orders"), where("status", "==", "pending"))
    const unsubOrders = onSnapshot(ordersQ, (snap) => {
      setPendingOrders(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    })

    const techQ = query(
      collection(db, "technicians"),
      where("isApproved", "==", true),
      where("isActive", "==", true)
    )
    const unsubTech = onSnapshot(techQ, (snap) => {
      setTechnicians(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    })

    return () => {
      unsubReq()
      unsubTech()
      unsubOrders()
    }
  }, [authorized])

  const techOptions = useMemo(
    () =>
      technicians
        .filter((t) => t.subscriptionStatus === "active")
        .map((t) => ({ label: `${t.name}${t.phone ? ` (${t.phone})` : ""}`, value: t.id })),
    [technicians]
  )

  const mergedRequests = useMemo(() => {
    // Get all orderIds that already have service requests
    const existingOrderIds = new Set(requests.map((r) => r.orderId).filter(Boolean))

    // Map existing requests
    const list = requests.map((r) => ({
      ...r,
      isFromOrdersTable: false,
    }))

    // Add pending orders that don't have a service request yet
    pendingOrders.forEach((o) => {
      if (!existingOrderIds.has(o.orderId)) {
        list.push({
          id: `order-req-${o.id}`,
          type: o.deviceType || "smartphone",
          description: `${o.brand || ""} ${o.model || ""} - ${o.issue || ""}`.trim() || "Repair Request",
          status: "new",
          createdAt: o.createdAt,
          location: {
            lat: o.location?.lat || 24.4539,
            lng: o.location?.lng || 54.3773,
            address: o.address || o.location?.address || "Abu Dhabi, UAE",
          },
          orderId: o.orderId,
          isFromOrdersTable: true,
          originalOrderDocId: o.id,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
        } as any)
      }
    })

    // Sort by createdAt descending
    return list.sort((a, b) => {
      const getMs = (dateVal: any) => {
        if (!dateVal) return 0
        if (typeof dateVal.toDate === "function") return dateVal.toDate().getTime()
        if (dateVal instanceof Date) return dateVal.getTime()
        if (dateVal.seconds) return dateVal.seconds * 1000
        return new Date(dateVal).getTime()
      }
      return getMs(b.createdAt) - getMs(a.createdAt)
    })
  }, [requests, pendingOrders])

  const assignManually = async (req: ServiceRequest) => {
    const techId = selectedTech[req.id]
    if (!techId) return
    if (isMockMode) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === req.id
            ? { ...r, status: "assigned", technicianId: techId, offers: [techId], assignedTo: Array.from(new Set([...(r.assignedTo || []), techId])) }
            : r
        )
      )
      return
    }
    setSaving((p) => ({ ...p, [req.id]: true }))
    try {
      if (req.isFromOrdersTable && req.originalOrderDocId) {
        const tech = technicians.find((t) => t.id === techId)

        // 1. Create a service request doc
        await addDoc(collection(db, "service_requests"), {
          type: req.type,
          description: req.description,
          status: "assigned",
          technicianId: techId,
          offers: [techId],
          assignedTo: [techId],
          offeredAt: Timestamp.now(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          location: req.location || { lat: 24.4539, lng: 54.3773, address: "Abu Dhabi, UAE" },
          orderId: req.orderId,
        })

        // 2. Update the original order document
        await updateDoc(doc(db, "orders", req.originalOrderDocId), {
          status: "in_progress",
          technicianId: techId,
          technicianName: tech?.name || "Technician",
          updatedAt: Timestamp.now(),
        })
      } else {
        await updateDoc(doc(db, "service_requests", req.id), {
          status: "assigned",
          technicianId: techId,
          offers: [techId],
          assignedTo: Array.from(new Set([...(req.assignedTo || []), techId])),
          offeredAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        } as any)
      }
    } finally {
      setSaving((p) => ({ ...p, [req.id]: false }))
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">{t("Service Requests")}</h1>
          <p className="text-white/50 text-sm">{t("Auto-assigned jobs and manual overrides")}</p>
        </div>
      </div>

      <Card className="bg-black/50 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">{t("Requests")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mergedRequests.length === 0 ? (
            <div className="text-white/60 text-sm">{t("No requests")}</div>
          ) : (
            <div className="space-y-3">
              {mergedRequests.slice(0, 200).map((r) => (
                <div key={r.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-semibold">{r.type || "-"}</span>
                        <Badge variant="outline" className={cn("capitalize", statusStyle[r.status] || "text-white/60 border-white/20")}>
                          {t(r.status)}
                        </Badge>
                        {r.orderId ? <span className="text-xs text-white/40">{r.orderId}</span> : null}
                        {r.isFromOrdersTable ? (
                          <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50 text-xs">
                            {t("Pending Order")}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="text-white/70 text-sm mt-1 break-words">{r.description || "-"}</div>
                      <div className="text-white/45 text-xs mt-1">
                        {r.location?.address ? r.location.address : ""}
                        {r.technicianId ? ` • ${t("Tech")}: ${r.technicianId}` : ""}
                        {r.customerName ? ` • ${t("Customer")}: ${r.customerName} (${r.customerPhone || ""})` : ""}
                      </div>
                    </div>
                    <div className="w-[260px] max-w-full space-y-2">
                      <AppSelect
                        value={selectedTech[r.id] || ""}
                        onValueChange={(v) => setSelectedTech((p) => ({ ...p, [r.id]: v }))}
                        placeholder={t("Assign technician")}
                        items={techOptions}
                      />
                      <Button
                        className="w-full"
                        disabled={!selectedTech[r.id] || !!saving[r.id]}
                        onClick={() => assignManually(r)}
                      >
                        {t("Assign")}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

