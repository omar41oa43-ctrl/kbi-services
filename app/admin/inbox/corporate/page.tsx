"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { useT } from "@/components/language-provider"
import { Building2, Phone, Mail, Trash2, Send, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  getCorporateRequestsAction,
  updateCorporateRequestStatusAction,
  deleteCorporateRequestAction
} from "@/app/actions/corporate-booking"

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

export default function CorporateInboxPage() {
  const t = useT()
  const [requests, setRequests] = useState<CorporateRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<CorporateRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true)
      try {
        const result = await getCorporateRequestsAction()
        if (result.success && result.data) {
          setRequests(result.data as CorporateRequest[])
        } else {
          setRequests([])
        }
      } catch (e: any) {
        if (e?.name === 'AbortError' || e?.message?.includes('aborted')) return
        setRequests([])
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [refreshKey])

  const refreshData = () => {
    setRefreshKey(prev => prev + 1)
  }

  const updateStatus = async (id: string, status: "New" | "Contacted" | "Closed") => {
    // Optimistic update
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    if (selectedRequest?.id === id) setSelectedRequest(prev => prev ? { ...prev, status } : null)

    const result = await updateCorporateRequestStatusAction(id, status)
    if (!result.success) {
      // Revert on failure
      refreshData()
    }
  }

  const deleteRequest = async (id: string) => {
    if (!confirm(t("Delete this request?"))) return

    // Optimistic update
    setRequests(prev => prev.filter(r => r.id !== id))
    if (selectedRequest?.id === id) setSelectedRequest(null)

    const result = await deleteCorporateRequestAction(id)
    if (!result.success) {
      // Revert on failure
      refreshData()
    }
  }

  return (
    <section className="pt-2 pb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-xl md:text-2xl font-bold">{t("Corporate Requests")}</h1>
          {requests.filter(r => r.status === "New").length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {requests.filter(r => r.status === "New").length} {t("New")}
            </Badge>
          )}
        </div>
        <button
          onClick={refreshData}
          disabled={loading}
          className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70"
          title={t("Refresh")}
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6 h-[600px]">
        <GlassCard className="overflow-hidden flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-semibold">{t("Inbox")}</h2>
              <p className="text-xs text-white/50 mt-1">
                {t("Email")}:{" "}
                <a
                  href="https://secureserver.titan.email/mail/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white underline underline-offset-4 decoration-white/20 hover:decoration-white/40"
                >
                  https://secureserver.titan.email/mail/
                </a>
              </p>
            </div>
            <a
              href="https://secureserver.titan.email/mail/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Send className="w-4 h-4 text-cyan-400" />
              {t("Open Email")}
            </a>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {requests.length === 0 && !loading && <p className="text-white/30 text-center py-10">{t("No requests")}</p>}
            {requests.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedRequest(r)}
                className={`p-4 rounded-xl border cursor-pointer transition-colors ${selectedRequest?.id === r.id ? "bg-cyan-500/10 border-cyan-500/50" : r.status === "New" ? "bg-white/10 border-white/20 font-semibold" : "bg-white/5 border-white/10"}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-cyan-400" />
                    {r.companyName}
                  </span>
                  <div className="text-xs text-white/50 text-right">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : t("Just now")}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-white/70">{r.contactPerson}</p>
                  <Badge variant="outline" className={
                    r.status === "New" ? "border-green-500 text-green-500" :
                      r.status === "Contacted" ? "border-blue-500 text-blue-500" :
                        "border-white/30 text-white/50"
                  }>
                    {t(r.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col">
          {selectedRequest ? (
            <>
              <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    {selectedRequest.companyName}
                  </h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm flex items-center gap-2 text-white/70">
                      <span className="text-white/40">{t("Contact:")}</span> {selectedRequest.contactPerson}
                    </p>
                    <p className="text-sm flex items-center gap-2 text-white/70">
                      <Mail className="w-3 h-3" />{" "}
                      <a className="hover:underline" href={`mailto:${selectedRequest.email}`}>
                        {selectedRequest.email}
                      </a>
                    </p>
                    <p className="text-sm flex items-center gap-2 text-white/70">
                      <Phone className="w-3 h-3" />{" "}
                      <a className="hover:underline" href={`tel:${selectedRequest.phone}`}>
                        {selectedRequest.phone}
                      </a>
                    </p>
                    <p className="text-sm flex items-center gap-2 text-white/70">
                      <span className="text-white/40">{t("Devices:")}</span> {selectedRequest.deviceCount}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => deleteRequest(selectedRequest.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors self-end">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <div className="flex gap-2 mt-2">
                    {selectedRequest.status === "New" && (
                      <button onClick={() => updateStatus(selectedRequest.id, "Contacted")} className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/50 hover:bg-blue-500/30 transition-colors">
                        {t("Mark Contacted")}
                      </button>
                    )}
                    {selectedRequest.status !== "Closed" && (
                      <button onClick={() => updateStatus(selectedRequest.id, "Closed")} className="text-xs bg-white/5 text-white/50 px-3 py-1 rounded-full border border-white/10 hover:bg-white/10 transition-colors">
                        {t("Close Request")}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/10 text-sm whitespace-pre-wrap break-words overflow-y-auto">
                <h4 className="text-xs text-white/40 uppercase tracking-wider mb-2">{t("Message")}</h4>
                {selectedRequest.message}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/30">
              {t("Select a request to view details")}
            </div>
          )}
        </GlassCard>
      </div>
    </section>
  )
}
