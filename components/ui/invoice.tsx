"use client"

import { useEffect, useMemo, useState } from "react"
type InvoiceItem = {
  description: string
  partNo?: string
  quantity: number
  total: number
}

type Props = {
  order: any
  items: InvoiceItem[]
  invoiceNumber: string
  invoiceDate: string | Date
  language: "en" | "ar" | "both"
  discount?: number
  vatEnabled?: boolean
  vatRate?: number
  warrantyPeriod?: string
  adminNotes?: string
  disclaimerText?: string
  editable?: boolean
  onInvoiceNumberChange?: (_value: string) => void
  onInvoiceDateChange?: (_value: string) => void
  subtotalOverride?: string
  totalOverride?: string
  onSubtotalOverrideChange?: (_value: string) => void
  onTotalOverrideChange?: (_value: string) => void
  manualRows?: InvoiceItem[]
  onManualRowsChange?: (_rows: InvoiceItem[]) => void
}

export function FinalInvoice(props: Props) {
  const {
    order,
    items,
    invoiceNumber,
    invoiceDate,
    language,
    discount = 0,
    vatEnabled = false,
    vatRate = 0,
    editable = false,
    onInvoiceNumberChange,
    onInvoiceDateChange,
    subtotalOverride,
    totalOverride,
    onSubtotalOverrideChange,
    onTotalOverrideChange,
    manualRows,
    onManualRowsChange
  } = props

  const fill = (value: unknown, placeholder = "_____________") => {
    const v = typeof value === "string" ? value.trim() : String(value ?? "").trim()
    return v ? v : placeholder
  }

  const [companyLine1, setCompanyLine1] = useState("KBI.")
  const [companyLine2, setCompanyLine2] = useState("GLOBAL TECHNOLOGIES")

  const [tel1, setTel1] = useState("+971502491034")
  const [tel2, setTel2] = useState("+971504914916")
  const [poBox, setPoBox] = useState("88888")
  const [country, setCountry] = useState("UNITED ARAB EMIRATES")
  const [emirate, setEmirate] = useState("ABU DHABI")
  const [email, setEmail] = useState("SUPPORT@KBI.SERVICES")

  const [issuedTo, setIssuedTo] = useState<string>(order?.customerName || "")
  const [location, setLocation] = useState<string>(order?.location || order?.address || "")
  const [localRows, setLocalRows] = useState<InvoiceItem[]>([])
  const [localSubtotalOverride, setLocalSubtotalOverride] = useState<string>("")
  const [localTotalOverride, setLocalTotalOverride] = useState<string>("")

  const [receivedBy, setReceivedBy] = useState("")
  const [receivedSignature, setReceivedSignature] = useState("")
  const [receivedPhone, setReceivedPhone] = useState("")
  const [receivedDate, setReceivedDate] = useState("")

  const termsTitle = "TERMS & CONDITIONS"
  const termsText =
    "Please send payment within 20 days of receiving this invoice.\nThere will be a 10% interest charge per month on late invoices."

  const [bankTitle, setBankTitle] = useState("BANK DETAILS")
  const [bankAccountHolder, setBankAccountHolder] = useState("KBI GLOBAL TECHNOLOGIES")
  const [bankIban, setBankIban] = useState("AE068090000000000623369")
  const [bankAccountNumber, setBankAccountNumber] = useState("623369")
  const [bankCurrency, setBankCurrency] = useState("AED")
  const [bankSwift, setBankSwift] = useState("EMDVAEADXXX")

  const [footerBrands, setFooterBrands] = useState("HP • Apple • LG • Dell • Samsung • iFixit")

  useEffect(() => {
    setIssuedTo(order?.customerName || "")
    setLocation(order?.location || order?.address || "")
  }, [order])

  const normalizedRowsFromItems = useMemo(() => {
    const normalized: InvoiceItem[] = (items || []).map((i) => ({
      description: i.description || "",
      partNo: i.partNo || "",
      quantity: Number.isFinite(i.quantity as any) ? Number(i.quantity) : 0,
      total: Number.isFinite(i.total as any) ? Number(i.total) : 0,
    }))
    return normalized
  }, [items])

  useEffect(() => {
    if (manualRows) return
    setLocalRows(normalizedRowsFromItems)
  }, [manualRows, normalizedRowsFromItems])

  const rows = useMemo(() => {
    return manualRows ?? localRows
  }, [manualRows, localRows])

  const updateRow = (index: number, patch: Partial<InvoiceItem>) => {
    const next = rows.map((r, i) => (i === index ? { ...r, ...patch } : r))
    if (onManualRowsChange) onManualRowsChange(next)
    else setLocalRows(next)
  }

  const addRow = () => {
    const next = [
      ...rows,
      {
        description: "",
        partNo: "",
        quantity: 0,
        total: 0,
      },
    ]
    if (onManualRowsChange) onManualRowsChange(next)
    else if (!manualRows) setLocalRows(next)
  }

  const totals = useMemo(() => {
    const subtotal = rows.reduce((s, i) => s + Number(i.total || 0), 0)
    const afterDiscount = subtotal - Number(discount || 0)
    const vatAmount = vatEnabled ? afterDiscount * Number(vatRate || 0) : 0
    const finalTotal = afterDiscount + vatAmount
    return { subtotal, vatAmount, finalTotal }
  }, [rows, discount, vatEnabled, vatRate])

  const subtotalValue = subtotalOverride ?? localSubtotalOverride
  const totalValue = totalOverride ?? localTotalOverride

  const subtotalDisplay = subtotalValue?.trim()
    ? Number(subtotalValue)
    : totals.subtotal
  const totalDisplay = totalValue?.trim()
    ? Number(totalValue)
    : totals.finalTotal

  const dateValue = (() => {
    try {
      if (!invoiceDate) return ""
      if (typeof invoiceDate === "string") return invoiceDate.slice(0, 10)
      return new Date(invoiceDate).toISOString().slice(0, 10)
    } catch {
      return ""
    }
  })()

  const orderNoRaw = order?.orderId || order?.id || ""
  const orderNo =
    typeof orderNoRaw === "string" && orderNoRaw.trim()
      ? orderNoRaw.trim().startsWith("KBI")
        ? orderNoRaw.trim()
        : `KBI ${orderNoRaw.trim()}`
      : ""

  const template = (
    <div className="bg-white text-black w-full shadow-sm print:shadow-none" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
      <div className="bg-[#2fb6b3] text-white px-8 py-8 text-center" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
        {editable ? (
          <>
            <input
              value={companyLine1}
              onChange={(e) => setCompanyLine1(e.target.value)}
              className="w-full bg-transparent text-center text-4xl font-extrabold tracking-tight outline-none"
            />
            <input
              value={companyLine2}
              onChange={(e) => setCompanyLine2(e.target.value)}
              className="w-full bg-transparent text-center text-sm font-semibold tracking-wide outline-none"
            />
          </>
        ) : (
          <>
            <div className="text-4xl font-extrabold tracking-tight">{companyLine1}</div>
            <div className="text-sm font-semibold tracking-wide">{companyLine2}</div>
          </>
        )}
      </div>

      <div className="px-8 pt-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="text-xs leading-5 font-semibold">
            <div className="flex items-center gap-2">
              <span>TEL :</span>
              {editable ? (
                <input value={tel1} onChange={(e) => setTel1(e.target.value)} className="bg-transparent outline-none" />
              ) : (
                <span>{tel1}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span>TEL :</span>
              {editable ? (
                <input value={tel2} onChange={(e) => setTel2(e.target.value)} className="bg-transparent outline-none" />
              ) : (
                <span>{tel2}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span>P.O. BOX :</span>
              {editable ? (
                <input value={poBox} onChange={(e) => setPoBox(e.target.value)} className="bg-transparent outline-none" />
              ) : (
                <span>{poBox}</span>
              )}
            </div>
            <div>
              {editable ? (
                <input value={country} onChange={(e) => setCountry(e.target.value)} className="bg-transparent outline-none" />
              ) : (
                <span>{country}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span>EMIRATE :</span>
              {editable ? (
                <input value={emirate} onChange={(e) => setEmirate(e.target.value)} className="bg-transparent outline-none" />
              ) : (
                <span>{emirate}</span>
              )}
            </div>
            <div>EMAIL :</div>
            <div>
              {editable ? (
                <input value={email} onChange={(e) => setEmail(e.target.value)} className="bg-transparent outline-none" />
              ) : (
                <span>{email}</span>
              )}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[#2fb6b3] font-extrabold tracking-widest">INVOICE</div>
          </div>
          <div className="text-xs font-semibold">
            <div className="flex items-center justify-end gap-2">
              <span>ORDER NO :</span>
              <span className="min-w-[160px] inline-block border-b border-dashed border-black/50 text-right">
                {fill(orderNo)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-10 text-xs font-semibold">
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <span className="w-20">ISSUED TO :</span>
              {editable ? (
                <input
                  value={issuedTo}
                  onChange={(e) => setIssuedTo(e.target.value)}
                  className="flex-1 border-b border-dashed border-black/50 outline-none"
                />
              ) : (
                <span className="flex-1 border-b border-dashed border-black/50 inline-block">{fill(issuedTo)}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-20">LOCATION :</span>
              {editable ? (
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="flex-1 border-b border-dashed border-black/50 outline-none"
                />
              ) : (
                <span className="flex-1 border-b border-dashed border-black/50 inline-block">{fill(location)}</span>
              )}
              <span>,UAE</span>
            </div>
          </div>
          <div className="space-y-5">
            <div className="flex items-center justify-end gap-2">
              <span>INVOICE NO:</span>
              {editable ? (
                <input
                  value={invoiceNumber}
                  onChange={(e) => onInvoiceNumberChange?.(e.target.value)}
                  className="min-w-[180px] border-b border-dashed border-black/50 outline-none text-right"
                />
              ) : (
                <span className="min-w-[180px] inline-block border-b border-dashed border-black/50 text-right">
                  {fill(invoiceNumber, "_____________")}
                </span>
              )}
            </div>
            <div className="flex items-center justify-end gap-2">
              <span>DATE:</span>
              {editable ? (
                <input
                  type="date"
                  value={dateValue}
                  onChange={(e) => onInvoiceDateChange?.(e.target.value)}
                  className="min-w-[180px] border-b border-dashed border-black/50 outline-none text-right"
                />
              ) : (
                <span className="min-w-[180px] inline-block border-b border-dashed border-black/50 text-right">
                  {fill(dateValue, "____/___/____")}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 border border-[#2fb6b3]">
          <div className="grid grid-cols-12 bg-[#2fb6b3] text-white text-xs font-bold" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
            <div className="col-span-7 px-3 py-2 border-r border-white/60 text-center">DESCRIPTION</div>
            <div className="col-span-2 px-3 py-2 border-r border-white/60 text-center">PART NO.</div>
            <div className="col-span-1 px-3 py-2 border-r border-white/60 text-center">QTY</div>
            <div className="col-span-2 px-3 py-2 text-center">TOTAL</div>
          </div>
          {editable && (
            <div className="px-3 py-2 border-b border-[#2fb6b3] bg-white print:hidden">
              <button
                type="button"
                onClick={addRow}
                className="px-3 py-1.5 rounded bg-[#2fb6b3] text-white text-xs font-semibold hover:opacity-90"
              >
                Add line
              </button>
            </div>
          )}
          <div className="divide-y divide-[#2fb6b3]">
            {rows.map((r, idx) => (
              <div key={idx} className="grid grid-cols-12 text-xs min-h-[64px]">
                <div className="col-span-7 px-3 py-2 border-r border-[#2fb6b3]">
                  {editable ? (
                    <textarea
                      value={r.description}
                      onChange={(e) => updateRow(idx, { description: e.target.value })}
                      className="w-full outline-none bg-transparent resize-none overflow-hidden"
                      rows={3}
                      style={{ height: "auto" }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement
                        target.style.height = "auto"
                        target.style.height = `${target.scrollHeight}px`
                      }}
                    />
                  ) : (
                    <span className="block whitespace-pre-wrap">{r.description}</span>
                  )}
                </div>
                <div className="col-span-2 px-3 py-2 border-r border-[#2fb6b3] text-center">
                  {editable ? (
                    <input
                      value={r.partNo || ""}
                      onChange={(e) => updateRow(idx, { partNo: e.target.value })}
                      className="w-full outline-none bg-transparent text-center"
                    />
                  ) : (
                    <span>{r.partNo}</span>
                  )}
                </div>
                <div className="col-span-1 px-2 py-2 border-r border-[#2fb6b3] text-center">
                  {editable ? (
                    <input
                      inputMode="numeric"
                      value={r.quantity ? String(r.quantity) : ""}
                      onChange={(e) => {
                        const q = Number(e.target.value || 0)
                        updateRow(idx, { quantity: Number.isFinite(q) ? q : 0 })
                      }}
                      className="w-full outline-none bg-transparent text-center"
                    />
                  ) : (
                    <span>{r.quantity || ""}</span>
                  )}
                </div>
                <div className="col-span-2 px-3 py-2 text-right">
                  {editable ? (
                    <input
                      inputMode="decimal"
                      value={r.total ? String(r.total) : ""}
                      onChange={(e) => {
                        const v = Number(e.target.value || 0)
                        updateRow(idx, { total: Number.isFinite(v) ? v : 0 })
                      }}
                      className="w-full outline-none bg-transparent text-right"
                    />
                  ) : (
                    <span>{r.total ? Number(r.total).toFixed(2) : ""}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-12 bg-[#2fb6b3] text-white text-xs font-bold" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
            <div className="col-span-7 px-3 py-2 border-r border-white/60 flex items-center justify-between">
              <span>SUBTOTAL :</span>
              {editable ? (
                <input
                  inputMode="decimal"
                  value={subtotalValue ?? ""}
                  onChange={(e) => {
                    if (onSubtotalOverrideChange) onSubtotalOverrideChange(e.target.value)
                    else setLocalSubtotalOverride(e.target.value)
                  }}
                  className="w-28 bg-transparent text-right outline-none"
                />
              ) : (
                <span>{subtotalDisplay.toFixed(2)}</span>
              )}
            </div>
            <div className="col-span-5 px-3 py-2 flex items-center justify-between">
              <span>TOTAL:</span>
              {editable ? (
                <input
                  inputMode="decimal"
                  value={totalValue ?? ""}
                  onChange={(e) => {
                    if (onTotalOverrideChange) onTotalOverrideChange(e.target.value)
                    else setLocalTotalOverride(e.target.value)
                  }}
                  className="w-28 bg-transparent text-right outline-none"
                />
              ) : (
                <span>{totalDisplay.toFixed(2)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-12 gap-4 text-[10px]">
          <div className="col-span-4">
            <div className="font-bold mb-2 flex items-center gap-2">
              <span>RECEIVED BY:</span>
              {editable ? (
                <input value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} className="flex-1 border-b border-dashed border-black/50 outline-none" />
              ) : (
                <span className="flex-1 border-b border-dashed border-black/50 inline-block">{fill(receivedBy)}</span>
              )}
            </div>
            <div className="font-bold mb-2 flex items-center gap-2">
              <span>SIGNATURE:</span>
              {editable ? (
                <input value={receivedSignature} onChange={(e) => setReceivedSignature(e.target.value)} className="flex-1 border-b border-dashed border-black/50 outline-none" />
              ) : (
                <span className="flex-1 border-b border-dashed border-black/50 inline-block">{fill(receivedSignature)}</span>
              )}
            </div>
            <div className="font-bold mb-2 flex items-center gap-2">
              <span>PHONE NUM :</span>
              {editable ? (
                <input value={receivedPhone} onChange={(e) => setReceivedPhone(e.target.value)} className="flex-1 border-b border-dashed border-black/50 outline-none" />
              ) : (
                <span className="flex-1 border-b border-dashed border-black/50 inline-block">{fill(receivedPhone)}</span>
              )}
            </div>
            <div className="font-bold flex items-center gap-2">
              <span>DATE:</span>
              {editable ? (
                <input value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} className="flex-1 border-b border-dashed border-black/50 outline-none" />
              ) : (
                <span className="flex-1 border-b border-dashed border-black/50 inline-block">{fill(receivedDate)}</span>
              )}
            </div>
            <div className="mt-6 text-[10px] font-semibold">RECEIVED IN GOOD CONDITION</div>
          </div>
          <div className="col-span-4 text-center">
            <div className="font-extrabold mb-2">{termsTitle}</div>
            <div className="text-[10px] leading-4 text-black/80 whitespace-pre-line break-words px-2">{termsText}</div>
          </div>
          <div className="col-span-4 text-right">
            {editable ? (
              <>
                <input
                  value={bankTitle}
                  onChange={(e) => setBankTitle(e.target.value)}
                  className="w-full bg-transparent text-right font-extrabold mb-2 outline-none"
                />
                <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 items-center text-[10px] font-semibold">
                  <span className="whitespace-nowrap">ACCOUNT HOLDER:</span>
                  <input value={bankAccountHolder} onChange={(e) => setBankAccountHolder(e.target.value)} className="bg-transparent outline-none text-right w-full" />
                  <span className="whitespace-nowrap">IBAN:</span>
                  <input value={bankIban} onChange={(e) => setBankIban(e.target.value)} className="bg-transparent outline-none text-right w-full" />
                  <span className="whitespace-nowrap">ACCOUNT NUMBER:</span>
                  <input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} className="bg-transparent outline-none text-right w-full" />
                  <span className="whitespace-nowrap">CURRENCY:</span>
                  <input value={bankCurrency} onChange={(e) => setBankCurrency(e.target.value)} className="bg-transparent outline-none text-right w-full" />
                  <span className="whitespace-nowrap">SWIFT CODE:</span>
                  <input value={bankSwift} onChange={(e) => setBankSwift(e.target.value)} className="bg-transparent outline-none text-right w-full" />
                </div>
              </>
            ) : (
              <>
                <div className="font-extrabold mb-2">{bankTitle}</div>
                <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-[10px] font-semibold">
                  <span className="whitespace-nowrap">ACCOUNT HOLDER:</span>
                  <span className="text-right break-all">{bankAccountHolder}</span>
                  <span className="whitespace-nowrap">IBAN:</span>
                  <span className="text-right break-all">{bankIban}</span>
                  <span className="whitespace-nowrap">ACCOUNT NUMBER:</span>
                  <span className="text-right break-all">{bankAccountNumber}</span>
                  <span className="whitespace-nowrap">CURRENCY:</span>
                  <span className="text-right break-all">{bankCurrency}</span>
                  <span className="whitespace-nowrap">SWIFT CODE:</span>
                  <span className="text-right break-all">{bankSwift}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#2fb6b3] text-white px-8 py-3 text-center text-[10px] font-semibold" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
        {editable ? (
          <input
            value={footerBrands}
            onChange={(e) => setFooterBrands(e.target.value)}
            className="w-full bg-transparent text-center outline-none"
          />
        ) : (
          <span>{footerBrands}</span>
        )}
      </div>
    </div>
  )

  if (language === "both") {
    return (
      <div className="space-y-8">
        <div dir="ltr">{template}</div>
        <div dir="rtl">{template}</div>
      </div>
    )
  }

  if (language === "ar") {
    return <div dir="ltr">{template}</div>
  }

  return <div dir="ltr">{template}</div>
}
