"use client"

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { onAuthStateChanged, signOut, type User } from "firebase/auth"
import { AlertTriangle, Languages, Loader2, Search } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { getUserRoleAction } from "@/app/actions/admin-auth"
import { AdminAppSidebar } from "@/components/admin/admin-app-sidebar"
import { useLanguage, useT } from "@/components/language-provider"
import { NotificationBell } from "@/components/notification-bell"
import { ThemeToggle } from "@/components/theme-toggle"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { auth } from "@/firebase/authClient"
import { cn } from "@/lib/utils"

const pageNames: Array<[string, string]> = [
  ["/admin/settings/security", "Security"],
  ["/admin/inbox/corporate", "Corporate Requests"],
  ["/admin/analytics", "Analytics"],
  ["/admin/tracking", "Live Tracking"],
  ["/admin/requests", "Technician Requests"],
  ["/admin/subscriptions", "Technician Operations"],
  ["/admin/technicians", "Technicians"],
  ["/admin/inventory", "Inventory"],
  ["/admin/settings", "Settings"],
  ["/admin/orders", "Orders"],
  ["/admin", "Dashboard"],
]

function AccessCard({
  title,
  description,
  actionLabel,
}: {
  title: string
  description: string
  actionLabel: string
}) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle />
            <AlertTitle>Admin access required</AlertTitle>
            <AlertDescription>Sign in with a verified KBI administrator account.</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full"><Link href="/admin/login">{actionLabel}</Link></Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { lang, setLang } = useLanguage()
  const t = useT()
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("kbi_admin_role")
    }
    return null
  })
  const [roleLoading, setRoleLoading] = useState(false)
  const [online, setOnline] = useState(true)
  const [globalSearch, setGlobalSearch] = useState("")
  const globalSearchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let active = true
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!active) return
      setUser(currentUser)
      setLoading(false)

      if (!currentUser) {
        setRole(null)
        if (typeof window !== "undefined") sessionStorage.removeItem("kbi_admin_role")
        setRoleLoading(false)
        return
      }

      const cachedRole = typeof window !== "undefined" ? sessionStorage.getItem("kbi_admin_role") : null
      if (!cachedRole) {
        setRoleLoading(true)
      }

      currentUser.getIdToken()
        .then((token) => getUserRoleAction(token))
        .then((result) => {
          if (!active) return
          const nextRole = result?.role || null
          setRole(nextRole)
          if (typeof window !== "undefined") {
            if (nextRole) sessionStorage.setItem("kbi_admin_role", nextRole)
            else sessionStorage.removeItem("kbi_admin_role")
          }
          if (nextRole !== "admin" && nextRole !== "super_admin") signOut(auth).catch(() => undefined)
        })
        .catch(() => {
          if (active && !cachedRole) setRole(null)
        })
        .finally(() => {
          if (active) setRoleLoading(false)
        })
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        globalSearchRef.current?.focus()
      }
    }
    window.addEventListener("keydown", focusSearch)
    return () => window.removeEventListener("keydown", focusSearch)
  }, [])

  useEffect(() => {
    const updateStatus = () => setOnline(navigator.onLine)
    updateStatus()
    window.addEventListener("online", updateStatus)
    window.addEventListener("offline", updateStatus)
    return () => {
      window.removeEventListener("online", updateStatus)
      window.removeEventListener("offline", updateStatus)
    }
  }, [])

  const pageName = useMemo(
    () => pageNames.find(([path]) => path === "/admin" ? pathname === path : pathname.startsWith(path))?.[1] || "Admin",
    [pathname],
  )

  const submitGlobalSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = globalSearch.trim()
    const destination = query ? `/admin/orders?q=${encodeURIComponent(query)}` : "/admin/orders"
    if (pathname.startsWith("/admin/orders")) {
      window.history.replaceState(window.history.state, "", destination)
      window.dispatchEvent(new CustomEvent("kbi:order-search", { detail: query }))
    } else {
      router.push(destination)
    }
  }

  const updateGlobalSearch = (value: string) => {
    setGlobalSearch(value)
    if (!pathname.startsWith("/admin/orders")) return
    const query = value.trim()
    const destination = query ? `/admin/orders?q=${encodeURIComponent(query)}` : "/admin/orders"
    window.history.replaceState(window.history.state, "", destination)
    window.dispatchEvent(new CustomEvent("kbi:order-search", { detail: query }))
  }

  if (loading || (user && roleLoading && pathname !== "/admin/login")) {
    return <div className="flex min-h-svh items-center justify-center bg-background"><Loader2 className="size-6 animate-spin" /></div>
  }

  if (pathname === "/admin/login") {
    return <div className={cn("min-h-svh bg-background", lang === "ar" && "[direction:rtl]")}>{children}</div>
  }

  if (!user) {
    return <AccessCard title={t("Sign in required")} description={t("Your admin session is not active.")} actionLabel={t("Go to login")} />
  }

  if (role !== "admin" && role !== "super_admin") {
    return <AccessCard title={t("Access denied")} description={t("This account does not have administrator access.")} actionLabel={t("Back to login")} />
  }

  return (
    <div className={cn("admin-theme min-h-svh bg-background text-foreground relative selection:bg-primary/20 selection:text-primary", lang === "ar" && "[direction:rtl]")}>
      {/* Background ambient lighting effects */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-50">
        <div className="absolute -top-40 -left-40 size-[32rem] rounded-full bg-cyan-400/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 size-[30rem] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute -bottom-60 left-1/3 size-[36rem] rounded-full bg-indigo-400/8 blur-[130px]" />
      </div>

      <SidebarProvider
        defaultOpen
        style={{ "--sidebar-width": "15.5rem", "--sidebar-width-icon": "3.25rem" } as CSSProperties}
      >
        <AdminAppSidebar side={lang === "ar" ? "right" : "left"} />
        <SidebarInset className="relative z-10 min-w-0 w-auto overflow-hidden border border-white/70 dark:border-white/10 bg-background/80 backdrop-blur-3xl shadow-[0_25px_80px_rgba(41,72,112,.12)] dark:shadow-black/30 md:rounded-[24px] md:m-3 md:ml-0">
          <header className="sticky top-0 z-30 grid min-h-[70px] shrink-0 grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-border/40 bg-background/65 px-4 md:px-6 backdrop-blur-3xl transition-all">
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger className="-ml-1 rounded-xl size-9 text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200" />
              <Separator orientation="vertical" className="h-5 bg-border/60" />
              <Breadcrumb className="min-w-0">
                <BreadcrumbList className="flex-nowrap">
                  <BreadcrumbItem className="hidden sm:inline-flex">
                    <BreadcrumbLink asChild>
                      <Link href="/admin" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors">
                        Admin
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden sm:block text-muted-foreground/40" />
                  <BreadcrumbItem className="min-w-0">
                    <BreadcrumbPage className="truncate font-bold text-sm bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
                      {t(pageName)}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <form onSubmit={submitGlobalSearch} className="mx-auto hidden h-11 w-full max-w-[490px] items-center gap-3 rounded-2xl border border-border/60 bg-white/60 px-4 shadow-[0_8px_24px_rgba(44,75,116,.07)] backdrop-blur-2xl md:flex dark:bg-slate-900/60">
              <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <input
                ref={globalSearchRef}
                type="search"
                name="q"
                value={globalSearch}
                onChange={(event) => updateGlobalSearch(event.target.value)}
                aria-label={t("Search orders")}
                placeholder={t("Search orders, customers, devices...")}
                className="min-w-0 flex-1 border-0 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button type="submit" className="sr-only">{t("Search orders")}</button>
              <kbd className="hidden rounded-md border border-border/70 bg-background/70 px-1.5 py-0.5 font-sans text-[10px] text-muted-foreground lg:inline">⌘ K</kbd>
            </form>

            <div className="flex items-center gap-2.5">
              <div className={cn("hidden items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold lg:flex border transition-all", online ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" : "bg-rose-500/10 text-rose-500 border-rose-500/30")}>
                <span className={cn("size-2 rounded-full", online ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                {online ? t("Live Sync") : t("Offline")}
              </div>

              <ThemeToggle />

              <NotificationBell role="admin" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon-sm" className="rounded-xl size-8 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={t("Language")}>
                    <Languages className="size-4 text-slate-500 dark:text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 z-50 bg-white dark:bg-[#0D1217] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 rounded-2xl">
                  <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 p-2">{t("Language")}</DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-slate-800" />
                  <DropdownMenuRadioGroup value={lang} onValueChange={(value) => setLang(value as "en" | "ar")}>
                    <DropdownMenuRadioItem value="en" className="rounded-xl cursor-pointer py-2 text-xs">English</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="ar" className="rounded-xl cursor-pointer py-2 text-xs">العربية</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {!online && (
            <Alert variant="destructive" className="m-4 mb-0 rounded-2xl border-destructive/30 bg-destructive/10">
              <AlertTriangle className="size-5" />
              <AlertTitle className="font-bold">{t("You are offline")}</AlertTitle>
              <AlertDescription>{t("Live updates are paused until the connection returns.")}</AlertDescription>
            </Alert>
          )}

          <div className="min-w-0 flex-1 overflow-auto p-4 md:p-6 lg:p-7">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
