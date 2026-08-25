"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
            <Search className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            {t("Track Order")}
          </h1>
          <p className="text-white/60 max-w-xl mx-auto">
            {t("Enter your tracking number to see the live status of your repair order.")}
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Search Form */}
          <GlassCard className="mb-8">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 ${isAr ? "right-4" : "left-4"}`} />
                <input
                  type="tel"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder={t("Enter registered phone number")}
                  className={`w-full py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500 transition-colors ${isAr ? "pr-12 pl-4 text-right placeholder:text-right" : "pl-12 pr-4 text-left"}`}
                  dir={isAr ? "rtl" : "ltr"}
                />
              </div>
              <Button
                type="submit"
                disabled={!inputVal || isSearching}
                className="rounded-xl px-8 min-w-[140px] bg-cyan-500 text-black hover:bg-cyan-400"
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

          <AnimatePresence mode="wait">
            {/* Not Found */}
            {notFound && (
              <motion.div
                key="notfound"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <GlassCard className="text-center">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{t("Order Not Found")}</h3>
                  <p className="text-white/60 mb-6">
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
              </motion.div>
            )}

            {/* Multiple Orders Found (Phone) */}
            {ordersList.length > 0 && (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold">{t("Found orders")} ({ordersList.length})</h3>
                  <p className="text-sm text-white/50">{t("Select an order to view details")}</p>
                </div>
                {ordersList.map((order) => (
                  (() => {
                    const step = resolveStatusStep(order.status)
                    const label = orderStatuses[step - 1]?.name || ""
                    return (
                  <GlassCard
                    key={order.orderId}
                    className="cursor-pointer hover:bg-white/10 transition-colors border-l-4 border-l-cyan-500"
                    onClick={() => selectOrder(order)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-cyan-400">{order.orderId}</p>
                        <p className="text-sm text-white/70">{order.device}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/40">{order.date || order.createdAt?.split('T')[0]}</p>
                        <p className="text-sm font-medium">{isAr ? t(label) : label}</p>
                      </div>
                    </div>
                  </GlassCard>
                    )
                  })()
                ))}
              </motion.div>
            )}

            {/* Single Order Found */}
            {orderData && (
              <motion.div
                key="found"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {(() => {
                  const step = resolveStatusStep(orderData.status)
                  const currentIndex = step - 1
                  const currentStatus = orderStatuses[currentIndex]

                  return (
                <GlassCard className="bg-gradient-to-br from-white/6 via-transparent to-cyan-500/10 ring-1 ring-white/10 shadow-[0_30px_90px_-55px_rgba(6,182,212,0.55)]">
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl" />
                    <div className="absolute -bottom-28 -left-24 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl" />
                    <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_0%,rgba(6,182,212,0.14),rgba(0,0,0,0)_62%)]" />
                  </div>
                  {/* Order Info */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-white/10">
                    <div>
                      <p className="text-sm text-white/50 mb-1">{t("Tracking Number")}</p>
                      <p className="text-xl font-mono font-bold text-cyan-400">{orderData.orderId}</p>
                    </div>
                    <div className="text-start sm:text-end">
                      <p className="text-sm text-white/50 mb-1">{t("Order Date")}</p>
                      <p className="font-medium">{orderData.date || orderData.createdAt?.split('T')[0]}</p>
                    </div>
                  </div>

                  {/* Device Info */}
                  <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
                    <div>
                      <p className="text-white/50 mb-1">{t("Device")}</p>
                      <p className="font-medium">{orderData.device}</p>
                    </div>
                    <div>
                      <p className="text-white/50 mb-1">{t("Issue")}</p>
                      <p className="font-medium">{orderData.issue}</p>
                    </div>
                    <div>
                      <p className="text-white/50 mb-1">{t("Technician")}</p>
                      <p className="font-medium text-cyan-200">{orderData.technicianName || "---"}</p>
                    </div>
                    <div>
                      <p className="text-white/50 mb-1">{t("Est. Completion")}</p>
                      <p className="font-medium">{orderData.estimatedCompletion || "---"}</p>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between gap-4 mb-6">
                      <h3 className="text-lg font-semibold">{t("Order Status")}</h3>
                      {currentStatus?.name ? (
                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                          {isAr ? t(currentStatus.name) : currentStatus.name}
                        </div>
                      ) : null}
                    </div>
                    <div className="relative">
                      <div className={`absolute top-0 bottom-0 w-px ${isAr ? "right-[23px]" : "left-[23px]"} bg-gradient-to-b from-cyan-500/35 via-white/10 to-white/5`} />

                      <div className="space-y-4">
                        {orderStatuses.map((status, index) => {
                          const isCompleted = index < currentIndex
                          const isCurrent = index === currentIndex
                          const isPending = index > currentIndex

                          return (
                            <motion.div
                              key={status.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className={`flex items-start gap-4 relative ${isPending ? "opacity-40" : ""}`}
                            >
                              <div
                                className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isCompleted
                                  ? "bg-cyan-500 text-black shadow-[0_18px_40px_-20px_rgba(6,182,212,0.75)]"
                                  : isCurrent
                                    ? "bg-cyan-500/15 border border-cyan-500/60 text-cyan-200 shadow-[0_18px_40px_-22px_rgba(6,182,212,0.6)]"
                                    : "bg-white/5 border border-white/20 text-white/30"
                                  }`}
                              >
                                {isCurrent ? (
                                  <span className="pointer-events-none absolute -inset-2 rounded-full bg-cyan-500/15 blur-md" />
                                ) : null}
                                {statusIcons[index]}
                              </div>
                              <div className="pt-2">
                                <p
                                  className={`font-semibold ${isCurrent ? "text-cyan-200" : isCompleted ? "text-white" : "text-white/50"}`}
                                >
                                  {isAr ? t(status.name) : status.name}
                                </p>
                                <p className="text-sm text-white/50">{isAr ? t(status.description) : status.description}</p>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Contact Options */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href="https://wa.me/971502491034"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      {t("Chat on WhatsApp")}
                    </a>
                    <a
                      href="tel:+971502491034"
                      className="flex-1 flex items-center justify-center gap-2 py-3 glass rounded-full font-semibold hover:bg-white/10 transition-colors"
                    >
                      <Phone className="w-5 h-5" />
                      {t("Call Support")}
                    </a>
                  </div>
                </GlassCard>
                  )
                })()}

                {ordersList.length > 0 && (
                  <button
                    onClick={() => { setOrderData(null) }}
                    className="mt-6 mx-auto block text-white/50 hover:text-white underline text-sm"
                  >
                    {t("Back to list")}
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
