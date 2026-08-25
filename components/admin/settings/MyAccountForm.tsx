"use client"

import { useState } from "react"
import { useT } from "@/components/language-provider"
import { UserCog, Mail, KeyRound, Loader2, ShieldCheck, Eye, EyeOff, Save } from "lucide-react"
import { auth } from "@/firebase/authClient"
import { EmailAuthProvider, reauthenticateWithCredential, updateEmail, updatePassword } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { logAdminAction } from "@/lib/logging/actionLogger"
import { passwordSchema } from "@/lib/schemas/auth"
import { updateUserEmailAction } from "@/app/actions/admin-auth"
import { handleStaleServerActionError } from "@/lib/utils"

export function MyAccountForm() {
  const t = useT()
  const { toast } = useToast()

  const [myEmail, setMyEmail] = useState("")
  const [profilePassword, setProfilePassword] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)

  const handleUpdate = async () => {
    if (!auth.currentUser || !currentPassword) {
      toast({
        title: "Current Password Required",
        description: "Please enter your current password to confirm account modifications.",
        variant: "destructive",
      })
      return
    }

    if (profilePassword) {
      const result = passwordSchema.safeParse(profilePassword)
      if (!result.success) {
        toast({
          title: "Weak Password",
          description: result.error.errors[0].message,
          variant: "destructive",
        })
        return
      }
    }

    setProfileSaving(true)
    try {
      // 1. Re-authenticate
      const cred = EmailAuthProvider.credential(auth.currentUser.email!, currentPassword)
      await reauthenticateWithCredential(auth.currentUser, cred)

      // 2. Update Email if changed
      if (myEmail && myEmail !== auth.currentUser.email) {
        const oldEmail = auth.currentUser.email
        await updateEmail(auth.currentUser, myEmail)
        const token = await auth.currentUser.getIdToken(true)
        await updateUserEmailAction(token, myEmail)

        logAdminAction({
          action: "Changed Own Email",
          actorUid: auth.currentUser.uid,
          actorEmail: myEmail,
          details: { oldEmail, newEmail: myEmail },
        })

        toast({ title: "Email Updated", description: "Your email address has been changed successfully." })
      }

      // 3. Update Password if provided
      if (profilePassword) {
        await updatePassword(auth.currentUser, profilePassword)

        logAdminAction({
          action: "Changed Own Password",
          actorUid: auth.currentUser.uid,
          actorEmail: auth.currentUser.email || "unknown",
          details: { complexity: "Strong (Zod Verified)" },
        })

        toast({ title: "Password Updated", description: "Your login password has been changed." })
      }

      setCurrentPassword("")
      setProfilePassword("")
    } catch (e: any) {
      if (handleStaleServerActionError(e)) return
      toast({ title: "Update Failed", description: e.message || "Failed to update profile credentials.", variant: "destructive" })
    } finally {
      setProfileSaving(false)
    }
  }

  return (
    <Card className="border-border bg-card shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-border/70 pb-4 bg-muted/20">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-cyan-500/10 dark:bg-[#00f5c4]/15 border border-cyan-500/30 dark:border-[#00f5c4]/30 flex items-center justify-center text-cyan-600 dark:text-[#00f5c4]">
            <UserCog className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-foreground">{t("My Account Credentials")}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Update your personal email address and administrative credentials.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">{t("Change Account Email")}</Label>
            <Input
              type="email"
              value={myEmail}
              onChange={(e) => setMyEmail(e.target.value)}
              placeholder={auth.currentUser?.email || "admin@kbi.ae"}
              className="bg-background border-input text-foreground text-xs h-10 rounded-xl focus:border-cyan-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">{t("New Password (Optional)")}</Label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                value={profilePassword}
                onChange={(e) => setProfilePassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className="bg-background border-input text-foreground text-xs h-10 rounded-xl pr-10 focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-semibold text-foreground">
              {t("Current Password (Required for Verification)")}
            </Label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password to authorize changes"
                className="bg-background border-input text-foreground text-xs h-10 rounded-xl pr-10 focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end">
          <Button
            type="button"
            onClick={handleUpdate}
            disabled={profileSaving || !currentPassword}
            className="h-10 rounded-xl bg-cyan-600 dark:bg-[#00f5c4] hover:bg-cyan-500 dark:hover:bg-[#00d8a7] text-white dark:text-[#0b0f14] font-extrabold text-xs px-6 shadow-sm"
          >
            {profileSaving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
            {t("Save Account Changes")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
