
"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { useT } from "@/components/language-provider"
import { UserCog, Mail, KeyRound, Loader2, ShieldCheck } from "lucide-react"
import { auth } from "@/firebase/authClient"
import { EmailAuthProvider, reauthenticateWithCredential, updateEmail, updatePassword } from "firebase/auth"
import { Button } from "@/components/ui/button"
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
    const [profileSaving, setProfileSaving] = useState(false)

    // Validate password on the fly or just on submit. We'll check on submit.

    const handleUpdate = async () => {
        if (!auth.currentUser || !currentPassword) return

        // Validate new password if provided
        if (profilePassword) {
            const result = passwordSchema.safeParse(profilePassword)
            if (!result.success) {
                toast({
                    title: "Weak Password",
                    description: result.error.errors[0].message,
                    variant: "destructive"
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
                await updateUserEmailAction(auth.currentUser.uid, myEmail)

                logAdminAction({
                    action: "Changed Own Email",
                    actorUid: auth.currentUser.uid,
                    actorEmail: myEmail, // Use new email
                    details: { oldEmail, newEmail: myEmail }
                })

                toast({ title: "Email Updated", description: "Your email has been changed." })
            }

            // 3. Update Password if provided
            if (profilePassword) {
                await updatePassword(auth.currentUser, profilePassword)

                logAdminAction({
                    action: "Changed Own Password",
                    actorUid: auth.currentUser.uid,
                    actorEmail: auth.currentUser.email || "unknown",
                    details: { complexity: "Strong (Zod Verified)" }
                })

                toast({ title: "Password Updated", description: "Your password has been changed." })
            }

            setCurrentPassword("")
            setProfilePassword("")

        } catch (e: any) {
            if (handleStaleServerActionError(e)) return
            toast({ title: "Error", description: e.message || "Failed to update profile.", variant: "destructive" })
        } finally {
            setProfileSaving(false)
        }
    }

    return (
        <GlassCard>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <UserCog className="w-5 h-5 text-cyan-400" />
                {t("My Account Security")}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs text-white/50 mb-1">{t("Update Email")}</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                            <input
                                value={myEmail || auth.currentUser?.email || ""}
                                onChange={(e) => setMyEmail(e.target.value)}
                                className="w-full pl-10 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                                placeholder={auth.currentUser?.email || "email@example.com"}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-white/50 mb-1">{t("New Password (Optional)")}</label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                            <input
                                type="password"
                                value={profilePassword}
                                onChange={(e) => setProfilePassword(e.target.value)}
                                className="w-full pl-10 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500"
                                placeholder="Leave empty to keep current"
                            />
                        </div>
                        <p className="text-[10px] text-white/40 mt-1">
                            Must contain: 8+ chars, 1 Uppercase, 1 Number, 1 Special Char.
                        </p>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                        <h3 className="text-sm font-semibold text-yellow-500 mb-2">{t("Authentication Required")}</h3>
                        <p className="text-xs text-white/60 mb-4">{t("To change your sensitive account details, please enter your current password.")}</p>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl focus:outline-none focus:border-yellow-500"
                            placeholder={t("Current Password")}
                        />
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button
                            disabled={profileSaving || !currentPassword || (!profilePassword && (!myEmail || myEmail === auth.currentUser?.email))}
                            onClick={handleUpdate}
                            className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
                        >
                            {profileSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                            {t("Update My Profile")}
                        </Button>
                    </div>
                </div>
            </div>
        </GlassCard>
    )
}
