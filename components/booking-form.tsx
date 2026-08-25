"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSearchParams } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { devices, getAllRepairTimes, getRepairTime } from "@/lib/data"
import { cn, handleStaleServerActionError } from "@/lib/utils"
import { useLanguage, useT } from "@/components/language-provider"
import { useToast } from "@/hooks/use-toast"
import { reverseGeocode } from "@/app/actions/geocode"
import { createBookingAction } from "@/app/actions/booking"
import { useSiteContact } from "@/components/contact-provider"
import { WhatsAppChatbot } from "@/components/whatsapp-chatbot"
import {
  Smartphone,
  Laptop,
  Tablet,
  Cctv,
  PcCase,
  Printer,
  Monitor,
  Tv,
  Watch,
  Gamepad2,
  Camera,
  MonitorUp,
  Wifi,
  Headset,
  ChevronRight,
  ChevronLeft,
  Check,
  User,
  Phone,
  MapPin,
  MessageSquare,
  MessageCircle,
  Calendar,
  Clock,
  CheckCircle2,
  Copy,
  Loader2,
  Star,
  Plus,
  Trash2,
  Search,
} from "lucide-react"
import type { ReactNode } from "react"

const iconMap: Record<string, ReactNode> = {
  Smartphone: <Smartphone className="w-6 h-6" />,
  Laptop: <Laptop className="w-6 h-6" />,
  Printer: <Printer className="w-6 h-6" />,
  Monitor: <Monitor className="w-6 h-6" />,
  Tv: <Tv className="w-6 h-6" />,
  Watch: <Watch className="w-6 h-6" />,
  Gamepad2: <Gamepad2 className="w-6 h-6" />,
  Camera: <Camera className="w-6 h-6" />,
  MonitorUp: <MonitorUp className="w-6 h-6" />,
  Wifi: <Wifi className="w-6 h-6" />,
  Headset: <Headset className="w-6 h-6" />,
}

const steps = [
  { id: 1, name: "Device", icon: <Smartphone className="w-4 h-4" /> },
  { id: 2, name: "Brand", icon: <Check className="w-4 h-4" /> },
  { id: 3, name: "Model", icon: <Check className="w-4 h-4" /> },
  { id: 4, name: "Issue", icon: <Check className="w-4 h-4" /> },
  { id: 5, name: "Details", icon: <User className="w-4 h-4" /> },
]

interface DeviceEntry {
  id: string
  deviceId: string
  deviceName: string
  brandId: string
  brandName: string
  model: string
  issues: string[]
}

function NeonPanel({
  title,
  description,
  top,
  children,
  className,
}: {
  title?: React.ReactNode
  description?: React.ReactNode
  top?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[32px] border border-border bg-card/80 backdrop-blur-xl shadow-lg",
        className
      )}
    >
      <div className="pointer-events-none absolute -inset-px bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-80" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_0%,rgba(6,182,212,0.12),rgba(0,0,0,0)_60%)]" />
      <div className="relative p-6 sm:p-8 lg:p-10">
        {top ? <div className="mb-6">{top}</div> : null}
        {title ? (
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h2>
            {description ? <p className="mt-2 text-sm sm:text-base text-muted-foreground">{description}</p> : null}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  )
}

