"use client"

import { useT } from "@/components/language-provider"
import { Building2, Globe2, Clock, Sliders, MapPin, Sparkles } from "lucide-react"
import { SiteSettings } from "@/lib/firestore/schema"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

interface Props {
  settings: SiteSettings
  setSettings: (_settings: SiteSettings) => void
}

export function SiteSettingsForm({ settings, setSettings }: Props) {
  const t = useT()

  return (
    <div className="space-y-6">
      {/* General Company Information */}
      <Card className="border-border bg-card shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/70 pb-4 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-cyan-500/10 dark:bg-[#00f5c4]/15 border border-cyan-500/30 dark:border-[#00f5c4]/30 flex items-center justify-center text-cyan-600 dark:text-[#00f5c4]">
              <Building2 className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">{t("General Information")}</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Company branding, core contacts, and search console verification.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold text-foreground">{t("Company Name")}</Label>
              <Input
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                placeholder="KBI Repairs"
                className="bg-background border-input text-foreground text-xs h-10 rounded-xl focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">{t("Main Phone")}</Label>
              <Input
                value={settings.mainPhone}
                onChange={(e) => setSettings({ ...settings, mainPhone: e.target.value })}
                placeholder="+971502491034"
                dir="ltr"
                className="bg-background border-input text-foreground text-xs h-10 rounded-xl focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">{t("WhatsApp Number")}</Label>
              <Input
                value={settings.whatsapp}
                onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                placeholder="971502491034"
                dir="ltr"
                className="bg-background border-input text-foreground text-xs h-10 rounded-xl focus:border-cyan-500 font-mono"
              />
              <p className="text-[10px] text-muted-foreground">Digits with country code (e.g. 971...)</p>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold text-foreground">{t("Support Email")}</Label>
              <Input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                placeholder="info@kbi.services"
                dir="ltr"
                className="bg-background border-input text-foreground text-xs h-10 rounded-xl focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold text-foreground">{t("Google Search Verification Tag")}</Label>
              <Input
                value={settings.googleSiteVerification || ""}
                onChange={(e) => setSettings({ ...settings, googleSiteVerification: e.target.value })}
                placeholder="google-site-verification=..."
                className="bg-background border-input text-foreground font-mono text-xs h-10 rounded-xl focus:border-cyan-500"
                dir="ltr"
              />
              <p className="text-[10px] text-muted-foreground">
                {t("Paste the HTML meta tag code from Google Search Console.")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address & Footer Content */}
      <Card className="border-border bg-card shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/70 pb-4 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <MapPin className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">{t("Address & Footer Content")}</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Localization for English & Arabic public site footers.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">{t("Address (English)")}</Label>
              <Textarea
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                placeholder="Abu Dhabi, UAE"
                className="bg-background border-input text-foreground text-xs rounded-xl min-h-[70px] focus:border-cyan-500 resize-y"
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">{t("Address (Arabic)")}</Label>
              <Textarea
                value={settings.addressAr || ""}
                onChange={(e) => setSettings({ ...settings, addressAr: e.target.value })}
                placeholder="أبوظبي، الإمارات العربية المتحدة"
                className="bg-background border-input text-foreground text-xs rounded-xl min-h-[70px] focus:border-cyan-500 resize-y text-right"
                dir="rtl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">{t("Footer Tagline (English)")}</Label>
              <Textarea
                value={settings.footerText}
                onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                placeholder="Your trusted on-site tech repair partner."
                className="bg-background border-input text-foreground text-xs rounded-xl min-h-[70px] focus:border-cyan-500 resize-y"
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">{t("Footer Tagline (Arabic)")}</Label>
              <Textarea
                value={settings.footerTextAr || ""}
                onChange={(e) => setSettings({ ...settings, footerTextAr: e.target.value })}
                placeholder="شريكك التقني الموثوق لصيانة الأجهزة..."
                className="bg-background border-input text-foreground text-xs rounded-xl min-h-[70px] focus:border-cyan-500 resize-y text-right"
                dir="rtl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operations, Service Areas & Working Hours */}
      <Card className="border-border bg-card shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/70 pb-4 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">{t("Operations & Working Hours")}</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Service coverage areas and active working schedules.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">{t("Service Areas List")}</Label>
            <Textarea
              value={settings.serviceAreas || ""}
              onChange={(e) => setSettings({ ...settings, serviceAreas: e.target.value })}
              className="bg-background border-input text-foreground text-xs rounded-xl min-h-[60px] focus:border-cyan-500 resize-y"
              placeholder="Abu Dhabi Downtown, Al Reem Island, Al Maryah Island, Yas Island, Khalifa City, Saadiyat"
              dir="ltr"
            />
            <p className="text-[10px] text-muted-foreground">Separate coverage locations with commas.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">{t("Working Hours (Weekdays)")}</Label>
              <Input
                value={settings.workingHoursWeekdays || ""}
                onChange={(e) => setSettings({ ...settings, workingHoursWeekdays: e.target.value })}
                className="bg-background border-input text-foreground text-xs h-10 rounded-xl focus:border-cyan-500"
                placeholder="8:00 AM – 10:00 PM"
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">{t("Working Hours (Friday)")}</Label>
              <Input
                value={settings.workingHoursFriday || ""}
                onChange={(e) => setSettings({ ...settings, workingHoursFriday: e.target.value })}
                className="bg-background border-input text-foreground text-xs h-10 rounded-xl focus:border-cyan-500"
                placeholder="2:00 PM – 10:00 PM"
                dir="ltr"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags & Portal Controls */}
      <Card className="border-border bg-card shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/70 pb-4 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Sliders className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">{t("Feature Flags & Security")}</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Toggle public portal capabilities and administrative features.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background/60 hover:bg-muted/40 transition-colors">
            <div>
              <p className="text-xs font-bold text-foreground">{t("Enable Order Countdown Timer")}</p>
              <p className="text-[11px] text-muted-foreground">Displays live technician arrival timer on tracking pages.</p>
            </div>
            <Switch
              checked={settings.enableCountdown}
              onCheckedChange={(checked) => setSettings({ ...settings, enableCountdown: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background/60 hover:bg-muted/40 transition-colors">
            <div>
              <p className="text-xs font-bold text-foreground">{t("Enable Corporate Services Page")}</p>
              <p className="text-[11px] text-muted-foreground">Allows B2B companies to submit corporate bulk repair inquiries.</p>
            </div>
            <Switch
              checked={settings.enableCorporatePage}
              onCheckedChange={(checked) => setSettings({ ...settings, enableCorporatePage: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background/60 hover:bg-muted/40 transition-colors">
            <div>
              <p className="text-xs font-bold text-foreground">{t("Enable Custom Device Model Entry")}</p>
              <p className="text-[11px] text-muted-foreground">Permits customers to type custom models not in preset catalogs.</p>
            </div>
            <Switch
              checked={settings.enableOtherModel}
              onCheckedChange={(checked) => setSettings({ ...settings, enableOtherModel: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
            <div>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-300 flex items-center gap-1.5">
                <Sparkles className="size-3.5" />
                {t("Allow New Admin Registration")}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Enables sign-up link on admin login page. Disable once your initial team is onboarded.
              </p>
            </div>
            <Switch
              checked={settings.allowRegistration ?? true}
              onCheckedChange={(checked) => setSettings({ ...settings, allowRegistration: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
