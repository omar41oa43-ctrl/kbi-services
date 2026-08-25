"use client"

import { useEffect, useMemo, useState } from "react"
import { addDoc, collection, doc, onSnapshot, orderBy, query, setDoc, Timestamp, updateDoc, where } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db, isMockMode } from "@/firebase/firebaseConfig"
import { useT } from "@/components/language-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AppSelect } from "@/components/ui/app-select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Subscription = {
  id: string
  techId: string
  plan: string
  status: "active" | "inactive"
  startDate?: any
  endDate?: any
}

type Technician = {
  id: string
  name: string
  phone?: string
  isApproved: boolean
  isActive: boolean
  subscriptionStatus: "active" | "inactive"
}

export default function AdminSubscriptionsPage() {
  const t = useT()
  const [authorized, setAuthorized] = useState(false)
  const [subs, setSubs] = useState<Subscription[]>([])
  const [techs, setTechs] = useState<Technician[]>([])
  const [newTechId, setNewTechId] = useState("")
  const [newPlan, setNewPlan] = useState("monthly")
  const [newEndDate, setNewEndDate] = useState("")
  const [saving, setSaving] = useState(false)

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
      setTechs([
        { id: "tech-1", name: "Ahmed", phone: "+97150...", isApproved: true, isActive: true, subscriptionStatus: "inactive" },
        { id: "tech-2", name: "Sara", phone: "+97155...", isApproved: true, isActive: true, subscriptionStatus: "active" },
      ])
      setSubs([
        { id: "sub-1", techId: "tech-2", plan: "monthly", status: "active", startDate: new Date().toISOString(), endDate: new Date(Date.now() + 20 * 86400000).toISOString() },
      ])
      return
    }

    const subQ = query(collection(db, "subscriptions"), orderBy("endDate", "asc"))
    const unsubSubs = onSnapshot(subQ, (snap) => {
      setSubs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    })

    const techQ = query(collection(db, "technicians"), where("isApproved", "==", true))
    const unsubTech = onSnapshot(techQ, (snap) => {
      setTechs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    })

    return () => {
      unsubSubs()
      unsubTech()
    }
  }, [authorized])

  const techOptions = useMemo(
    () => techs.map((t) => ({ label: `${t.name}${t.phone ? ` (${t.phone})` : ""}`, value: t.id })),
    [techs]
  )

  const grantSubscription = async () => {
    if (!newTechId) return
    setSaving(true)
    try {
      const now = Timestamp.now()
      const end = newEndDate ? Timestamp.fromDate(new Date(newEndDate)) : Timestamp.fromMillis(now.toMillis() + 30 * 86400000)
      if (isMockMode) {
        setSubs((p) => [
          ...p,
          { id: `sub-${Date.now()}`, techId: newTechId, plan: newPlan, status: "active", startDate: now.toDate().toISOString(), endDate: end.toDate().toISOString() },
        ])
        setTechs((p) => p.map((t) => (t.id === newTechId ? { ...t, subscriptionStatus: "active" } : t)))
        return
      }
      const ref = doc(collection(db, "subscriptions"))
      await setDoc(ref, { techId: newTechId, plan: newPlan, status: "active", startDate: now, endDate: end, createdAt: now, updatedAt: now } as any)
      await updateDoc(doc(db, "technicians", newTechId), { subscriptionStatus: "active", isActive: true, updatedAt: now } as any)
      await addDoc(collection(db, "payments"), { techId: newTechId, amount: 0, type: "subscription", status: "paid", createdAt: now } as any)
    } finally {
      setSaving(false)
    }
  }

  const setSubStatus = async (s: Subscription, status: "active" | "inactive") => {
    const now = Timestamp.now()
    if (isMockMode) {
      setSubs((p) => p.map((x) => (x.id === s.id ? { ...x, status } : x)))
      setTechs((p) => p.map((t) => (t.id === s.techId ? { ...t, subscriptionStatus: status } : t)))
      return
    }
    await updateDoc(doc(db, "subscriptions", s.id), { status, updatedAt: now } as any)
    await updateDoc(doc(db, "technicians", s.techId), { subscriptionStatus: status, isActive: status === "active", updatedAt: now } as any)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t("Subscriptions")}</h1>
        <p className="text-white/50 text-sm">{t("Manage technician subscriptions and access")}</p>
      </div>

      <Card className="bg-black/50 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">{t("Grant Subscription")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <AppSelect value={newTechId} onValueChange={setNewTechId} placeholder={t("Select technician")} items={techOptions} />
          <AppSelect
            value={newPlan}
            onValueChange={setNewPlan}
            placeholder={t("Plan")}
            items={[
              { label: "monthly", value: "monthly" },
              { label: "quarterly", value: "quarterly" },
              { label: "yearly", value: "yearly" },
            ]}
          />
          <Input value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} placeholder={t("End date (YYYY-MM-DD)") as any} />
          <div className="md:col-span-3">
            <Button className="w-full" disabled={!newTechId || saving} onClick={grantSubscription}>
              {t("Activate")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-black/50 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">{t("Active Subscriptions")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {subs.length === 0 ? (
            <div className="text-white/60 text-sm">{t("No subscriptions")}</div>
          ) : (
            subs.slice(0, 200).map((s) => (
              <div key={s.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-white font-semibold">{s.techId}</div>
                    <Badge variant="outline" className={cn("capitalize", s.status === "active" ? "text-cyan-300 border-cyan-400/40" : "text-white/50 border-white/20")}>
                      {s.status}
                    </Badge>
                    <Badge variant="outline" className="text-white/70 border-white/20">
                      {s.plan}
                    </Badge>
                  </div>
                  <div className="text-xs text-white/45 mt-1">
                    {t("End")}: {String((s.endDate as any)?.toDate ? (s.endDate as any).toDate().toISOString().slice(0, 10) : s.endDate || "-")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={() => setSubStatus(s, "active")}>
                    {t("Activate")}
                  </Button>
                  <Button variant="destructive" onClick={() => setSubStatus(s, "inactive")}>
                    {t("Deactivate")}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

