
"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { KeyRound, ShieldCheck, Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { AppSelect } from "@/components/ui/app-select"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { User } from "@/lib/firestore/schema"
import { auth } from "@/firebase/authClient"
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"
import { logAdminAction } from "@/lib/logging/actionLogger"
import { passwordSchema } from "@/lib/schemas/auth"

interface Props {
    accounts: User[]
}

export function UserManagement({ accounts }: Props) {
    const [accountFilter, setAccountFilter] = useState<"all" | "super_admin" | "admin" | "technician" | "customer">("all")
    const [search, setSearch] = useState("")
    const [selectedUid, setSelectedUid] = useState<string>("")
    const [newPassword, setNewPassword] = useState("")
    const [forceChange, setForceChange] = useState(true)
    const [adminPassword, setAdminPassword] = useState("")
    const [changing, setChanging] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const { toast } = useToast()

    const handlePasswordChange = async () => {
        // Zod Validation
        const result = passwordSchema.safeParse(newPassword)
        if (!result.success) {
            toast({ title: "Weak Password", description: result.error.errors[0].message, variant: "destructive" })
            setConfirmOpen(false)
            return
        }

        if (!selectedUid) return
        setChanging(true)
        try {
            // Re-authenticate Super Admin
            if (!auth.currentUser || !auth.currentUser.email) throw new Error("Not authenticated")
            const cred = EmailAuthProvider.credential(auth.currentUser.email, adminPassword)
            await reauthenticateWithCredential(auth.currentUser, cred)

            const token = await auth.currentUser.getIdToken(true)
            const res = await fetch("/api/admin/users/password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    uid: selectedUid,
                    password: newPassword,
                    forceChange
                })
            })
            if (res.ok) {
                toast({ title: "Success", description: "Password changed successfully." })

                // Log the action
                logAdminAction({
                    action: "Admin Forced Password Change",
                    actorUid: auth.currentUser.uid,
                    actorEmail: auth.currentUser.email || "unknown",
                    details: { targetUid: selectedUid, forceChange }
                })

                setNewPassword("")
                setAdminPassword("")
                setForceChange(true)
            } else {
                const data = await res.json().catch(() => ({}))
                toast({ title: "Error", description: data?.error || "Failed to change password.", variant: "destructive" })
            }
        } catch (e: any) {
            const msg = e?.message || "Re-authentication failed"
            toast({ title: "Error", description: msg, variant: "destructive" })
        } finally {
            setChanging(false)
            setConfirmOpen(false)
        }
    }

    return (
        <GlassCard>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-cyan-400" />
                Admin Settings – User Management
            </h2>
            <p className="text-sm text-white/60 mb-4">Manage user accounts and perform security resets.</p>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                    <label className="block text-xs text-white/50">Search</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or email"
                            className="bg-white/5 border-white/10 text-white pl-10"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="block text-xs text-white/50">Filter by Role</label>
                    <AppSelect
                        value={accountFilter}
                        onValueChange={(v) => setAccountFilter(v as any)}
                        items={[
                            { value: "all", label: "All" },
                            { value: "super_admin", label: "Super Admin" },
                            { value: "admin", label: "Admin" },
                            { value: "technician", label: "Technician" },
                            { value: "customer", label: "Customer" },
                        ]}
                        className="w-full"
                        placeholder="Filter by Role"
                    />
                </div>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-auto border border-white/10 rounded-xl p-3 mb-6">
                {accounts
                    .filter(a => (accountFilter === "all" ? true : a.role === accountFilter))
                    .filter(a => !search ? true : (a.name?.toLowerCase().includes(search.toLowerCase()) || a.email?.toLowerCase().includes(search.toLowerCase())))
                    .map((a) => (
                        <button
                            key={a.uid}
                            onClick={() => setSelectedUid(a.uid)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border ${selectedUid === a.uid ? "border-cyan-500 bg-cyan-500/10" : "border-white/10 bg-white/5"} text-left`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{a.name || a.email}</p>
                                    <p className="text-xs text-white/50">{a.email} • {a.role}</p>
                                </div>
                            </div>
                            <div className="text-xs text-white/50">{a.uid}</div>
                        </button>
                    ))}
                {accounts.length === 0 && <p className="text-sm text-white/50">No accounts found.</p>}
            </div>

            <div className="border-t border-white/10 pt-6">
                <h3 className="text-sm font-semibold text-white/80 mb-4">Reset User Password</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="block text-xs text-white/50">New Password</label>
                        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 chars, 1 Up, 1 Num, 1 Spec" className="bg-white/5 border-white/10 text-white" />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs text-white/50">Options</label>
                        <label className="flex items-center gap-2 text-sm h-10">
                            <input type="checkbox" checked={forceChange} onChange={(e) => setForceChange(e.target.checked)} className="w-4 h-4 accent-cyan-500" />
                            <span>Force change on login</span>
                        </label>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="block text-xs text-white/50">Super Admin Re-authentication</label>
                        <Input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Enter your current password" className="bg-white/5 border-white/10 text-white" />
                        <p className="text-xs text-white/40">Required to override user credentials.</p>
                    </div>
                </div>

                <div className="mt-4 flex justify-end">
                    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                        <AlertDialogTrigger asChild>
                            <Button
                                disabled={!selectedUid || newPassword.length < 8 || changing}
                                className="bg-cyan-500 hover:bg-cyan-400 text-black"
                            >
                                {changing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Change Password
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-zinc-900 border-white/10 text-white">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Password Change</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will change the selected account’s password immediately. Proceed?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="flex justify-end gap-2">
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handlePasswordChange}>
                                    Confirm
                                </AlertDialogAction>
                            </div>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </GlassCard>
    )
}
