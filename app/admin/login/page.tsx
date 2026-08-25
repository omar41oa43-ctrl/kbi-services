"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword, signOut, updatePassword, verifyPasswordResetCode, confirmPasswordReset, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth"
import { auth } from "@/firebase/authClient"
import { GlassCard } from "@/components/ui/glass-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, Lock } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { ensureAdminUserDocAction, getUserRoleAction, setMustChangePasswordAction, setupDefaultAdminAction } from "@/app/actions/admin-auth"
import { Checkbox } from "@/components/ui/checkbox"

export default function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()
  useLanguage()
  const { toast } = useToast()

  // Registration State
  const [isRegistering, setIsRegistering] = useState(false)
  const [allowRegistration, setAllowRegistration] = useState<boolean>(true) // ALWAYS allow registration

  // Forgot Password State
  const [resetLoading, setResetLoading] = useState(false)
  const [forceOpen, setForceOpen] = useState(false)
  const [forceNew, setForceNew] = useState("")
  const [forceConfirm, setForceConfirm] = useState("")
  const [forceSaving, setForceSaving] = useState(false)
  const [otpOpen, setOtpOpen] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [otpNew, setOtpNew] = useState("")
  const [otpConfirm, setOtpConfirm] = useState("")
  const [otpSaving, setOtpSaving] = useState(false)
  const [showSetup, setShowSetup] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      if (params.get("setup") === "true") {
        setShowSetup(true)
      }
    }
  }, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kbi_admin_remember_email_v1")
      if (saved) {
        setEmail(saved)
        setRememberMe(true)
      }
    } catch { }
  }, [])

  const requestReset = async () => {
    const targetEmail = email.trim()
    if (!targetEmail) {
      toast({ title: "Email Required", description: "Please enter your email address first." })
      return
    }
    setResetLoading(true)
    try {
      const res = await fetch("/api/admin/reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      })
      if (res.status === 429) {
        toast({ title: "Too Many Requests", description: "Please try again later." })
      } else if (res.ok) {
        toast({ title: "Check Your Email", description: `A reset link has been sent to ${targetEmail} if it exists.` })
        setOtpOpen(true)
      } else {
        toast({ title: "Error", description: "Unable to send reset link. Try again later." })
      }
    } catch {
      toast({ title: "Error", description: "Network issue. Please try again." })
    } finally {
      setResetLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)

      // Master Admin Configuration
      const getMasterAdmins = () => {
        const envEmails = process.env.NEXT_PUBLIC_MASTER_ADMIN_EMAILS || "";
        return envEmails.split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
      };
      const getMasterUid = () => {
        return process.env.NEXT_PUBLIC_MASTER_ADMIN_UID || "";
      };
      const masterAdmins = getMasterAdmins();
      const masterUid = getMasterUid();
      const isMasterAdmin = masterAdmins.includes((cred.user.email || "").toLowerCase()) || cred.user.uid === masterUid;

      // EMAIL VERIFICATION CHECK - Skip for Master Admins
      if (!cred.user.emailVerified && !isMasterAdmin) {
        await signOut(auth)
        setError("Please verify your email address to log in.")
        return
      }

      // Auto-setup Master Admin in Firestore (best effort)
      if (isMasterAdmin) {
        try {
          await ensureAdminUserDocAction(cred.user.uid, cred.user.email || "", "super_admin")
        } catch (err) {
          console.log("Master admin doc setup failed (non-critical):", err)
        }
      }

      // Get role (best effort)
      let role: string | null = null
      let mustChange = false
      try {
        const roleRes = await getUserRoleAction(cred.user.uid, cred.user.email)
        role = (roleRes as any)?.role || null
        mustChange = !!(roleRes as any)?.mustChangePassword
      } catch (err) {
        console.log("Role fetch failed (non-critical):", err)
      }

      // Master admins always allowed, even without role
      if (!isMasterAdmin && role !== "admin" && role !== "super_admin") {
        await signOut(auth)
        setError("This account is not an admin")
      } else {
        if (mustChange && !isMasterAdmin) {
          setForceOpen(true)
        } else {
          try {
            if (rememberMe) localStorage.setItem("kbi_admin_remember_email_v1", email)
            else localStorage.removeItem("kbi_admin_remember_email_v1")
          } catch { }
          
          // Set the admin token cookie IMMEDIATELY before navigation
          try {
            const token = await cred.user.getIdToken()
            const secureFlag = (typeof window !== 'undefined' && window.location.protocol === 'https:') ? 'Secure;' : ''
            document.cookie = `kbi_admin_token=${token}; path=/; max-age=3600; ${secureFlag} SameSite=Strict`
            console.log("✅ Admin token cookie set successfully!")
          } catch (cookieErr) {
            console.error("❌ Failed to set cookie:", cookieErr)
          }
          
          // Navigate to admin dashboard
          console.log("🔄 Navigating to admin dashboard...")
          window.location.href = "/admin"
        }
      }
    } catch (e: any) {
      console.error("Login error:", e)
      if (e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password') {
        setError("Invalid email or password")
      } else if (e.code === 'auth/invalid-api-key') {
        setError("Configuration Error: Invalid API Key. Check Environment Variables.")
      } else if (e.code === 'auth/user-not-found') {
        setError("No account found with this email")
      } else {
        setError(e.message || "An error occurred during sign in")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allowRegistration) {
      setError("Registration is currently disabled.")
      return
    }
    setLoading(true)
    setError("")

    try {
      // 1. Create Auth User
      const cred = await createUserWithEmailAndPassword(auth, email, password)

      // 2. Check if this is a master admin
      const getMasterAdmins = () => {
        const envEmails = process.env.NEXT_PUBLIC_MASTER_ADMIN_EMAILS || "";
        return envEmails.split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
      };
      const masterAdmins = getMasterAdmins();
      const isMasterAdmin = masterAdmins.includes((email || "").toLowerCase());

      // 3. Create Firestore Profile (Super Admin)
      try {
        await ensureAdminUserDocAction(cred.user.uid, cred.user.email || "", "super_admin")
      } catch (e) {
        console.log("Firestore doc creation failed (non-critical):", e)
      }

      if (isMasterAdmin) {
        // 4a. Master admin - log them straight in!
        toast({
          title: "Registration successful!",
          description: "Welcome, admin! Redirecting you to the dashboard...",
          duration: 3000,
        })
        
        // Set cookie and redirect
        try {
          const token = await cred.user.getIdToken()
          const secureFlag = (typeof window !== 'undefined' && window.location.protocol === 'https:') ? 'Secure;' : ''
          document.cookie = `kbi_admin_token=${token}; path=/; max-age=3600; ${secureFlag} SameSite=Strict`
          console.log("✅ Admin token cookie set successfully!")
        } catch (cookieErr) {
          console.error("❌ Failed to set cookie:", cookieErr)
        }
        
        window.location.href = "/admin"
      } else {
        // 4b. Regular user - send verification email
        await sendEmailVerification(cred.user)
        await signOut(auth)
        toast({
          title: "Verify your email",
          description: "A verification link has been sent to your email. Please verify before logging in.",
          duration: 10000,
        })

        // Switch back to Login
        setIsRegistering(false)
        setEmail("")
        setPassword("")
      }

    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        setError("Email is already registered.")
      } else if (e.code === 'auth/weak-password') {
        setError("Password is too weak.")
      } else {
        setError(e.message || "Failed to register.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-black overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-black to-amber-950" />
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-fuchsia-500/25 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-[28rem] w-[28rem] rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-28 left-1/3 h-[34rem] w-[34rem] rounded-full bg-amber-500/15 blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <GlassCard dir="ltr" hoverEffect={false} className="p-8 sm:p-10 ring-1 ring-white/25 border border-white/20 bg-white/5 backdrop-blur-xl text-left">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-semibold tracking-tight text-white">
                {isRegistering ? "Register Here" : "Login Here"}
              </h1>
            </div>

            {showSetup && (
              <div className="mb-6 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 text-sm space-y-3">
                <p className="font-semibold text-center text-white">⚙️ Admin Setup Assistant</p>
                <p>Click below to verify and initialize the default master admin account (<code className="text-white">admin@kbi.ae</code>).</p>
                <Button
                  type="button"
                  onClick={async () => {
                    setLoading(true)
                    try {
                      const res = await setupDefaultAdminAction()
                      if (res?.success) {
                        toast({ title: "Admin Setup", description: res.message || "Admin seeded successfully!" })
                        setEmail("admin@kbi.ae")
                        setPassword("AdminPassword2026!")
                      } else {
                        toast({ title: "Setup Failed", description: res?.error || "Failed to setup admin", variant: "destructive" })
                      }
                    } catch (err: any) {
                      toast({ title: "Setup Error", description: err.message, variant: "destructive" })
                    } finally {
                      setLoading(false)
                    }
                  }}
                  disabled={loading}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold h-10 rounded-lg text-xs"
                >
                  Seed/Reset Default Admin
                </Button>
              </div>
            )}

            <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/80">{isRegistering ? "Email" : "Email"}</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 bg-transparent border-0 border-b border-white/30 rounded-none px-0 pr-10 text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-cyan-400"
                      placeholder=""
                    />
                    <Mail className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/80">{isRegistering ? "Password" : "Password"}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 bg-transparent border-0 border-b border-white/30 rounded-none px-0 pr-10 text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-cyan-400"
                      placeholder=""
                    />
                    <Lock className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-white/70 select-none">
                  <Checkbox checked={rememberMe} onCheckedChange={(v) => setRememberMe(v === true)} />
                  <span>Remember me</span>
                </label>
                {!isRegistering && (
                  <button
                    type="button"
                    disabled={resetLoading}
                    onClick={requestReset}
                    className="text-white/70 hover:text-white underline underline-offset-4 disabled:opacity-50"
                  >
                    {resetLoading ? "Sending..." : "Forgot Password?"}
                  </button>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-full bg-white text-black font-semibold hover:bg-white/90"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isRegistering ? "Register" : "Login"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-white/60 hover:text-white text-sm transition-colors"
              >
                {isRegistering ? "Already have an account? Login" : "Don't have an account? Register"}
              </button>
            </div>

            <Toaster />
          </GlassCard>
        </motion.div>
      </div>
      {forceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2">Change Your Password</h3>
            <p className="text-sm text-white/60 mb-4">You must change your password to continue.</p>
            <div className="space-y-3">
              <Input
                type="password"
                placeholder="New password (min 8)"
                value={forceNew}
                onChange={(e) => setForceNew(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
              <Input
                type="password"
                placeholder="Confirm new password"
                value={forceConfirm}
                onChange={(e) => setForceConfirm(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
              <div className="flex justify-end">
                <Button
                  disabled={forceNew.length < 8 || forceNew !== forceConfirm || forceSaving}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black"
                  onClick={async () => {
                    if (!auth.currentUser) return
                    setForceSaving(true)
                    try {
                      await updatePassword(auth.currentUser, forceNew)
                      if (auth.currentUser?.uid) {
                        await setMustChangePasswordAction(auth.currentUser.uid, false)
                      }
                      setForceOpen(false)
                      setForceNew("")
                      setForceConfirm("")
                      router.push("/admin")
                    } catch {
                      toast({ title: "Error", description: "Failed to update password.", variant: "destructive" })
                    } finally {
                      setForceSaving(false)
                    }
                  }}
                >
                  {forceSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save New Password
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {otpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2">Reset With Code</h3>
            <p className="text-sm text-white/60 mb-4">Enter the code sent to your email.</p>
            <div className="space-y-3">
              <Input
                placeholder="Enter code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
              <Input
                type="password"
                placeholder="New password (min 8)"
                value={otpNew}
                onChange={(e) => setOtpNew(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
              <Input
                type="password"
                placeholder="Confirm new password"
                value={otpConfirm}
                onChange={(e) => setOtpConfirm(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  className="text-white/70"
                  onClick={() => {
                    setOtpOpen(false)
                    setOtpCode("")
                    setOtpNew("")
                    setOtpConfirm("")
                  }}
                >
                  Cancel
                </Button>
                <Button
                  disabled={otpCode.length < 10 || otpNew.length < 8 || otpNew !== otpConfirm || otpSaving}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black"
                  onClick={async () => {
                    setOtpSaving(true)
                    try {
                      await verifyPasswordResetCode(auth, otpCode)
                      await confirmPasswordReset(auth, otpCode, otpNew)
                      toast({ title: "Password Reset", description: "Your admin password has been updated." })
                      setOtpOpen(false)
                      setOtpCode("")
                      setOtpNew("")
                      setOtpConfirm("")
                      router.push("/admin/login")
                    } catch {
                      toast({ title: "Error", description: "Invalid or expired code.", variant: "destructive" })
                    } finally {
                      setOtpSaving(false)
                    }
                  }}
                >
                  {otpSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Reset Password
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
