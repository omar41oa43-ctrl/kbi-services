"use client"

import { useEffect, useMemo, useState } from "react"
import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, setDoc, Timestamp, updateDoc, where } from "firebase/firestore"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth, db, isMockMode } from "@/firebase/firebaseConfig"
import { useT } from "@/components/language-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ExternalLink, FileText, MapPin, Calendar, User, Phone, Mail, Award, CheckCircle, XCircle, Info, Landmark } from "lucide-react"

type TechnicianRequestStatus = "pending" | "approved" | "rejected" | "documents_requested" | "draft"

type TechnicianRequest = {
  id: string
  userId: string
  full_name: string
  phone: string
  whatsapp?: string
  email: string
  nationality?: string
  dob?: string
  gender?: string
  language?: string
  profile_photo?: string
  experience_main_skill?: string
  skills?: string[]
  experience?: string
  employment_type?: string
  vehicle?: boolean
  tools?: boolean
  onsite?: boolean
  availability?: {
    days: string[]
    start_time: string
    end_time: string
  }
  service_areas?: string[]
  latitude?: number
  longitude?: number
  documents?: {
    emirates_id?: string
    passport?: string
    visa?: string
    cv?: string
    driving_license?: string
    certificate?: string
  }
  bank_details?: {
    method: string
    bank_name?: string
    iban?: string
    account_holder?: string
  }
  status: TechnicianRequestStatus
  createdAt?: any
}

type Technician = {
  id: string
  name: string
  phone: string
  whatsapp?: string
  email?: string
  skills: string[]
  experience_main_skill?: string
  isApproved: boolean
  isActive: boolean
  subscriptionStatus: "active" | "inactive"
  rating: number
  wallet_balance?: number
  completed_jobs?: number
  technician_id?: string
  qr_code?: string
  latitude?: number
  longitude?: number
  dob?: string
  gender?: string
  language?: string
  profile_photo?: string
  nationality?: string
  service_areas?: string[]
  bank_details?: {
    method: string
    bank_name?: string
    iban?: string
    account_holder?: string
  }
  documents?: {
    emirates_id?: string
    passport?: string
    visa?: string
    cv?: string
    driving_license?: string
    certificate?: string
  }
}

const statusStyle: Record<string, string> = {
  pending: "text-yellow-300 border-yellow-400/40 bg-yellow-400/10",
  approved: "text-green-300 border-green-400/40 bg-green-400/10",
  rejected: "text-red-300 border-red-400/40 bg-red-400/10",
  documents_requested: "text-blue-300 border-blue-400/40 bg-blue-400/10",
  draft: "text-white/40 border-white/20 bg-white/5",
}

