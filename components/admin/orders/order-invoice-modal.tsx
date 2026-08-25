"use client"

import React, { useRef } from "react"
import { Printer, Download, CheckCircle2, ShieldCheck, Wrench, Building2, Phone, Mail, MapPin } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AdminWorkOrder, formatOrderDate } from "@/components/admin/orders/order-types"

interface Props {
  order: AdminWorkOrder | null
  open: boolean
  onOpenChange: (_open: boolean) => void
}

export function OrderInvoiceModal({ order, open, onOpenChange }: Props) {
  const printRef = useRef<HTMLDivElement>(null)

  if (!order) return null

  const subtotal = order.totalAmount > 0 ? order.totalAmount / 1.05 : 0
  const vat = order.totalAmount > 0 ? order.totalAmount - subtotal : 0
  const total = order.totalAmount > 0 ? order.totalAmount : 0

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-background text-foreground border-border max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Tax Invoice / Work Order
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handlePrint} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold gap-2 text-xs h-9 rounded-xl shadow-xs">
              <Printer className="w-4 h-4" /> Print / Save PDF
            </Button>
          </div>
        </DialogHeader>

        <div className="p-8 overflow-y-auto flex-1 print:p-0 print:overflow-visible" ref={printRef}>
          {/* Invoice Document Body */}
          <div className="border border-border/80 rounded-2xl p-6 sm:p-8 bg-card shadow-xs print:border-none print:shadow-none print:p-0">
            {/* Header / Brand */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-border">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-foreground">
                  KBI<span className="text-cyan-500">.</span>
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">KBI Global Technologies LLC • Abu Dhabi, UAE</p>
                <p className="text-xs text-muted-foreground font-mono">TRN: 100482937400003</p>
              </div>

              <div className="text-start sm:text-end">
                <span className="inline-block px-3 py-1 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-bold text-xs rounded-full border border-cyan-500/20 mb-1">
                  OFFICIAL TAX INVOICE
                </span>
                <p className="text-xs text-muted-foreground">Invoice #: <strong className="text-foreground font-mono">INV-{order.reference}</strong></p>
                <p className="text-xs text-muted-foreground">Date: <strong className="text-foreground">{formatOrderDate(order.createdAt)}</strong></p>
              </div>
            </div>

            {/* Bill To / Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 text-xs">
              <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-1.5">
                <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Client / Recipient</p>
                <p className="font-bold text-sm text-foreground">{order.customerName || "Customer"}</p>
                {order.customerPhone && <p className="text-muted-foreground flex items-center gap-1.5"><Phone className="w-3 h-3" /> {order.customerPhone}</p>}
                {order.customerEmail && <p className="text-muted-foreground flex items-center gap-1.5"><Mail className="w-3 h-3" /> {order.customerEmail}</p>}
                {order.address && <p className="text-muted-foreground flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {order.address}</p>}
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-1.5">
                <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Service & Technician</p>
                <p className="font-bold text-sm text-foreground">{order.service || "On-Site Repair Service"}</p>
                <p className="text-muted-foreground">Device: <strong className="text-foreground">{order.device || "Electronic Device"}</strong></p>
                <p className="text-muted-foreground">Technician: <strong className="text-foreground">{order.technicianName || "KBI Field Specialist"}</strong></p>
                <p className="text-muted-foreground">Status: <span className="font-semibold text-emerald-600 dark:text-emerald-400 uppercase">{order.status}</span></p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-border rounded-xl overflow-hidden mb-6">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Price (AED)</th>
                    <th className="p-3 text-right">Total (AED)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="p-3">
                      <p className="font-bold text-foreground">{order.service || "Hardware/Software Repair & Diagnostics"}</p>
                      <p className="text-[11px] text-muted-foreground">On-site diagnosis, certified labor & genuine replacement parts for {order.device || "device"}.</p>
                    </td>
                    <td className="p-3 text-center text-muted-foreground">1</td>
                    <td className="p-3 text-right font-mono">{subtotal.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono font-bold text-foreground">{subtotal.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="flex justify-end mb-6">
              <div className="w-full sm:w-64 space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal (Excl. VAT):</span>
                  <span className="font-mono">AED {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>VAT (5%):</span>
                  <span className="font-mono">AED {vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-border text-foreground">
                  <span>Total Due / Paid:</span>
                  <span className="font-mono text-cyan-600 dark:text-cyan-400">AED {total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Warranty & Guarantee Footer */}
            <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 flex items-center gap-3">
              <ShieldCheck className="w-7 h-7 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <div className="text-[11px] text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Official KBI Warranty Guarantee:</strong> All replaced parts and labor are backed by our standard 90-day warranty against manufacturer defects.
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
