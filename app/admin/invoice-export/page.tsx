"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { FinalInvoice } from "@/components/ui/invoice"
import { Printer, Download, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import Script from "next/script"

type Payload = {
  order: any
  items: any[]
  invoiceNumber: string
  invoiceDate: string
  language: "en" | "ar" | "both"
  discount?: number
  vatEnabled?: boolean
  vatRate?: number
  subtotalOverride?: string
  totalOverride?: string
  warrantyPeriod?: string
  adminNotes?: string
  disclaimerText?: string
  autoPrint?: boolean
  autoDownload?: boolean
  fileName?: string
}

export default function InvoiceExportPage() {
  const [raw, setRaw] = useState<string>("")
  const [isDownloading, setIsDownloading] = useState(false)
  const invoiceRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || typeof window === "undefined") return;
    
    // @ts-ignore
    if (typeof html2pdf === "undefined") {
      alert("Please wait while the PDF generator is loading...");
      return;
    }

    setIsDownloading(true);
    
    try {
      const element = invoiceRef.current;
      const fileName = payload?.fileName || payload?.invoiceNumber || "invoice";
      
      const opt = {
        margin: 0,
        filename: `${fileName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          letterRendering: true
        },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };

      // @ts-ignore
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    try {
      const v = sessionStorage.getItem("kbi_invoice_export_v1") || ""
      setRaw(v)
    } catch (e) {
      console.error("Failed to read from session storage", e)
      setRaw("")
    }
  }, [])

  const payload = useMemo(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Payload;
    } catch (e) {
      console.error("Failed to parse payload from session storage", e);
      return null;
    }
  }, [raw])

  useEffect(() => {
    if (!payload?.autoPrint) return
    const id = window.setTimeout(() => window.print(), 800)
    return () => window.clearTimeout(id)
  }, [payload])

  useEffect(() => {
    if (!payload?.autoDownload) return
    const id = window.setTimeout(() => handleDownloadPDF(), 1500)
    return () => window.clearTimeout(id)
  }, [payload])

  useEffect(() => {
    if (!payload) return
    const name = payload.fileName || payload.invoiceNumber || "invoice"
    document.title = name
  }, [payload])

  if (!payload) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
           <Printer className="w-8 h-8 text-white/20" />
        </div>
        <h1 className="text-2xl font-bold mb-2">بيانات الفاتورة غير متوفرة</h1>
        <p className="text-white/60 mb-6 max-w-md">يرجى فتح هذه الصفحة من خلال لوحة تحكم الطلبات بالضغط على "معاينة الفاتورة" أولاً.</p>
        <Link href="/admin/orders" className="px-6 py-2 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition-colors inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          العودة للطلبات
        </Link>
      </div>
    )
  }

  const isAr = payload.language === "ar" || payload.language === "both"

  return (
    <div className="min-h-screen bg-neutral-900 p-4 sm:p-8 print:p-0 print:bg-white">
      <div className="mx-auto max-w-[900px] print:max-w-none">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden bg-black/40 backdrop-blur-xl p-4 rounded-2xl border border-white/10">
          <Script 
            src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" 
            strategy="afterInteractive"
          />
          <Link href="/admin/orders" className="text-white/60 hover:text-white flex items-center gap-2 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {isAr ? "العودة للطلبات" : "Back to Orders"}
          </Link>
          
          <div className="flex items-center gap-2">
            <Button 
              type="button" 
              variant="outline" 
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl flex items-center gap-2"
              onClick={handlePrint}
            >
              <Printer className="w-4 h-4" />
              {payload.language === "ar" ? "طباعة الفاتورة" : "Print Invoice"}
            </Button>
            <Button 
              type="button" 
              disabled={isDownloading}
              className="bg-cyan-500 text-black hover:bg-cyan-400 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
              onClick={handleDownloadPDF}
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {payload.language === "ar" ? (isDownloading ? "جاري التحميل..." : "تحميل كملف PDF") : (isDownloading ? "Downloading..." : "Download as PDF")}
            </Button>
          </div>
        </div>
        
        <div ref={invoiceRef} className="bg-white rounded-2xl overflow-hidden shadow-2xl print:shadow-none print:rounded-none">
          <FinalInvoice
            order={payload.order}
            items={payload.items}
            invoiceNumber={payload.invoiceNumber}
            invoiceDate={payload.invoiceDate}
            language={payload.language}
            discount={payload.discount}
            vatEnabled={payload.vatEnabled}
            vatRate={payload.vatRate}
            subtotalOverride={payload.subtotalOverride}
            totalOverride={payload.totalOverride}
            warrantyPeriod={payload.warrantyPeriod}
            adminNotes={payload.adminNotes}
            disclaimerText={payload.disclaimerText}
          />
        </div>
      </div>
    </div>
  )
}

