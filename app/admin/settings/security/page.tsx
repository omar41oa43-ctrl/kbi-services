"use client"

import { useCallback, useEffect, useMemo, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/firebase/authClient"
import { GlassCard } from "@/components/ui/glass-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { ShieldCheck, Lock, Loader2, AlertTriangle, User, KeyRound, Download } from "lucide-react"
import { changePassword } from "@/lib/firestore/services/authService"
import { AppSelect } from "@/components/ui/app-select"
import { Checkbox } from "@/components/ui/checkbox"
import { getUsersAction } from "@/app/actions/admin-settings"
import { getUserRoleAction } from "@/app/actions/admin-auth"

export default function SecuritySettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
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
      ; (async () => {
        try {
          const roleRes = await getUserRoleAction(user.uid, user.email)
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
          if (errorStr.includes('abort') || errorStr.includes('cancelled') || errorStr.includes('aborted')) return
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
      if (errorStr.includes('abort') || errorStr.includes('cancelled') || errorStr.includes('aborted')) return
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

  // Basic validation
  const validate = (): string | null => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return "All fields are required"
    }
    if (newPassword.length < 8) {
      return "New password must be at least 8 characters"
    }
    if (newPassword === currentPassword) {
      return "New password must be different from current password"
    }
    if (newPassword !== confirmPassword) {
      return "New password and confirmation must match"
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (inCooldown) {
      setError(`Too many attempts. Try again in ${remainingCooldownSeconds}s`)
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
        title: "Password Changed",
        description: "Your password has been updated. We sent you an email notification.",
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
      if (!isMounted.current) return
      if (!res.ok || !json?.ok) {
        setAdminUsers([])
        return
      }
      setAdminUsers(json.users || [])
    } catch (e: any) {
      if (!isMounted.current) return
      const errorStr = String(e?.message || e?.name || "").toLowerCase()
      if (errorStr.includes('abort') || errorStr.includes('cancelled') || errorStr.includes('aborted')) return
      setAdminUsers([])
    } finally {
      if (isMounted.current) setListLoading(false)
    }
  }

  const changeOtherPassword = async () => {
    setTargetError("")
    if (!selectedUserUid || !targetPassword) {
      setTargetError("Select user and enter new password")
      return
    }
    if (targetPassword.length < 8) {
      setTargetError("New password must be at least 8 characters")
      return
    }
    setTargetLoading(true)
    try {
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch("/api/admin/users/password", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({
          uid: selectedUserUid,
          password: targetPassword,
          forceChange: targetForceChange,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        setTargetError(json?.error || "Failed to change password")
        return
      }
      toast({
        title: "Password Changed",
        description: "Selected user's password has been updated.",
      })
      setTargetPassword("")
      setTargetForceChange(false)
    } catch (err: any) {
      setTargetError(err?.message || "Failed to change password")
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
        toast({ title: "Export Failed", description: "Unable to export users." })
        return
      }
      const text = await res.text()
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "users.txt"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast({ title: "Exported", description: "Downloaded users.txt" })
    } catch {
      toast({ title: "Export Failed", description: "Network issue. Try again." })
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
      setNewSuperError("Password must be at least 8 characters")
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
      toast({ title: "Created", description: "Super admin created successfully." })
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
    <section className="pt-2 pb-8">
      <Toaster />
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-cyan-500/20 rounded-lg">
          <ShieldCheck className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Security Settings</h1>
          <p className="text-white/60 text-sm">Change your password securely</p>
        </div>
      </div>

      <GlassCard className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-white">Current Password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              disabled={loading}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">New Password</Label>
              <Input
                type="password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Confirm New Password</Label>
              <Input
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {inCooldown && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
              <ClockCountdown />
              <span className="text-sm">Please wait {remainingCooldownSeconds}s before retrying</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button
              type="submit"
              className="bg-cyan-500 hover:bg-cyan-400 text-black"
              disabled={loading || inCooldown}
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
              Change Password
            </Button>
          </div>
        </form>
      </GlassCard>

      <div className="mt-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <User className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Admin Emails</h2>
            <p className="text-white/60 text-sm">All users with admin roles</p>
          </div>
        </div>
        <GlassCard className="p-6">
          {adminEmails.length === 0 ? (
            <div className="text-sm text-white/50">No admin users found.</div>
          ) : (
            <div className="space-y-2">
              {adminEmails.map((u) => (
                <div
                  key={u.uid}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{u.email}</div>
                    <div className="text-xs text-white/50">{u.uid}</div>
                  </div>
                  <div
                    className={
                      u.role === "super_admin"
                        ? "text-[11px] font-semibold px-2 py-1 rounded-full border border-purple-500/50 bg-purple-500/15 text-purple-300"
                        : "text-[11px] font-semibold px-2 py-1 rounded-full border border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                    }
                  >
                    {u.role}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
      {isSuperAdmin && (
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <KeyRound className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Super Admin</h2>
              <p className="text-white/60 text-sm">Change another user's password</p>
            </div>
          </div>
          <GlassCard className="p-6 space-y-4 mb-4">
            <div className="text-sm font-semibold text-white">Create New Super Admin</div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label className="text-white">Email</Label>
                <Input
                  value={newSuperEmail}
                  onChange={(e) => setNewSuperEmail(e.target.value)}
                  placeholder="new.admin@example.com"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  disabled={newSuperLoading}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Name (optional)</Label>
                <Input
                  value={newSuperName}
                  onChange={(e) => setNewSuperName(e.target.value)}
                  placeholder="Full name"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  disabled={newSuperLoading}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-white">Temporary Password</Label>
                <Input
                  type="password"
                  value={newSuperPassword}
                  onChange={(e) => setNewSuperPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  disabled={newSuperLoading}
                />
              </div>
              <div className="flex items-end">
                <div className="flex items-center gap-2 h-10">
                  <Checkbox checked={newSuperForceChange} onCheckedChange={(v) => setNewSuperForceChange(!!v)} />
                  <span className="text-sm text-white/80">Force change on login</span>
                </div>
              </div>
            </div>
            {newSuperError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">{newSuperError}</span>
              </div>
            )}
            <div className="flex items-center justify-end">
              <Button onClick={createSuperAdmin} className="bg-purple-500 hover:bg-purple-400 text-black" disabled={newSuperLoading}>
                {newSuperLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <User className="w-4 h-4 mr-2" />}
                Create Super Admin
              </Button>
            </div>
          </GlassCard>
          <GlassCard className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">User Email</Label>
                <AppSelect
                  items={adminUsers.map((u) => ({ value: u.uid, label: u.email }))}
                  value={selectedUserUid}
                  onValueChange={setSelectedUserUid}
                  placeholder={listLoading ? "Loading users…" : "Select user"}
                  helperText={listLoading ? "Fetching latest users" : undefined}
                  searchThreshold={5}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">New Password</Label>
                <Input
                  type="password"
                  placeholder="At least 8 characters"
                  value={targetPassword}
                  onChange={(e) => setTargetPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  disabled={targetLoading}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={targetForceChange}
                onCheckedChange={(v) => setTargetForceChange(!!v)}
              />
              <span className="text-sm text-white/80">Require password change on next login</span>
            </div>
            {targetError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">{targetError}</span>
              </div>
            )}
            <div className="flex items-center justify-end">
              <Button
                onClick={changeOtherPassword}
                className="bg-purple-500 hover:bg-purple-400 text-black"
                disabled={targetLoading}
              >
                {targetLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <User className="w-4 h-4 mr-2" />}
                Change Selected User Password
              </Button>
              <Button
                onClick={exportUsersTxt}
                className="ml-3 bg-white/10 hover:bg-white/20 text-white"
                disabled={exporting}
              >
                {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Export Users (.txt)
              </Button>
            </div>
          </GlassCard>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="bg-zinc-950 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Password Change</AlertDialogTitle>
            <AlertDialogDescription>
              For security, changing your password will sign you out. Do you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-white/80">You will need to sign in again with the new password.</span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <AlertDialogCancel className="border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doChangePassword} className="bg-cyan-500 hover:bg-cyan-400 text-black">
              Confirm
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

function ClockCountdown() {
  return <Loader2 className="w-4 h-4 animate-spin" />
}
