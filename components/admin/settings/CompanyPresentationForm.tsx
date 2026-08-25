"use client"

import { useT } from "@/components/language-provider"
import { FileText, Upload, Trash2, Loader2, ExternalLink, FileCheck } from "lucide-react"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "@/firebase/storageClient"
import { SiteSettings } from "@/lib/firestore/schema"
import { useState } from "react"
import { logAdminAction } from "@/lib/logging/actionLogger"
import { auth } from "@/firebase/authClient"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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
          details: { fileName: file.name, url },
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
        actorEmail: auth.currentUser.email || "unknown",
      })
    }
  }

  return (
    <Card className="border-border bg-card shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-border/70 pb-4 bg-muted/20">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-cyan-500/10 dark:bg-[#00f5c4]/15 border border-cyan-500/30 dark:border-[#00f5c4]/30 flex items-center justify-center text-cyan-600 dark:text-[#00f5c4]">
            <FileText className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-foreground">{t("Company Profile Deck (PDF)")}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Public brochure downloadable for B2B and corporate clients.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {settings.companyPresentationUrl ? (
          <div className="flex items-center justify-between p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-[#00f5c4] flex items-center justify-center shrink-0">
                <FileCheck className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{t("Company Profile Deck.pdf")}</p>
                <a
                  href={settings.companyPresentationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-cyan-600 dark:text-[#00f5c4] font-semibold hover:underline inline-flex items-center gap-1 mt-0.5"
                >
                  {t("Preview PDF")} <ExternalLink className="size-3" />
                </a>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={clearPDF}
              className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
              title="Remove presentation"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl p-6 bg-background/50 text-center space-y-3">
            <div className="size-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
              <Upload className="size-6 text-cyan-600 dark:text-[#00f5c4]" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-foreground">Upload Corporate Presentation</p>
              <p className="text-[11px] text-muted-foreground">PDF format up to 25MB.</p>
            </div>

            <Button
              type="button"
              onClick={() => document.getElementById("company-presentation-input")?.click()}
              disabled={uploading}
              className="h-9 rounded-xl bg-cyan-600 dark:bg-[#00f5c4] hover:bg-cyan-500 dark:hover:bg-[#00d8a7] text-white dark:text-[#0b0f14] font-extrabold text-xs px-5 shadow-sm"
            >
              {uploading ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Upload className="size-4 mr-1.5" />}
              {uploading ? "Uploading..." : t("Select PDF File")}
            </Button>
            <input
              id="company-presentation-input"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleUploadPDF}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
