"use client"

import type React from "react"
import { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLanguage, useT } from "@/components/language-provider"
import { useToast } from "@/hooks/use-toast"
import { createBookingAction } from "@/app/actions/booking"
import { reverseGeocode } from "@/app/actions/geocode"
import { useSiteContact } from "@/components/contact-provider"
import { detectEmirateFromGPS, UAE_EMIRATES } from "@/lib/locations"
import {
  Smartphone,
  Laptop,
  PcCase,
  Printer,
  Tv,
  Monitor,
  Gamepad2,
  Cctv,
  Wrench,
  Check,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Phone,
  User,
  Mail,
  MessageSquare,
  MessageCircle,
  CheckCircle2,
  Copy,
  Loader2,
  Navigation,
  Sparkles,
  Zap,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  ShieldCheck,
  HelpCircle,
  Clock,
  ArrowRight,
  QrCode,
  Flame,
} from "lucide-react"

export interface BookingState {
  deviceId: string
  deviceName: string
  problem: string
  brand: string
  model: string
  emirateId: string
  emirateName: string
  area: string
  latitude: number | null
  longitude: number | null
  appointmentDay: "today" | "tomorrow" | "custom"
  customDate: string
  timeSlot: string
  customerName: string
  phone: string
  email: string
  notes: string
}

const DEVICE_CONFIGS = [
  {
    id: "mobile",
    name: "Mobile Phone",
    nameAr: "هاتف ذكي",
    icon: Smartphone,
    popular: true,
    quickBrands: ["Apple", "Samsung", "Huawei", "Xiaomi"],
    issues: [
      "Screen",
      "Battery",
      "Charging Port",
      "Camera",
      "Speaker / Microphone",
      "Software",
      "Water Damage",
      "Other",
      "Not Sure",
    ],
  },
  {
    id: "laptop",
    name: "Laptop",
    nameAr: "كمبيوتر محمول",
    icon: Laptop,
    popular: true,
    quickBrands: ["Apple", "Dell", "HP", "Lenovo", "ASUS"],
    issues: [
      "Screen",
      "Keyboard",
      "Battery",
      "Charging",
      "Overheating",
      "Windows / Software",
      "Ports",
      "Other",
      "Not Sure",
    ],
  },
  {
    id: "pc",
    name: "PC / Desktop",
    nameAr: "كمبيوتر مكتبي",
    icon: PcCase,
    quickBrands: ["Custom Gaming", "HP", "Dell", "Lenovo"],
    issues: [
      "Won't Turn On",
      "Slow Performance",
      "Overheating",
      "Windows / Software",
      "Hardware Upgrade",
      "Ports",
      "Other",
      "Not Sure",
    ],
  },
  {
    id: "printer",
    name: "Printer",
    nameAr: "طابعة",
    icon: Printer,
    quickBrands: ["HP", "Canon", "Epson", "Brother"],
    issues: [
      "Not Printing",
      "Paper Jam",
      "Ink / Toner",
      "Connection Problem",
      "Poor Print Quality",
      "Maintenance",
      "Other",
      "Not Sure",
    ],
  },
  {
    id: "tv",
    name: "TV",
    nameAr: "تلفاز",
    icon: Tv,
    quickBrands: ["Samsung", "LG", "Sony", "TCL"],
    issues: [
      "No Display",
      "No Power",
      "Sound Problem",
      "HDMI Problem",
      "Screen Issue",
      "Installation",
      "Other",
      "Not Sure",
    ],
  },
  {
    id: "monitor",
    name: "Monitor",
    nameAr: "شاشة عرض",
    icon: Monitor,
    quickBrands: ["Dell", "Samsung", "LG", "BenQ"],
    issues: [
      "No Display",
      "No Power",
      "Screen Issue",
      "Display Issues",
      "Cables / Ports",
      "Other",
      "Not Sure",
    ],
  },
  {
    id: "gaming",
    name: "PlayStation / Xbox",
    nameAr: "أجهزة ألعاب",
    icon: Gamepad2,
    quickBrands: ["Sony PS5", "Sony PS4", "Xbox Series X", "Nintendo Switch"],
    issues: [
      "HDMI Port",
      "Overheating",
      "No Power",
      "Controller",
      "Software",
      "Other",
      "Not Sure",
    ],
  },
  {
    id: "cctv",
    name: "CCTV",
    nameAr: "كاميرات مراقبة",
    icon: Cctv,
    quickBrands: ["Hikvision", "Dahua", "Ezviz", "Imou"],
    issues: [
      "Installation",
      "Camera Not Working",
      "No Recording",
      "Remote Access",
      "Network Issue",
      "Maintenance",
      "Other",
      "Not Sure",
    ],
  },
  {
    id: "other",
    name: "Other",
    nameAr: "أجهزة أخرى",
    icon: Wrench,
    quickBrands: ["Smart Home", "Sound System", "Server", "UPS"],
    issues: [
      "Won't Turn On",
      "Power Issue",
      "Hardware Issue",
      "Maintenance",
      "Other",
      "Not Sure",
    ],
  },
]