export default function AdminTechniciansPage() {
  const t = useT()
  const [authorized, setAuthorized] = useState(false)
  const [requests, setRequests] = useState<TechnicianRequest[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [savingId, setSavingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

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
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (typeof window !== "undefined") window.location.replace("/admin/login")
      } else {
        // Double check admin role to prevent standard users from causing permission errors
        const masterEmails = (process.env.NEXT_PUBLIC_MASTER_ADMIN_EMAILS || "admin@kbi.ae").split(",").map(e => e.trim().toLowerCase());
        const isMaster = masterEmails.includes((user.email || "").toLowerCase()) || user.uid === process.env.NEXT_PUBLIC_MASTER_ADMIN_UID;
        
        if (isMaster) {
          setAuthorized(true)
          return
        }

        try {
          const userSnap = await getDoc(doc(db, "users", user.uid))
          const role = userSnap.data()?.role
          if (role === "admin" || role === "super_admin") {
            setAuthorized(true)
          } else {
            console.warn("Non-admin account blocked:", user.email)
            await signOut(auth)
            if (typeof window !== "undefined") window.location.replace("/admin/login")
          }
        } catch (e) {
          console.error("Auth check failed:", e)
          await signOut(auth)
          if (typeof window !== "undefined") window.location.replace("/admin/login")
        }
      }
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!authorized) return
    if (isMockMode) {
      setRequests([
        {
          id: "u1",
          userId: "u1",
          full_name: "Ahmed Mohamed",
          phone: "+971507313446",
          whatsapp: "+971507313446",
          email: "ahmed@kbi.services",
          nationality: "Egyptian",
          dob: "12-10-1990",
          gender: "Male",
          language: "Arabic",
          profile_photo: "https://api.dicebear.com/7.x/bottts/png?seed=ahmed",
          experience_main_skill: "Printer Repair",
          skills: ["HP", "Canon"],
          experience: "3–5 years",
          employment_type: "Freelancer",
          vehicle: true,
          tools: true,
          onsite: true,
          availability: { days: ["Monday", "Wednesday"], start_time: "09:00", end_time: "18:00" },
          service_areas: ["Abu Dhabi", "Yas Island"],
          latitude: 24.4539,
          longitude: 54.3773,
          documents: { emirates_id: "#", passport: "#", visa: "#", cv: "#" },
          bank_details: { method: "Bank Transfer", bank_name: "ADCB", iban: "AE12023...", account_holder: "Ahmed Mohamed" },
          status: "pending",
        }
      ])
      setTechnicians([
        { id: "u2", name: "Sara Al-Hashimi", phone: "+971550000000", skills: ["Apple", "Dell"], isApproved: true, isActive: true, subscriptionStatus: "active", rating: 4.9 },
      ])
      return
    }

    const reqQ = query(collection(db, "technician_requests"), orderBy("updatedAt", "desc"))
    const unsubReq = onSnapshot(reqQ, (snap) => {
      setRequests(snap.docs.map((d) => {
        const raw = d.data()
        return {
          id: d.id,
          userId: raw.userId || d.id,
          full_name: raw.full_name || raw.name || "",
          phone: raw.phone || "",
          whatsapp: raw.whatsapp,
          email: raw.email || "",
          nationality: raw.nationality,
          dob: raw.dob,
          gender: raw.gender,
          language: raw.language,
          profile_photo: raw.profile_photo,
          experience_main_skill: raw.experience_main_skill,
          skills: raw.skills || [],
          experience: raw.experience,
          employment_type: raw.employment_type,
          vehicle: raw.vehicle,
          tools: raw.tools,
          onsite: raw.onsite,
          availability: raw.availability,
          service_areas: raw.service_areas || [],
          latitude: raw.latitude,
          longitude: raw.longitude,
          documents: raw.documents,
          bank_details: raw.bank_details,
          status: raw.status || "pending",
        }
      }))
    })

    const techQ = query(collection(db, "technicians"), orderBy("updatedAt", "desc"))
    const unsubTech = onSnapshot(techQ, (snap) => {
      setTechnicians(snap.docs.map((d) => {
        const raw = d.data()
        return {
          id: d.id,
          name: raw.name || raw.full_name || "",
          phone: raw.phone || "",
          whatsapp: raw.whatsapp,
          email: raw.email || "",
          skills: raw.skills || [],
          experience_main_skill: raw.experience_main_skill,
          isApproved: raw.isApproved === true,
          isActive: raw.isActive === true,
          subscriptionStatus: raw.subscriptionStatus || "inactive",
          rating: raw.rating ?? 5.0,
          wallet_balance: raw.wallet_balance ?? 0,
          completed_jobs: raw.completed_jobs ?? 0,
          technician_id: raw.technician_id,
          qr_code: raw.qr_code,
          latitude: raw.latitude,
          longitude: raw.longitude,
          dob: raw.dob,
          gender: raw.gender,
          language: raw.language,
          profile_photo: raw.profile_photo,
          nationality: raw.nationality,
          service_areas: raw.service_areas || [],
          bank_details: raw.bank_details,
          documents: raw.documents,
        }
      }))
    })

    return () => {
      unsubReq()
      unsubTech()
    }
  }, [authorized])

  const pending = useMemo(() => requests.filter((r) => r.status === "pending"), [requests])

  const approve = async (r: TechnicianRequest) => {
    if (isMockMode) {
      setRequests((p) => p.map((x) => (x.id === r.id ? { ...x, status: "approved" } : x)))
      setTechnicians((p) => [
        ...p,
        {
          id: r.userId,
          name: r.full_name,
          phone: r.phone,
          skills: r.skills || [],
          isApproved: true,
          isActive: true,
          subscriptionStatus: "inactive",
          rating: 5,
          technician_id: `KBI-TECH-${Math.floor(1000 + Math.random() * 9000)}`,
        },
      ])
      return
    }
    setSavingId(r.id)
    try {
      const generatedTechId = `KBI-TECH-${Math.floor(1000 + Math.random() * 9000)}`
      const generatedQrCode = `https://kbi.services/tech/${r.userId}`

      await updateDoc(doc(db, "technician_requests", r.id), { status: "approved", updatedAt: Timestamp.now() } as any)
      await updateDoc(doc(db, "users", r.userId), { role: "technician", updatedAt: Timestamp.now() } as any)
      
      await setDoc(doc(db, "technicians", r.userId), {
        name: r.full_name,
        phone: r.phone,
        whatsapp: r.whatsapp || r.phone,
        email: r.email,
        skills: r.skills || [],
        experience_main_skill: r.experience_main_skill || "",
        isApproved: true,
        isActive: true,
        subscriptionStatus: "inactive",
        rating: 5.0,
        wallet_balance: 0,
        completed_jobs: 0,
        technician_id: generatedTechId,
        qr_code: generatedQrCode,
        latitude: r.latitude || 24.4539,
        longitude: r.longitude || 54.3773,
        dob: r.dob || "",
        gender: r.gender || "",
        language: r.language || "",
        profile_photo: r.profile_photo || "",
        nationality: r.nationality || "",
        service_areas: r.service_areas || [],
        bank_details: r.bank_details || null,
        documents: r.documents || null,
        updatedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
      } as any, { merge: true })

      await addDoc(collection(db, "notifications"), {
        role: "admin",
        type: "technician_approved",
        message: `Technician approved: ${r.full_name} (${generatedTechId})`,
        createdAt: Timestamp.now(),
      })
    } finally {
      setSavingId(null)
    }
  }

  const reject = async (r: TechnicianRequest) => {
    if (isMockMode) {
      setRequests((p) => p.map((x) => (x.id === r.id ? { ...x, status: "rejected" } : x)))
      return
    }
    setSavingId(r.id)
    try {
      await updateDoc(doc(db, "technician_requests", r.id), { status: "rejected", updatedAt: Timestamp.now() } as any)
      await addDoc(collection(db, "notifications"), {
        role: "admin",
        type: "technician_rejected",
        message: `Technician rejected: ${r.full_name}`,
        createdAt: Timestamp.now(),
      })
    } finally {
      setSavingId(null)
    }
  }

  const requestMoreDocs = async (r: TechnicianRequest) => {
    if (isMockMode) {
      setRequests((p) => p.map((x) => (x.id === r.id ? { ...x, status: "documents_requested" } : x)))
      return
    }
    setSavingId(r.id)
    try {
      await updateDoc(doc(db, "technician_requests", r.id), { status: "documents_requested", updatedAt: Timestamp.now() } as any)
      await addDoc(collection(db, "notifications"), {
        role: "admin",
        type: "documents_requested",
        message: `Requested additional documents from: ${r.full_name}`,
        createdAt: Timestamp.now(),
      })
    } finally {
      setSavingId(null)
    }
  }

  const toggleApproval = async (tech: Technician) => {
    if (isMockMode) {
      setTechnicians((p) =>
        p.map((x) => (x.id === tech.id ? { ...x, isApproved: !x.isApproved, isActive: !x.isApproved } : x))
      )
      return
    }
    setSavingId(tech.id)
    try {
      const nextApproved = !tech.isApproved
      await updateDoc(doc(db, "technicians", tech.id), {
        isApproved: nextApproved,
        isActive: nextApproved,
        updatedAt: Timestamp.now()
      } as any)
      
      await updateDoc(doc(db, "users", tech.id), {
        role: nextApproved ? "technician" : "user",
        updatedAt: Timestamp.now()
      } as any)
    } catch (e) {
      console.error(e)
    } finally {
      setSavingId(null)
    }
  }

  const toggleSubscription = async (tech: Technician) => {
    if (isMockMode) {
      setTechnicians((p) =>
        p.map((x) => (x.id === tech.id ? { ...x, subscriptionStatus: x.subscriptionStatus === "active" ? "inactive" : "active" } : x))
      )
      return
    }
    setSavingId(tech.id)
    try {
      const nextSub = tech.subscriptionStatus === "active" ? "inactive" : "active"
      await updateDoc(doc(db, "technicians", tech.id), {
        subscriptionStatus: nextSub,
        updatedAt: Timestamp.now()
      } as any)
    } catch (e) {
      console.error(e)
    } finally {
      setSavingId(null)
    }
  }

  const renderProfileDetails = (p: TechnicianRequest | Technician) => {
    const isRequest = "status" in p
    const docs = p.documents || {}
    const bank = p.bank_details || { method: "Cash" }
    const avail = "availability" in p ? p.availability : null

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 p-4 rounded-xl bg-white/5 border border-white/5 text-sm text-white/80">
        <div>
          <h4 className="font-bold text-cyan-400 mb-3 flex items-center gap-1.5"><User className="w-4 h-4"/> Personal Details</h4>
          <div className="space-y-1.5">
            <div><span className="text-white/40">WhatsApp:</span> <a href={`https://wa.me/${p.whatsapp || p.phone}`} target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline inline-flex items-center gap-1">{(p as any).whatsapp || p.phone} <ExternalLink className="w-3 h-3"/></a></div>
            <div><span className="text-white/40">Email:</span> {p.email || "-"}</div>
            <div><span className="text-white/40">Date of Birth:</span> {p.dob || "-"}</div>
            <div><span className="text-white/40">Gender:</span> {p.gender || "-"}</div>
            <div><span className="text-white/40">Language:</span> {p.language || "-"}</div>
            <div><span className="text-white/40">Nationality:</span> {p.nationality || "-"}</div>
          </div>

          <h4 className="font-bold text-cyan-400 mt-5 mb-3 flex items-center gap-1.5"><Award className="w-4 h-4"/> Professional Info</h4>
          <div className="space-y-1.5">
            <div><span className="text-white/40">Main Skill:</span> {p.experience_main_skill || "-"}</div>
            <div><span className="text-white/40">Sub Skills:</span> {p.skills?.join(", ") || "-"}</div>
            {"experience" in p && <div><span className="text-white/40">Experience:</span> {(p as any).experience || "-"}</div>}
            {"employment_type" in p && <div><span className="text-white/40">Employment:</span> {(p as any).employment_type || "-"}</div>}
            {"vehicle" in p && <div><span className="text-white/40">Own Vehicle:</span> {(p as any).vehicle ? "Yes" : "No"}</div>}
            {"tools" in p && <div><span className="text-white/40">Own Tools:</span> {(p as any).tools ? "Yes" : "No"}</div>}
            {"onsite" in p && <div><span className="text-white/40">On-site work:</span> {(p as any).onsite ? "Yes" : "No"}</div>}
            {avail && (
              <div>
                <span className="text-white/40">Availability:</span> {avail.days?.join(", ")} ({avail.start_time} - {avail.end_time})
              </div>
            )}
            {p.service_areas && p.service_areas.length > 0 && (
              <div><span className="text-white/40">Service Areas:</span> {p.service_areas.join(", ")}</div>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-bold text-cyan-400 mb-3 flex items-center gap-1.5"><FileText className="w-4 h-4"/> Identity Verification Documents</h4>
          <div className="space-y-2">
            {docs.emirates_id ? (
              <a href={docs.emirates_id} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-cyan-300 hover:underline">
                <FileText className="w-4 h-4 text-white/50"/> Emirates ID Copy <ExternalLink className="w-3 h-3"/>
              </a>
            ) : <div className="text-white/30">Emirates ID Missing ❌</div>}
            {docs.cv ? (
              <a href={docs.cv} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-cyan-300 hover:underline">
                <FileText className="w-4 h-4 text-white/50"/> CV / Resume <ExternalLink className="w-3 h-3"/>
              </a>
            ) : <div className="text-white/30">CV / Resume Missing ❌</div>}
            {docs.driving_license && (
              <a href={docs.driving_license} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-cyan-300 hover:underline">
                <FileText className="w-4 h-4 text-white/50"/> Driving License <ExternalLink className="w-3 h-3"/>
              </a>
            )}
          </div>

          <h4 className="font-bold text-cyan-400 mt-5 mb-3 flex items-center gap-1.5"><Landmark className="w-4 h-4"/> Banking & Payout Details</h4>
          <div className="space-y-1.5">
            <div><span className="text-white/40">Method:</span> {bank.method}</div>
            {bank.method === "Bank Transfer" && (
              <>
                <div><span className="text-white/40">Bank Name:</span> {bank.bank_name || "-"}</div>
                <div><span className="text-white/40">IBAN:</span> {bank.iban || "-"}</div>
                <div><span className="text-white/40">Holder Name:</span> {bank.account_holder || "-"}</div>
              </>
            )}
          </div>

          {p.latitude && p.longitude && (
            <>
              <h4 className="font-bold text-cyan-400 mt-5 mb-3 flex items-center gap-1.5"><MapPin className="w-4 h-4"/> GPS Coordinates</h4>
              <div>
                <a 
                  href={`https://maps.google.com/?q=${p.latitude},${p.longitude}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-cyan-300 underline inline-flex items-center gap-1"
                >
                  Locate on Google Maps ({p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}) <ExternalLink className="w-3 h-3"/>
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">{t("Technicians")}</h1>
          <p className="text-white/50 text-sm">{t("Approve technicians and manage status")}</p>
        </div>
      </div>

      <Card className="bg-black/50 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">
            {t("Pending Approvals")} <span className="text-white/40">({pending.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 ? (
            <div className="text-white/60 text-sm">{t("No pending requests")}</div>
          ) : (
            pending.map((r) => (
              <div key={r.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    {r.profile_photo ? (
                      <img src={r.profile_photo} alt="" className="w-12 h-12 rounded-full border border-white/10 object-cover"/>
                    ) : (
                      <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white"><User className="w-5 h-5"/></div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-white font-semibold">{r.full_name}</div>
                        <Badge variant="outline" className={cn("capitalize text-xs", statusStyle[r.status])}>
                          {t(r.status)}
                        </Badge>
                        <div className="text-xs text-white/45">{r.phone}</div>
                      </div>
                      <div className="text-white/60 text-xs mt-0.5">Category: {r.experience_main_skill}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                      {expandedId === r.id ? "Hide Details" : "View Details"}
                    </Button>
                    <Button disabled={savingId === r.id} size="sm" onClick={() => approve(r)}>
                      {t("Approve")}
                    </Button>
                    <Button variant="destructive" size="sm" disabled={savingId === r.id} onClick={() => reject(r)}>
                      {t("Reject")}
                    </Button>
                    <Button variant="outline" className="border-white/15" size="sm" disabled={savingId === r.id} onClick={() => requestMoreDocs(r)}>
                      {t("Request More Docs")}
                    </Button>
                  </div>
                </div>

                {expandedId === r.id && renderProfileDetails(r)}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="bg-black/50 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">{t("Technician Directory")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {technicians.length === 0 ? (
            <div className="text-white/60 text-sm">{t("No technicians")}</div>
          ) : (
            technicians.slice(0, 200).map((tech) => (
              <div key={tech.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    {tech.profile_photo ? (
                      <img src={tech.profile_photo} alt="" className="w-12 h-12 rounded-full border border-white/10 object-cover"/>
                    ) : (
                      <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white"><User className="w-5 h-5"/></div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-white font-semibold">{tech.name}</div>
                        {tech.technician_id && (
                          <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-400/20 text-xs">
                            {tech.technician_id}
                          </Badge>
                        )}
                        <Badge variant="outline" className={cn("text-white/70 border-white/20 text-xs", tech.isApproved ? "text-green-300 border-green-400/40 bg-green-400/5" : "text-yellow-300 border-yellow-400/40 bg-yellow-400/5")}>
                          {tech.isApproved ? t("Approved") : t("Pending")}
                        </Badge>
                        <Badge variant="outline" className={cn("text-white/70 border-white/20 text-xs", tech.subscriptionStatus === "active" ? "text-cyan-300 border-cyan-400/40 bg-cyan-400/5" : "text-white/50 border-white/20")}>
                          {tech.subscriptionStatus}
                        </Badge>
                        <div className="text-xs text-white/45">{tech.phone}</div>
                      </div>
                      <div className="text-white/60 text-xs mt-0.5">Rating: {tech.rating} | Jobs: {tech.completed_jobs} | Balance: {tech.wallet_balance} AED</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setExpandedId(expandedId === tech.id ? null : tech.id)}>
                      {expandedId === tech.id ? "Hide Details" : "View Details"}
                    </Button>
                    <Button 
                      size="sm" 
                      variant={tech.isApproved ? "secondary" : "default"}
                      disabled={savingId === tech.id} 
                      onClick={() => toggleApproval(tech)}
                    >
                      {tech.isApproved ? t("Suspend") : t("Approve")}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-white/20 text-white hover:bg-white/10"
                      disabled={savingId === tech.id} 
                      onClick={() => toggleSubscription(tech)}
                    >
                      {tech.subscriptionStatus === "active" ? t("Set Inactive") : t("Set Active")}
                    </Button>
                  </div>
                </div>

                {expandedId === tech.id && renderProfileDetails(tech)}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
