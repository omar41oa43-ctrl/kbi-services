"use client"

import React, { useState } from "react"
import Link from "next/link"
import {
  Building2,
  ShieldCheck,
  Clock,
  Laptop,
  Smartphone,
  Printer,
  Camera,
  Tv,
  Plus,
  ArrowRight,
  CheckCircle2,
  FileText,
  HelpCircle,
  Sparkles,
  Phone,
  MessageCircle,
  CalendarDays,
  Activity,
  Layers,
  Award
} from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { useT } from "@/components/language-provider"

export default function CorporatePortalPage() {
  const t = useT()
  const [selectedTab, setSelectedTab] = useState<"dashboard" | "batch-ticket" | "sla">("dashboard")
  const [companyName, setCompanyName] = useState("")
  const [deviceCount, setDeviceCount] = useState("5")
  const [issueSummary, setIssueSummary] = useState("")
  const [submitted, setSubmitted] = useState(false)

  // Demo active fleet orders
  const activeFleetOrders = [
    { id: "CORP-8821", department: "Executive Suite", devices: "3x MacBook Pro 16", status: "In Progress", tech: "Farooq (Senior IT)", sla: "1h 15m remaining" },
    { id: "CORP-8819", department: "HQ Reception & Meeting Rooms", devices: "2x 75\" Conference Displays", status: "Completed", tech: "Rashid (AV Specialist)", sla: "Met SLA (45m)" },
    { id: "CORP-8804", department: "Sales Operations", devices: "10x iPhone 15 Pro Fleet", status: "Delivered", tech: "Zack (Mobile Lab)", sla: "Met SLA (2h)" },
  ]

  const handleSubmitBatch = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setIssueSummary("")
    }, 4000)
  }

  return (
    <main className="min-h-screen bg-background text-foreground pt-28 pb-20 selection:bg-cyan-500/20">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Top Header Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-6 border-b border-border">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Building2 className="w-3.5 h-3.5" /> Corporate Enterprise Portal
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Fleet & Contract Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time SLA status, scheduled maintenance windows, and priority batch dispatch.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm" className="rounded-xl border-border bg-card">
              <Link href="/corporate">
                {t("Contract Plans")} <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button
              onClick={() => setSelectedTab("batch-ticket")}
              size="sm"
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-xs gap-2"
            >
              <Plus className="w-4 h-4" /> New Batch Ticket
            </Button>
          </div>
        </div>

        {/* SLA & Coverage Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <GlassCard className="p-5" hoverEffect={false}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground">Active SLA Response</span>
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-black font-mono text-foreground">&lt; 2 Hours</p>
            <p className="text-xs text-muted-foreground mt-1">Priority enterprise on-site dispatch</p>
          </GlassCard>

          <GlassCard className="p-5" hoverEffect={false}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground">Managed Devices</span>
              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Laptop className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-black font-mono text-foreground">150+ Units</p>
            <p className="text-xs text-muted-foreground mt-1">Phones, Laptops, Displays & CCTV</p>
          </GlassCard>

          <GlassCard className="p-5" hoverEffect={false}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground">Warranty Coverage</span>
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">180 Days</p>
            <p className="text-xs text-muted-foreground mt-1">Extended parts & labor guarantee</p>
          </GlassCard>

          <GlassCard className="p-5" hoverEffect={false}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground">Dedicated Tech Lead</span>
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Award className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-black text-foreground">Assigned</p>
            <p className="text-xs text-muted-foreground mt-1">Direct escalation & monthly audits</p>
          </GlassCard>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-border pb-4 mb-8">
          <button
            onClick={() => setSelectedTab("dashboard")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedTab === "dashboard"
                ? "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Live Fleet Requests
          </button>
          <button
            onClick={() => setSelectedTab("batch-ticket")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedTab === "batch-ticket"
                ? "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Submit Batch Ticket
          </button>
          <button
            onClick={() => setSelectedTab("sla")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedTab === "sla"
                ? "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            SLA & Contract Documents
          </button>
        </div>

        {/* Tab 1: Live Requests Table */}
        {selectedTab === "dashboard" && (
          <div className="space-y-6">
            <GlassCard className="p-0 overflow-hidden" hoverEffect={false}>
              <div className="p-5 border-b border-border bg-muted/20 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">Active Work Orders & Maintenance</h3>
                  <p className="text-xs text-muted-foreground">Real-time status of items currently under technician care.</p>
                </div>
                <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 font-bold">
                  Live Syncing
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground border-b border-border font-semibold">
                    <tr>
                      <th className="p-4">Ticket Reference</th>
                      <th className="p-4">Department</th>
                      <th className="p-4">Hardware Inventory</th>
                      <th className="p-4">Assigned Specialist</th>
                      <th className="p-4">SLA Commitment</th>
                      <th className="p-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {activeFleetOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-mono font-bold text-cyan-600 dark:text-cyan-400">{order.id}</td>
                        <td className="p-4 font-medium text-foreground">{order.department}</td>
                        <td className="p-4 text-muted-foreground">{order.devices}</td>
                        <td className="p-4 font-medium text-foreground">{order.tech}</td>
                        <td className="p-4 font-mono text-muted-foreground">{order.sla}</td>
                        <td className="p-4 text-right">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                            order.status === "Completed"
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                              : order.status === "In Progress"
                              ? "bg-cyan-500/10 text-cyan-600 border border-cyan-500/20 animate-pulse"
                              : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Tab 2: Batch Ticket Submission */}
        {selectedTab === "batch-ticket" && (
          <div className="max-w-2xl mx-auto">
            <GlassCard className="p-6 sm:p-8" hoverEffect={false}>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Submit Bulk Maintenance Ticket</h3>
                  <p className="text-xs text-muted-foreground">Request priority dispatch for multiple office devices or meeting room setups.</p>
                </div>
              </div>

              {submitted ? (
                <div className="text-center py-8 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <h4 className="text-lg font-bold text-foreground">Batch Ticket Dispatched!</h4>
                  <p className="text-xs text-muted-foreground">Your assigned technician lead has been notified. Expected arrival within SLA window.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitBatch} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Company / Office Branch</label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Al Maryah Tower HQ, 14th Floor"
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-cyan-500 text-foreground"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-foreground mb-1.5">Device Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={deviceCount}
                        onChange={(e) => setDeviceCount(e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-cyan-500 text-foreground font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-foreground mb-1.5">Priority Urgency</label>
                      <select className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-cyan-500 text-foreground">
                        <option>Immediate / Production Blocker (&lt; 2h)</option>
                        <option>Scheduled Maintenance (Today)</option>
                        <option>Weekend Fleet Overhaul</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-foreground mb-1.5">Equipment & Fault Description</label>
                    <textarea
                      rows={4}
                      required
                      value={issueSummary}
                      onChange={(e) => setIssueSummary(e.target.value)}
                      placeholder="Describe the hardware, brands, and symptoms (e.g. 5x Dell Latitude battery swelling, 2x meeting room projectors not turning on)..."
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-cyan-500 text-foreground resize-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl px-8 h-11">
                      Dispatch Enterprise Support
                    </Button>
                  </div>
                </form>
              )}
            </GlassCard>
          </div>
        )}

        {/* Tab 3: SLA & Documents */}
        {selectedTab === "sla" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6 space-y-4" hoverEffect={false}>
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                <h3 className="text-base font-bold text-foreground">Master Service Level Agreement (SLA)</h3>
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                  <strong>Response Guarantee:</strong> 2-Hour maximum on-site arrival anywhere within Abu Dhabi & surrounding zones.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                  <strong>Parts Authenticity:</strong> 100% genuine OEM components with serialized tracking.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                  <strong>Data Privacy & Security:</strong> Non-disclosure compliance under UAE Federal Decree-Law No. 45.
                </li>
              </ul>
            </GlassCard>

            <GlassCard className="p-6 space-y-4" hoverEffect={false}>
              <div className="flex items-center gap-3">
                <Phone className="w-6 h-6 text-emerald-600 dark:text-green-400" />
                <h3 className="text-base font-bold text-foreground">Dedicated Account Escalation</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                For urgent server room power outages, network crashes, or VIP executive hardware emergencies, contact your assigned technical lead directly:
              </p>
              <div className="p-4 rounded-xl bg-muted/30 border border-border flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-foreground">Enterprise Dispatch Desk</p>
                  <p className="text-muted-foreground font-mono">+971 50 249 1034</p>
                </div>
                <Button size="sm" asChild className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold gap-1.5">
                  <a href="https://wa.me/971502491034" target="_blank" rel="noreferrer">
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Lead
                  </a>
                </Button>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </main>
  )
}
