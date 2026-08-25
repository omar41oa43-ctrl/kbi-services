"use client"

import { useEffect, useState, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminAppSidebar } from "@/components/admin/admin-app-sidebar"
import { useLanguage, useT } from "@/components/language-provider"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from "@/firebase/authClient"
import { Loader2, ShieldCheck, AlertTriangle, Download, LayoutDashboard, ShoppingCart, Users, Package, Settings as SettingsIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { NotificationBell } from "@/components/notification-bell"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getUserRoleAction } from "@/app/actions/admin-auth"
import Link from "next/link"
import Dock from "@/components/ui/dock"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { lang, setLang } = useLanguage()
  const t = useT()
  const isAr = lang === "ar"
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const navigatingRef = useRef(false)
  const [role, setRole] = useState<string | null>(null)
  const [roleLoading, setRoleLoading] = useState(false)
  const [online, setOnline] = useState(true)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
      if (currentUser?.uid) {
        setRoleLoading(true)

        // Sync token to cookie for server-side middleware verification
        currentUser.getIdToken().then((token) => {
          const secureFlag = (typeof window !== 'undefined' && window.location.protocol === 'https:') ? 'Secure;' : ''
          document.cookie = `kbi_admin_token=${token}; path=/; max-age=3600; ${secureFlag} SameSite=Strict`
        }).catch(() => {})

        // Timeout race to prevent hanging
        const rolePromise = getUserRoleAction(currentUser.uid, currentUser.email)
        const timeoutPromise = new Promise<null>(resolve => setTimeout(() => resolve(null), 5000))

        Promise.race([rolePromise, timeoutPromise])
          .then((r: any) => {
            if (navigatingRef.current) return // Component is likely unmounting or navigating
            const resolvedRole = r?.role || null
            setRole(resolvedRole)

            const masterEmails = (process.env.NEXT_PUBLIC_MASTER_ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase())
            const isMaster = masterEmails.includes(currentUser.email || "") || currentUser.uid === process.env.NEXT_PUBLIC_MASTER_ADMIN_UID
            if (!isMaster && resolvedRole !== "admin" && resolvedRole !== "super_admin" && resolvedRole !== "technician") {
              signOut(auth).catch(() => {})
            }
          })
          .catch(() => {
            if (navigatingRef.current) return
            setRole(null)
          })
          .finally(() => {
            if (navigatingRef.current) return
            setRoleLoading(false)
          })
      } else {
        // Clear token cookie
        document.cookie = "kbi_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        setRole(null)
        setRoleLoading(false)
      }
    })

    return () => {
      unsubscribe()
      navigatingRef.current = true
    }
  }, [])

  useEffect(() => {
    if (navigatingRef.current) return
    if (loading) return
    if (pathname !== "/admin/login") return
    if (!user) return
    if (roleLoading) return
    if (role === "admin" || role === "super_admin") {
      navigatingRef.current = true
      // Only redirect if explicitly on login and NOT already navigating
      if (pathname === "/admin/login") {
        router.replace("/admin")
      }
    }
  }, [loading, user, roleLoading, role, pathname, router])

  useEffect(() => {
    const update = () => setOnline(typeof navigator !== "undefined" ? navigator.onLine : true)
    update()
    window.addEventListener("online", update)
    window.addEventListener("offline", update)
    return () => {
      window.removeEventListener("online", update)
      window.removeEventListener("offline", update)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    const media = window.matchMedia("(display-mode: standalone)")
    const updateInstalled = () => setIsInstalled(media.matches || !!(window.navigator as Navigator & { standalone?: boolean }).standalone)

    updateInstalled()
    media.addEventListener?.("change", updateInstalled)

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    const onAppInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt)
    window.addEventListener("appinstalled", onAppInstalled)

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/admin-sw.js", { scope: "/admin/" }).catch(() => { })
    }

    return () => {
      media.removeEventListener?.("change", updateInstalled)
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
      window.removeEventListener("appinstalled", onAppInstalled)
    }
  }, [])

  const handleInstallApp = async () => {
    if (!installPrompt || isInstalling) return

    setIsInstalling(true)
    try {
      await installPrompt.prompt()
      const choice = await installPrompt.userChoice
      if (choice.outcome === "accepted") {
        setIsInstalled(true)
      }
      setInstallPrompt(null)
    } finally {
      setIsInstalling(false)
    }
  }

  if (loading || (user && roleLoading && pathname !== "/admin/login")) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  // If on login page, render without sidebar
  if (pathname === "/admin/login") {
    return <div className={cn("min-h-screen bg-black", isAr && "[direction:rtl]")}>{children}</div>
  }

  const getMasterAdmins = () => {
    const envEmails = process.env.NEXT_PUBLIC_MASTER_ADMIN_EMAILS || ""
    return envEmails.split(",").map(e => e.trim().toLowerCase()).filter(Boolean)
  }
  const getMasterUid = () => {
    return process.env.NEXT_PUBLIC_MASTER_ADMIN_UID || ""
  }
  const isMasterAdmin = getMasterAdmins().includes(user?.email || "") || user?.uid === getMasterUid()
  const isTechnician = role === "technician"

  if (!user && pathname !== "/admin/login") {
    return (
      <div className={cn("min-h-screen relative flex items-center justify-center p-6 overflow-hidden bg-black", isAr && "[direction:rtl]")}>
        {/* Animated gradient background - no image needed */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.15),transparent_50%),radial-gradient(ellipse_at_bottom,rgba(139,92,246,0.1),transparent_50%)] animate-pulse" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        
        <div className="relative z-10 max-w-md w-full rounded-3xl border border-white/20 bg-black/40 backdrop-blur-xl p-8 text-center shadow-2xl">
          <div className="text-3xl mb-4">🚫</div>
          <div className="text-2xl font-bold text-white mb-2">{t("Not an admin? Nice try 😄")}</div>
          <div className="mt-2 text-sm text-white/70 mb-8">{t("Please sign in to continue.")}</div>
          <Link
            href="/admin/login"
            className="w-full inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-6 py-3 text-black font-bold hover:bg-cyan-400 transition-all active:scale-95 shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)]"
          >
            {t("Go to Login")}
          </Link>
        </div>
      </div>
    )
  }

  if (user && !isMasterAdmin && !roleLoading && role !== "admin" && role !== "super_admin" && role !== "technician" && pathname !== "/admin/login") {
    return (
      <div className={cn("min-h-screen relative flex items-center justify-center p-6 overflow-hidden bg-black", isAr && "[direction:rtl]")}>
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(239,68,68,0.12),transparent_50%),radial-gradient(ellipse_at_bottom,rgba(139,92,246,0.08),transparent_50%)] animate-pulse" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        <div className="relative z-10 max-w-md w-full rounded-3xl border border-white/20 bg-black/40 backdrop-blur-xl p-8 text-center shadow-2xl">
          <div className="text-3xl mb-4">🚫</div>
          <div className="text-2xl font-bold text-white mb-2">{t("Not an admin? Nice try 😄")}</div>
          <div className="mt-2 text-sm text-white/70 mb-8">{t("Your account does not have admin access.")}</div>
          <Link
            href="/admin/login"
            className="w-full inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-6 py-3 text-black font-bold hover:bg-cyan-400 transition-all active:scale-95 shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)]"
          >
            {t("Back to Login")}
          </Link>
        </div>
      </div>
    )
  }

  const side = isAr ? "right" : "left"

  const dockItems = [
    { icon: <LayoutDashboard size={20} />, label: t("Dashboard"), onClick: () => router.push("/admin") },
    { icon: <ShoppingCart size={20} />, label: t("Orders"), onClick: () => router.push("/admin/orders") },
    { icon: <Package size={20} />, label: t("Inventory"), onClick: () => router.push("/admin/inventory") },
    { icon: <SettingsIcon size={20} />, label: t("Settings"), onClick: () => router.push("/admin/settings") },
  ]

  return (
    <div className={cn("min-h-screen bg-black text-white", isAr && "[direction:rtl]")}>
      <SidebarProvider defaultOpen={true}>
        <div className="hidden lg:block">
          <AdminAppSidebar side={side} />
        </div>
        <main className="relative flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.08),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.06),transparent_45%),radial-gradient(circle_at_20%_80%,rgba(34,197,94,0.05),transparent_40%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:28px_28px] opacity-20" />
          </div>
          <header className="relative z-10 flex items-center gap-4 border-b border-white/10 bg-black/50 px-6 py-3 backdrop-blur-md sticky top-0">
            <SidebarTrigger
              className="hidden lg:inline-flex size-9! rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-white/10 text-white shadow-[0_8px_24px_-10px_rgba(6,182,212,0.45)] hover:shadow-[0_12px_32px_-10px_rgba(6,182,212,0.65)] ring-1 ring-white/10 hover:ring-cyan-400/40 transition-all duration-300 active:scale-95"
              title="Menu"
            />
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <NotificationBell role="admin" />
              {!isInstalled && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl border border-white/10 bg-gradient-to-r from-cyan-500/15 to-blue-500/15 text-cyan-300 hover:text-white hover:from-cyan-500/25 hover:to-blue-500/25"
                  title={t("Install Admin App")}
                  disabled={!installPrompt || isInstalling}
                  onClick={handleInstallApp}
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">{isInstalling ? t("Installing...") : t("Install App")}</span>
                </Button>
              )}
              {user && (
                <div className="hidden md:flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-xs text-white/70">{user.email}</span>
                  {role && (
                    <Badge className="text-[10px] px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                      {role}
                    </Badge>
                  )}
                </div>
              )}
              {role === "super_admin" && (
                <a
                  href="/admin/settings/security"
                  title={t("Security")}
                  className="group relative overflow-hidden size-9 rounded-xl bg-gradient-to-r from-cyan-500/15 to-blue-500/15 border border-white/10 text-white shadow-[0_8px_24px_-10px_rgba(6,182,212,0.45)] hover:shadow-[0_12px_32px_-10px_rgba(6,182,212,0.65)] ring-1 ring-white/10 hover:ring-cyan-400/40 transition-all duration-300 active:scale-95 flex items-center justify-center"
                >
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.06),transparent_45%)]" />
                  <ShieldCheck className="h-5 w-5 text-cyan-400" />
                </a>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="group relative overflow-hidden size-9 rounded-xl bg-gradient-to-r from-red-500/15 to-pink-500/15 border border-white/10 text-white shadow-[0_8px_24px_-10px_rgba(244,63,94,0.45)] hover:shadow-[0_12px_32px_-10px_rgba(244,63,94,0.65)] ring-1 ring-white/10 hover:ring-red-400/40 transition-all duration-300 active:scale-95"
                title={t("Logout")}
                onClick={async () => {
                  try {
                    await signOut(auth)
                    router.replace("/admin/login")
                  } catch { }
                }}
              >
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.06),transparent_45%)]" />
                <LogOut className="h-5 w-5 text-red-400" />
              </Button>
              <button
                onClick={() => setLang("en")}
                className={cn("px-3 py-1 rounded-full text-xs font-semibold border border-white/10 transition-colors", lang === "en" ? "bg-cyan-500 text-black border-cyan-500" : "text-white/70 hover:bg-white/10")}
              >
                EN
              </button>
              <button
                onClick={() => setLang("ar")}
                className={cn("px-3 py-1 rounded-full text-xs font-semibold border border-white/10 transition-colors", lang === "ar" ? "bg-cyan-500 text-black border-cyan-500" : "text-white/70 hover:bg-white/10")}
              >
                AR
              </button>
            </div>
          </header>
          {!online && (
            <div className="relative z-10 px-6 py-2 bg-red-500/10 border-y border-red-500/30 text-red-400 text-sm flex items-center gap-2 justify-center">
              <AlertTriangle className="h-4 w-4" />
              <span>You are offline. Live updates paused.</span>
            </div>
          )}
          <div className="relative z-10 flex-1 overflow-auto p-6 pb-24 lg:pb-6">
            {children}
          </div>
          <div className="lg:hidden">
            <Dock items={dockItems} panelHeight={64} baseItemSize={48} />
          </div>
        </main>
      </SidebarProvider>
    </div>
  )
}
