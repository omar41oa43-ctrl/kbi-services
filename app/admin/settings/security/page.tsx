"use client"

import { useCallback, useEffect, useMemo, useState, useRef } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/firebase/authClient"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  ShieldCheck,
  Lock,
  Loader2,
  AlertTriangle,
  User,
  KeyRound,
  Download,
  Eye,
  EyeOff,
  CheckCircle2,
  Copy,
  Check,
  UserPlus,
  ShieldAlert,
  Sparkles,
} from "lucide-react"
import { changePassword } from "@/lib/firestore/services/authService"
import { AppSelect } from "@/components/ui/app-select"
import { Checkbox } from "@/components/ui/checkbox"
import { getUsersAction } from "@/app/actions/admin-settings"
import { getUserRoleAction } from "@/app/actions/admin-auth"

export default function SecuritySettingsPage() {
  const { toast } = useToast()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  // Form states
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string>("")

  const [, setFailedAttempts] = useState<number>(0)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [adminUsers, setAdminUsers] = useState<Array<{ uid: string; email: string }>>([])
  const [selectedUserUid, setSelectedUserUid] = useState<string | undefined>(undefined)
  const [targetPassword, setTargetPassword] = useState("")
  const [targetForceChange, setTargetForceChange] = useState(false)
  const [targetError, setTargetError] = useState<string>("")
  const [targetLoading, setTargetLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [adminEmails, setAdminEmails] = useState<Array<{ uid: string; email: string; role: string }>>([])
  const [copiedUid, setCopiedUid] = useState<string | null>(null)

  // New Super Admin form
  const [newSuperEmail, setNewSuperEmail] = useState("")
  const [newSuperName, setNewSuperName] = useState("")
  const [newSuperPassword, setNewSuperPassword] = useState("")
  const [newSuperForceChange, setNewSuperForceChange] = useState(true)
  const [newSuperLoading, setNewSuperLoading] = useState(false)
  const [newSuperError, setNewSuperError] = useState("")

  // Auth guard
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!isMounted.current) return
      if (!user) {
        setAuthorized(false)
      } else {
        setAuthorized(true)
      }
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!authorized) return
    const user = auth.currentUser
    if (!user) return
    ;(async () => {
      try {
        const roleRes = await getUserRoleAction(await user.getIdToken())
        if (!isMounted.current) return
        const role = String((roleRes as any)?.role || "")
        const isSuper = role === "super_admin"
        setIsSuperAdmin(isSuper)
        if (isSuper) {
          await fetchUsers()
        }
      } catch (e: any) {
        if (!isMounted.current) return
        const errorStr = String(e?.message || e?.name || "").toLowerCase()
        if (errorStr.includes("abort") || errorStr.includes("cancelled") || errorStr.includes("aborted")) return
      }
    })()
  }, [authorized])

  const fetchAdminEmails = useCallback(async () => {
    if (!authorized) return
    try {
      const users = await getUsersAction()
      if (!isMounted.current) return
      const rows = (users || [])
        .map((u: any) => ({
          uid: String(u.uid || u.id || ""),
          email: String(u.email || ""),
          role: String(u.role || ""),
        }))
        .filter((r: any) => r.email && (r.role === "admin" || r.role === "super_admin"))
        .sort((a: any, b: any) => a.email.localeCompare(b.email))
      setAdminEmails(rows)
    } catch (e: any) {
      if (!isMounted.current) return
      const errorStr = String(e?.message || e?.name || "").toLowerCase()
      if (errorStr.includes("abort") || errorStr.includes("cancelled") || errorStr.includes("aborted")) return
    }
  }, [authorized])

  useEffect(() => {
    if (!authorized) return
    fetchAdminEmails()
  }, [authorized, fetchAdminEmails])

  const inCooldown = useMemo(() => {
    if (!cooldownUntil) return false
    return Date.now() < cooldownUntil
  }, [cooldownUntil])

  const remainingCooldownSeconds = useMemo(() => {
    if (!cooldownUntil) return 0
    const diff = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000))
    return diff
  }, [cooldownUntil])

  const generateStrongPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    let pass = ""
    for (let i = 0; i < 14; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewSuperPassword(pass)
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedUid(id)
    setTimeout(() => setCopiedUid(null), 2000)
    toast({ title: "Copied", description: "UID copied to clipboard." })
  }

  // Password validation
  const validate = (): string | null => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return "All password fields are required"
    }
    if (newPassword.length < 8) {
      return "New password must be at least 8 characters long"
    }
    if (newPassword === currentPassword) {
      return "New password must be different from current password"
    }
    if (newPassword !== confirmPassword) {
      return "New password and confirmation do not match"
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (inCooldown) {
      setError(`Too many attempts. Please try again in ${remainingCooldownSeconds}s`)
      return
    }

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setConfirmOpen(true)
  }

  const doChangePassword = async () => {
    setLoading(true)
    setError("")
    try {
      await changePassword(currentPassword, newPassword)

      toast({
        title: "Password Updated Successfully",
        description: "Your password has been changed. Please sign in again.",
      })

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      const msg = err?.message || "Failed to change password"
      setError(msg)
      setFailedAttempts((prev: number) => {
        const next = prev + 1
        if (next >= 5) {
          setCooldownUntil(Date.now() + 60_000)
        }
        return next
      })
    } finally {
      setLoading(false)
      setConfirmOpen(false)
    }
  }

  const fetchUsers = async () => {
    setListLoading(true)
    try {
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch("/api/admin/users/list", {
        headers: { authorization: `Bearer ${token || ""}` },
        cache: "no-store",
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) return
      setAdminUsers(json.users || [])
    } finally {
      setListLoading(false)
    }
  }

  const changeOtherPassword = async () => {
    setTargetError("")
    if (!selectedUserUid) {
      setTargetError("Please select an administrator account")
      return
    }
    if (!targetPassword || targetPassword.length < 8) {
      setTargetError("Password must be at least 8 characters long")
      return
    }
    setTargetLoading(true)
    try {
      const token = await auth.currentUser?.getIdToken(true)
      const res = await fetch("/api/admin/users/password", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({
          uid: selectedUserUid,
          newPassword: targetPassword,
          forceChange: targetForceChange,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        setTargetError(json?.error || "Failed to change user password")
        return
      }
      toast({ title: "Password Changed", description: "User password updated successfully." })
      setTargetPassword("")
      setTargetForceChange(false)
    } catch (e: any) {
      setTargetError(e?.message || "Failed to change password")
    } finally {
      setTargetLoading(false)
    }
  }

  const exportUsersTxt = async () => {
    setExporting(true)
    try {
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch("/api/admin/users/export", {
        headers: { authorization: `Bearer ${token || ""}` },
        cache: "no-store",
      })
      if (!res.ok) {
        toast({ title: "Export Failed", description: "Unable to export users list." })
        return
      }
      const text = await res.text()
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "kbi_admin_users.txt"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast({ title: "Export Complete", description: "Downloaded admin users list." })
    } catch {
      toast({ title: "Export Failed", description: "Network error occurred." })
    } finally {
      setExporting(false)
    }
  }

  if (!authorized) return null

  const createSuperAdmin = async () => {
    setNewSuperError("")
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setNewSuperError("No internet connection")
      return
    }
    if (!newSuperEmail.trim() || !newSuperPassword) {
      setNewSuperError("Email and password are required")
      return
    }
    if (newSuperPassword.length < 8) {
      setNewSuperError("Password must be at least 8 characters long")
      return
    }
    setNewSuperLoading(true)
    try {
      const token = await auth.currentUser?.getIdToken(true)
      const res = await fetch("/api/admin/users/create-super-admin", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({
          email: newSuperEmail.trim(),
          name: newSuperName.trim(),
          password: newSuperPassword,
          forceChange: newSuperForceChange,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        setNewSuperError(json?.error || "Failed to create super admin")
        return
      }
      toast({ title: "Super Admin Created", description: `Account created for ${newSuperEmail}` })
      setNewSuperEmail("")
      setNewSuperName("")
      setNewSuperPassword("")
      setNewSuperForceChange(true)
      await fetchAdminEmails()
      await fetchUsers()
    } catch (e: any) {
      setNewSuperError(e?.message || "Failed to create super admin")
    } finally {
      setNewSuperLoading(false)
    }
  }

  return (
    <div className="space-y-8 pb-12">
      <Toaster />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-2xl bg-cyan-500/10 dark:bg-[#00f5c4]/15 border border-cyan-500/30 dark:border-[#00f5c4]/30 flex items-center justify-center text-cyan-600 dark:text-[#00f5c4] shadow-sm">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Security & Access Control</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage personal credentials, administrator access levels, and security policies.
            </p>
          </div>
        </div>

        {isSuperAdmin && (
          <Button
            onClick={exportUsersTxt}
            disabled={exporting}
            variant="outline"
            size="sm"
            className="h-10 rounded-xl font-bold text-xs border-border bg-card hover:bg-muted self-start sm:self-auto"
          >
            {exporting ? <Loader2 className="size-3.5 mr-2 animate-spin" /> : <Download className="size-3.5 mr-2 text-cyan-600 dark:text-[#00f5c4]" />}
            Export Credentials (.txt)
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Change Password & Security Status (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Change Password */}
          <Card className="border-border bg-card shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border/70 pb-4 bg-muted/20">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-cyan-500/10 dark:bg-[#00f5c4]/10 border border-cyan-500/20 dark:border-[#00f5c4]/20 flex items-center justify-center text-cyan-600 dark:text-[#00f5c4]">
                  <Lock className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-foreground">Change Account Password</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Update your personal administrator login password.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Current Password</Label>
                  <div className="relative">
                    <Input
                      type={showCurrent ? "text" : "password"}
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="bg-background border-input text-foreground text-xs h-10 rounded-xl pr-10 focus:border-cyan-500"
                      disabled={loading}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">New Password</Label>
                    <div className="relative">
                      <Input
                        type={showNew ? "text" : "password"}
                        placeholder="At least 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-background border-input text-foreground text-xs h-10 rounded-xl pr-10 focus:border-cyan-500"
                        disabled={loading}
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

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Repeat new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-background border-input text-foreground text-xs h-10 rounded-xl pr-10 focus:border-cyan-500"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium">
                    <AlertTriangle className="size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {inCooldown && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-medium">
                    <Loader2 className="size-4 animate-spin shrink-0" />
                    <span>Too many failed attempts. Please wait {remainingCooldownSeconds}s before retrying.</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end">
                  <Button
                    type="submit"
                    disabled={loading || inCooldown}
                    className="h-10 rounded-xl bg-cyan-600 dark:bg-[#00f5c4] hover:bg-cyan-500 dark:hover:bg-[#00d8a7] text-white dark:text-[#0b0f14] font-extrabold text-xs px-6 shadow-sm"
                  >
                    {loading ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Lock className="size-4 mr-2" />}
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Super Admin Section: Manage & Reset Passwords */}
          {isSuperAdmin && (
            <Card className="border-border bg-card shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-border/70 pb-4 bg-muted/20">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <KeyRound className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">Reset User Password</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Override password for any existing administrator account.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Select Admin Account</Label>
                    <AppSelect
                      items={adminUsers.map((u) => ({ value: u.uid, label: u.email }))}
                      value={selectedUserUid}
                      onValueChange={setSelectedUserUid}
                      placeholder={listLoading ? "Loading users…" : "Select admin user"}
                      helperText={listLoading ? "Fetching registered users" : undefined}
                      searchThreshold={5}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">New Temporary Password</Label>
                    <Input
                      type="password"
                      placeholder="At least 8 characters"
                      value={targetPassword}
                      onChange={(e) => setTargetPassword(e.target.value)}
                      className="bg-background border-input text-foreground text-xs h-10 rounded-xl focus:border-purple-500"
                      disabled={targetLoading}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    id="force-change-check"
                    checked={targetForceChange}
                    onCheckedChange={(v) => setTargetForceChange(!!v)}
                  />
                  <Label htmlFor="force-change-check" className="text-xs text-muted-foreground font-medium cursor-pointer">
                    Require user to change password upon next login
                  </Label>
                </div>

                {targetError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium">
                    <AlertTriangle className="size-4 shrink-0" />
                    <span>{targetError}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end">
                  <Button
                    type="button"
                    onClick={changeOtherPassword}
                    disabled={targetLoading || !selectedUserUid || !targetPassword}
                    className="h-10 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs px-6"
                  >
                    {targetLoading ? <Loader2 className="size-4 mr-2 animate-spin" /> : <KeyRound className="size-4 mr-2" />}
                    Reset User Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Admin Accounts List & Create Super Admin (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Registered Admin Emails */}
          <Card className="border-border bg-card shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border/70 pb-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <User className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">Admin Accounts</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      {adminEmails.length} authorized administrators
                    </CardDescription>
                  </div>
                </div>

                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-bold">
                  {adminEmails.length} Active
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-2.5 max-h-[380px] overflow-y-auto [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
              {adminEmails.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">No admin accounts found.</div>
              ) : (
                adminEmails.map((u) => {
                  const isSuper = u.role === "super_admin"
                  return (
                    <div
                      key={u.uid}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/60 p-3 hover:border-cyan-500/40 transition-colors group"
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <div className={`size-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${isSuper ? "bg-purple-500/15 text-purple-600 dark:text-purple-300" : "bg-cyan-500/15 text-cyan-600 dark:text-cyan-300"}`}>
                          {u.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{u.email}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">{u.uid}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(u.uid, u.uid)}
                              className="text-muted-foreground hover:text-foreground"
                              title="Copy UID"
                            >
                              {copiedUid === u.uid ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={
                          isSuper
                            ? "bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/30 text-[10px] font-black uppercase shrink-0"
                            : "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border-cyan-500/30 text-[10px] font-black uppercase shrink-0"
                        }
                      >
                        {isSuper ? "Super Admin" : "Admin"}
                      </Badge>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Card: Provision Super Admin (Only for Super Admin) */}
          {isSuperAdmin && (
            <Card className="border-border bg-card shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-border/70 pb-4 bg-muted/20">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <UserPlus className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">Create Super Admin</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Provision a new high-privilege administrative account.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Email Address</Label>
                  <Input
                    type="email"
                    value={newSuperEmail}
                    onChange={(e) => setNewSuperEmail(e.target.value)}
                    placeholder="new.admin@kbi.ae"
                    className="bg-background border-input text-foreground text-xs h-10 rounded-xl focus:border-purple-500"
                    disabled={newSuperLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Full Name (Optional)</Label>
                  <Input
                    value={newSuperName}
                    onChange={(e) => setNewSuperName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="bg-background border-input text-foreground text-xs h-10 rounded-xl focus:border-purple-500"
                    disabled={newSuperLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground">Initial Password</Label>
                    <button
                      type="button"
                      onClick={generateStrongPassword}
                      className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="size-3" /> Auto Generate
                    </button>
                  </div>
                  <Input
                    type="text"
                    value={newSuperPassword}
                    onChange={(e) => setNewSuperPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="bg-background border-input text-foreground font-mono text-xs h-10 rounded-xl focus:border-purple-500"
                    disabled={newSuperLoading}
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    id="new-super-force"
                    checked={newSuperForceChange}
                    onCheckedChange={(v) => setNewSuperForceChange(!!v)}
                  />
                  <Label htmlFor="new-super-force" className="text-xs text-muted-foreground font-medium cursor-pointer">
                    Force password change on first sign-in
                  </Label>
                </div>

                {newSuperError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium">
                    <AlertTriangle className="size-4 shrink-0" />
                    <span>{newSuperError}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end">
                  <Button
                    type="button"
                    onClick={createSuperAdmin}
                    disabled={newSuperLoading || !newSuperEmail || !newSuperPassword}
                    className="h-10 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs px-6 w-full"
                  >
                    {newSuperLoading ? <Loader2 className="size-4 mr-2 animate-spin" /> : <UserPlus className="size-4 mr-2" />}
                    Create Super Admin Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="bg-card border-border text-foreground rounded-2xl sm:max-w-md">
          <AlertDialogHeader className="space-y-2">
            <div className="size-10 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-[#00f5c4] flex items-center justify-center">
              <ShieldAlert className="size-5" />
            </div>
            <AlertDialogTitle className="text-lg font-bold">Confirm Password Update</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              For security reasons, updating your password will sign you out. You will need to sign in again with your new credentials.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="pt-4 border-t border-border mt-4 flex flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel className="h-10 rounded-xl border-border text-xs font-bold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={doChangePassword}
              className="h-10 rounded-xl bg-cyan-600 dark:bg-[#00f5c4] hover:bg-cyan-500 dark:hover:bg-[#00d8a7] text-white dark:text-[#0b0f14] font-extrabold text-xs px-5"
            >
              Confirm & Change Password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
