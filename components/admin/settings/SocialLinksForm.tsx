
"use client"

import type React from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { useT } from "@/components/language-provider"
import { Facebook, Globe, Instagram, Linkedin, Twitter } from "lucide-react"
import { SiteSettings } from "@/lib/firestore/schema"

interface Props {
    settings: SiteSettings
    setSettings: (s: SiteSettings) => void
}

const TiktokIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
        <path d="M15.6 3c.4 1.2 1.3 2.1 2.5 2.5.5.2 1 .3 1.6.3v2.7c-1.6 0-3.2-.5-4.5-1.4v6.2c0 3.1-2.5 5.7-5.7 5.7-3.1 0-5.7-2.5-5.7-5.7 0-3.1 2.5-5.7 5.7-5.7.6 0 1.2.1 1.8.3v2.9c-.6-.3-1.2-.5-1.8-.5-1.6 0-2.8 1.3-2.8 2.8s1.3 2.8 2.8 2.8c1.7 0 2.9-1.2 2.9-3.2V3h3.2z" />
    </svg>
)

export function SocialLinksForm({ settings, setSettings }: Props) {
    const t = useT()

    return (
        <GlassCard>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                {t("Social Media")}
            </h2>
            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-blue-400">
                                <Facebook className="w-4 h-4" />
                            </div>
                            <label className="block text-xs text-white/50">Facebook</label>
                        </div>
                        <label className="flex items-center gap-2 text-xs text-white/60">
                            <input
                                type="checkbox"
                                checked={settings.socialLinksEnabled.facebook}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    socialLinksEnabled: { ...settings.socialLinksEnabled, facebook: e.target.checked }
                                })}
                                className="w-4 h-4 accent-cyan-500"
                            />
                            {settings.socialLinksEnabled.facebook ? t("Enabled") : t("Disabled")}
                        </label>
                    </div>
                    <input
                        value={settings.socialLinks.facebook}
                        onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, facebook: e.target.value } })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                        placeholder="https://facebook.com/..."
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-pink-400">
                                <Instagram className="w-4 h-4" />
                            </div>
                            <label className="block text-xs text-white/50">Instagram</label>
                        </div>
                        <label className="flex items-center gap-2 text-xs text-white/60">
                            <input
                                type="checkbox"
                                checked={settings.socialLinksEnabled.instagram}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    socialLinksEnabled: { ...settings.socialLinksEnabled, instagram: e.target.checked }
                                })}
                                className="w-4 h-4 accent-cyan-500"
                            />
                            {settings.socialLinksEnabled.instagram ? t("Enabled") : t("Disabled")}
                        </label>
                    </div>
                    <input
                        value={settings.socialLinks.instagram}
                        onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, instagram: e.target.value } })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                        placeholder="https://instagram.com/..."
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70">
                                <TiktokIcon className="w-4 h-4" />
                            </div>
                            <label className="block text-xs text-white/50">TikTok</label>
                        </div>
                        <label className="flex items-center gap-2 text-xs text-white/60">
                            <input
                                type="checkbox"
                                checked={settings.socialLinksEnabled.tiktok}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    socialLinksEnabled: { ...settings.socialLinksEnabled, tiktok: e.target.checked }
                                })}
                                className="w-4 h-4 accent-cyan-500"
                            />
                            {settings.socialLinksEnabled.tiktok ? t("Enabled") : t("Disabled")}
                        </label>
                    </div>
                    <input
                        value={settings.socialLinks.tiktok}
                        onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, tiktok: e.target.value } })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                        placeholder="https://tiktok.com/@..."
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70">
                            <Twitter className="w-4 h-4" />
                        </div>
                        <label className="block text-xs text-white/50">Twitter (X)</label>
                    </div>
                    <input
                        value={settings.socialLinks.twitter}
                        onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, twitter: e.target.value } })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                        placeholder="https://twitter.com/..."
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sky-400">
                            <Linkedin className="w-4 h-4" />
                        </div>
                        <label className="block text-xs text-white/50">LinkedIn</label>
                    </div>
                    <input
                        value={settings.socialLinks.linkedin}
                        onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, linkedin: e.target.value } })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                        placeholder="https://linkedin.com/..."
                    />
                </div>
            </div>
        </GlassCard>
    )
}
