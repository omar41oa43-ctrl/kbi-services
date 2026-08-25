"use client"

import { useState, useEffect, useRef } from "react"
import { useT } from "@/components/language-provider"
import { Save, Loader2, Settings, ShieldCheck, CheckCircle2 } from "lucide-react"
import { auth } from "@/firebase/authClient"
import { onAuthStateChanged } from "firebase/auth"
import type { User, SiteSettings } from "@/lib/firestore/schema"
import { getUserRoleAction } from "@/app/actions/admin-auth"
import { Button } from "@/components/ui/button"

// Components
import { SiteSettingsForm } from "@/components/admin/settings/SiteSettingsForm"
import { SocialLinksForm } from "@/components/admin/settings/SocialLinksForm"
import { CompanyPresentationForm } from "@/components/admin/settings/CompanyPresentationForm"
import { MyAccountForm } from "@/components/admin/settings/MyAccountForm"
import { UserManagement } from "@/components/admin/settings/UserManagement"
import { AuditLogViewer } from "@/components/admin/settings/AuditLogViewer"
import { useToast } from "@/hooks/use-toast"
import {
  getSiteSettingsAction,
  updateSiteSettingsAction,
  getUsersAction,
} from "@/app/actions/admin-settings"

export default function AdminSettingsPage() {
  const t = useT()
  const { toast } = useToast()
  const [authorized, setAuthorized] = useState(() => {
    if (typeof window !== "undefined") {
      const storedRole = sessionStorage.getItem("kbi_admin_role")
      return storedRole === "admin" || storedRole === "super_admin"
    }
    return true
  })
  const [myRole, setMyRole] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("kbi_admin_role")
    }
    return null
  })

  // Loading
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  // Site Settings State
  const [settings, setSettings] = useState<SiteSettings>({
    companyName: "",
    mainPhone: "",
    whatsapp: "",
    email: "",
    address: "",
    addressAr: "",
    footerText: "",
    footerTextAr: "",
    socialLinks: { facebook: "", instagram: "", twitter: "", linkedin: "", tiktok: "" },
    socialLinksEnabled: { facebook: true, instagram: true, tiktok: true },
    enableCountdown: true,
    enableCorporatePage: true,
    enableOtherModel: false,
    companyPresentationUrl: "",
    serviceAreas: "",
    workingHoursWeekdays: "",
    workingHoursFriday: "",
  })

  // User Management State
  const [accounts, setAccounts] = useState<User[]>([])

  // Fast background data loading
  useEffect(() => {
    let active = true

    // 1. Fetch site settings immediately in parallel without waiting for auth handshake
    getSiteSettingsAction()
      .then((siteSettings) => {
        if (!active || !isMounted.current) return
        if (siteSettings && Object.keys(siteSettings).length > 0) {
          setSettings((prev) => ({
            ...prev,
            ...siteSettings,
            socialLinks: { ...prev.socialLinks, ...(siteSettings as SiteSettings).socialLinks },
            socialLinksEnabled: { ...prev.socialLinksEnabled, ...(siteSettings as SiteSettings).socialLinksEnabled },
          }))
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active && isMounted.current) setLoading(false)
      })

    // 2. Auth listener for permissions & user management
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!active) return
      if (!user) {
        if (isMounted.current) {
          const storedRole = typeof window !== "undefined" ? sessionStorage.getItem("kbi_admin_role") : null
          if (!storedRole) setAuthorized(false)
          setLoading(false)
        }
      } else {
        if (isMounted.current) setAuthorized(true)
        try {
          const token = await user.getIdToken()
          if (!active || !isMounted.current) return

          // Get role
          const roleRes = await getUserRoleAction(token)
          if (!active || !isMounted.current) return

          const role = (roleRes as any)?.role as string | null
          setMyRole(role || null)
          if (role && typeof window !== "undefined") {
            sessionStorage.setItem("kbi_admin_role", role)
          }

          // Fetch accounts only if super_admin
          if (role === "super_admin") {
            const usersList = await getUsersAction()
            if (active && isMounted.current && usersList) {
              setAccounts(usersList as User[])
            }
          }
        } catch (e: any) {
          if (!isMounted.current) return
          const errorStr = String(e?.message || e?.name || "").toLowerCase()
          if (errorStr.includes("abort") || errorStr.includes("cancelled") || errorStr.includes("aborted")) return
        }
      }
    })

    return () => {
      active = false
      unsubAuth()
    }
  }, [])

  const saveSettings = async () => {
    setSaving(true)
    try {
      const user = auth.currentUser
      if (!user) throw new Error("Not logged in")
      const idToken = await user.getIdToken()

      const result = await updateSiteSettingsAction(settings, idToken)
      if (result.error) throw new Error(result.error)

      toast({ title: "Settings Saved", description: "Site configurations updated successfully." })
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Error saving settings", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (!authorized) return null

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header with Sticky Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-2xl bg-cyan-500/10 dark:bg-[#00f5c4]/15 border border-cyan-500/30 dark:border-[#00f5c4]/30 flex items-center justify-center text-cyan-600 dark:text-[#00f5c4] shadow-sm">
            <Settings className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">{t("Site Settings & Operations")}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("Configure public company contact details, localization, social profiles, and operational parameters.")}
            </p>
          </div>
        </div>

        <Button
          onClick={saveSettings}
          disabled={saving}
          className="h-10 rounded-xl bg-cyan-600 dark:bg-[#00f5c4] hover:bg-cyan-500 dark:hover:bg-[#00d8a7] text-white dark:text-[#0b0f14] font-extrabold text-xs px-6 shadow-sm self-start sm:self-auto"
        >
          {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
          {t("Save All Changes")}
        </Button>
      </div>

      {/* Main Grid: 7 cols left, 5 cols right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: General Info, Localization & Features */}
        <div className="lg:col-span-7 space-y-6">
          <SiteSettingsForm settings={settings} setSettings={setSettings} />
        </div>

        {/* Right Column: Social Links, Company Deck & My Account */}
        <div className="lg:col-span-5 space-y-6">
          <SocialLinksForm settings={settings} setSettings={setSettings} />
          <CompanyPresentationForm settings={settings} setSettings={setSettings} />
          <MyAccountForm />
        </div>
      </div>

      {/* Super Admin User Directory & Logs */}
      {myRole === "super_admin" && (
        <div className="pt-6 border-t border-border space-y-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-lg font-black text-foreground">Super Administrator Controls</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6">
              <UserManagement accounts={accounts} />
            </div>
            <div className="lg:col-span-6">
              <AuditLogViewer />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
