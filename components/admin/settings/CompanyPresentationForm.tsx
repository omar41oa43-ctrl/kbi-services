
"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { useT } from "@/components/language-provider"
import { FileText, Upload, Trash2, Loader2 } from "lucide-react"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "@/firebase/storageClient"
import { SiteSettings } from "@/lib/firestore/schema"
import { useState } from "react"
import { logAdminAction } from "@/lib/logging/actionLogger"
import { auth } from "@/firebase/authClient"

interface Props {
    settings: SiteSettings
    setSettings: (_s: SiteSettings) => void
}

export function CompanyPresentationForm({ settings, setSettings }: Props) {
    const t = useT()
    const [uploading, setUploading] = useState(false)

    const handleUploadPDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return
        const file = e.target.files[0]
        setUploading(true)
        try {
            const storageRef = ref(storage, `company/${Date.now()}_${file.name}`)
            await uploadBytes(storageRef, file)
            const url = await getDownloadURL(storageRef)
            setSettings({ ...settings, companyPresentationUrl: url })

            if (auth.currentUser) {
                logAdminAction({
                    action: "Uploaded Company Presentation",
                    actorUid: auth.currentUser.uid,
                    actorEmail: auth.currentUser.email || "unknown",
                    details: { fileName: file.name, url }
                })
            }
        } catch {
            alert("Upload failed")
        } finally {
            setUploading(false)
        }
    }

    const clearPDF = () => {
        setSettings({ ...settings, companyPresentationUrl: "" })
        if (auth.currentUser) {
            logAdminAction({
                action: "Removed Company Presentation",
                actorUid: auth.currentUser.uid,
                actorEmail: auth.currentUser.email || "unknown"
            })
        }
    }

    return (
        <GlassCard>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                {t("Company Presentation (PDF)")}
            </h2>
            <div className="space-y-4">
                {settings.companyPresentationUrl ? (
                    <div className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-cyan-400">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-medium text-white">{t("Company Presentation")}</p>
                                <a href={settings.companyPresentationUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 underline">{t("View PDF")}</a>
                            </div>
                        </div>
                        <button onClick={clearPDF} className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => document.getElementById("company-presentation-input")?.click()}
                            className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 flex items-center gap-2"
                            disabled={uploading}
                        >
                            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5 text-cyan-400" />}
                            <span className="text-sm">{uploading ? "Uploading..." : t("Upload PDF")}</span>
                        </button>
                        <input id="company-presentation-input" type="file" accept="application/pdf" className="hidden" onChange={handleUploadPDF} />
                    </div>
                )}
                <p className="text-xs text-white/40">{t("Upload a company presentation PDF that will be shown on public pages.")}</p>
            </div>
        </GlassCard>
    )
}
