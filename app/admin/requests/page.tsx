"use client"

import { useEffect, useState } from "react"
import { collection, onSnapshot, orderBy, query, updateDoc, doc, Timestamp, addDoc, arrayUnion } from "firebase/firestore"
import { db, isMockMode, auth } from "@/firebase/firebaseConfig"
import { onAuthStateChanged } from "firebase/auth"
import { useT } from "@/components/language-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"

interface ReqItem {
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
}

export default function AdminRequestsPage() {
  const t = useT()
  const [authorized, setAuthorized] = useState(false)
  const [requests, setRequests] = useState<ReqItem[]>([])
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null)
  const [priceInput, setPriceInput] = useState<string>("")
  const [notes, setNotes] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isMockMode) {
      const u = typeof window !== "undefined" ? window.localStorage.getItem("mock_admin_user") : null
      if (!u) {
        if (typeof window !== "undefined") {
          window.location.replace("/admin/login")
        }
        return
      }
      setAuthorized(true)
    } else {
      const unsub = onAuthStateChanged(auth, (user) => {
        if (!user) {
          if (typeof window !== "undefined") {
            window.location.replace("/admin/login")
          }
        } else {
          setAuthorized(true)
        }
      })
      return () => unsub()
    }
  }, [])

  useEffect(() => {
    if (isMockMode) {
      setRequests([
        {
          id: "req-1",
          orderId: "ORD-1024",
          technicianId: "tech-1",
          technicianName: "Ahmed",
          partOrServiceName: "iPhone Screen Replacement",
          category: "spare_part",
          quantity: 1,
          estimatedPrice: 350,
          reason: "Original screen cracked during diagnosis",
          photoUrl: "",
          status: "pending",
          createdAt: new Date().toISOString(),
        },
        {
          id: "req-2",
          orderId: "ORD-1025",
          technicianId: "tech-2",
          technicianName: "Sara",
          partOrServiceName: "Data Backup Service",
          category: "additional_service",
          quantity: 1,
          estimatedPrice: 120,
          reason: "Customer requested full backup before repair",
          photoUrl: "",
          status: "approved",
          createdAt: new Date().toISOString(),
          finalPrice: 100,
        }
      ] as ReqItem[])
      return
    }

    const q = query(collection(db, "tech_requests"), orderBy("createdAt", "desc"))
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
    })
    return () => unsub()
  }, [])

  const setAdminNote = (id: string, v: string) => setNotes(prev => ({ ...prev, [id]: v }))

  const updateOrderInvoice = async (req: ReqItem) => {
    if (isMockMode) return
    const orderRef = doc(db, "orders", req.orderId)
    const total = (req.finalPrice ?? req.estimatedPrice) * req.quantity
    await updateDoc(orderRef, {
      invoiceItems: arrayUnion({
        description: req.partOrServiceName,
        category: req.category,
        quantity: req.quantity,
        unitPrice: req.finalPrice ?? req.estimatedPrice,
        total: total,
        requestId: req.id,
        addedAt: Timestamp.now(),
      }),
      totalCost: (req as any).totalCost ? (req as any).totalCost + total : undefined,
      pendingRequestsCount: (req as any).pendingRequestsCount ? (req as any).pendingRequestsCount - 1 : undefined,
      updatedAt: Timestamp.now(),
      status: "in_progress",
    })
  }

  const notify = async (role: "technician" | "admin", message: string, req: ReqItem) => {
    if (isMockMode) return
    await addDoc(collection(db, "notifications"), {
      role,
      userId: role === "technician" ? req.technicianId : undefined,
      type: "tech_request",
      message,
      orderId: req.orderId,
      requestId: req.id,
      createdAt: Timestamp.now(),
    })
  }

  const approve = async (req: ReqItem) => {
    if (isMockMode) {
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "approved", updatedAt: new Date().toISOString(), adminNotes: notes[req.id] || r.adminNotes } : r))
      return
    }
    const ref = doc(db, "tech_requests", req.id)
    await updateDoc(ref, {
      status: "approved",
      updatedAt: Timestamp.now(),
      adminNotes: notes[req.id] || null,
      history: arrayUnion({ action: "approved", by: "admin", at: Timestamp.now(), note: notes[req.id] || null })
    })
    await updateOrderInvoice(req)
    await notify("technician", t("Request approved"), req)
  }

  const reject = async (req: ReqItem) => {
    if (isMockMode) {
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "rejected", updatedAt: new Date().toISOString(), adminNotes: notes[req.id] || r.adminNotes } : r))
      return
    }
    const ref = doc(db, "tech_requests", req.id)
    await updateDoc(ref, {
      status: "rejected",
      updatedAt: Timestamp.now(),
      adminNotes: notes[req.id] || null,
      history: arrayUnion({ action: "rejected", by: "admin", at: Timestamp.now(), note: notes[req.id] || null })
    })
    await notify("technician", t("Request rejected"), req)
  }

  const saveEditedPrice = async (req: ReqItem) => {
    const newPrice = parseFloat(priceInput)
    if (isNaN(newPrice) || newPrice < 0) return
    if (isMockMode) {
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, finalPrice: newPrice, updatedAt: new Date().toISOString(), priceChanges: [ ...(r.priceChanges || []), { oldPrice: r.estimatedPrice, newPrice, changedAt: new Date().toISOString(), changedBy: "admin" } ] } : r))
      setEditingPriceId(null)
      setPriceInput("")
      return
    }
    const ref = doc(db, "tech_requests", req.id)
    await updateDoc(ref, {
      finalPrice: newPrice,
      updatedAt: Timestamp.now(),
      priceChanges: arrayUnion({ oldPrice: req.estimatedPrice, newPrice, changedAt: Timestamp.now(), changedBy: "admin" }),
      history: arrayUnion({ action: "price_updated", by: "admin", at: Timestamp.now(), note: `AED ${req.estimatedPrice} -> AED ${newPrice}` })
    })
    setEditingPriceId(null)
    setPriceInput("")
    await notify("technician", t("Price updated by admin"), req)
  }

  const statusBadge = (s: string) => (
    <Badge variant="outline" className={cn("capitalize", s === "pending" ? "text-yellow-400 border-yellow-400/40" : s === "approved" ? "text-green-400 border-green-400/40" : "text-red-400 border-red-400/40")}>{t(s.charAt(0).toUpperCase() + s.slice(1))}</Badge>
  )

  if (!authorized) return null
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t("Technician Requests")}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {requests.map((req) => (
          <Card key={req.id} className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>{req.partOrServiceName}</span>
                {statusBadge(req.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-white/80">
              <div className="flex items-center justify-between">
                <span>#{req.orderId}</span>
                <Link href={`/admin/orders`} className="text-cyan-400 hover:underline">{t("View Details")}</Link>
              </div>
              <div className="flex items-center justify-between">
                <span>{t("Quantity")}: {req.quantity}</span>
                <span>{t("Estimated Price (AED)")}: {req.estimatedPrice}</span>
              </div>
              <div>
                <span className="text-white/50">{t("Reason for Request")}:</span>
                <p className="mt-1">{req.reason}</p>
              </div>
              {req.photoUrl && (
                <div className="relative w-full h-36 rounded-lg border border-white/10 overflow-hidden">
                  <Image src={req.photoUrl} alt="photo" fill className="object-cover" unoptimized />
                </div>
              )}

              {/* Admin Notes */}
              <div className="space-y-1">
                <span className="text-white/50">{t("Admin Notes")}</span>
                <Textarea value={notes[req.id] || ""} onChange={(e) => setAdminNote(req.id, e.target.value)} className="bg-black/20 border-white/10 text-white" />
              </div>

              {/* Price Edit */}
              <div className="space-y-2">
                {editingPriceId === req.id ? (
                  <div className="flex gap-2">
                    <Input type="number" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} className="bg-black/20 border-white/10 text-white" />
                    <Button onClick={() => saveEditedPrice(req)} className="bg-cyan-500 text-black">{t("Save")}</Button>
                    <Button variant="outline" onClick={() => { setEditingPriceId(null); setPriceInput("") }}>{t("Cancel")}</Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => { setEditingPriceId(req.id); setPriceInput(String(req.finalPrice ?? req.estimatedPrice)) }}>{t("Edit Price")}</Button>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button onClick={() => approve(req)} className="bg-green-500 text-black">{t("Approve Request")}</Button>
                <Button onClick={() => reject(req)} className="bg-red-500 text-white">{t("Reject Request")}</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {requests.length === 0 && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6 text-white/60">{t("No requests")}</CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
