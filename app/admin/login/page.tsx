"use client"

import { FormEvent, useEffect, useState } from "react"
import Image from "next/image"
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from "firebase/auth"
import { ArrowRight, BadgeCheck, CheckCircle2, CircleAlert, Eye, EyeOff, Loader2, LockKeyhole, Mail, ShieldCheck } from "lucide-react"

import { getUserRoleAction, setMustChangePasswordAction } from "@/app/actions/admin-auth"
import { auth } from "@/firebase/authClient"
import { establishAdminSession } from "@/lib/admin-session-client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [mustChangePassword, setMustChangePassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem("kbi_admin_remember_email_v1")
    if (saved) {
      setEmail(saved)
      setRememberMe(true)
    }
  }, [])

  const finishLogin = async () => {
    const user = auth.currentUser
    if (!user) throw new Error("Authentication required")
    const token = await user.getIdToken(true)
    await establishAdminSession(token)
    if (rememberMe) localStorage.setItem("kbi_admin_remember_email_v1", user.email || email)
    else localStorage.removeItem("kbi_admin_remember_email_v1")
    window.location.assign("/admin")
  }

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError("")
    setNotice("")
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
      if (!credential.user.emailVerified) {
        await signOut(auth)
        throw new Error("Verify your email before signing in.")
      }

      const token = await credential.user.getIdToken(true)
      const access = await getUserRoleAction(token)
      if (access.role !== "admin" && access.role !== "super_admin") {
        await signOut(auth)
        throw new Error("This account does not have administrator access.")
      }

      if (access.mustChangePassword) {
        setMustChangePassword(true)
        return
      }
      await finishLogin()
    } catch (cause) {
      const code = (cause as { code?: string }).code
      if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") {
        setError("Incorrect email or password.")
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Try again later or reset your password.")
      } else {
        setError(cause instanceof Error ? cause.message : "Unable to sign in.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!email.trim()) {
      setError("Enter your email address first.")
      return
    }
    setResetting(true)
    setError("")
    try {
      await sendPasswordResetEmail(auth, email.trim())
      setNotice("If this administrator account exists, a reset email has been sent.")
    } catch {
      setNotice("If this administrator account exists, a reset email has been sent.")
    } finally {
      setResetting(false)
    }
  }

  const handleRequiredPasswordChange = async () => {
    if (newPassword.length < 12 || newPassword !== confirmPassword || !auth.currentUser) return
    setLoading(true)
    setError("")
    try {
      await updatePassword(auth.currentUser, newPassword)
      const token = await auth.currentUser.getIdToken(true)
      const result = await setMustChangePasswordAction(token, false)
      if (result.error) throw new Error(result.error)
      await finishLogin()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update password.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="admin-access-shell">
      <div className="admin-access-photo" aria-hidden="true" />
      <div className="admin-access-shade" aria-hidden="true" />

      <section className="admin-access-layout" aria-label="KBI administrator access">
        <aside className="admin-access-intro">
          <div className="admin-access-brand" aria-label="KBI Global Technologies">
            <span className="admin-access-logo"><Image src="/kbi-logo.png" alt="KBI" width={120} height={50} priority /></span>
          </div>

          <div className="admin-access-copy">
            <span className="admin-access-eyebrow"><BadgeCheck /> Trusted field operations</span>
            <h2>Precision service.<br /><span>Securely managed.</span></h2>
            <p>Coordinate technicians, service orders, and customer support from one protected workspace.</p>
            <div className="admin-access-proof" aria-label="Access benefits">
              <span><CheckCircle2 /> Verified administrators</span>
              <span><CheckCircle2 /> Live operations</span>
            </div>
          </div>

          <footer className="admin-access-location"><span /> Created by 7moo0d</footer>
        </aside>

        <div className="admin-access-form-side">
          <Card className="admin-access-card" aria-labelledby="admin-login-title">
            <CardHeader className="admin-access-card-header">
              <div className="admin-access-card-logo"><Image src="/kbi-logo.png" alt="KBI" width={112} height={46} priority /></div>
              <div className="admin-access-lock" aria-hidden="true"><ShieldCheck /></div>
              <CardTitle><h1 id="admin-login-title">{mustChangePassword ? "Create a new password" : "Welcome back"}</h1></CardTitle>
              <CardDescription>{mustChangePassword ? "Create a secure password to finish signing in." : "Sign in to your KBI administrator workspace."}</CardDescription>
              <div className="admin-access-mode" aria-label="Portal access type">
                <span className="is-active"><LockKeyhole /> Sign in</span>
                <span><ShieldCheck /> Admin only</span>
              </div>
            </CardHeader>

            <CardContent className="admin-access-content">
              {mustChangePassword ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New password</Label>
                    <div className="admin-access-field"><LockKeyhole aria-hidden="true" /><Input id="new-password" type="password" minLength={12} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm password</Label>
                    <div className="admin-access-field"><LockKeyhole aria-hidden="true" /><Input id="confirm-password" type="password" minLength={12} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
                  </div>
                  <Button className="admin-access-submit group w-full" disabled={loading || newPassword.length < 12 || newPassword !== confirmPassword} onClick={handleRequiredPasswordChange}>
                    {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck />} Update password
                  </Button>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleLogin}>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <div className="admin-access-field">
                      <Mail aria-hidden="true" />
                      <Input id="email" type="email" autoComplete="username" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={Boolean(error)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4"><Label htmlFor="password">Password</Label><Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs text-cyan-200 hover:text-cyan-100" disabled={resetting} onClick={handleReset}>{resetting ? "Sending…" : "Forgot password?"}</Button></div>
                    <div className="admin-access-field">
                      <LockKeyhole aria-hidden="true" />
                      <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={Boolean(error)} />
                      <Button type="button" variant="ghost" size="icon-sm" className="admin-access-reveal" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff /> : <Eye />}</Button>
                    </div>
                  </div>

                  <label htmlFor="remember-email" className="admin-access-remember">
                    <Checkbox id="remember-email" checked={rememberMe} onCheckedChange={(value) => setRememberMe(value === true)} />
                    Remember this email
                  </label>

                  <Button className="admin-access-submit group w-full" disabled={loading} type="submit">
                    {loading ? <Loader2 className="animate-spin" /> : <>Sign in securely <ArrowRight className="transition-transform group-hover:translate-x-0.5" /></>}
                  </Button>
                </form>
              )}

              <div aria-live="polite" className="mt-4 min-h-5">
                {error && <Alert variant="destructive" className="border-red-300/25 bg-red-950/45 text-red-100"><CircleAlert /><AlertTitle>Sign in failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                {!error && notice && <Alert className="border-emerald-300/25 bg-emerald-950/40 text-emerald-100"><CheckCircle2 /><AlertTitle>Email sent</AlertTitle><AlertDescription>{notice}</AlertDescription></Alert>}
              </div>
            </CardContent>

            <CardFooter className="admin-access-footer"><LockKeyhole /> Encrypted and role-verified access</CardFooter>
          </Card>
        </div>
      </section>
    </main>
  )
}
