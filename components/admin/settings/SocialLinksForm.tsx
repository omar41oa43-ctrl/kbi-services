"use client"

import type React from "react"
import { useT } from "@/components/language-provider"
import { Globe, Facebook, Instagram, Linkedin, Twitter } from "lucide-react"
import { SiteSettings } from "@/lib/firestore/schema"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface Props {
  settings: SiteSettings
  setSettings: (_settings: SiteSettings) => void
}

const TiktokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M15.6 3c.4 1.2 1.3 2.1 2.5 2.5.5.2 1 .3 1.6.3v2.7c-1.6 0-3.2-.5-4.5-1.4v6.2c0 3.1-2.5 5.7-5.7 5.7-3.1 0-5.7-2.5-5.7-5.7 0-3.1 2.5-5.7 5.7-5.7.6 0 1.2.1 1.8.3v2.9c-.6-.3-1.2-.5-1.8-.5-1.6 0-2.8 1.3-2.8 2.8s1.3 2.8 2.8 2.8c1.7 0 2.9-1.2 2.9-3.2V3h3.2z" />
  </svg>
)

export function SocialLinksForm({ settings, setSettings }: Props) {
  const t = useT()

  return (
    <Card className="border-border bg-card shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-border/70 pb-4 bg-muted/20">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-cyan-500/10 dark:bg-[#00f5c4]/15 border border-cyan-500/30 dark:border-[#00f5c4]/30 flex items-center justify-center text-cyan-600 dark:text-[#00f5c4]">
            <Globe className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-foreground">{t("Social Media Profiles")}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Official public channels and social presence links.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Facebook */}
        <div className="space-y-1.5 p-3.5 rounded-xl border border-border bg-background/60">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Facebook className="size-3.5" />
              </div>
              <Label className="text-xs font-bold text-foreground">Facebook</Label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">
                {settings.socialLinksEnabled.facebook ? "Active" : "Hidden"}
              </span>
              <Switch
                checked={settings.socialLinksEnabled.facebook}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    socialLinksEnabled: { ...settings.socialLinksEnabled, facebook: checked },
                  })
                }
              />
            </div>
          </div>
          <Input
            value={settings.socialLinks.facebook}
            onChange={(e) =>
              setSettings({ ...settings, socialLinks: { ...settings.socialLinks, facebook: e.target.value } })
            }
            placeholder="https://facebook.com/kbi.services"
            className="bg-background border-input text-foreground text-xs h-9 rounded-lg focus:border-cyan-500"
          />
        </div>

        {/* Instagram */}
        <div className="space-y-1.5 p-3.5 rounded-xl border border-border bg-background/60">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center">
                <Instagram className="size-3.5" />
              </div>
              <Label className="text-xs font-bold text-foreground">Instagram</Label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">
                {settings.socialLinksEnabled.instagram ? "Active" : "Hidden"}
              </span>
              <Switch
                checked={settings.socialLinksEnabled.instagram}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    socialLinksEnabled: { ...settings.socialLinksEnabled, instagram: checked },
                  })
                }
              />
            </div>
          </div>
          <Input
            value={settings.socialLinks.instagram}
            onChange={(e) =>
              setSettings({ ...settings, socialLinks: { ...settings.socialLinks, instagram: e.target.value } })
            }
            placeholder="https://instagram.com/kbi.services"
            className="bg-background border-input text-foreground text-xs h-9 rounded-lg focus:border-cyan-500"
          />
        </div>

        {/* TikTok */}
        <div className="space-y-1.5 p-3.5 rounded-xl border border-border bg-background/60">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-foreground/10 text-foreground flex items-center justify-center">
                <TiktokIcon className="size-3.5" />
              </div>
              <Label className="text-xs font-bold text-foreground">TikTok</Label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">
                {settings.socialLinksEnabled.tiktok ? "Active" : "Hidden"}
              </span>
              <Switch
                checked={settings.socialLinksEnabled.tiktok}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    socialLinksEnabled: { ...settings.socialLinksEnabled, tiktok: checked },
                  })
                }
              />
            </div>
          </div>
          <Input
            value={settings.socialLinks.tiktok}
            onChange={(e) =>
              setSettings({ ...settings, socialLinks: { ...settings.socialLinks, tiktok: e.target.value } })
            }
            placeholder="https://tiktok.com/@kbi.services"
            className="bg-background border-input text-foreground text-xs h-9 rounded-lg focus:border-cyan-500"
          />
        </div>

        {/* Twitter (X) */}
        <div className="space-y-1.5 p-3.5 rounded-xl border border-border bg-background/60">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
                <Twitter className="size-3.5" />
              </div>
              <Label className="text-xs font-bold text-foreground">Twitter / X</Label>
            </div>
          </div>
          <Input
            value={settings.socialLinks.twitter}
            onChange={(e) =>
              setSettings({ ...settings, socialLinks: { ...settings.socialLinks, twitter: e.target.value } })
            }
            placeholder="https://twitter.com/kbi_repairs"
            className="bg-background border-input text-foreground text-xs h-9 rounded-lg focus:border-cyan-500"
          />
        </div>

        {/* LinkedIn */}
        <div className="space-y-1.5 p-3.5 rounded-xl border border-border bg-background/60">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center">
                <Linkedin className="size-3.5" />
              </div>
              <Label className="text-xs font-bold text-foreground">LinkedIn</Label>
            </div>
          </div>
          <Input
            value={settings.socialLinks.linkedin}
            onChange={(e) =>
              setSettings({ ...settings, socialLinks: { ...settings.socialLinks, linkedin: e.target.value } })
            }
            placeholder="https://linkedin.com/company/kbi-repairs"
            className="bg-background border-input text-foreground text-xs h-9 rounded-lg focus:border-cyan-500"
          />
        </div>
      </CardContent>
    </Card>
  )
}