export function BookingForm() {
  const { lang } = useLanguage()
  const { toast } = useToast()
  const isAr = lang === "ar"
  const t = useT()
  const ChevronIcon = isAr ? ChevronLeft : ChevronRight
  const searchParams = useSearchParams()
  const contact = useSiteContact()
  const preselectedDevice = searchParams.get("device")
  const reviewUrl = "https://g.page/r/CWG_uPaqr-MjEAI/review"
  const stepsRef = useRef<HTMLDivElement | null>(null)

  const [currentStep, setCurrentStep] = useState(1)
  
  const [selectedDevice, setSelectedDevice] = useState<string | null>(preselectedDevice)
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [selectedIssues, setSelectedIssues] = useState<string[]>([])

  const [deviceEntries, setDeviceEntries] = useState<DeviceEntry[]>([])

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    address: "",
    locationLat: null as number | null,
    locationLng: null as number | null,
    locationType: "home" as "home" | "office",
    companyName: "",
    unitNumber: "",
    notes: "",
    preferredDate: "",
    preferredTime: "",
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState("")
  const [copied, setCopied] = useState(false)
  const [isOtherModel, setIsOtherModel] = useState(false)
  const [customModel, setCustomModel] = useState("")
  const [deviceSearch, setDeviceSearch] = useState("")
  const [modelSearch, setModelSearch] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [issuePickingId, setIssuePickingId] = useState<string | null>(null)
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Handle preselected device from URL
  useEffect(() => {
    if (preselectedDevice && devices.find((d) => d.id === preselectedDevice)) {
      setSelectedDevice(preselectedDevice)
      setCurrentStep(2)
    }
  }, [preselectedDevice])

  const currentDeviceData = devices.find((d) => d.id === selectedDevice)
  const currentBrandData = currentDeviceData?.brands.find((b) => b.id === selectedBrand)
  const visibleDevices = devices.filter((device) => {
    const query = deviceSearch.trim().toLowerCase()
    if (!query) return true
    return [device.name, ...device.brands.map((brand) => brand.name), ...device.issues]
      .join(" ")
      .toLowerCase()
      .includes(query)
  })
  const repairEstimateLabel = (deviceId: string, issue: string) => {
    const configuredMinutes = getAllRepairTimes()[`${deviceId}|${issue}`]
    const hasCategoryEstimate = /^(Hardware|Software|Physical):/.test(issue)
    if (configuredMinutes == null && !hasCategoryEstimate) {
      return t("Estimate after diagnosis")
    }
    return t("~60 min").replace("60", String(getRepairTime(deviceId, issue)))
  }

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDevice(deviceId)
    setSelectedBrand(null)
    setSelectedModel(null)
    setSelectedIssues([])
    setCurrentStep(2)
  }

  const handleDevicePick = (deviceId: string) => handleDeviceSelect(deviceId)

  const handleBrandSelect = (brandId: string) => {
    setSelectedBrand(brandId)
    setSelectedModel(null)
    setModelSearch("")
    setCurrentStep(3)
  }

  const handleBrandPick = (brandId: string) => handleBrandSelect(brandId)

  const handleModelSelect = (model: string) => {
    setSelectedModel(model)
    setIsOtherModel(false)
    setCurrentStep(4)
  }

  const handleModelPick = (model: string) => handleModelSelect(model)

  const handleIssueToggle = (issue: string) => {
    setSelectedIssues(prev =>
      prev.includes(issue)
        ? prev.filter(i => i !== issue)
        : [...prev, issue]
    )
  }

  const handleIssuePick = (issue: string) => {
    setIssuePickingId(issue)
    handleIssueToggle(issue)
    setTimeout(() => setIssuePickingId(null), 160)
  }

  const generateYearRangeModels = (prefix: string, start: number, end: number) => {
    const list: string[] = []
    for (let y = start; y <= end; y++) {
      list.push(`${prefix} (${y})`)
    }
    return list
  }

  const generateIphoneModelsUpTo2025 = (): string[] => {
    return [
      "iPhone 6 (2014)",
      "iPhone 7 (2016)",
      "iPhone 8 (2017)",
      "iPhone X (2017)",
      "iPhone XR (2018)",
      "iPhone XS (2018)",
      "iPhone 11 (2019)",
      "iPhone 12 (2020)",
      "iPhone 13 (2021)",
      "iPhone 14 (2022)",
      "iPhone 15 (2023)",
      "iPhone 16 (2024)",
      "iPhone 17 (2025)",
      "iPhone 17 Pro Max (2025)",
    ]
  }

  const generateSamsungSModelsUpTo2025 = (): string[] => {
    return [
      "Galaxy S10 (2019)",
      "Galaxy S20 (2020)",
      "Galaxy S21 (2021)",
      "Galaxy S22 (2022)",
      "Galaxy S23 (2023)",
      "Galaxy S24 (2024)",
      "Galaxy S25 (2025)",
    ]
  }

  const addDeviceToList = () => {
    if (selectedDevice && selectedBrand && selectedModel && selectedIssues.length > 0 && currentDeviceData && currentBrandData) {
      const isDuplicate = deviceEntries.some(
        (entry) =>
          entry.deviceId === selectedDevice &&
          entry.brandId === selectedBrand &&
          entry.model === selectedModel &&
          entry.issues.length === selectedIssues.length &&
          entry.issues.every((issue) => selectedIssues.includes(issue))
      )
      if (!isDuplicate) {
        const newEntry: DeviceEntry = {
          id: Date.now().toString(),
          deviceId: selectedDevice,
          deviceName: currentDeviceData.name,
          brandId: selectedBrand,
          brandName: currentBrandData.name,
          model: selectedModel,
          issues: selectedIssues,
        }
        setDeviceEntries([...deviceEntries, newEntry])
      }
      // Reset selections for adding another device
      setSelectedDevice(null)
      setSelectedBrand(null)
      setSelectedModel(null)
      setSelectedIssues([])
      setCurrentStep(1)
    }
  }

  const removeDeviceEntry = (id: string) => {
    setDeviceEntries(deviceEntries.filter((entry) => entry.id !== id))
  }

  const proceedToDetails = () => {
    if (selectedDevice && selectedBrand && selectedModel && selectedIssues.length > 0 && currentDeviceData && currentBrandData) {
      const isDuplicate = deviceEntries.some(
        (entry) =>
          entry.deviceId === selectedDevice &&
          entry.brandId === selectedBrand &&
          entry.model === selectedModel &&
          entry.issues.length === selectedIssues.length &&
          entry.issues.every((issue) => selectedIssues.includes(issue))
      )
      if (!isDuplicate) {
        const newEntry: DeviceEntry = {
          id: Date.now().toString(),
          deviceId: selectedDevice,
          deviceName: currentDeviceData.name,
          brandId: selectedBrand,
          brandName: currentBrandData.name,
          model: selectedModel,
          issues: selectedIssues,
        }
        setDeviceEntries([...deviceEntries, newEntry])
      }
      // Reset selections so going back doesn't add the same device again
      setSelectedDevice(null)
      setSelectedBrand(null)
      setSelectedModel(null)
      setSelectedIssues([])
    }
    setCurrentStep(5)
  }

  const detectLocation = async () => {
    setIsDetectingLocation(true)
    setLocationError(null)

    if (typeof window !== "undefined" && !window.isSecureContext) {
      setLocationError(t("Location requires HTTPS. Please open via https or enter address manually."))
      setIsDetectingLocation(false)
      return
    }

    if (!navigator.geolocation) {
      setLocationError(t("Geolocation is not supported by your browser"))
      setIsDetectingLocation(false)
      return
    }

    const setAddressFromCoords = async (latitude: number, longitude: number) => {
      const result = await reverseGeocode(latitude, longitude, lang === "ar" ? "ar" : "en")
      if ((result as any)?.error) throw new Error((result as any).error)
      const address = (result as any)?.address || ""
      if (!address) throw new Error("No address")
      setFormData((prev) => ({ ...prev, address, locationLat: latitude, locationLng: longitude }))
    }

    const fallbackToIpLocation = async () => {
      const res = await fetch("https://ipwho.is/")
      const json = await res.json().catch(() => null)
      const latitude = json?.latitude
      const longitude = json?.longitude
      if (typeof latitude !== "number" || typeof longitude !== "number") throw new Error("No coordinates")
      await setAddressFromCoords(latitude, longitude)
    }

    try {
      const perms = (navigator as any).permissions
      if (perms?.query) {
        const status = await perms.query({ name: "geolocation" })
        if (status?.state === "denied") {
          try {
            await fallbackToIpLocation()
            setLocationError(null)
          } catch {
            setLocationError(t("Location permission denied. Please allow access or enter address manually."))
          }
          setIsDetectingLocation(false)
          return
        }
      }
    } catch {
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          await setAddressFromCoords(latitude, longitude)
        } catch {
          try {
            await fallbackToIpLocation()
            setLocationError(null)
          } catch {
            setLocationError(t("Failed to detect address. Please enter manually."))
          }
        } finally {
          setIsDetectingLocation(false)
        }
      },
      (error) => {
        ;(async () => {
          try {
            if (error.code === error.PERMISSION_DENIED) {
              await fallbackToIpLocation()
              setLocationError(null)
              return
            }

            if (error.code === error.POSITION_UNAVAILABLE || error.code === error.TIMEOUT) {
              await fallbackToIpLocation()
              setLocationError(null)
              return
            }

            setLocationError(t("Failed to get location"))
          } catch {
            if (error.code === error.PERMISSION_DENIED) {
              setLocationError(t("Location permission denied. Please allow access or enter address manually."))
              return
            }
            setLocationError(t("Location unavailable. Please enter address manually."))
          } finally {
            setIsDetectingLocation(false)
          }
        })()
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Use Server Action to bypass AdBlockers blocking Firestore API
      const result = await createBookingAction(formData, deviceEntries)

      if (result.error) throw new Error(result.error)

      if (result.orderIds && result.orderIds.length > 0) {
        setTrackingNumber(result.orderIds.join(", "))

        // Google Ads / Analytics Conversion Event
        if (typeof window !== "undefined" && (window as any).gtag) {
          (window as any).gtag("event", "generate_lead", {
            currency: "AED",
            value: 0, // No price known yet
            event_callback: () => {}
          })
        }

        setIsSubmitted(true)
      } else {
        throw new Error("No order IDs returned")
      }
    } catch (err) {
      if (handleStaleServerActionError(err)) return
      toast({
        variant: "destructive",
        title: t("Error"),
        description: t("Failed to create order. Please try again.")
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyTrackingNumber = () => {
    navigator.clipboard.writeText(trackingNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const goToStep = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step)
    }
  }

  useEffect(() => {
    const el = stepsRef.current
    if (!el || currentStep === 1) return
    el.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [currentStep])

  if (isSubmitted) {
    return (
      <section className="pt-24 pb-12">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto text-center"
          >
            <GlassCard className="p-8" dir={isAr ? 'rtl' : 'ltr'}>
              <div className="w-20 h-20 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-cyan-400" />
              </div>

              <h2 className="text-2xl font-bold mb-2">{t("Order Created Successfully!")}</h2>
              <p className="text-muted-foreground mb-6">
                {isAr ? `تم إنشاء طلبك بنجاح. رقم التتبع الخاص بك هو: ${trackingNumber}.` : `Your order has been created successfully. Tracking Number: ${trackingNumber}.`}
              </p>

              <div className="bg-muted/50 border border-border rounded-2xl p-6 mb-6">
                <p className="text-sm text-muted-foreground mb-2">{t("Your Tracking Number")}</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl font-mono font-bold text-cyan-600 dark:text-cyan-300">{trackingNumber}</span>
                  <button
                    onClick={copyTrackingNumber}
                    aria-label={t("Copy tracking number")}
                    className="p-2 rounded-lg bg-background hover:bg-accent transition-colors"
                  >
                    {copied ? <Check className="w-5 h-5 text-cyan-500" /> : <Copy className="w-5 h-5 text-muted-foreground" />}
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-left mb-6">
                <h4 className="text-sm font-semibold text-foreground">
                  {deviceEntries.length > 1 ? `${t("Device(s)")} (${deviceEntries.length})` : t("Device")}
                </h4>
                {deviceEntries.map((entry, index) => (
                  <div key={entry.id} className="bg-muted/50 border border-border rounded-xl p-3 space-y-1">
                    {deviceEntries.length > 1 && (
                      <p className="text-xs text-cyan-600 dark:text-cyan-300 font-semibold">{t("Device")} {index + 1}</p>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("Type")}:</span>
                      <span className="text-foreground">{isAr ? t(entry.deviceName) : entry.deviceName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("Brand")}:</span>
                      <span className="text-foreground">{entry.brandName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("Model")}:</span>
                      <span className="text-foreground">{entry.model}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("Issue")}:</span>
                      <span className="text-foreground">{isAr ? entry.issues.map(i => t(i)).join(", ") : entry.issues.join(", ")}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <Button asChild variant="primary" className="w-full">
                  <a href={`/track/${encodeURIComponent(trackingNumber)}`}>
                    {t("Track Your Order")}
                  </a>
                </Button>
                <Button asChild variant="secondary" className="w-full">
                  <a
                    href={`https://wa.me/${contact.whatsappRaw}?text=Hi! I just booked a repair for ${deviceEntries.length} device(s). My tracking number is ${trackingNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("Chat on WhatsApp")}
                  </a>
                </Button>
                <Button asChild variant="outline" className="w-full border-border bg-background/60 hover:bg-accent text-foreground">
                  <a href={reviewUrl} target="_blank" rel="noopener noreferrer">
                    <Star className="w-5 h-5 mr-2" />
                    {isAr ? "قيّمنا على Google" : "Rate us on Google"}
                  </a>
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>
    )
  }

  return (
    <section className="pt-24 pb-12">

      <div className="container mx-auto px-6">
        {/* Help Banner */}
        {mounted && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto mb-8"
          >
            <GlassCard className="p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="text-center md:text-left flex-1 min-w-[200px]">
                  <h3 className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">
                    {t("Need Help?")}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t("Chat with us on WhatsApp for quick assistance with your booking!")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs text-emerald-700 dark:text-green-300 font-medium">
                      {t("We're Online")}
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 w-fit mx-auto mb-3">
            <Clock className="w-3 h-3 text-cyan-500 dark:text-cyan-400" />
            <span className="text-xs font-semibold tracking-wide text-cyan-600 dark:text-cyan-400">{t("Same-Day On-Site Service")}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 text-foreground">
            {isAr ? (
              <>
                {t("Book a")} <span className="text-cyan-500 dark:text-cyan-400">{t("Technician")}</span>
              </>
            ) : (
              <>Book a <span className="text-cyan-500 dark:text-cyan-400">Technician</span></>
            )}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t("Select your device, tell us the problem, and we'll send a certified technician to your location.")}
          </p>
        </div>

        {deviceEntries.length > 0 && currentStep < 5 && (
          <div className="max-w-4xl mx-auto mb-6">
            <GlassCard className="p-4" dir={isAr ? 'rtl' : 'ltr'}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">{t("Devices Added")} ({deviceEntries.length})</h3>
              </div>
              <div className="space-y-2">
                {deviceEntries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between bg-muted/50 rounded-xl p-3 border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center text-cyan-300 ring-1 ring-cyan-500/20">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {entry.brandName} {entry.model}
                        </p>
                        <p className="text-xs text-muted-foreground">{isAr ? entry.issues.map(i => t(i)).join(", ") : entry.issues.join(", ")}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeDeviceEntry(entry.id)}
                      aria-label={isAr ? "إزالة الجهاز" : "Remove device"}
                      className="p-2 rounded-lg hover:bg-red-500/15 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}

        {/* Progress Steps */}
        <div className="sticky top-20 z-30 max-w-3xl mx-auto mb-8 rounded-2xl border border-border bg-background/85 px-3 py-3 shadow-lg backdrop-blur-2xl sm:px-5" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => goToStep(step.id)}
                  disabled={step.id > currentStep}
                  className={`flex flex-col items-center gap-2 ${step.id <= currentStep ? "cursor-pointer" : "cursor-not-allowed"}`}
                >
                  <div
                    className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${step.id < currentStep
                      ? "bg-cyan-500 text-black"
                      : step.id === currentStep
                        ? "bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400"
                        : "bg-muted text-muted-foreground/60"
                      }`}
                  >
                    <span className={`absolute inset-0 rounded-full bg-cyan-500/10 blur-md ${step.id === currentStep ? "opacity-100" : "opacity-0"}`} />
                    {step.id < currentStep ? <Check className="w-5 h-5" /> : step.id}
                  </div>
                  <span
                    className={`text-xs hidden sm:block ${step.id <= currentStep ? "text-foreground" : "text-muted-foreground/60"}`}
                  >
                    {t(step.name)}
                  </span>
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={`w-7 md:w-14 lg:w-20 h-0.5 mx-1.5 sm:mx-2 ${step.id < currentStep ? "bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 shadow-[0_0_20px_rgba(6,182,212,0.25)]" : "bg-border"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div ref={stepsRef} className="max-w-5xl mx-auto scroll-mt-44">
          <AnimatePresence mode="wait">
            {/* Step 1: Device Selection */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="relative overflow-hidden rounded-[32px] border border-border bg-card/80 backdrop-blur-xl shadow-lg">
                  <div className="pointer-events-none absolute -inset-px bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-80" />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_0%,rgba(6,182,212,0.12),rgba(0,0,0,0)_60%)]" />
                  <div className="relative p-6 sm:p-8 lg:p-10">
                    <div className="text-center">
                      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        {t(deviceEntries.length > 0 ? "Add Another Device" : "Select Your Device")}
                      </h2>
                      <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                        {t("Select your device, tell us the problem, and we'll send a certified technician to your location.")}
                      </p>
                    </div>

                    <div className="relative mt-7 max-w-xl mx-auto">
                      <Search className={`pointer-events-none absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground ${isAr ? "right-4" : "left-4"}`} />
                      <input
                        type="search"
                        value={deviceSearch}
                        onChange={(event) => setDeviceSearch(event.target.value)}
                        aria-label={t("Search devices or services")}
                        placeholder={t("Search devices or services")}
                        className={`w-full rounded-2xl border border-input bg-background/80 py-3.5 text-foreground shadow-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 placeholder:text-muted-foreground ${isAr ? "pr-12 pl-4 text-right" : "pl-12 pr-4"}`}
                      />
                    </div>

                    <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 auto-rows-fr" dir={isAr ? "rtl" : "ltr"}>
                      {visibleDevices.map((device) => {
                        const featured = device.id === "pc" || device.id === "gaming" || device.id === "networking" || device.id === "tech-support"
                        const IconNode = device.id === "tablet"
                          ? <Tablet className="w-6 h-6" />
                          : device.id === "cctv"
                            ? <Cctv className="w-6 h-6" />
                            : device.id === "pc"
                              ? <PcCase className="w-6 h-6" />
                              : device.id === "networking"
                                ? <Wifi className="w-6 h-6" />
                                : device.id === "tech-support"
                                  ? <Headset className="w-6 h-6" />
                                  : (iconMap as any)[device.icon]

                        return (
                          <button
                            key={device.id}
                            type="button"
                            onClick={() => handleDevicePick(device.id)}
                            className="group relative w-full h-full min-h-[124px] rounded-3xl border border-border bg-card/85 hover:bg-card backdrop-blur-xl px-3 py-4 flex flex-col items-center justify-center gap-2 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-500/50 hover:shadow-xl cursor-pointer"
                          >
                            <span className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-70" />
                            <span className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(6,182,212,0.15),rgba(0,0,0,0)_65%)]" />

                            {featured ? (
                              <span className="absolute top-3 left-3 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 ring-1 ring-cyan-500/30 px-2.5 py-1 text-[10px] font-bold tracking-wide">
                                {t("Featured")}
                              </span>
                            ) : null}

                            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-muted/60 ring-1 ring-border transition-all duration-300 group-hover:ring-cyan-500/40 group-hover:bg-cyan-500/10">
                              <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-cyan-500/10" />
                              <div className="relative text-foreground/70 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors group-hover:scale-110 duration-500">
                                {IconNode}
                              </div>
                            </div>

                            <div className="mt-1 text-sm font-bold text-foreground text-center w-full px-2">{t(device.name)}</div>
                            <div className="text-xs text-muted-foreground group-hover:opacity-0 transition-opacity duration-300 mt-0.5 text-center w-full">
                              {t("Select Service")}
                            </div>

                            {/* CTA Indicator on Hover */}
                            <div className="absolute bottom-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 w-full text-center px-2">
                               <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 tracking-wider uppercase block">
                                 {t("Book Now")}
                               </span>
                            </div>

                          </button>
                        )
                      })}
                    </div>
                    {visibleDevices.length === 0 ? (
                      <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/30 px-5 py-8 text-center text-sm text-muted-foreground">
                        {t("No matching device found. Try a different search.")}
                      </div>
                    ) : null}
                  </div>

                  {deviceEntries.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <Button
                        onClick={() => setCurrentStep(5)}
                        className="w-full bg-cyan-500 text-black hover:bg-cyan-400 font-bold py-4 rounded-2xl transition-all shadow-md"
                      >
                        {isAr 
                          ? `المتابعة مع ${deviceEntries.length} ${deviceEntries.length > 1 ? "أجهزة" : "جهاز"}`
                          : `Continue with ${deviceEntries.length} Device(s)`}
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 2: Brand Selection */}
            {currentStep === 2 && currentDeviceData && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <NeonPanel
                  top={
                    <div className="flex items-center gap-2 flex-wrap" dir={isAr ? "rtl" : "ltr"}>
                      <button onClick={() => setCurrentStep(1)} className="text-muted-foreground hover:text-foreground transition-colors">
                        {t(currentDeviceData.name)}
                      </button>
                      <ChevronIcon className="w-4 h-4 text-muted-foreground/60" />
                      <span className="text-cyan-700 dark:text-cyan-300 font-semibold">{t("Select Brand")}</span>
                    </div>
                  }
                  title={t("Select Brand")}
                  description={t("Choose the brand")}
                >
                  <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 auto-rows-fr" dir={isAr ? "rtl" : "ltr"}>
                    {currentDeviceData.brands.map((brand) => {
                      const active = selectedBrand === brand.id
                      return (
                        <button
                          key={brand.id}
                          type="button"
                          onClick={() => handleBrandPick(brand.id)}
                          className={cn(
                            "group relative w-full h-full min-h-[124px] rounded-3xl border bg-card/85 backdrop-blur-xl px-4 py-5 flex flex-col items-center justify-center gap-2 text-center transition-all duration-200 hover:-translate-y-0.5",
                            active
                              ? "border-cyan-500/70 bg-cyan-500/10 shadow-[0_24px_70px_-40px_rgba(6,182,212,0.75)]"
                              : "border-border hover:border-cyan-500/50 hover:shadow-[0_24px_70px_-40px_rgba(6,182,212,0.45)]"
                          )}
                        >
                          <span className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-70" />
                          <span className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(6,182,212,0.22),rgba(0,0,0,0)_65%)]" />

                          <div className={cn(
                            "relative flex items-center justify-center w-12 h-12 rounded-2xl bg-muted/60 ring-1 ring-border transition-all duration-300",
                            active ? "ring-cyan-500/50 bg-cyan-500/10" : "group-hover:ring-cyan-500/40 group-hover:bg-cyan-500/10"
                          )}>
                            <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-cyan-500/10" />
                            <span className={cn("relative text-lg font-bold", active ? "text-cyan-700 dark:text-cyan-300" : "text-foreground group-hover:text-cyan-700 dark:group-hover:text-cyan-300")}>
                              {brand.name.slice(0, 1).toUpperCase()}
                            </span>
                          </div>

                          <div className="text-sm font-semibold text-foreground">{t(brand.name)}</div>
                          <div className="text-xs text-muted-foreground">{t("Select Service")}</div>
                        </button>
                      )
                    })}
                  </div>
                </NeonPanel>
              </motion.div>
            )}

            {/* Step 3: Model Selection */}
            {currentStep === 3 && currentBrandData && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <NeonPanel
                  top={
                    <div className="flex items-center gap-2 mb-2 flex-wrap" dir={isAr ? "rtl" : "ltr"}>
                      <button onClick={() => setCurrentStep(1)} className="text-muted-foreground hover:text-foreground transition-colors">
                        {currentDeviceData?.name ? t(currentDeviceData.name) : ""}
                      </button>
                      <ChevronIcon className="w-4 h-4 text-muted-foreground/60" />
                      <button onClick={() => setCurrentStep(2)} className="text-muted-foreground hover:text-foreground transition-colors">
                        {currentBrandData.name}
                      </button>
                      <ChevronIcon className="w-4 h-4 text-muted-foreground/60" />
                      <span className="text-cyan-700 dark:text-cyan-300 font-semibold">{t("Select Model")}</span>
                    </div>
                  }
                  title={t("Select Model")}
                  description={isAr ? "اختر الموديل" : "Choose the model"}
                >
                  <div className="relative mt-7 max-w-xl mx-auto">
                    <Search className={`pointer-events-none absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground ${isAr ? "right-4" : "left-4"}`} />
                    <input
                      type="search"
                      value={modelSearch}
                      onChange={(event) => setModelSearch(event.target.value)}
                      aria-label={t("Search models")}
                      placeholder={t("Search models")}
                      className={`w-full rounded-2xl border border-input bg-background/80 py-3.5 text-foreground shadow-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 placeholder:text-muted-foreground ${isAr ? "pr-12 pl-4 text-right" : "pl-12 pr-4"}`}
                    />
                  </div>
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 auto-rows-fr" dir={isAr ? "rtl" : "ltr"}>
                    {(() => {
                      let modelsToShow: string[] = []
                      if (selectedDevice === "mobile" && selectedBrand === "apple") {
                        modelsToShow = generateIphoneModelsUpTo2025()
                      } else if (selectedDevice === "mobile" && selectedBrand === "samsung") {
                        modelsToShow = generateSamsungSModelsUpTo2025()
                      } else if (selectedDevice === "tablet" && selectedBrand === "apple-ipad") {
                        modelsToShow = generateYearRangeModels("iPad", 2011, 2025)
                      } else if (selectedDevice === "tablet" && selectedBrand === "samsung-tab") {
                        modelsToShow = generateYearRangeModels("Galaxy Tab", 2012, 2025)
                      } else if (selectedDevice === "pc") {
                        modelsToShow = [
                          ...currentBrandData.models,
                          ...generateYearRangeModels("Model Year", 2015, 2025),
                        ]
                      } else {
                        modelsToShow = currentBrandData.models
                      }

                      modelsToShow = modelsToShow
                        .slice()
                        .reverse()
                        .filter((model) => model.toLowerCase().includes(modelSearch.trim().toLowerCase()))

                      return (
                        <>
                          {modelsToShow.map((model) => {
                            const active = selectedModel === model
                            return (
                              <button
                                key={model}
                                type="button"
                                onClick={() => handleModelPick(model)}
                                className={cn(
                                  "group relative w-full h-full min-h-[112px] rounded-3xl border bg-card/85 backdrop-blur-xl px-4 py-4 flex flex-col items-center justify-center text-center transition-all duration-200 hover:-translate-y-0.5",
                                  active
                                    ? "border-cyan-500/70 bg-cyan-500/10 shadow-[0_24px_70px_-40px_rgba(6,182,212,0.75)]"
                                    : "border-border hover:border-cyan-500/50 hover:shadow-[0_24px_70px_-40px_rgba(6,182,212,0.45)]"
                                )}
                              >
                                <span className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-70" />
                                <span className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(6,182,212,0.22),rgba(0,0,0,0)_65%)]" />
                                <span className="relative text-sm font-semibold text-foreground leading-snug">{isAr ? t(model) : model}</span>
                                <span className="relative text-xs text-muted-foreground mt-1">{t("Select Service")}</span>
                              </button>
                            )
                          })}

                          <button
                            type="button"
                            onClick={() => setIsOtherModel(true)}
                            className="group relative w-full h-full min-h-[112px] rounded-3xl border border-border bg-muted/35 backdrop-blur-xl px-4 py-4 flex flex-col items-center justify-center text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-500/50"
                          >
                            <span className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-70" />
                            <span className="relative text-sm font-semibold text-foreground">{t("Other Model (Enter Manually)")}</span>
                            <span className="relative text-xs text-muted-foreground mt-1">{t("Enter your model manually")}</span>
                          </button>
                        </>
                      )
                    })()}
                  </div>

                  {isOtherModel ? (
                    <div className="mt-6 flex flex-col items-stretch gap-3" dir={isAr ? "rtl" : "ltr"}>
                      <input
                        type="text"
                        value={customModel}
                        onChange={(e) => setCustomModel(e.target.value)}
                        placeholder={t("Enter Model Name")}
                        className="flex-1 px-4 py-3.5 bg-background border border-input rounded-2xl focus:outline-none focus:border-cyan-500/60 transition-colors text-base text-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => customModel && handleModelSelect(`Other: ${customModel}`)}
                        className="w-full px-6 py-3 bg-cyan-500 text-black rounded-2xl font-semibold hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        disabled={!customModel}
                      >
                        {t("Use This Model")}
                        <ChevronIcon className="w-4 h-4 text-black/70" />
                      </button>
                    </div>
                  ) : null}
                </NeonPanel>
              </motion.div>
            )}

            {/* Step 4: Issue Selection - Updated with Add Another Device option */}
            {currentStep === 4 && currentDeviceData && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <NeonPanel
                  top={
                    <div className="flex items-center gap-2 mb-2 flex-wrap" dir={isAr ? "rtl" : "ltr"}>
                      <button onClick={() => setCurrentStep(1)} className="text-muted-foreground hover:text-foreground transition-colors">
                        {t(currentDeviceData.name)}
                      </button>
                      <ChevronIcon className="w-4 h-4 text-muted-foreground/60" />
                      <button onClick={() => setCurrentStep(2)} className="text-muted-foreground hover:text-foreground transition-colors">
                        {currentBrandData?.name ? t(currentBrandData.name) : ""}
                      </button>
                      <ChevronIcon className="w-4 h-4 text-muted-foreground/60" />
                      <button onClick={() => setCurrentStep(3)} className="text-muted-foreground hover:text-foreground transition-colors">
                        {selectedModel ? t(selectedModel) : ""}
                      </button>
                      <ChevronIcon className="w-4 h-4 text-muted-foreground/60" />
                      <span className="text-cyan-700 dark:text-cyan-300 font-semibold">{t("Select Issue")}</span>
                    </div>
                  }
                  title={t("Select Issue")}
                  description={t("Choose the Problem")}
                >
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 auto-rows-fr" dir={isAr ? "rtl" : "ltr"}>
                    {currentDeviceData.issues.map((issue) => {
                      const active = selectedIssues.includes(issue)
                      const isLoading = issuePickingId === issue
                      return (
                        <button
                          key={issue}
                          type="button"
                          onClick={() => handleIssuePick(issue)}
                          className={cn(
                            "group relative w-full min-h-[86px] rounded-3xl border bg-card/85 backdrop-blur-xl px-4 py-4 flex items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-500/50 hover:shadow-[0_24px_70px_-40px_rgba(6,182,212,0.45)]",
                            active ? "border-cyan-500/70 bg-cyan-500/10" : "border-border"
                          )}
                        >
                          <span className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-70" />
                          <span className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(6,182,212,0.22),rgba(0,0,0,0)_65%)]" />

                          <div className={cn(
                            "relative w-10 h-10 rounded-2xl ring-1 flex items-center justify-center shrink-0 transition-all",
                            active ? "bg-cyan-500/20 ring-cyan-500/40" : "bg-muted/60 ring-border group-hover:ring-cyan-500/30"
                          )}>
                            {active ? <Check className="w-5 h-5 text-cyan-600 dark:text-cyan-300" /> : <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />}
                          </div>

                          <div className={cn("relative flex-1 min-w-0", isAr ? "text-right" : "text-left")}>
                            <div className="text-sm font-semibold text-foreground leading-tight">{t(issue)}</div>
                            <div className="mt-1 text-xs text-muted-foreground">{t("Select Service")}</div>
                          </div>

                          <div className={cn(
                            "relative text-xs font-semibold px-2.5 py-1 rounded-full ring-1 shrink-0",
                            active ? "text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 ring-cyan-500/25" : "text-muted-foreground bg-muted/60 ring-border"
                          )}>
                            {repairEstimateLabel(selectedDevice as string, issue)}
                          </div>

                          {isLoading ? (
                            <span className="absolute inset-0 rounded-3xl bg-background/60 backdrop-blur-sm flex items-center justify-center">
                              <Loader2 className="w-5 h-5 text-cyan-600 dark:text-cyan-300 animate-spin" />
                            </span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>

                  {selectedIssues.length > 0 ? (
                    <div className="mt-6 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 p-4" dir={isAr ? "rtl" : "ltr"}>
                      <p className="text-sm text-cyan-700 dark:text-cyan-300 font-semibold">
                        {t("Selected Issues")} ({selectedIssues.length}): {isAr ? selectedIssues.map(i => t(i)).join(", ") : selectedIssues.join(", ")}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-8 flex flex-col gap-3" dir={isAr ? "rtl" : "ltr"}>
                    <button
                      type="button"
                      onClick={proceedToDetails}
                      disabled={selectedIssues.length === 0}
                      className="w-full py-4 bg-cyan-500 text-black rounded-2xl font-semibold text-base hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {t("Continue to Details")}
                      <ChevronIcon className="w-4 h-4 text-black/70" />
                    </button>

                    <div className="rounded-3xl border border-border bg-muted/35 backdrop-blur-xl p-6 text-center shadow-[0_24px_70px_-50px_rgba(6,182,212,0.35)]">
                      <div className="flex items-center justify-center gap-2 text-foreground text-sm">
                        <div className="w-8 h-8 rounded-2xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-500/25 flex items-center justify-center">
                          <Plus className="w-4 h-4" />
                        </div>
                        <span className="font-semibold">{t("Add Another Device")}</span>
                      </div>
                      <p className="mt-3 text-muted-foreground text-sm">{t("One visit, all devices • Single tracking number • Priority scheduling")}</p>
                      <button
                        type="button"
                        onClick={addDeviceToList}
                        disabled={selectedIssues.length === 0}
                        className="mt-5 px-6 py-3 bg-background text-foreground ring-1 ring-border rounded-2xl font-semibold hover:bg-accent hover:ring-cyan-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-5 h-5" />
                        {t("Add Another Device")}
                      </button>
                    </div>
                  </div>
                </NeonPanel>
              </motion.div>
            )}

            {/* Step 5: Contact Details - Updated to show all devices */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <NeonPanel title={t("Your Details")} description={isAr ? "أدخل بياناتك لإتمام الطلب" : "Enter your details to complete the order"}>
                  <form onSubmit={handleSubmit} className="mt-8 space-y-5" suppressHydrationWarning dir={isAr ? "rtl" : "ltr"}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="booking-name" className="block text-sm font-semibold text-foreground/80 mb-2">{t("Full Name *")}</label>
                        <div className="relative">
                          <User className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground ${isAr ? "right-4" : "left-4"}`} />
                          <input
                            type="text"
                            id="booking-name"
                            name="name"
                            autoComplete="name"
                            required
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder={t("Your full name")}
                            className={`w-full py-3.5 bg-background border border-input rounded-2xl focus:outline-none focus:border-cyan-500 transition-colors text-foreground text-base shadow-xs placeholder:text-muted-foreground/60 ${isAr ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left"}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="booking-phone" className="block text-sm font-semibold text-foreground/80 mb-2">{t("Phone Number *")}</label>
                        <div className="relative">
                          <Phone className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground ${isAr ? "right-4" : "left-4"}`} />
                          <input
                            type="tel"
                            id="booking-phone"
                            name="phone"
                            inputMode="tel"
                            autoComplete="tel"
                            required
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="050 XXX XXXX"
                            className={`w-full py-3.5 bg-background border border-input rounded-2xl focus:outline-none focus:border-cyan-500 transition-colors text-foreground text-base shadow-xs placeholder:text-muted-foreground/60 ${isAr ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left"}`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="booking-whatsapp" className="block text-sm font-semibold text-foreground/80 mb-2">{t("WhatsApp")}</label>
                        <div className="relative">
                          <MessageSquare className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground ${isAr ? "right-4" : "left-4"}`} />
                          <input
                            type="tel"
                            id="booking-whatsapp"
                            name="whatsapp"
                            inputMode="tel"
                            value={formData.whatsapp}
                            onChange={handleInputChange}
                            placeholder={t("WhatsApp number (optional)")}
                            className={`w-full py-3.5 bg-background border border-input rounded-2xl focus:outline-none focus:border-cyan-500 transition-colors text-foreground text-base shadow-xs placeholder:text-muted-foreground/60 ${isAr ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left"}`}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="booking-address" className="block text-sm font-semibold text-foreground/80 mb-2">{t("Address / Location *")}</label>
                      <div className="relative">
                        <MapPin className={`absolute top-4 w-5 h-5 text-muted-foreground ${isAr ? "right-4" : "left-4"}`} />
                        <input
                          type="text"
                          id="booking-address"
                          name="address"
                          autoComplete="street-address"
                          required
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder={t("Your address in Abu Dhabi")}
                          className={`w-full py-3.5 bg-background border border-input rounded-2xl focus:outline-none focus:border-cyan-500 transition-colors text-foreground text-base shadow-xs placeholder:text-muted-foreground/60 ${isAr ? "pr-12 pl-32 text-right" : "pl-12 pr-32 text-left"}`}
                        />
                        <button
                          type="button"
                          onClick={detectLocation}
                          disabled={isDetectingLocation}
                          className={`absolute top-1/2 -translate-y-1/2 px-3 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 rounded-xl text-cyan-600 dark:text-cyan-300 text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs ${isAr ? "left-2" : "right-2"}`}
                        >
                          {isDetectingLocation ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              {t("Detecting...")}
                            </>
                          ) : (
                            <>
                              <MapPin className="w-3 h-3" />
                              {t("Detect")}
                            </>
                          )}
                        </button>
                      </div>
                      {locationError && (
                        <p className="text-xs text-destructive mt-1 font-medium">{locationError}</p>
                      )}
                    </div>

                    <div role="group" aria-labelledby="booking-location-type">
                      <div id="booking-location-type" className="block text-sm font-semibold text-foreground/80 mb-2">{t("Location Type")}</div>
                      <div className="grid grid-cols-2 gap-2" dir={isAr ? "rtl" : "ltr"}>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              locationType: "home",
                              companyName: "",
                            }))
                          }
                          className={cn(
                            "w-full py-2.5 rounded-2xl border text-sm font-bold transition-colors cursor-pointer",
                            formData.locationType === "home"
                              ? "bg-cyan-500/20 border-cyan-500 text-cyan-700 dark:text-cyan-300 shadow-xs"
                              : "bg-muted/40 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          {t("Home Location")}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              locationType: "office",
                              unitNumber: "",
                            }))
                          }
                          className={cn(
                            "w-full py-2.5 rounded-2xl border text-sm font-bold transition-colors cursor-pointer",
                            formData.locationType === "office"
                              ? "bg-cyan-500/20 border-cyan-500 text-cyan-700 dark:text-cyan-300 shadow-xs"
                              : "bg-muted/40 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          {t("Office Location")}
                        </button>
                      </div>

                      {formData.locationType === "office" ? (
                        <div className="mt-3">
                          <input
                            type="text"
                            name="companyName"
                            aria-label={t("Company Name")}
                            autoComplete="organization"
                            value={formData.companyName}
                            onChange={handleInputChange}
                            placeholder={t("Company Name")}
                            className={`w-full py-3.5 bg-background border border-input rounded-2xl focus:outline-none focus:border-cyan-500 transition-colors text-foreground text-base shadow-xs placeholder:text-muted-foreground/60 ${isAr ? "pr-4 pl-4 text-right" : "pl-4 pr-4 text-left"}`}
                          />
                        </div>
                      ) : (
                        <div className="mt-3">
                          <input
                            type="text"
                            name="unitNumber"
                            aria-label={t("Apartment / Villa Number")}
                            value={formData.unitNumber}
                            onChange={handleInputChange}
                            placeholder={t("Apartment / Villa Number")}
                            className={`w-full py-3.5 bg-background border border-input rounded-2xl focus:outline-none focus:border-cyan-500 transition-colors text-foreground text-base shadow-xs placeholder:text-muted-foreground/60 ${isAr ? "pr-4 pl-4 text-right" : "pl-4 pr-4 text-left"}`}
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="booking-date" className="block text-sm font-semibold text-foreground/80 mb-2">{t("Preferred Date")}</label>
                        <div className="relative">
                          <Calendar className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground ${isAr ? "right-4" : "left-4"}`} />
                          <input
                              type="date"
                              id="booking-date"
                              name="preferredDate"
                              required
                              min={new Date().toISOString().split("T")[0]}
                              value={formData.preferredDate}
                              onChange={handleInputChange}
                              className={`w-full py-3.5 bg-background border border-input rounded-2xl focus:outline-none focus:border-cyan-500 transition-colors text-foreground text-base cursor-pointer shadow-xs ${isAr ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left"}`}
                            />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="booking-time" className="block text-sm font-semibold text-foreground/80 mb-2">{t("Preferred Time")}</label>
                        <div className="relative">
                          <Clock className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground ${isAr ? "right-4" : "left-4"}`} />
                          <select
                            id="booking-time"
                            name="preferredTime"
                            required
                            value={formData.preferredTime}
                            onChange={handleInputChange}
                            className={`w-full py-3.5 bg-background border border-input rounded-2xl focus:outline-none focus:border-cyan-500 transition-colors text-foreground appearance-none cursor-pointer text-base shadow-xs ${isAr ? "pr-12 pl-12 text-right" : "pl-12 pr-12 text-left"}`}
                          >
                            <option value="" className="bg-popover text-popover-foreground">
                              {t("Select time")}
                            </option>
                            <option value="morning" className="bg-popover text-popover-foreground">
                              {t("Morning (9AM - 12PM)")}
                            </option>
                            <option value="afternoon" className="bg-popover text-popover-foreground">
                              {t("Afternoon (12PM - 5PM)")}
                            </option>
                            <option value="evening" className="bg-popover text-popover-foreground">
                              {t("Evening (5PM - 9PM)")}
                            </option>
                            <option value="asap" className="bg-popover text-popover-foreground">
                              {t("As Soon As Possible")}
                            </option>
                          </select>
                          <ChevronIcon className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none ${isAr ? "left-4" : "right-4"}`} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="booking-notes" className="block text-sm font-semibold text-foreground/80 mb-2">{t("Additional Notes")}</label>
                      <div className="relative">
                        <MessageSquare className={`absolute top-4 w-5 h-5 text-muted-foreground ${isAr ? "right-4" : "left-4"}`} />
                        <textarea
                          id="booking-notes"
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                          placeholder={t("Describe the issue in more detail (optional)")}
                          rows={3}
                          className={`w-full py-3.5 bg-background border border-input rounded-2xl focus:outline-none focus:border-cyan-500 transition-colors text-foreground resize-none text-base shadow-xs placeholder:text-muted-foreground/60 ${isAr ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left"}`}
                        />
                      </div>
                    </div>

                    <div className="relative group bg-card rounded-3xl p-6 border border-border shadow-md" suppressHydrationWarning dir={isAr ? 'rtl' : 'ltr'}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-foreground">
                          {t("Order Summary")} ({deviceEntries.length} {t("Device(s)")})
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentStep(1)
                          }}
                          className="text-xs text-cyan-600 dark:text-cyan-300 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          {t("Add More")}
                        </button>
                      </div>
                      <div className="space-y-3">
                        {deviceEntries.map((entry, index) => (
                          <div key={entry.id} className="relative flex items-start justify-between bg-muted/40 rounded-2xl border border-border p-3.5 hover:bg-muted/70 transition-all overflow-hidden">
                            <div className="space-y-1 text-sm flex-1">
                              {deviceEntries.length > 1 && (
                                <p className="text-xs text-cyan-600 dark:text-cyan-400 font-bold mb-1">{t("Device")} {index + 1}</p>
                              )}
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("Type")}:</span>
                                <span className="font-semibold text-foreground">{isAr ? t(entry.deviceName) : entry.deviceName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("Brand")}:</span>
                                <span className="font-semibold text-foreground">{entry.brandName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("Model")}:</span>
                                <span className="font-semibold text-foreground">{entry.model}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("Issue")}:</span>
                                <span className="font-semibold text-foreground">{isAr ? entry.issues.map(i => t(i)).join(", ") : entry.issues.join(", ")}</span>
                              </div>
                            </div>
                            {deviceEntries.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeDeviceEntry(entry.id)}
                                aria-label={isAr ? "إزالة الجهاز" : "Remove device"}
                                className={`p-1.5 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer ${isAr ? "mr-3" : "ml-3"}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div />
                    </div>

                    <div className="grid gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/8 px-4 py-4 text-sm text-foreground sm:grid-cols-3">
                      {["No payment today", "Quote confirmed before repair", "On-site service in Abu Dhabi"].map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
                          <span>{t(item)}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={deviceEntries.length === 0 || isSubmitting}
                      className="w-full py-4 bg-cyan-500 text-black rounded-2xl font-semibold text-lg hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                      {t("Create Order")}
                    </button>

                    <p className="text-center text-sm text-muted-foreground">
                      {t("By booking, you agree to our terms. Payment is only after successful repair.")}
                    </p>
                  </form>
                </NeonPanel>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Booking-specific WhatsApp chatbot with context */}
        {mounted && (
          <WhatsAppChatbot
            bookingStep={currentStep}
            currentDevice={
              selectedDevice
                ? isAr
                  ? t(currentDeviceData?.name || selectedDevice)
                  : currentDeviceData?.name || selectedDevice
                : undefined
            }
            currentIssue={
              selectedIssues.length > 0
                ? isAr
                  ? selectedIssues.map(i => t(i)).join(", ")
                  : selectedIssues.join(", ")
                : undefined
            }
          />
        )}
    </section>
  )
}
