"use client"

import { useEffect, useState } from "react"
import {
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Laptop,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Trash2,
  User,
} from "lucide-react"

import {
  deleteCorporateRequestAction,
  getCorporateRequestsAction,
  updateCorporateRequestStatusAction,
} from "@/app/actions/corporate-booking"
import { useT } from "@/components/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { auth } from "@/firebase/firebaseConfig"

interface CorporateRequest {
  id: string
  companyName: string
  contactPerson: string
  email: string
  phone: string
  deviceCount: string
  message: string
  createdAt: any
  status: "New" | "Contacted" | "Closed"
}

const formatDate = (value: unknown) => {
  if (!value) return "Recent"
  if (typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toLocaleDateString()
  }
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? "Recent" : parsed.toLocaleDateString()
}

export default function CorporateInboxPage() {
  const t = useT()
  const [requests, setRequests] = useState<CorporateRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<CorporateRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "New" | "Contacted" | "Closed">("ALL")

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true)
      try {
        const idToken = await auth.currentUser?.getIdToken()
        if (!idToken) throw new Error("Unauthorized")
        const result = await getCorporateRequestsAction(idToken)
        if (result.success && result.data) {
          const list = result.data as CorporateRequest[]
          setRequests(list)
          if (!selectedRequest && list.length > 0) {
            setSelectedRequest(list[0])
          }
        } else {
          setRequests([])
        }
      } catch (e: any) {
        if (e?.name === "AbortError" || e?.message?.includes("aborted")) return
        setRequests([])
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [refreshKey])

  const refreshData = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const updateStatus = async (id: string, status: "New" | "Contacted" | "Closed") => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
    if (selectedRequest?.id === id) setSelectedRequest((prev) => (prev ? { ...prev, status } : null))

    const idToken = await auth.currentUser?.getIdToken()
    if (!idToken) return refreshData()
    const result = await updateCorporateRequestStatusAction(id, status, idToken)
    if (!result.success) {
      refreshData()
    }
  }

  const deleteRequest = async (id: string) => {
    if (!confirm("Are you sure you want to delete this corporate request?")) return

    setRequests((prev) => prev.filter((r) => r.id !== id))
    if (selectedRequest?.id === id) setSelectedRequest(null)

    const idToken = await auth.currentUser?.getIdToken()
    if (!idToken) return refreshData()
    const result = await deleteCorporateRequestAction(id, idToken)
    if (!result.success) {
      refreshData()
    }
  }

  const filteredRequests = requests.filter((r) => {
    const needle = search.trim().toLowerCase()
    const matchesSearch = !needle || [r.companyName, r.contactPerson, r.email, r.phone, r.message].some((v) => v?.toLowerCase().includes(needle))
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const newCount = requests.filter((r) => r.status === "New").length
  const contactedCount = requests.filter((r) => r.status === "Contacted").length
  const closedCount = requests.filter((r) => r.status === "Closed").length

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Header Bar */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div className="flex items-start gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
            <Building2 className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Corporate Requests</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Corporate B2B lead inquiries, bulk fleet repair proposals, and enterprise contracts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            asChild
            size="sm"
            className="h-10 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 shadow-xs"
          >
            <a href="https://secureserver.titan.email/mail/" target="_blank" rel="noreferrer">
              <Send className="size-3.5 mr-1.5" /> Open Titan Webmail <ExternalLink className="size-3 ml-1" />
            </a>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={refreshData}
            disabled={loading}
            className="h-10 rounded-xl border-border bg-card text-xs font-semibold text-foreground hover:bg-muted"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin text-primary" : ""}`} />
          </Button>
        </div>
      </section>

      {/* Metrics Bar */}
      <section className="grid gap-3 sm:grid-cols-4" aria-label="Corporate request statistics">
        <div className="rounded-2xl bg-card border border-border/80 p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Total Inquiries</p>
            <p className="text-2xl font-black text-foreground mt-1 tabular-nums font-mono">{loading ? "—" : requests.length}</p>
          </div>
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Building2 className="size-5" />
          </span>
        </div>

        <div className="rounded-2xl bg-card border border-border/80 p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">New Leads</p>
            <p className="text-2xl font-black text-primary mt-1 tabular-nums font-mono">{loading ? "—" : newCount}</p>
          </div>
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="size-5" />
          </span>
        </div>

        <div className="rounded-2xl bg-card border border-border/80 p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">In Contact</p>
            <p className="text-2xl font-black text-sky-500 mt-1 tabular-nums font-mono">{loading ? "—" : contactedCount}</p>
          </div>
          <span className="flex size-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <Phone className="size-5" />
          </span>
        </div>

        <div className="rounded-2xl bg-card border border-border/80 p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Closed / Finalized</p>
            <p className="text-2xl font-black text-muted-foreground mt-1 tabular-nums font-mono">{loading ? "—" : closedCount}</p>
          </div>
          <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground border border-border">
            <CheckCircle2 className="size-5" />
          </span>
        </div>
      </section>

      {/* Workspace Split Layout */}
      <div className="grid gap-6 lg:grid-cols-5 min-h-[640px]">
        {/* Left Column: Requests List (2 Columns on Large Screens) */}
        <Card className="lg:col-span-2 min-w-0 bg-card border-border/80 shadow-xs p-0 flex flex-col rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border/60 bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                <MessageSquare className="size-4 text-primary" /> Corporate Leads Inbox
              </CardTitle>
              <Badge variant="outline" className="bg-primary/10 border-primary/20 text-xs font-mono text-primary">
                {filteredRequests.length} Item{filteredRequests.length === 1 ? "" : "s"}
              </Badge>
            </div>

            {/* Search & Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search company, contact, or email..."
                  className="bg-background border-border text-xs text-foreground placeholder:text-muted-foreground pl-8 h-9 rounded-xl focus:border-primary"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {(["ALL", "New", "Contacted", "Closed"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all shrink-0 ${
                      statusFilter === filter
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {filter === "ALL" ? "All" : filter}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-3 flex-1 max-h-[540px] overflow-y-auto space-y-2.5">
            {loading ? (
              <div className="space-y-3 p-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl bg-muted" />
                ))}
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <Building2 className="size-10 mb-2 opacity-30 text-muted-foreground" />
                <p className="text-xs font-semibold">No corporate requests match your query.</p>
              </div>
            ) : (
              filteredRequests.map((req) => {
                const isSelected = selectedRequest?.id === req.id
                return (
                  <div
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? "bg-primary/10 border-primary shadow-xs"
                        : "bg-card border-border/70 hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-black text-foreground truncate">{req.companyName || "Unnamed Company"}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <User className="size-3" /> {req.contactPerson || "Direct Inquiry"}
                        </p>
                      </div>

                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 font-mono ${
                          req.status === "New"
                            ? "bg-primary/10 text-primary border-primary/30 animate-pulse"
                            : req.status === "Contacted"
                            ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {req.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-3 pt-2 border-t border-border/50 font-mono">
                      <span className="flex items-center gap-1">
                        <Laptop className="size-3 text-primary" /> {req.deviceCount || "Custom Quantity"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" /> {formatDate(req.createdAt)}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Right Column: Lead Detail & Action Center (3 Columns on Large Screens) */}
        <Card className="lg:col-span-3 min-w-0 bg-card border-border/80 shadow-xs p-0 flex flex-col rounded-2xl overflow-hidden">
          {selectedRequest ? (
            <>
              {/* Lead Detail Header */}
              <div className="border-b border-border/60 bg-muted/30 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                    <Building2 className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-black text-foreground truncate">{selectedRequest.companyName}</h2>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 font-mono">
                      Submitted on {formatDate(selectedRequest.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex items-center gap-1.5 self-start sm:self-auto bg-muted/50 p-1 rounded-xl border border-border">
                  {(["New", "Contacted", "Closed"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => updateStatus(selectedRequest.id, st)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        selectedRequest.status === st
                          ? st === "New"
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : st === "Contacted"
                            ? "bg-sky-600 text-white shadow-xs"
                            : "bg-muted-foreground text-card shadow-xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lead Body Content */}
              <div className="p-6 flex-1 space-y-6 overflow-y-auto">
                {/* Contact Coordinates Card */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 rounded-xl bg-muted/20 border border-border/70 space-y-1">
                    <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                      <User className="size-3 text-primary" /> Contact Person
                    </span>
                    <p className="text-sm font-bold text-foreground">{selectedRequest.contactPerson || "Not Provided"}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/20 border border-border/70 space-y-1">
                    <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                      <Mail className="size-3 text-primary" /> Email Address
                    </span>
                    <a
                      href={`mailto:${selectedRequest.email}`}
                      className="text-sm font-bold text-primary hover:underline truncate block"
                    >
                      {selectedRequest.email || "No Email"}
                    </a>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/20 border border-border/70 space-y-1">
                    <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                      <Phone className="size-3 text-primary" /> Phone Number
                    </span>
                    <a
                      href={`tel:${selectedRequest.phone}`}
                      className="text-sm font-bold text-foreground hover:text-primary transition block font-mono"
                    >
                      {selectedRequest.phone || "No Phone"}
                    </a>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/20 border border-border/70 space-y-1">
                    <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                      <Laptop className="size-3 text-primary" /> Device Scope
                    </span>
                    <p className="text-sm font-bold text-foreground">{selectedRequest.deviceCount || "Custom Quantity"}</p>
                  </div>
                </div>

                {/* Message / Scope of Work Body */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Proposal Request & Message</h3>
                  <div className="p-5 rounded-2xl bg-muted/20 border border-border/70 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                    {selectedRequest.message || "No additional message was supplied with this inquiry."}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="border-t border-border/60 bg-muted/30 p-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteRequest(selectedRequest.id)}
                  className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 text-xs"
                >
                  <Trash2 className="size-3.5 mr-1.5" /> Delete Inquiry
                </Button>

                <div className="flex items-center gap-2">
                  {selectedRequest.phone && (
                    <Button asChild size="sm" variant="outline" className="rounded-xl border-border bg-card text-xs font-bold">
                      <a href={`https://wa.me/${selectedRequest.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer">
                        WhatsApp Contact
                      </a>
                    </Button>
                  )}
                  {selectedRequest.email && (
                    <Button asChild size="sm" className="rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:brightness-110">
                      <a href={`mailto:${selectedRequest.email}?subject=KBI Corporate Repair Solutions Proposal`}>
                        <Mail className="size-3.5 mr-1.5" /> Reply by Email
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 p-12 text-center text-muted-foreground space-y-3">
              <Building2 className="size-12 opacity-25 text-muted-foreground" />
              <div>
                <p className="text-sm font-bold text-foreground">Inspect Corporate Lead Details</p>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  Select a corporate inquiry from the left inbox list to inspect device quantities, proposal details, and direct contact tools.
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