const TIME_SLOTS = [
  { id: "slot1", label: "9 AM – 12 PM", period: "Morning", periodAr: "صباحاً", icon: Sunrise, tag: "Early Arrival" },
  { id: "slot2", label: "12 PM – 3 PM", period: "Afternoon", periodAr: "ظهراً", icon: Sun, tag: "Most Popular" },
  { id: "slot3", label: "3 PM – 6 PM", period: "Late Afternoon", periodAr: "عصراً", icon: Sunset, tag: "Fast Track" },
  { id: "slot4", label: "6 PM – 9 PM", period: "Evening", periodAr: "مساءً", icon: Moon, tag: "After Work" },
]

function getFormattedDate(offsetDays: number = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().split("T")[0]
}

export function BookingForm() {
  const { lang } = useLanguage()
  const isAr = lang === "ar"
  const t = useT()
  const searchParams = useSearchParams()
  const contact = useSiteContact()
  const { toast } = useToast()

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [isPending, startTransition] = useTransition()
  const [isLocating, setIsLocating] = useState(false)
  const [showModelDetails, setShowModelDetails] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Booking Data State
  const [state, setState] = useState<BookingState>({
    deviceId: "",
    deviceName: "",
    problem: "",
    brand: "",
    model: "",
    emirateId: "dubai",
    emirateName: "Dubai",
    area: "",
    latitude: null,
    longitude: null,
    appointmentDay: "today",
    customDate: getFormattedDate(2),
    timeSlot: "12 PM – 3 PM",
    customerName: "",
    phone: "",
    email: "",
    notes: "",
  })

  // Pre-select device from query parameters
  useEffect(() => {
    const devParam = searchParams.get("device")?.toLowerCase() || ""
    if (devParam) {
      let matchedId = ""
      if (devParam.includes("mobile") || devParam.includes("phone")) matchedId = "mobile"
      else if (devParam.includes("laptop") || devParam.includes("macbook")) matchedId = "laptop"
      else if (devParam.includes("pc") || devParam.includes("desktop")) matchedId = "pc"
      else if (devParam.includes("print")) matchedId = "printer"
      else if (devParam.includes("tv")) matchedId = "tv"
      else if (devParam.includes("monitor") || devParam.includes("screen")) matchedId = "monitor"
      else if (devParam.includes("game") || devParam.includes("playstation") || devParam.includes("xbox")) matchedId = "gaming"
      else if (devParam.includes("cctv") || devParam.includes("cam")) matchedId = "cctv"
      else if (devParam.includes("other")) matchedId = "other"

      if (matchedId) {
        const found = DEVICE_CONFIGS.find((d) => d.id === matchedId)
        if (found) {
          setState((prev) => ({
            ...prev,
            deviceId: found.id,
            deviceName: found.name,
          }))
        }
      }
    }
  }, [searchParams])

  // Analytics helper
  const trackEvent = (name: string, params?: Record<string, any>) => {
    if (typeof window !== "undefined") {
      if ((window as any).gtag) {
        ;(window as any).gtag("event", name, params)
      }
      if ((window as any).fbq) {
        ;(window as any).fbq("trackCustom", name, params)
      }
    }
  }

  // Handle GPS location click
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: isAr ? "غير مدعوم" : "Not Supported",
        description: isAr ? "متصفحك لا يدعم تحديد الموقع الجغرافي." : "Your browser does not support geolocation.",
      })
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const detectedEmirate = detectEmirateFromGPS(latitude, longitude)
          const geoRes = await reverseGeocode(latitude, longitude)
          const detectedArea = (geoRes && "address" in geoRes && typeof geoRes.address === "string") ? geoRes.address : ""

          setState((prev) => ({
            ...prev,
            latitude,
            longitude,
            emirateId: detectedEmirate?.id || prev.emirateId,
            emirateName: detectedEmirate?.nameEn || prev.emirateName,
            area: detectedArea || prev.area,
          }))

          toast({
            title: isAr ? "تم تحديد موقعك بدقة 🎯" : "Location Pinpointed 🎯",
            description: `${detectedEmirate?.nameEn || "UAE"} - ${detectedArea || "Current Location"}`,
          })
        } catch {
          setState((prev) => ({ ...prev, latitude, longitude }))
        } finally {
          setIsLocating(false)
        }
      },
      () => {
        setIsLocating(false)
        toast({
          variant: "destructive",
          title: isAr ? "تعذر تحديد الموقع" : "Location Unavailable",
          description: isAr ? "يرجى كتابة اسم المنطقة يدوياً." : "Please enter your area manually.",
        })
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  // Selected device object
  const selectedDeviceConfig = DEVICE_CONFIGS.find((d) => d.id === state.deviceId)

  // Validation
  const isStep1Valid = Boolean(state.deviceId && state.problem)
  const isStep2Valid = Boolean(state.emirateId && (state.area.trim().length >= 2 || state.latitude !== null))
  const isStep3Valid = Boolean(state.customerName.trim().length >= 2 && state.phone.replace(/\D/g, "").length >= 7)

  // Step navigation
  const handleNextStep = () => {
    setSubmitError(null)
    if (step === 1 && isStep1Valid) {
      trackEvent("device_and_problem_selected", { device: state.deviceName, problem: state.problem })
      setStep(2)
      window.scrollTo({ top: 80, behavior: "smooth" })
    } else if (step === 2 && isStep2Valid) {
      trackEvent("location_and_appointment_selected", {
        emirate: state.emirateName,
        slot: state.timeSlot,
      })
      setStep(3)
      window.scrollTo({ top: 80, behavior: "smooth" })
    }
  }

  const handlePrevStep = () => {
    setSubmitError(null)
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3)
      window.scrollTo({ top: 80, behavior: "smooth" })
    }
  }

  // Final Submit
  const handleConfirmBooking = async () => {
    if (!isStep3Valid || isPending) return
    setSubmitError(null)

    startTransition(async () => {
      try {
        trackEvent("booking_submitted")

        // Normalize phone
        const cleanDigits = state.phone.replace(/\D/g, "")
        let formattedPhone = state.phone.trim()
        if (!formattedPhone.startsWith("+")) {
          if (cleanDigits.startsWith("971")) {
            formattedPhone = `+${cleanDigits}`
          } else if (cleanDigits.startsWith("0")) {
            formattedPhone = `+971${cleanDigits.substring(1)}`
          } else {
            formattedPhone = `+971${cleanDigits}`
          }
        }

        // Computed preferred date
        let chosenDate = getFormattedDate(0)
        if (state.appointmentDay === "tomorrow") {
          chosenDate = getFormattedDate(1)
        } else if (state.appointmentDay === "custom" && state.customDate) {
          chosenDate = state.customDate
        }

        const emirateItem = UAE_EMIRATES.find((e) => e.id === state.emirateId)
        const emirateName = emirateItem?.nameEn || state.emirateName || "Dubai"
        const areaName = state.area.trim() || "Doorstep Area"

        const formDataPayload = {
          name: state.customerName.trim(),
          phone: formattedPhone,
          whatsapp: formattedPhone,
          email: state.email.trim() || "",
          emirateId: state.emirateId,
          emirateName,
          areaId: "",
          areaName,
          address: `${areaName}, ${emirateName}`,
          locationLat: state.latitude,
          locationLng: state.longitude,
          locationType: "home" as const,
          companyName: "",
          unitNumber: "",
          notes: state.notes.trim() || "",
          preferredDate: chosenDate,
          preferredTime: state.timeSlot,
          privacyConsent: true,
        }

        const deviceEntryPayload = [
          {
            id: `dev-${Date.now()}`,
            deviceId: state.deviceId,
            deviceName: state.deviceName || "Device",
            brandId: state.brand.trim() ? state.brand.toLowerCase() : "other",
            brandName: state.brand.trim() || "Standard",
            model: state.model.trim() || "Standard / Unspecified",
            issues: [state.problem || "Inspection"],
          },
        ]

        const res = await createBookingAction(formDataPayload, deviceEntryPayload)

        if (res.error) {
          setSubmitError(
            isAr
              ? "تعذر إرسال طلب الحجز. يرجى المحاولة مرة أخرى أو التواصل معنا عبر واتساب."
              : "We couldn't submit your booking. Please try again or contact us on WhatsApp.",
          )
          trackEvent("booking_failed", { error: res.error })
          return
        }

        const confirmedId = res.primaryOrderId || res.orderIds?.[0] || `KBI-${Date.now().toString().slice(-6)}`
        setConfirmedOrderId(confirmedId)
        setStep(4)
        trackEvent("booking_completed", { orderId: confirmedId })
        trackEvent("Lead", { currency: "AED", value: 1 })
        window.scrollTo({ top: 60, behavior: "smooth" })
      } catch (err) {
        setSubmitError(
          isAr
            ? "تعذر إرسال طلب الحجز. يرجى المحاولة مرة أخرى أو التواصل معنا عبر واتساب."
            : "We couldn't submit your booking. Please try again or contact us on WhatsApp.",
        )
        trackEvent("booking_failed", { error: String(err) })
      }
    })
  }

  // Copy order ID
  const handleCopyOrderId = () => {
    if (confirmedOrderId) {
      navigator.clipboard.writeText(confirmedOrderId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="relative pt-24 sm:pt-28 pb-24 min-h-screen overflow-hidden">
      {/* APPLE LIQUID GLASS AMBIENCE MESH */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={cn(
            "absolute top-[-18%] left-[-15%] w-[60vw] h-[60vw] rounded-full blur-[160px] transition-all duration-1000",
            step === 1 ? "bg-cyan-500/20" : step === 2 ? "bg-teal-400/20" : "bg-blue-600/20"
          )}
        />
        <div
          className={cn(
            "absolute bottom-[-15%] right-[-15%] w-[50vw] h-[50vw] rounded-full blur-[160px] transition-all duration-1000",
            step === 1 ? "bg-blue-600/20" : step === 2 ? "bg-emerald-500/20" : "bg-cyan-500/20"
          )}
        />
        <div className="absolute top-[35%] left-[20%] w-[35vw] h-[35vw] bg-indigo-500/10 rounded-full blur-[180px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.035]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* LIQUID GLASS HERO */}
        {step !== 4 ? (
          <div className="max-w-2xl mx-auto text-center mb-6 sm:mb-8">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-card/60 border border-white/10 dark:border-cyan-500/25 mb-3.5 backdrop-blur-2xl shadow-xl shadow-cyan-500/5 ring-1 ring-white/10"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                {t("SERVING THE ENTIRE UAE")}
              </span>
              <span className="text-muted-foreground/30 font-light">|</span>
              <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>{isAr ? "صيانة فورية في موقعك" : "Instant On-Site Service"}</span>
              </span>
            </motion.div>

            <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
              {t("Book a Technician")}
            </h1>
            <p className="text-xs sm:text-base text-muted-foreground mt-1.5 max-w-md mx-auto leading-relaxed">
              {t("Professional on-site device repair at your home or office across the UAE.")}
            </p>
          </div>
        ) : null}

        {/* LIQUID GLASS SEGMENTED TRACKER */}
        {step !== 4 ? (
          <div className="max-w-xl mx-auto mb-6 sm:mb-8">
            <div className="relative p-1.5 rounded-2xl bg-card/70 backdrop-blur-2xl border border-white/10 dark:border-white/5 shadow-2xl shadow-cyan-500/5">
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { num: 1, label: t("Device"), labelAr: "الجهاز", icon: Smartphone },
                  { num: 2, label: t("Location"), labelAr: "الموقع", icon: MapPin },
                  { num: 3, label: t("Details"), labelAr: "البيانات", icon: User },
                ].map((st) => {
                  const Icon = st.icon
                  const isActive = step === st.num
                  const isDone = step > st.num
                  return (
                    <button
                      key={st.num}
                      type="button"
                      onClick={() => {
                        if (isDone) setStep(st.num as 1 | 2 | 3)
                      }}
                      className={cn(
                        "relative flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all duration-300 text-xs font-bold select-none overflow-hidden",
                        isActive
                          ? "bg-gradient-to-r from-cyan-500/25 via-blue-500/20 to-teal-500/25 text-cyan-400 border border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                          : isDone
                            ? "text-foreground hover:bg-muted/40 cursor-pointer"
                            : "text-muted-foreground/50",
                      )}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all shrink-0",
                          isActive
                            ? "bg-cyan-400 text-black shadow-md shadow-cyan-400/60 ring-2 ring-cyan-400/40"
                            : isDone
                              ? "bg-emerald-400 text-black shadow-sm"
                              : "bg-muted/80 text-muted-foreground",
                        )}
                      >
                        {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : st.num}
                      </div>
                      <span className="truncate">{isAr ? st.labelAr : st.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Liquid Progress Glow Beam */}
              <div className="mt-1.5 h-1 bg-muted/40 rounded-full overflow-hidden relative">
                <motion.div
                  className="absolute inset-y-0 bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.8)]"
                  initial={{ width: "33%" }}
                  animate={{
                    width: step === 1 ? "33%" : step === 2 ? "66%" : "100%",
                  }}
                  transition={{ type: "spring", stiffness: 220, damping: 25 }}
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* MAIN LIQUID GLASS CONTAINER */}
        <div className="max-w-2xl mx-auto">
          <div className="relative rounded-[36px] border border-white/15 dark:border-white/10 bg-card/80 backdrop-blur-3xl p-5 sm:p-9 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/10 before:to-transparent before:pointer-events-none">
            {/* Top Liquid Flare */}
            <div className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-4/5 h-28 bg-cyan-400/25 rounded-full blur-3xl" />

            <AnimatePresence mode="wait">
              {/* =========================================================================
                  STEP 1: DEVICE & PROBLEM (Apple Liquid 3D Tiles)
              ========================================================================= */}
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                        {t("What needs repair?")}
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        {isAr ? "حدد نوع الجهاز وسنرسل لك الفني المعتمد والمجهز" : "Select your device to begin on-site service"}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/25 hidden sm:inline-block shadow-sm">
                      {isAr ? "الخطوة 1 من 3" : "Step 1 of 3"}
                    </span>
                  </div>

                  {/* Liquid 3D Device Tiles */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {DEVICE_CONFIGS.map((dev) => {
                      const Icon = dev.icon
                      const isSelected = state.deviceId === dev.id
                      return (
                        <motion.button
                          key={dev.id}
                          type="button"
                          whileHover={{ scale: 1.03, y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            setState((prev) => ({
                              ...prev,
                              deviceId: dev.id,
                              deviceName: dev.name,
                              problem: "", // fresh selection
                            }))
                          }}
                          className={cn(
                            "relative group flex flex-col items-start justify-between p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer min-h-[88px] sm:min-h-[98px] overflow-hidden backdrop-blur-xl",
                            isSelected
                              ? "border-cyan-400 bg-gradient-to-br from-cyan-500/20 via-blue-500/15 to-transparent shadow-[0_0_30px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/60 text-foreground"
                              : "border-white/10 bg-card/60 hover:bg-muted/50 text-muted-foreground hover:text-foreground hover:border-cyan-400/40 hover:shadow-lg",
                          )}
                        >
                          {dev.popular && !isSelected ? (
                            <span className="absolute top-2.5 right-2.5 text-[9px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-500/15 px-2 py-0.5 rounded-full border border-cyan-500/30">
                              {isAr ? "شائع" : "Popular"}
                            </span>
                          ) : null}

                          {isSelected ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-md shadow-cyan-400/60"
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                            </motion.div>
                          ) : null}

                          <div
                            className={cn(
                              "p-2.5 rounded-xl transition-all duration-300",
                              isSelected
                                ? "bg-cyan-400 text-black shadow-lg shadow-cyan-400/40"
                                : "bg-muted/70 text-foreground group-hover:bg-cyan-500/20 group-hover:text-cyan-400",
                            )}
                          >
                            <Icon className="w-5 h-5" />
                          </div>

                          <span className="text-xs sm:text-sm font-bold tracking-tight mt-2.5 line-clamp-1">
                            {isAr ? dev.nameAr : dev.name}
                          </span>
                        </motion.button>
                      )
                    })}
                  </div>

                  {/* Immediate Problem Chips with Neon Edge */}
                  {selectedDeviceConfig ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3 pt-3 border-t border-white/10"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-cyan-400" />
                          <span>{isAr ? "ما هي المشكلة الشائعة؟" : "What is the issue?"}</span>
                        </label>
                        <span className="text-[11px] text-cyan-400 font-bold">
                          {isAr ? "اختر المشكلة للمتابعة" : "Pick an issue to continue"}
                        </span>
                      </div>

                      {/* Issue Chips with Liquid Glow */}
                      <div className="flex flex-wrap gap-2">
                        {selectedDeviceConfig.issues.map((iss) => {
                          const isSelected = state.problem === iss
                          const isNotSure = iss === "Not Sure"
                          return (
                            <button
                              key={iss}
                              type="button"
                              onClick={() => setState((prev) => ({ ...prev, problem: iss }))}
                              className={cn(
                                "px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all duration-200 cursor-pointer active:scale-95",
                                isSelected
                                  ? "border-cyan-400 bg-gradient-to-r from-cyan-400 to-teal-400 text-black font-black shadow-lg shadow-cyan-400/30 scale-[1.03]"
                                  : isNotSure
                                    ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 font-bold"
                                    : "border-white/10 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-cyan-500/30",
                              )}
                            >
                              {t(iss)}
                            </button>
                          )
                        })}
                      </div>

                      {/* "Not Sure" Reassurance Prompt */}
                      {state.problem === "Not Sure" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-xs text-cyan-300 shadow-lg shadow-cyan-500/5"
                        >
                          <HelpCircle className="w-4 h-4 shrink-0 text-cyan-400" />
                          <span>
                            {isAr
                              ? "لا تقلق أبداً! سيقوم الفني بفحص الجهاز بالكامل عند وصوله لتشخيص العطل بدقة واقتراح أفضل حل."
                              : "No worries! Our technician carries complete testing gear to inspect and diagnose your device on-site."}
                          </span>
                        </motion.div>
                      )}

                      {/* Optional Brand & Model with Fast-Tap Suggestions */}
                      <div className="pt-2">
                        {!showModelDetails ? (
                          <button
                            type="button"
                            onClick={() => setShowModelDetails(true)}
                            className="text-xs text-muted-foreground hover:text-cyan-400 inline-flex items-center gap-1.5 transition-colors cursor-pointer group"
                          >
                            <span className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center text-[10px] group-hover:border-cyan-400">+</span>
                            <span className="underline decoration-dotted underline-offset-4">
                              {isAr ? "إضافة الموديل أو الماركة (اختياري)" : "Add Brand / Model (Optional)"}
                            </span>
                          </button>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-2xl bg-muted/30 border border-white/10 space-y-3"
                          >
                            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                              <span>{isAr ? "الماركة والموديل (اختياري)" : "Brand & Model (Optional)"}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setState((prev) => ({ ...prev, brand: "", model: "" }))
                                  setShowModelDetails(false)
                                }}
                                className="text-cyan-400 hover:underline cursor-pointer"
                              >
                                {t("Skip / I don't know")}
                              </button>
                            </div>

                            {/* Quick Brand Tap Chips */}
                            {selectedDeviceConfig.quickBrands ? (
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[11px] text-muted-foreground/70">{isAr ? "شائع:" : "Common:"}</span>
                                {selectedDeviceConfig.quickBrands.map((b) => (
                                  <button
                                    key={b}
                                    type="button"
                                    onClick={() => setState((prev) => ({ ...prev, brand: b }))}
                                    className={cn(
                                      "text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer",
                                      state.brand === b
                                        ? "bg-cyan-400 text-black font-bold border-cyan-400 shadow-sm"
                                        : "bg-card border-white/10 text-muted-foreground hover:text-foreground",
                                    )}
                                  >
                                    {b}
                                  </button>
                                ))}
                              </div>
                            ) : null}

                            <div className="grid grid-cols-2 gap-2.5">
                              <input
                                type="text"
                                value={state.brand}
                                onChange={(e) => setState((prev) => ({ ...prev, brand: e.target.value }))}
                                placeholder={t("Brand (Optional)")}
                                className="w-full px-3 py-2.5 text-xs sm:text-sm bg-background/80 border border-white/10 rounded-xl focus:border-cyan-400 focus:outline-none"
                              />
                              <input
                                type="text"
                                value={state.model}
                                onChange={(e) => setState((prev) => ({ ...prev, model: e.target.value }))}
                                placeholder={t("Model (Optional)")}
                                className="w-full px-3 py-2.5 text-xs sm:text-sm bg-background/80 border border-white/10 rounded-xl focus:border-cyan-400 focus:outline-none"
                              />
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ) : null}

                  {/* Step 1 CTA */}
                  <div className="pt-2">
                    <Button
                      type="button"
                      disabled={!isStep1Valid}
                      onClick={handleNextStep}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 text-black hover:opacity-95 font-black text-base shadow-xl shadow-cyan-400/25 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 group transition-all"
                    >
                      <span>{t("Continue")}</span>
                      <ChevronRight className={cn("w-4 h-4 transition-transform group-hover:translate-x-1", isAr && "rotate-180 group-hover:-translate-x-1")} />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* =========================================================================
                  STEP 2: LOCATION & APPOINTMENT (All 7 Emirates + Ambient Time Slots)
              ========================================================================= */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                        {t("Where should we come?")}
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        {isAr ? "نصل إلى باب بيتك أو مكتبك في أي مكان بالإمارات" : "On-site doorstep service across all 7 Emirates"}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/25 hidden sm:inline-block shadow-sm">
                      {isAr ? "الخطوة 2 من 3" : "Step 2 of 3"}
                    </span>
                  </div>

                  {/* 7 Emirates Selection with Ambient Glow */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{isAr ? "اختر الإمارة" : "Select Emirate"}</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {UAE_EMIRATES.map((em) => {
                        const isSelected = state.emirateId === em.id
                        return (
                          <button
                            key={em.id}
                            type="button"
                            onClick={() =>
                              setState((prev) => ({
                                ...prev,
                                emirateId: em.id,
                                emirateName: em.nameEn,
                              }))
                            }
                            className={cn(
                              "relative px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer text-center",
                              isSelected
                                ? "border-cyan-400 bg-gradient-to-r from-cyan-400 to-teal-400 text-black font-black shadow-lg shadow-cyan-400/30 scale-[1.02]"
                                : "border-white/10 bg-card/60 hover:bg-muted/40 text-muted-foreground hover:text-foreground",
                            )}
                          >
                            <span>{isAr ? em.nameAr : em.nameEn}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Area / City + Creative Radar Location Button */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wide">
                        {isAr ? "المنطقة أو الحي" : "Area / City"}
                      </label>
                      <button
                        type="button"
                        onClick={handleUseMyLocation}
                        disabled={isLocating}
                        className="inline-flex items-center gap-1.5 text-xs font-extrabold text-cyan-400 hover:text-cyan-300 cursor-pointer disabled:opacity-50 group"
                      >
                        {isLocating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <div className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
                          </div>
                        )}
                        <span className="underline decoration-cyan-400/40 underline-offset-4">{t("Use My Location")}</span>
                      </button>
                    </div>
                    <div className="relative">
                      <MapPin className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isAr ? "right-3.5" : "left-3.5")} />
                      <input
                        type="text"
                        value={state.area}
                        onChange={(e) => setState((prev) => ({ ...prev, area: e.target.value }))}
                        placeholder={t("Area, community or building")}
                        className={cn(
                          "w-full py-3.5 bg-background/80 border border-white/10 rounded-2xl text-xs sm:text-sm text-foreground focus:border-cyan-400 focus:outline-none transition-colors shadow-inner",
                          isAr ? "pr-10 pl-4 text-right" : "pl-10 pr-4 text-left",
                        )}
                      />
                    </div>
                  </div>

                  {/* Appointment Timing (Day + Ambient Slots) */}
                  <div className="space-y-3 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        <span>{t("When would you like us to come?")}</span>
                      </label>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/25">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t("Same-Day Service Available")}</span>
                      </span>
                    </div>

                    {/* Day Selection */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "today", label: t("Today") },
                        { id: "tomorrow", label: t("Tomorrow") },
                        { id: "custom", label: t("Choose Date") },
                      ].map((day) => {
                        const isSelected = state.appointmentDay === day.id
                        return (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => setState((prev) => ({ ...prev, appointmentDay: day.id as any }))}
                            className={cn(
                              "py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer text-center",
                              isSelected
                                ? "border-cyan-400 bg-cyan-500/20 text-foreground ring-1 ring-cyan-400 shadow-md shadow-cyan-500/10"
                                : "border-white/10 bg-card/60 hover:bg-muted/40 text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {day.label}
                          </button>
                        )
                      })}
                    </div>

                    {state.appointmentDay === "custom" ? (
                      <div className="pt-1">
                        <input
                          type="date"
                          min={getFormattedDate(0)}
                          value={state.customDate}
                          onChange={(e) => setState((prev) => ({ ...prev, customDate: e.target.value }))}
                          className="w-full px-4 py-3 bg-background/80 border border-white/10 rounded-xl text-sm focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                    ) : null}

                    {/* Ambient Time Slots */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {isAr ? "اختر نافذة الوقت المناسبة:" : "Pick a preferred arrival window:"}
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {TIME_SLOTS.map((slot) => {
                          const Icon = slot.icon
                          const isSelected = state.timeSlot === slot.label
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => setState((prev) => ({ ...prev, timeSlot: slot.label }))}
                              className={cn(
                                "flex items-center justify-between p-3 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer",
                                isSelected
                                  ? "border-cyan-400 bg-gradient-to-r from-cyan-400 to-teal-400 text-black font-black shadow-lg shadow-cyan-400/30"
                                  : "border-white/10 bg-card/60 hover:bg-muted/40 text-muted-foreground hover:text-foreground",
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 opacity-80" />
                                <span>{slot.label}</span>
                              </div>
                              <span className="text-[10px] opacity-75 font-medium hidden sm:inline">
                                {isAr ? slot.periodAr : slot.tag}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Step 2 CTA */}
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevStep}
                      className="py-4 px-6 rounded-2xl border-white/10 font-bold text-sm cursor-pointer"
                    >
                      <ChevronLeft className={cn("w-4 h-4", isAr && "rotate-180")} />
                      <span>{t("Back")}</span>
                    </Button>
                    <Button
                      type="button"
                      disabled={!isStep2Valid}
                      onClick={handleNextStep}
                      className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 text-black hover:opacity-95 font-black text-base shadow-xl shadow-cyan-400/25 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 group"
                    >
                      <span>{t("Continue")}</span>
                      <ChevronRight className={cn("w-4 h-4 transition-transform group-hover:translate-x-1", isAr && "rotate-180 group-hover:-translate-x-1")} />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* =========================================================================
                  STEP 3: CONTACT & DIGITAL REPAIR PASS (VIP Pass Receipt)
              ========================================================================= */}
              {step === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                        {t("Almost done")}
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        {t("Where should we send your booking confirmation?")}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/25 hidden sm:inline-block shadow-sm">
                      {isAr ? "الخطوة 3 من 3" : "Step 3 of 3"}
                    </span>
                  </div>

                  {/* VIP Digital Boarding Pass Ticket */}
                  <div className="relative rounded-3xl bg-gradient-to-br from-cyan-500/15 via-background/90 to-blue-500/10 border border-cyan-400/40 p-4 sm:p-5 shadow-2xl overflow-hidden backdrop-blur-2xl">
                    <div className="flex items-center justify-between pb-3 border-b border-cyan-400/20">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400" />
                        <span className="font-black text-foreground text-xs uppercase tracking-wider">
                          {isAr ? "تذكرة صيانة ميدانية معتمدة" : "Verified Doorstep Repair Pass"}
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-black text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                        {isAr ? "الدفع بعد الإصلاح" : "Pay After Repair"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 text-xs sm:text-sm">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          {t("Device")}
                        </span>
                        <div className="flex items-center justify-between pr-2 mt-0.5">
                          <span className="font-black text-foreground truncate">
                            {isAr ? selectedDeviceConfig?.nameAr : state.deviceName}
                            {state.brand ? ` (${state.brand})` : ""}
                          </span>
                          <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="text-[10px] font-bold text-cyan-400 hover:underline cursor-pointer"
                          >
                            {t("Edit")}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          {isAr ? "المشكلة" : "Issue"}
                        </span>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="font-black text-foreground truncate">{t(state.problem)}</span>
                          <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="text-[10px] font-bold text-cyan-400 hover:underline cursor-pointer"
                          >
                            {t("Edit")}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          {t("Location")}
                        </span>
                        <div className="flex items-center justify-between pr-2 mt-0.5">
                          <span className="font-black text-foreground truncate">
                            {state.emirateName} – {state.area}
                          </span>
                          <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="text-[10px] font-bold text-cyan-400 hover:underline cursor-pointer"
                          >
                            {t("Edit")}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          {isAr ? "الموعد" : "Appointment"}
                        </span>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="font-black text-foreground truncate">
                            {state.appointmentDay === "today" ? t("Today") : state.appointmentDay === "tomorrow" ? t("Tomorrow") : state.customDate} ({state.timeSlot})
                          </span>
                          <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="text-[10px] font-bold text-cyan-400 hover:underline cursor-pointer"
                          >
                            {t("Edit")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Inputs */}
                  <div className="space-y-3.5">
                    {/* Full Name */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wide">
                        {t("Full Name")} <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isAr ? "right-3.5" : "left-3.5")} />
                        <input
                          type="text"
                          required
                          value={state.customerName}
                          onChange={(e) => setState((prev) => ({ ...prev, customerName: e.target.value }))}
                          placeholder={isAr ? "اسم العميل الكريم" : "e.g. Sultan Al Nuaimi"}
                          className={cn(
                            "w-full py-3.5 bg-background/80 border border-white/10 rounded-2xl text-xs sm:text-sm text-foreground focus:border-cyan-400 focus:outline-none transition-colors shadow-inner",
                            isAr ? "pr-10 pl-4 text-right" : "pl-10 pr-4 text-left",
                          )}
                        />
                      </div>
                    </div>

                    {/* Phone Input with UAE Flag Badge */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wide">
                          {t("Phone Number")} <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[11px] font-bold text-cyan-400 inline-flex items-center gap-1">
                          <span>🇦🇪</span>
                          <span>+971 UAE</span>
                        </span>
                      </div>
                      <div className="relative">
                        <Phone className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isAr ? "right-3.5" : "left-3.5")} />
                        <input
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          required
                          value={state.phone}
                          onChange={(e) => setState((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder="050 123 4567"
                          className={cn(
                            "w-full py-3.5 bg-background/80 border border-white/10 rounded-2xl text-xs sm:text-sm text-foreground focus:border-cyan-400 focus:outline-none transition-colors font-semibold shadow-inner",
                            isAr ? "pr-10 pl-4 text-right" : "pl-10 pr-4 text-left",
                          )}
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* Email (Optional) */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                        {t("Email (Optional)")}
                      </label>
                      <div className="relative">
                        <Mail className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isAr ? "right-3.5" : "left-3.5")} />
                        <input
                          type="email"
                          value={state.email}
                          onChange={(e) => setState((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="name@example.com"
                          className={cn(
                            "w-full py-3 bg-background/80 border border-white/10 rounded-2xl text-xs sm:text-sm text-foreground focus:border-cyan-400 focus:outline-none transition-colors",
                            isAr ? "pr-10 pl-4 text-right" : "pl-10 pr-4 text-left",
                          )}
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* Notes (Optional) */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                        {t("Anything else we should know?")}
                      </label>
                      <div className="relative">
                        <MessageSquare className={cn("absolute top-3.5 w-4 h-4 text-muted-foreground", isAr ? "right-3.5" : "left-3.5")} />
                        <textarea
                          rows={2}
                          value={state.notes}
                          onChange={(e) => setState((prev) => ({ ...prev, notes: e.target.value }))}
                          placeholder={t("Describe the problem briefly if needed...")}
                          className={cn(
                            "w-full py-3 bg-background/80 border border-white/10 rounded-2xl text-xs sm:text-sm text-foreground focus:border-cyan-400 focus:outline-none transition-colors resize-none",
                            isAr ? "pr-10 pl-4 text-right" : "pl-10 pr-4 text-left",
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Trust Micro-Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] sm:text-xs text-muted-foreground pt-1">
                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-card/60 border border-white/5">
                      <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="font-semibold">{t("We Come to You")}</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-card/60 border border-white/5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-semibold">{t("Clear Quote Before Repair")}</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-card/60 border border-white/5">
                      <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="font-semibold">{t("Same-Day Service Available")}</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-card/60 border border-white/5">
                      <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="font-semibold">{t("Warranty on Eligible Repairs")}</span>
                    </div>
                  </div>

                  {/* Error Notification */}
                  {submitError ? (
                    <div className="p-3.5 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive text-xs text-center font-bold">
                      {submitError}
                    </div>
                  ) : null}

                  {/* Primary Shimmer Button */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePrevStep}
                        disabled={isPending}
                        className="py-4 px-6 rounded-2xl border-white/10 font-bold text-sm cursor-pointer"
                      >
                        <ChevronLeft className={cn("w-4 h-4", isAr && "rotate-180")} />
                        <span>{t("Back")}</span>
                      </Button>
                      <Button
                        type="button"
                        disabled={!isStep3Valid || isPending}
                        onClick={handleConfirmBooking}
                        className="relative flex-1 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 text-black hover:opacity-95 font-black text-base shadow-xl shadow-cyan-400/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 overflow-hidden active:scale-[0.99] transition-all"
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>{t("Booking your technician...")}</span>
                          </>
                        ) : (
                          <>
                            <span>{t("Confirm Booking")}</span>
                            <ArrowRight className={cn("w-5 h-5", isAr && "rotate-180")} />
                          </>
                        )}
                      </Button>
                    </div>

                    {/* WhatsApp Secondary Helper */}
                    <div className="text-center pt-1">
                      <p className="text-xs text-muted-foreground">
                        {t("Need help?")}{" "}
                        <a
                          href={`https://wa.me/${contact.whatsappRaw}?text=${encodeURIComponent("Hello KBI, I need quick assistance with booking.")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-emerald-500 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{t("Chat with us on WhatsApp")}</span>
                        </a>
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* =========================================================================
                  STEP 4: SUCCESS CONFIRMATION (VIP Cyber Pass)
              ========================================================================= */}
              {step === 4 && (
                <motion.div
                  key="step-4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 220, damping: 20 }}
                  className="text-center py-6 sm:py-8 space-y-6"
                >
                  <div className="relative inline-flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-300 text-black flex items-center justify-center shadow-xl shadow-emerald-400/50 relative z-10">
                      <Check className="w-10 h-10 stroke-[3]" />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
                      {t("Booking Confirmed")}
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                      {t("Your service request has been received.")}
                    </p>
                  </div>

                  {/* High-Tech Booking Pass Badge */}
                  <div className="max-w-md mx-auto p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-card to-muted/40 border border-cyan-400/40 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">
                          {t("Booking ID")}
                        </span>
                        <span className="text-xl sm:text-2xl font-mono font-black text-cyan-400 tracking-wider">
                          {confirmedOrderId}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyOrderId}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-400 border border-cyan-400/30 transition-colors cursor-pointer text-xs font-bold"
                        title={t("Copy order ID")}
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">{isAr ? "تم النسخ" : "Copied"}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>{isAr ? "نسخ" : "Copy"}</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 text-left text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("Device")}:</span>
                        <span className="font-bold text-foreground">{isAr ? selectedDeviceConfig?.nameAr : state.deviceName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{isAr ? "المشكلة" : "Issue"}:</span>
                        <span className="font-bold text-foreground">{t(state.problem)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("Location")}:</span>
                        <span className="font-bold text-foreground">{state.emirateName} – {state.area}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{isAr ? "الموعد" : "Appointment"}:</span>
                        <span className="font-bold text-foreground">
                          {state.appointmentDay === "today" ? t("Today") : state.appointmentDay === "tomorrow" ? t("Tomorrow") : state.customDate} ({state.timeSlot})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("Phone Number")}:</span>
                        <span className="font-bold text-foreground" dir="ltr">{state.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto pt-2">
                    <Button asChild className="flex-1 py-4 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 text-black hover:opacity-90 font-black shadow-lg shadow-cyan-400/25">
                      <Link href={`/track?orderId=${encodeURIComponent(confirmedOrderId || "")}`}>
                        <Clock className="w-4 h-4 mr-1.5" />
                        <span>{t("Track Booking")}</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1 py-4 rounded-xl border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-bold">
                      <a
                        href={`https://wa.me/${contact.whatsappRaw}?text=${encodeURIComponent(`Hello KBI, I just booked order ${confirmedOrderId}.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="w-4 h-4 mr-1.5" />
                        <span>{t("WhatsApp Support")}</span>
                      </a>
                    </Button>
                  </div>

                  <div className="pt-2">
                    <Link href="/" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4">
                      {t("Back to Home")}
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
