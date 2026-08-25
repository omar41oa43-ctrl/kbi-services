"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { auth } from "@/firebase/authClient"
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth"
import { GlassCard } from "@/components/ui/glass-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { motion } from "framer-motion"

export default function AdminResetPasswordPage() {
  const router = useRouter()
  const search = useSearchParams()
  const { toast } = useToast()

  const [oobCode, setOobCode] = useState<string | null>(null)
  const [valid, setValid] = useState<boolean | null>(null)
  const [email, setEmail] = useState<string>("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const code = search.get("oobCode")
    const mode = search.get("mode")
    if (!code || mode !== "resetPassword") {
      setValid(false)
      return
    }
    setOobCode(code)
    verifyPasswordResetCode(auth, code)
      .then((mail) => {
        setEmail(mail || "")
        setValid(true)
      })
      .catch(() => {
        setValid(false)
      })
  }, [search])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!oobCode) return
    setLoading(true)
    setError("")
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters")
      setLoading(false)
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }
    try {
      await confirmPasswordReset(auth, oobCode, newPassword)
      toast({ title: "Password Reset", description: "Your admin password has been updated." })
      router.replace("/admin/login")
    } catch {
      setError("Invalid or expired reset link")
    } finally {
      setLoading(false)
    }
  }

  if (valid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black">
        <GlassCard className="p-8 text-center">
          <p className="text-white/80">Invalid or expired reset link.</p>
          <Button className="mt-4 bg-cyan-500 hover:bg-cyan-400 text-black" onClick={() => router.replace("/admin/login")}>
            Back to Admin Login
          </Button>
        </GlassCard>
      </div>
    )
  }

  if (valid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black text-white">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-black overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -inset-1 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:22px_22px] opacity-10" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <GlassCard className="p-8 ring-1 ring-white/10 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-cyan-300">Reset Admin Password</span>
            </div>
            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-white">Email</Label>
                <Input value={email} readOnly className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-white">New Password</Label>
                <Input
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Confirm Password</Label>
                <Input
                  type="password"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
              {error && (
                <div className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Reset Password
              </Button>
            </form>
            <Toaster />
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}
