
"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { useT } from "@/components/language-provider"
import { Settings as SettingsIcon } from "lucide-react"
import { SiteSettings } from "@/lib/firestore/schema"

interface Props {
    settings: SiteSettings
    setSettings: (s: SiteSettings) => void
}

export function SiteSettingsForm({ settings, setSettings }: Props) {
    const t = useT()

    return (
        <GlassCard>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-cyan-400" />
                {t("General Information")}
            </h2>
            <div className="space-y-4">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs text-white/50 mb-1">{t("Company Name")}</label>
                            <input
                                value={settings.companyName}
                                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-white/50 mb-1">{t("Main Phone")}</label>
                            <input
                                value={settings.mainPhone}
                                onChange={(e) => setSettings({ ...settings, mainPhone: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                                placeholder="+971500000000"
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-white/50 mb-1">{t("WhatsApp Number")}</label>
                            <input
                                value={settings.whatsapp}
                                onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                                placeholder="e.g. 971507313446"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                                dir="ltr"
                            />
                            <p className="text-[10px] text-white/40 mt-1">Digits only. Used for wa.me links.</p>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs text-white/50 mb-1">{t("Email")}</label>
                            <input
                                value={settings.email}
                                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                                dir="ltr"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs text-white/50 mb-1">{t("Google Verification Code")}</label>
                            <input
                                value={settings.googleSiteVerification || ""}
                                onChange={(e) => setSettings({ ...settings, googleSiteVerification: e.target.value })}
                                placeholder="google-site-verification=..."
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500 font-mono text-sm"
                                dir="ltr"
                            />
                            <p className="text-[10px] text-white/40 mt-1">
                                {t("Paste the HTML tag content from Google Search Console.")}
                            </p>
                        </div>
                    </div>

                    <div className="h-px bg-white/5" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-white/50 mb-1">{t("Address (English)")}</label>
                            <textarea
                                value={settings.address}
                                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500 min-h-24 max-h-60 resize-y overflow-y-auto"
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-white/50 mb-1">{t("Address (Arabic)")}</label>
                            <textarea
                                value={settings.addressAr || ""}
                                onChange={(e) => setSettings({ ...settings, addressAr: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500 text-right min-h-24 max-h-60 resize-y overflow-y-auto"
                                dir="rtl"
                                placeholder="أبو ظبي، الإمارات"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-white/50 mb-1">{t("Footer Text (English)")}</label>
                            <textarea
                                value={settings.footerText}
                                onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500 min-h-24 max-h-60 resize-y overflow-y-auto"
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-white/50 mb-1">{t("Footer Text (Arabic)")}</label>
                            <textarea
                                value={settings.footerTextAr || ""}
                                onChange={(e) => setSettings({ ...settings, footerTextAr: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500 min-h-24 max-h-60 resize-y overflow-y-auto text-right"
                                dir="rtl"
                                placeholder="شريكك التقني الموثوق..."
                            />
                        </div>
                    </div>
                </div>

                <div className="h-px bg-white/5 my-6" />

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4 text-white/80">{t("Service Details")}</h3>
                    <div>
                        <label className="block text-xs text-white/50 mb-1">{t("Service Areas List")}</label>
                        <textarea
                            value={settings.serviceAreas || ""}
                            onChange={(e) => setSettings({ ...settings, serviceAreas: e.target.value })}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500 h-24"
                            placeholder="Al Reem Island, Khalifa City, ..."
                            dir="ltr"
                        />
                        <p className="text-[10px] text-white/40 mt-1">Comma separated list of areas.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-white/50 mb-1">{t("Working Hours (Weekdays)")}</label>
                            <input
                                value={settings.workingHoursWeekdays || ""}
                                onChange={(e) => setSettings({ ...settings, workingHoursWeekdays: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                                placeholder="8:00 AM - 10:00 PM"
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-white/50 mb-1">{t("Working Hours (Friday)")}</label>
                            <input
                                value={settings.workingHoursFriday || ""}
                                onChange={(e) => setSettings({ ...settings, workingHoursFriday: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                                placeholder="2:00 PM - 10:00 PM"
                                dir="ltr"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <SettingsIcon className="w-4 h-4 text-cyan-400" />
                        {t("Features")}
                    </h3>
                    <div className="space-y-4">
                        <label className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10">
                            <span className="font-medium">{t("Enable Order Countdown")}</span>
                            <input type="checkbox" checked={settings.enableCountdown} onChange={(e) => setSettings({ ...settings, enableCountdown: e.target.checked })} className="w-5 h-5 accent-cyan-500" />
                        </label>
                        <label className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10">
                            <span className="font-medium">{t("Enable Corporate Page")}</span>
                            <input type="checkbox" checked={settings.enableCorporatePage} onChange={(e) => setSettings({ ...settings, enableCorporatePage: e.target.checked })} className="w-5 h-5 accent-cyan-500" />
                        </label>
                        <label className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10">
                            <span className="font-medium">{t("Enable Other Model (Manual Entry)")}</span>
                            <input type="checkbox" checked={settings.enableOtherModel} onChange={(e) => setSettings({ ...settings, enableOtherModel: e.target.checked })} className="w-5 h-5 accent-cyan-500" />
                        </label>
                        <label className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10">
                            <span className="font-medium text-amber-300">{t("Allow Admin Registration")}</span>
                            <input type="checkbox" checked={settings.allowRegistration ?? true} onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })} className="w-5 h-5 accent-cyan-500" />
                        </label>
                    </div>
                    <p className="text-xs text-amber-500/50 mt-2 px-1">
                        {t('* Enable "Allow Admin Registration" to let new admins create accounts on the login page. Disable it immediately after setup.')}
                    </p>
                </div>
            </div>
        </GlassCard>
    )
}
