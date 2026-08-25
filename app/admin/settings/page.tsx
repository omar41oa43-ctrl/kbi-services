"use client"

import { useState, useEffect, useRef } from "react"
import { useT } from "@/components/language-provider"
import { Save, Loader2 } from "lucide-react"
import { auth } from "@/firebase/authClient"
import { onAuthStateChanged } from "firebase/auth"
import type { User, SiteSettings } from "@/lib/firestore/schema"
import { getUserRoleAction } from "@/app/actions/admin-auth"

// Components
import { SiteSettingsForm } from "@/components/admin/settings/SiteSettingsForm"
import { SocialLinksForm } from "@/components/admin/settings/SocialLinksForm"
import { CompanyPresentationForm } from "@/components/admin/settings/CompanyPresentationForm"
import { MyAccountForm } from "@/components/admin/settings/MyAccountForm"
import { UserManagement } from "@/components/admin/settings/UserManagement"
import { useToast } from "@/hooks/use-toast"
import {
  getSiteSettingsAction,
  updateSiteSettingsAction,
  getUsersAction
} from "@/app/actions/admin-settings"

export default function AdminSettingsPage() {
  const t = useT()
  const { toast } = useToast()
  const [authorized, setAuthorized] = useState(false)
  const [myRole, setMyRole] = useState<string | null>(null)

  // Loading
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
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
    workingHoursFriday: ""
  })

  // User Management State
  const [accounts, setAccounts] = useState<User[]>([])

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (isMounted.current) {
          setAuthorized(false)
          setLoading(false)
        }
      } else {
        if (isMounted.current) setAuthorized(true)
        try {
          // 1. Get Role
          const roleRes = await getUserRoleAction(user.uid, user.email)
          if (!isMounted.current) return
          
          const role = (roleRes as any)?.role as string | null
          setMyRole(role || null)

          // 2. Fetch Data via Server Actions
          const [siteSettings, usersList] = await Promise.all([
            getSiteSettingsAction(),
            role === 'super_admin' ? getUsersAction() : Promise.resolve([])
          ])

          if (!isMounted.current) return

          if (siteSettings && Object.keys(siteSettings).length > 0) {
            setSettings(prev => ({
              ...prev,
              ...siteSettings,
              socialLinks: { ...prev.socialLinks, ...(siteSettings as SiteSettings).socialLinks },
              socialLinksEnabled: { ...prev.socialLinksEnabled, ...(siteSettings as SiteSettings).socialLinksEnabled }
            }))
          }
          if (usersList) {
            setAccounts(usersList as User[])
          }
        } catch (e: any) {
          if (!isMounted.current) return
          const errorStr = String(e?.message || e?.name || "").toLowerCase()
          if (errorStr.includes('abort') || errorStr.includes('cancelled') || errorStr.includes('aborted')) return
          toast({ variant: "destructive", title: "Error", description: "Failed to load settings" })
        } finally {
          if (isMounted.current) setLoading(false)
        }
      }
    })
    return () => unsubAuth()
  }, [])

  const saveSettings = async () => {
    setSaving(true)
    try {
      const user = auth.currentUser
      if (!user) throw new Error("Not logged in")
      const idToken = await user.getIdToken()

      const result = await updateSiteSettingsAction(settings, idToken)
      if (result.error) throw new Error(result.error)

      toast({ title: "Success", description: "Site settings saved!" })
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Error saving settings", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (!authorized) return null
  if (loading) return <div className="p-8 text-center text-white/50">{t("Loading settings...")}</div>

  return (
    <section className="pt-2 pb-8 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold">{t("Site Settings")}</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column: General Settings */}
        <SiteSettingsForm settings={settings} setSettings={setSettings} />

        {/* Right Column: Socials, Features, Presentation */}
        <div className="space-y-6">
          <SocialLinksForm settings={settings} setSettings={setSettings} />
          <CompanyPresentationForm settings={settings} setSettings={setSettings} />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-8 py-3 bg-cyan-500 text-black rounded-xl font-semibold hover:bg-cyan-400 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {t("Save Changes")}
        </button>
      </div>

      <div className="mt-10">
        <MyAccountForm />
      </div>

      {myRole === "super_admin" && (
        <div className="mt-10 space-y-10">
          <UserManagement accounts={accounts} />
          <AuditLogViewer />
        </div>
      )}
    </section>
  )
}
import { AuditLogViewer } from "@/components/admin/settings/AuditLogViewer"
