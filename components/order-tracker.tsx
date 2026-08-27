"use client"

import type React from "react"

import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { orderStatuses } from "@/lib/data"
import {
  Package,
  Search,
  UserCheck,
  Truck,
  Stethoscope,
  Wrench,
  ClipboardCheck,
  CheckCircle2,
  Phone,
  MessageCircle,
  AlertCircle
} from "lucide-react"

import { useLanguage, useT } from "@/components/language-provider"

function normalizeStatus(val: string) {
  return val.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim()
}

function resolveStatusStep(status: unknown) {
  const max = orderStatuses.length
  if (typeof status === "number" && Number.isFinite(status)) {
    const n = Math.round(status)
    if (n < 1) return 1
    if (n > max) return max
    return n
  }

  if (typeof status !== "string") return 1

  const s = normalizeStatus(status)
  if (!s) return 1
  if (s.includes("completed") || s.includes("delivered")) return max

  const exact = orderStatuses.findIndex((st) => normalizeStatus(st.name) === s)
  if (exact >= 0) return exact + 1

  const loose = orderStatuses.findIndex((st) => {
    const n = normalizeStatus(st.name)
    return s.includes(n) || n.includes(s)
  })
  if (loose >= 0) return loose + 1

  return 1
}
const statusIcons = [
  <Package key={0} className="w-6 h-6" />,
  <UserCheck key={1} className="w-6 h-6" />,
  <Truck key={2} className="w-6 h-6" />,
  <Stethoscope key={3} className="w-6 h-6" />,
  <Wrench key={4} className="w-6 h-6" />,
  <ClipboardCheck key={5} className="w-6 h-6" />,
  <CheckCircle2 key={6} className="w-6 h-6" />,
]

export function OrderTracker() {
  const { lang } = useLanguage()
  const isAr = lang === "ar"
  const t = useT()

  const [inputVal, setInputVal] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [orderData, setOrderData] = useState<any | null>(null)
  const [ordersList, setOrdersList] = useState<any[]>([])
  const [notFound, setNotFound] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputVal.trim()) return

    setIsSearching(true)
    setNotFound(false)
    setErrorMessage("")
    setOrderData(null)
    setOrdersList([])

    try {
      try {
        const res = await fetch(`/api/track?phone=${encodeURIComponent(inputVal.trim())}`)
        const data = await res.json()

        if (data.error) {
          setErrorMessage(data.error)
          // If "No match", show not found UI
          if (data.error.includes("No match")) {
            setNotFound(true)
          } else {
            setNotFound(true) // Show error in text
          }
        } else if (data.results && data.results.length > 0) {
          if (data.results.length === 1) {
            setOrderData(data.results[0])
          } else {
            setOrdersList(data.results)
          }
        } else {
          setNotFound(true)
        }

      } catch (fetchError: any) {
        setErrorMessage(`Network Error: ${fetchError.message}`)
        setNotFound(true)
      }
    } catch (e: any) {
      setErrorMessage(`System Error: ${e.message || "Unknown error"}`)
      setNotFound(true)
    } finally {
      setIsSearching(false)
    }
  }

  const selectOrder = (order: any) => {
    setOrderData(order)
    setOrdersList([])
  }

  return (
    <section className="relative pt-32 pb-16 min-h-screen">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-cyan-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500/10 mb-6 border border-cyan-500/20">
            <Search className="w-8 h-8 text-cyan-500 dark:text-cyan-400" />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 text-foreground">
            {t("Track Order")}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t("Enter your tracking number to see the live status of your repair order.")}
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Search Form */}
          <GlassCard className="mb-8">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground ${isAr ? "right-4" : "left-4"}`} />
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder={t("Enter order ID or phone number")}
                  className={`w-full py-4 bg-background border border-input rounded-xl focus:outline-none focus:border-cyan-500 transition-colors text-foreground text-base shadow-xs placeholder:text-muted-foreground/60 ${isAr ? "pr-12 pl-4 text-right placeholder:text-right" : "pl-12 pr-4 text-left"}`}
                  dir={isAr ? "rtl" : "ltr"}
                />
              </div>
              <Button
                type="submit"
                disabled={!inputVal || isSearching}
                className="rounded-xl px-8 min-w-[140px] bg-cyan-500 text-black hover:bg-cyan-400 font-bold shadow-md cursor-pointer"
              >
                {isSearching ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>{t("Searching...")}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {/* Icon placement based on locale: LTR = Icon Left (mr-2), RTL = Icon Right (ml-2) */}
                    <Search className={`w-5 h-5 ${isAr ? "ml-2" : "mr-2"}`} />
                    <span>{t("Track Order")}</span>
                  </div>
                )}
              </Button>
            </form>
          </GlassCard>

          <>
            {/* Not Found */}
            {notFound && (
              <div>
                <GlassCard className="text-center">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">{t("Order Not Found")}</h3>
                  <p className="text-muted-foreground mb-6">
                    {errorMessage || (isAr ? `لم نعثر على أي طلب مطابق لـ "${inputVal}".` : `We couldn't find any order matching "${inputVal}".`)}
                  </p>
                  <Button asChild variant="secondary">
                    <a
                      href="https://wa.me/971502491034"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      {t("Contact Support")}
                    </a>
                  </Button>
                </GlassCard>
              </div>
            )}

            {/* Multiple Orders Found (Phone) */}
            {ordersList.length > 0 && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold">{t("Found orders")} ({ordersList.length})</h3>
                  <p className="text-sm text-muted-foreground">{t("Select an order to view details")}</p>
                </div>
                {ordersList.map((order) => (
                  (() => {
                    const step = resolveStatusStep(order.status)
                    const label = orderStatuses[step - 1]?.name || ""
                    return (
                  <GlassCard
                    key={order.orderId}
                    className="cursor-pointer hover:bg-muted/70 transition-colors border-l-4 border-l-cyan-500"
                    onClick={() => selectOrder(order)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-cyan-600 dark:text-cyan-400">{order.orderId}</p>
                        <p className="text-sm text-muted-foreground">{order.device}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground/80">{order.date || order.createdAt?.split('T')[0]}</p>
                        <p className="text-sm font-medium">{isAr ? t(label) : label}</p>
                      </div>
                    </div>
                  </GlassCard>
                    )
                  })()
                ))}
              </div>
            )}

            {/* Single Order Found */}
            {orderData && (
              <div className="space-y-6">
                {(() => {
                  const step = resolveStatusStep(orderData.status)
                  const currentIndex = step - 1
                  const currentStatus = orderStatuses[currentIndex]
                  const formattedDate = orderData.date || (orderData.createdAt ? new Date(orderData.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "")

                  return (
                    <div className="relative overflow-hidden rounded-3xl border border-white/15 dark:border-white/10 bg-card/90 backdrop-blur-2xl shadow-2xl p-6 sm:p-8">
                      {/* Ambient background glow */}
                      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-cyan-500/15 blur-3xl" />
                        <div className="absolute -bottom-28 -left-24 w-80 h-80 rounded-full bg-blue-500/15 blur-3xl" />
                      </div>

                      {/* Header Badge & Order Number */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-border/70">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("Tracking Number")}</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                              LIVE
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <h2 className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-600 dark:text-cyan-400 tracking-tight">
                              {orderData.orderId}
                            </h2>
                            <button
                              onClick={() => {
                                if (navigator.clipboard) {
                                  navigator.clipboard.writeText(orderData.orderId)
                                }
                              }}
                              className="p-1.5 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-90"
                              title={t("Copy order ID")}
                              aria-label={t("Copy order ID")}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                            </button>
                          </div>
                        </div>

                        <div className="text-start sm:text-end space-y-1">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("Order Date")}</span>
                          <p className="text-sm sm:text-base font-semibold text-foreground">{formattedDate || "---"}</p>
                        </div>
                      </div>

                      {/* Device & Service Information Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-6">
                        <div className="p-4 rounded-2xl bg-muted/40 dark:bg-white/5 border border-border/60 hover:border-cyan-500/30 transition-colors">
                          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">{t("Device")}</span>
                          <p className="text-base font-bold text-foreground truncate">{orderData.device || "---"}</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-muted/40 dark:bg-white/5 border border-border/60 hover:border-cyan-500/30 transition-colors">
                          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">{t("Issue")}</span>
                          <p className="text-sm font-semibold text-foreground line-clamp-2">{orderData.issue || "General Service"}</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-muted/40 dark:bg-white/5 border border-border/60 hover:border-cyan-500/30 transition-colors">
                          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">{t("Technician")}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-xs font-bold">
                              {orderData.technicianName ? orderData.technicianName.charAt(0).toUpperCase() : "T"}
                            </div>
                            <p className="text-sm font-bold text-cyan-700 dark:text-cyan-300">
                              {orderData.technicianName || t("Assigning Specialist...")}
                            </p>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-muted/40 dark:bg-white/5 border border-border/60 hover:border-cyan-500/30 transition-colors">
                          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">{t("Est. Completion")}</span>
                          <p className="text-sm font-semibold text-foreground">{orderData.estimatedCompletion || t("Same-day Service")}</p>
                        </div>
                      </div>

                      {/* Status Timeline Card */}
                      <div className="p-5 sm:p-6 rounded-2xl bg-muted/30 dark:bg-black/40 border border-border/70 my-6">
                        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-border/60">
                          <h3 className="text-base font-bold text-foreground">{t("Order Status")}</h3>
                          {currentStatus?.name ? (
                            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/15 px-3.5 py-1 text-xs font-bold text-cyan-700 dark:text-cyan-200 shadow-xs">
                              <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
                              {isAr ? t(currentStatus.name) : currentStatus.name}
                            </div>
                          ) : null}
                        </div>

                        <div className="relative">
                          {/* Vertical Track Line */}
                          <div
                            className={`absolute top-3 bottom-3 w-0.5 ${isAr ? "right-[21px]" : "left-[21px]"} bg-gradient-to-b from-cyan-500 via-cyan-500/40 to-border/50`}
                          />

                          <div className="space-y-4">
                            {orderStatuses.map((status, index) => {
                              const isCompleted = index < currentIndex
                              const isCurrent = index === currentIndex
                              const isPending = index > currentIndex

                              return (
                                <div
                                  key={status.id}
                                  className={`flex items-start gap-4 relative transition-all duration-300 ${
                                    isPending ? "opacity-35 grayscale" : "opacity-100"
                                  }`}
                                >
                                  <div
                                    className={`relative z-10 w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                                      isCompleted
                                        ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                                        : isCurrent
                                        ? "bg-cyan-500 text-black font-bold ring-4 ring-cyan-500/25 shadow-lg shadow-cyan-500/30 scale-105"
                                        : "bg-background border border-border text-muted-foreground"
                                    }`}
                                  >
                                    {isCompleted ? (
                                      <CheckCircle2 className="w-5 h-5" />
                                    ) : (
                                      statusIcons[index]
                                    )}
                                  </div>

                                  <div className="pt-1.5 min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <p
                                        className={`text-sm font-bold truncate ${
                                          isCurrent
                                            ? "text-cyan-600 dark:text-cyan-300 font-extrabold"
                                            : isCompleted
                                            ? "text-foreground font-semibold"
                                            : "text-muted-foreground"
                                        }`}
                                      >
                                        {isAr ? t(status.name) : status.name}
                                      </p>
                                      {isCurrent && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                                          Current
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                      {isAr ? t(status.description) : status.description}
                                    </p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Contact Quick Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <a
                          href={`https://wa.me/971502491034?text=${encodeURIComponent(`Hello, I'm checking on my order ${orderData.orderId}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-emerald-500/25 active:scale-[0.98] transition-all"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span suppressHydrationWarning>{t("Chat on WhatsApp")}</span>
                        </a>
                        <a
                          href="tel:+971502491034"
                          className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-muted hover:bg-accent border border-border text-foreground rounded-2xl font-bold text-sm shadow-xs hover:border-border active:scale-[0.98] transition-all"
                        >
                          <Phone className="w-4 h-4" />
                          <span suppressHydrationWarning>{t("Call Support")}</span>
                        </a>
                      </div>
                    </div>
                  )
                })()}

                {ordersList.length > 0 && (
                  <button
                    onClick={() => { setOrderData(null) }}
                    className="mt-6 mx-auto block text-muted-foreground hover:text-foreground underline text-sm font-semibold"
                  >
                    {t("Back to list")}
                  </button>
                )}
              </div>
            )}
          </>
        </div>
      </div>
    </section>
  )
}
