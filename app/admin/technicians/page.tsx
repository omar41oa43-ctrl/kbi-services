"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc, Timestamp, updateDoc } from "firebase/firestore"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  ClipboardCheck,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  FilterX,
  KeyRound,
  Lock,
  MapPin,
  MoreHorizontal,
  Navigation,
  Pencil,
  Power,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Smartphone,
  Trash2,
  Unlock,
  UserCheck,
  UserPlus,
  Users,
  UsersRound,
  Wifi,
  WifiOff,
  Wrench,
  Copy,
  Check,
  Sparkles,
  Loader2,
} from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"

import { useT } from "@/components/language-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { db } from "@/firebase/firebaseConfig"
import { authorizedFetch } from "@/lib/authorized-fetch"
import { isTechnicianProfile } from "@/lib/technician-profile"

type TechnicianRequestStatus = "pending" | "approved" | "rejected" | "documents_requested" | "draft"

type Documents = {
  emirates_id?: string
  passport?: string
  visa?: string
  cv?: string
  driving_license?: string
  certificate?: string
}

type BankDetails = {
  method?: string
  bank_name?: string
  iban?: string
  account_holder?: string
}

type TechnicianRequest = {
  kind: "request"
  id: string
  userId: string
  full_name: string
  phone: string
  whatsapp: string
  email: string
  nationality: string
  dob: string
  gender: string
  language: string
  profile_photo: string
  experience_main_skill: string
  skills: string[]
  experience: string
  employment_type: string
  vehicle?: boolean
  tools?: boolean
  onsite?: boolean
  availability?: { days?: string[]; start_time?: string; end_time?: string }
  service_areas: string[]
  latitude?: number
  longitude?: number
  documents: Documents
  bank_details: BankDetails
  status: TechnicianRequestStatus
}

type Technician = {
  kind: "technician"
  id: string
  name: string
  phone: string
  whatsapp: string
  email: string
  skills: string[]
  specialization: string
  isApproved: boolean
  isActive: boolean
  isSuspended?: boolean
  isLocked?: boolean
  employeeId: string
  latitude?: number
  longitude?: number
  dob: string
  gender: string
  language: string
  profile_photo: string
  nationality: string
  service_areas: string[]
  bank_details: BankDetails
  documents: Documents
  online: boolean
  available: boolean
  currentJob: string
}

type Profile = TechnicianRequest | Technician

const requestStatuses: TechnicianRequestStatus[] = ["pending", "approved", "rejected", "documents_requested", "draft"]

const normalizeRequestStatus = (value: unknown): TechnicianRequestStatus => {
  const status = String(value || "pending").toLowerCase() as TechnicianRequestStatus
  return requestStatuses.includes(status) ? status : "pending"
}

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "—"

const requestStatusLabel: Record<TechnicianRequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  documents_requested: "Documents requested",
  draft: "Draft",
}

const requestStatusVariant: Record<TechnicianRequestStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
  documents_requested: "outline",
  draft: "outline",
}

const recorded = (value: string | undefined) => value?.trim() || "Not recorded"

function EditTechnicianDialog({
  profile,
  open,
  onClose,
  onSave,
  onDelete,
}: {
  profile: Profile | null
  open: boolean
  onClose: () => void
  onSave: (_updatedData: any) => Promise<void>
  onDelete?: (_profile: Profile) => void
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    employeeId: "",
    specialization: "",
    skills: "",
    nationality: "",
    dob: "",
    gender: "",
    language: "",
    service_areas: "",
    isActive: true,
    isApproved: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      const isReq = profile.kind === "request"
      setFormData({
        name: isReq ? profile.full_name : profile.name,
        email: profile.email || "",
        phone: profile.phone || "",
        whatsapp: profile.whatsapp || "",
        employeeId: isReq ? "" : profile.employeeId || "",
        specialization: isReq ? profile.experience_main_skill : profile.specialization || "",
        skills: profile.skills ? profile.skills.join(", ") : "",
        nationality: profile.nationality || "",
        dob: profile.dob || "",
        gender: profile.gender || "",
        language: profile.language || "",
        service_areas: profile.service_areas ? profile.service_areas.join(", ") : "",
        isActive: isReq ? true : profile.isActive,
        isApproved: isReq ? profile.status === "approved" : profile.isApproved,
      })
    }
  }, [profile])

  if (!profile) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        ...formData,
        skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
        service_areas: formData.service_areas.split(",").map((s) => s.trim()).filter(Boolean),
      })
      onClose()
    } catch (err) {
      console.error("Save edit error:", err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-border text-card-foreground rounded-2xl sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6 font-sans">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <Pencil className="size-5 text-primary" /> Edit Technician Profile
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Update contact information, skills, service areas, and account status.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-semibold">Full Name</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-background border-border text-foreground text-xs h-10 rounded-xl focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-semibold">Email Address</Label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-background border-border text-foreground text-xs h-10 rounded-xl focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-semibold">Phone Number</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-background border-border text-foreground text-xs h-10 rounded-xl focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-semibold">WhatsApp Number</Label>
              <Input
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="bg-background border-border text-foreground text-xs h-10 rounded-xl focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-semibold">Employee / Technician ID</Label>
              <Input
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                placeholder="e.g. KBI-TECH-101"
                className="bg-background border-border text-foreground text-xs h-10 rounded-xl focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-semibold">Primary Specialization</Label>
              <Input
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="e.g. Mobile Repair, CCTV"
                className="bg-background border-border text-foreground text-xs h-10 rounded-xl focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-semibold">Nationality</Label>
              <Input
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                className="bg-background border-border text-foreground text-xs h-10 rounded-xl focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-semibold">Date of Birth</Label>
              <Input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="bg-background border-border text-foreground text-xs h-10 rounded-xl focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-semibold">Gender</Label>
              <Select value={formData.gender} onValueChange={(val) => setFormData({ ...formData, gender: val })}>
                <SelectTrigger className="bg-background border-border text-foreground text-xs h-10 rounded-xl">
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-semibold">Spoken Languages</Label>
              <Input
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                placeholder="e.g. English, Arabic, Hindi"
                className="bg-background border-border text-foreground text-xs h-10 rounded-xl focus:border-primary"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground font-semibold">Skills (comma separated)</Label>
              <Input
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="e.g. Screen Replacement, Soldering, Battery Repair"
                className="bg-background border-border text-foreground text-xs h-10 rounded-xl focus:border-primary"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground font-semibold">Service Areas (comma separated)</Label>
              <Input
                value={formData.service_areas}
                onChange={(e) => setFormData({ ...formData, service_areas: e.target.value })}
                placeholder="e.g. Abu Dhabi Downtown, Al Reem Island, Yas Island"
                className="bg-background border-border text-foreground text-xs h-10 rounded-xl focus:border-primary"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground font-semibold">Account Status</Label>
              <Select
                value={formData.isActive ? "active" : "inactive"}
                onValueChange={(val) => setFormData({ ...formData, isActive: val === "active" })}
              >
                <SelectTrigger className="bg-background border-border text-foreground text-xs h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="active">Active Account</SelectItem>
                  <SelectItem value="inactive">Inactive / Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2">
            {onDelete && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onClose()
                  onDelete(profile)
                }}
                className="w-full sm:w-auto h-10 rounded-xl border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-500/20"
              >
                <Trash2 className="size-3.5 mr-1.5" /> Delete Profile
              </Button>
            )}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button type="button" variant="outline" onClick={onClose} className="h-10 rounded-xl border-border bg-background text-xs font-semibold text-foreground hover:bg-muted">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="h-10 rounded-xl bg-primary text-primary-foreground font-extrabold text-xs px-6 hover:brightness-110 shadow-xs">
                {saving ? "Saving Changes…" : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ProfileDialog({
  profile,
  busy,
  onClose,
  onEdit,
  onDelete,
  onResetPassword,
  onApprove,
  onReject,
  onRequestDocuments,
  onAccountControl,
  onRemoteCommand,
}: {
  profile: Profile | null
  busy: boolean
  onClose: () => void
  onEdit: (_profile: Profile) => void
  onDelete?: (_profile: Profile) => void
  onResetPassword?: (_profile: Profile) => void
  onApprove: (_request: TechnicianRequest) => Promise<void>
  onReject: (_request: TechnicianRequest) => Promise<void>
  onRequestDocuments: (_request: TechnicianRequest) => Promise<void>
  onAccountControl: (_technicianId: string, _action: string) => Promise<void>
  onRemoteCommand: (_technicianId: string, _action: string, _payload?: any) => Promise<void>
}) {
  const [broadcastText, setBroadcastText] = useState("")

  if (!profile) return null

  const name = profile.kind === "request" ? profile.full_name : profile.name
  const specialty = profile.kind === "request" ? profile.experience_main_skill : profile.specialization
  const documentLinks = [
    ["Emirates ID", (profile.documents as any)?.emirates_id || (profile.documents as any)?.emiratesId],
    ["Trade License", (profile.documents as any)?.trade_license || (profile.documents as any)?.tradeLicense],
    ["Company Logo", (profile.documents as any)?.company_logo || (profile.documents as any)?.companyLogo],
    ["Passport", profile.documents.passport],
    ["Visa", profile.documents.visa],
    ["CV / Resume", profile.documents.cv],
    ["Driving licence", profile.documents.driving_license],
    ["Certificate", profile.documents.certificate],
  ].filter((item): item is [string, string] => Boolean(item[1]))

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[96vw] sm:max-w-[95vw] md:max-w-[1100px] lg:max-w-[1200px] xl:max-w-[1280px] max-h-[94vh] p-0 bg-card border border-border shadow-2xl rounded-[24px] overflow-hidden text-card-foreground flex flex-col font-sans">
        {/* Fixed Header */}
        <DialogHeader className="shrink-0 border-b border-border bg-muted/30 px-6 md:px-8 py-6 pr-14">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-5 min-w-0">
              <Avatar className="size-[80px] ring-2 ring-primary/40 shadow-xl shadow-primary/10 shrink-0">
                {profile.profile_photo && <AvatarImage src={profile.profile_photo} alt={name} className="object-cover" />}
                <AvatarFallback className="bg-muted text-2xl font-black text-primary">{initials(name)}</AvatarFallback>
              </Avatar>

              <div className="space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <DialogTitle className="text-2xl md:text-3xl font-black tracking-tight text-foreground leading-none truncate">
                    {name || profile.email || profile.phone || "Technician Profile"}
                  </DialogTitle>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold border shrink-0 ${profile.kind === "technician" && profile.isActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"}`}>
                    <span className={`size-2 rounded-full ${profile.kind === "technician" && profile.isActive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                    {profile.kind === "technician" ? (profile.isActive ? "Active Profile" : "Inactive / Suspended") : "Pending Application"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold text-muted-foreground">
                  <span className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-1 text-primary font-bold">
                    {specialty || "Field Repair Specialist"}
                  </span>
                  {profile.kind === "technician" && profile.employeeId && (
                    <span className="font-mono text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-lg border border-border">
                      ID: {profile.employeeId}
                    </span>
                  )}
                </div>

                <div className="pt-1 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(profile)}
                    className="h-9 rounded-xl border-primary/30 bg-primary/10 text-xs font-bold text-primary hover:bg-primary/20 shadow-xs"
                  >
                    <Pencil className="size-3.5 mr-1.5" /> Edit Profile
                  </Button>

                  {onDelete && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDelete(profile)}
                      className="h-9 rounded-xl border-rose-500/30 bg-rose-500/10 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 shadow-xs"
                    >
                      <Trash2 className="size-3.5 mr-1.5 text-rose-500" /> Delete Profile
                    </Button>
                  )}

                  {profile.latitude !== undefined && profile.longitude !== undefined && (
                    <Button asChild size="sm" variant="outline" className="h-9 rounded-xl border-primary/30 bg-primary/10 text-xs font-bold text-primary hover:bg-primary/20">
                      <a href={`https://maps.google.com/?q=${profile.latitude},${profile.longitude}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="size-3.5 mr-1.5" /> Live Map Pin
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Body Content */}
        <ScrollArea className="flex-1 max-h-[calc(94vh-170px)] overflow-y-auto scroll-smooth">
          <div className="grid gap-6 p-6 md:p-8 grid-cols-1 md:grid-cols-2">
            {/* Card 1: Contact & Identity */}
            <div className="rounded-[16px] bg-muted/20 border border-border/70 p-6 shadow-xs space-y-4 min-w-0">
              <div className="flex items-center gap-2.5 border-b border-border/70 pb-3.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UsersRound className="size-4" />
                </span>
                <h3 className="text-base font-bold text-foreground">Contact & Identity</h3>
              </div>

              <div className="space-y-2.5">
                {[
                  ["Email", profile.email, "email"],
                  ["Phone", profile.phone, "phone"],
                  ["WhatsApp", profile.whatsapp, "whatsapp"],
                  ["Nationality", profile.nationality, "text"],
                  ["Date of Birth", profile.dob, "date"],
                  ["Gender", profile.gender, "text"],
                  ["Language", profile.language, "text"],
                ].map(([label, value, fieldType]) => (
                  <div key={String(label)} className="bg-background border border-border/70 px-4 py-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                    <span className="text-muted-foreground text-xs font-semibold shrink-0">{label}</span>
                    <span className="text-foreground text-xs font-bold min-w-0 truncate text-left sm:text-right">
                      {value ? (
                        fieldType === "whatsapp" ? (
                          <a href={`https://wa.me/${String(value).replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="text-primary hover:underline font-mono">
                            {String(value)}
                          </a>
                        ) : fieldType === "phone" ? (
                          <a href={`tel:${String(value)}`} className="text-primary hover:underline font-mono">
                            {String(value)}
                          </a>
                        ) : fieldType === "email" ? (
                          <span className="text-primary font-mono break-all">{String(value)}</span>
                        ) : (
                          <span>{String(value)}</span>
                        )
                      ) : (
                        <span className="text-muted-foreground/60 italic font-normal">Not recorded</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Work Profile & Skills */}
            <div className="rounded-[16px] bg-muted/20 border border-border/70 p-6 shadow-xs space-y-4 min-w-0">
              <div className="flex items-center gap-2.5 border-b border-border/70 pb-3.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Wrench className="size-4" />
                </span>
                <h3 className="text-base font-bold text-foreground">Work Profile & Skills</h3>
              </div>

              <div className="space-y-4">
                <div className="bg-background border border-border/70 p-4 rounded-xl space-y-1.5">
                  <span className="block text-muted-foreground text-xs font-semibold">Primary Specialty</span>
                  <div className="text-xs font-bold text-primary leading-relaxed break-words">
                    {specialty || "General Service Technician"}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="block text-muted-foreground text-xs font-semibold">Skills & Qualifications</span>
                  {profile.skills.length ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill) => (
                        <span key={skill} className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-1 font-bold text-primary text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground/60 italic text-xs">No skills tagged</span>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="block text-muted-foreground text-xs font-semibold">Covered Service Areas</span>
                  {profile.service_areas.length ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.service_areas.map((area) => (
                        <span key={area} className="rounded-lg bg-background border border-border px-3 py-1 font-semibold text-muted-foreground text-xs">
                          {area}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground/60 italic text-xs">No service area assigned</span>
                  )}
                </div>
              </div>
            </div>

            {/* Card 3: Verification Documents */}
            <div className="rounded-[16px] bg-muted/20 border border-border/70 p-6 shadow-xs space-y-4 min-w-0">
              <div className="flex items-center gap-2.5 border-b border-border/70 pb-3.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-4" />
                </span>
                <h3 className="text-base font-bold text-foreground">Verification Documents</h3>
              </div>

              {documentLinks.length ? (
                <div className="flex flex-col gap-2.5">
                  {documentLinks.map(([label, href]) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center justify-between rounded-xl bg-background border border-border/70 px-4 py-3 text-xs transition-all hover:border-primary hover:bg-muted/40"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <FileText className="size-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-foreground text-xs leading-normal">{label}</span>
                      </div>
                      <span className="text-primary font-bold text-xs flex items-center gap-1 shrink-0">
                        View <ExternalLink className="size-3" />
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-muted/30 border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  No verification documents uploaded.
                </div>
              )}
            </div>

            {/* Card 4: Account Security & Remote Control */}
            {profile.kind === "technician" && (
              <div className="rounded-[16px] bg-muted/20 border border-border/70 p-6 shadow-xs space-y-4 min-w-0 lg:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ShieldCheck className="size-4" />
                    </span>
                    <h3 className="text-base font-bold text-foreground">Account Controls & Remote Security</h3>
                  </div>
                  <span className="font-mono text-xs text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-md font-semibold">
                    ID: {profile.employeeId || profile.id.slice(0, 10)}
                  </span>
                </div>

                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => onAccountControl(profile.id, profile.isActive ? "SUSPEND" : "ACTIVATE")}
                    className={`h-11 rounded-xl font-bold text-xs px-4 flex items-center justify-center gap-2 border ${profile.isActive ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"}`}
                  >
                    {profile.isActive ? <AlertTriangle className="size-4 shrink-0" /> : <CheckCircle2 className="size-4 shrink-0" />}
                    <span>{profile.isActive ? "Suspend Account" : "Activate Account"}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => onAccountControl(profile.id, profile.isLocked ? "UNLOCK" : "LOCK")}
                    className={`h-11 rounded-xl font-bold text-xs px-4 flex items-center justify-center gap-2 border ${profile.isLocked ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20" : "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20"}`}
                  >
                    {profile.isLocked ? <Unlock className="size-4 shrink-0" /> : <Lock className="size-4 shrink-0" />}
                    <span>{profile.isLocked ? "Unlock Screen" : "Remote Lock Screen"}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => onAccountControl(profile.id, "FORCE_LOGOUT")}
                    className="h-11 rounded-xl border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold px-4 flex items-center justify-center gap-2 hover:bg-rose-500/20"
                  >
                    <Power className="size-4 shrink-0 text-rose-500" />
                    <span>Force Sign Out</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => {
                      if (onResetPassword) {
                        onResetPassword(profile)
                      } else {
                        onAccountControl(profile.id, "RESET_PASSWORD")
                      }
                    }}
                    className="h-11 rounded-xl border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold px-4 flex items-center justify-center gap-2 hover:bg-cyan-500/20"
                  >
                    <KeyRound className="size-4 shrink-0 text-cyan-500" />
                    <span>Reset Password</span>
                  </Button>

                  {onDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => onDelete(profile)}
                      className="h-11 rounded-xl border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold px-4 flex items-center justify-center gap-2 hover:bg-rose-500/20 sm:col-span-2"
                    >
                      <Trash2 className="size-4 shrink-0 text-rose-500" />
                      <span>Delete Technician Permanently</span>
                    </Button>
                  )}
                </div>

                <div className="pt-3 border-t border-border/70 space-y-3">
                  <span className="block text-xs font-bold uppercase tracking-wider text-primary">
                    Dispatch Remote App Command
                  </span>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Send custom broadcast alert..."
                      value={broadcastText}
                      onChange={(e) => setBroadcastText(e.target.value)}
                      className="bg-background border-border text-xs text-foreground h-10 rounded-xl flex-1"
                    />
                    <Button
                      size="sm"
                      disabled={busy || !broadcastText}
                      onClick={() => {
                        if (broadcastText) {
                          onRemoteCommand(profile.id, "POPUP_ALERT", { message: broadcastText })
                          setBroadcastText("")
                        }
                      }}
                      className="h-10 rounded-xl bg-primary text-primary-foreground font-bold text-xs px-4 hover:brightness-110"
                    >
                      <Send className="size-3.5 mr-1.5" /> Broadcast
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Fixed Footer Action Bar */}
        <DialogFooter className="shrink-0 border-t border-border bg-muted/30 px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={onClose} className="h-10 w-full sm:w-auto rounded-xl border-border bg-background text-xs font-semibold text-foreground px-5 hover:bg-muted">
              Close Modal
            </Button>
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => onDelete(profile)}
                className="h-10 w-full sm:w-auto rounded-xl border-rose-500/30 bg-rose-500/10 text-xs font-bold text-rose-600 dark:text-rose-400 px-4 hover:bg-rose-500/20"
              >
                <Trash2 className="size-3.5 mr-1.5 text-rose-500" /> Delete Profile
              </Button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {(profile.kind === "request" ? profile.status !== "approved" : !profile.isApproved) && (
              <>
                <Button variant="outline" size="sm" disabled={busy} onClick={() => onRequestDocuments(profile as TechnicianRequest)} className="h-10 w-full sm:w-auto rounded-xl border-amber-500/30 bg-amber-500/10 text-xs font-bold text-amber-600 dark:text-amber-400 px-4 hover:bg-amber-500/20">
                  Request Documents
                </Button>
                <Button variant="destructive" size="sm" disabled={busy} onClick={() => onReject(profile as TechnicianRequest)} className="h-10 w-full sm:w-auto rounded-xl text-xs font-bold px-4">
                  Reject
                </Button>
                <Button size="sm" disabled={busy} onClick={() => onApprove(profile as TechnicianRequest)} className="h-10 w-full sm:w-auto rounded-xl bg-primary text-primary-foreground text-xs font-bold px-5 hover:brightness-110 shadow-md shadow-primary/20">
                  Approve Application
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteConfirmationDialog({
  profile,
  open,
  busy,
  onClose,
  onConfirm,
}: {
  profile: Profile | null
  open: boolean
  busy: boolean
  onClose: () => void
  onConfirm: (_profile: Profile) => Promise<void>
}) {
  if (!profile) return null
  const name = profile.kind === "request" ? profile.full_name : profile.name
  const email = profile.email || "No email recorded"
  const isTech = profile.kind === "technician"

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !busy && onClose()}>
      <DialogContent className="bg-card border border-border text-card-foreground rounded-2xl sm:max-w-md p-6 font-sans">
        <DialogHeader className="space-y-3 pb-2">
          <div className="size-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto sm:mx-0">
            <Trash2 className="size-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Delete {isTech ? "Technician" : "Application"}?
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to permanently delete <strong className="text-foreground font-bold">{name || "this account"}</strong> ({email})?
            <br className="my-1" />
            This will remove their profile record, Firebase authentication account, documents, and mobile app access. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="border-t border-border pt-4 flex flex-col-reverse sm:flex-row gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onClose}
            className="w-full sm:w-auto h-10 rounded-xl border-border text-foreground font-bold text-xs hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={() => onConfirm(profile)}
            className="w-full sm:w-auto h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 shadow-xs"
          >
            {busy ? "Deleting…" : `Delete ${isTech ? "Technician" : "Application"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ManualResetPasswordDialog({
  profile,
  open,
  busy,
  onClose,
  onSubmit,
}: {
  profile: Profile | null
  open: boolean
  busy: boolean
  onClose: () => void
  onSubmit: (_technicianId: string, _password: string, _mustChangePassword: boolean) => Promise<void>
}) {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [mustChange, setMustChange] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      setPassword("")
      setError("")
      setMustChange(true)
      setShowPassword(false)
    }
  }, [open])

  if (!profile) return null

  const isTech = profile.kind === "technician"
  const name = isTech ? profile.name : profile.full_name
  const email = profile.email || ""
  const targetId = isTech ? profile.id : profile.userId

  const handleAutoGenerate = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%"
    let pass = "Kbi@"
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPassword(pass)
    setShowPassword(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!password || password.trim().length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    await onSubmit(targetId, password.trim(), mustChange)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && !v && onClose()}>
      <DialogContent className="border-border bg-card text-foreground sm:max-w-md rounded-2xl">
        <DialogHeader className="space-y-2">
          <div className="size-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-[#00f5c4] flex items-center justify-center">
            <KeyRound className="size-5" />
          </div>
          <DialogTitle className="text-lg font-bold">Manual Password Reset</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Enter a custom password for <strong className="text-foreground">{name}</strong> ({email}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">New Password</Label>
              <button
                type="button"
                onClick={handleAutoGenerate}
                className="text-[11px] font-bold text-cyan-600 dark:text-[#00f5c4] hover:underline flex items-center gap-1"
              >
                <Sparkles className="size-3" /> Auto Generate
              </button>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password (e.g. Kbi123456)"
                className="bg-background border-input text-foreground text-xs h-10 rounded-xl pr-10 focus:border-cyan-500 font-mono"
                disabled={busy}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="tech-must-change"
              checked={mustChange}
              onCheckedChange={(v) => setMustChange(!!v)}
            />
            <Label htmlFor="tech-must-change" className="text-xs text-muted-foreground font-medium cursor-pointer">
              Prompt technician to change password upon first login
            </Label>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium">
              {error}
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-border mt-4 flex flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={busy}
              className="h-10 rounded-xl border-border text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={busy || !password || password.length < 6}
              className="h-10 rounded-xl bg-cyan-600 dark:bg-[#00f5c4] hover:bg-cyan-500 dark:hover:bg-[#00d8a7] text-white dark:text-[#0b0f14] font-extrabold text-xs px-6 shadow-sm"
            >
              {busy ? <Loader2 className="size-4 mr-2 animate-spin" /> : <KeyRound className="size-4 mr-2" />}
              Update Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminTechniciansPage() {
  const t = useT()
  const [requests, setRequests] = useState<TechnicianRequest[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [techniciansLoading, setTechniciansLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newTechData, setNewTechData] = useState({ name: "", email: "", phone: "", specialization: "", password: "" })
  const [tempPasswordModal, setTempPasswordModal] = useState<string | null>(null)
  const [copiedPassword, setCopiedPassword] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [resetPasswordTarget, setResetPasswordTarget] = useState<Profile | null>(null)
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false)

  useEffect(() => {
    const unsubscribeRequests = onSnapshot(collection(db, "technician_requests"), (snapshot) => {
      const items = snapshot.docs.map((item) => {
        const raw = item.data()
        return {
          kind: "request" as const,
          id: item.id,
          userId: String(raw.userId || item.id),
          full_name: String(raw.full_name || raw.name || ""),
          phone: String(raw.phone || ""),
          whatsapp: String(raw.whatsapp || ""),
          email: String(raw.email || ""),
          nationality: String(raw.nationality || ""),
          dob: String(raw.dob || ""),
          gender: String(raw.gender || ""),
          language: String(raw.language || ""),
          profile_photo: String(raw.profile_photo || ""),
          experience_main_skill: String(raw.experience_main_skill || raw.specialization || ""),
          skills: Array.isArray(raw.skills) ? raw.skills.map(String) : [],
          experience: String(raw.experience || ""),
          employment_type: String(raw.employment_type || ""),
          vehicle: typeof raw.vehicle === "boolean" ? raw.vehicle : undefined,
          tools: typeof raw.tools === "boolean" ? raw.tools : undefined,
          onsite: typeof raw.onsite === "boolean" ? raw.onsite : undefined,
          availability: raw.availability,
          service_areas: Array.isArray(raw.service_areas) ? raw.service_areas.map(String) : [],
          latitude: typeof raw.latitude === "number" ? raw.latitude : undefined,
          longitude: typeof raw.longitude === "number" ? raw.longitude : undefined,
          documents: raw.documents || {},
          bank_details: raw.bank_details || {},
          status: normalizeRequestStatus(raw.status),
          updatedAt: raw.updatedAt,
        }
      })
      setRequests(items)
      setRequestsLoading(false)
    }, (err) => {
      console.warn("Requests subscription notice:", err?.message || err)
      setRequestsLoading(false)
    })

    const unsubscribeTechnicians = onSnapshot(collection(db, "technicians"), (snapshot) => {
      const items = snapshot.docs.filter((item) => isTechnicianProfile(item.data())).map((item) => {
        const raw = item.data()
        return {
          kind: "technician" as const,
          id: item.id,
          name: String(raw.name || raw.full_name || raw.displayName || ""),
          phone: String(raw.phone || raw.phoneNumber || ""),
          whatsapp: String(raw.whatsapp || ""),
          email: String(raw.email || ""),
          skills: Array.isArray(raw.skills) ? raw.skills.map(String) : [],
          specialization: String(raw.specialization || raw.department || raw.experience_main_skill || ""),
          isApproved: raw.isApproved === true,
          isActive: raw.isActive === true && raw.isSuspended !== true,
          isSuspended: raw.isSuspended === true,
          isLocked: raw.isLocked === true,
          employeeId: String(raw.employeeId || raw.technician_id || ""),
          latitude: typeof raw.latitude === "number" ? raw.latitude : undefined,
          longitude: typeof raw.longitude === "number" ? raw.longitude : undefined,
          dob: String(raw.dob || ""),
          gender: String(raw.gender || ""),
          language: String(raw.language || ""),
          profile_photo: String(raw.profile_photo || ""),
          nationality: String(raw.nationality || ""),
          service_areas: Array.isArray(raw.service_areas) ? raw.service_areas.map(String) : [],
          bank_details: raw.bank_details || {},
          documents: raw.documents || {},
          online: raw.online === true || raw.isOnline === true,
          available: raw.available === true || raw.isAvailable === true,
          currentJob: String(raw.currentJob || raw.currentOrder || ""),
          updatedAt: raw.updatedAt,
        }
      })
      setTechnicians(items)
      setTechniciansLoading(false)
    }, (err) => {
      console.warn("Technicians subscription notice:", err?.message || err)
      setTechniciansLoading(false)
    })

    return () => {
      unsubscribeRequests()
      unsubscribeTechnicians()
    }
  }, [])

  const pendingRequests = useMemo(() => {
    return requests.filter((request) => request.status !== "approved" && request.status !== "rejected")
  }, [requests])

  const rejectedRequestUserIds = useMemo(() => {
    return new Set(
      requests
        .filter((request) => request.status === "rejected")
        .map((request) => request.userId)
        .filter(Boolean),
    )
  }, [requests])

  const unapprovedTechs = useMemo(() => {
    return technicians.filter(
      (technician) =>
        !technician.isApproved && !rejectedRequestUserIds.has(technician.id),
    )
  }, [rejectedRequestUserIds, technicians])

  const pending = useMemo(() => {
    return [...pendingRequests, ...unapprovedTechs]
  }, [pendingRequests, unapprovedTechs])

  const applicationsList = useMemo(() => {
    const list: Profile[] = [...pendingRequests]
    unapprovedTechs.forEach((tech) => {
      if (!list.some((p) => (p.kind === "request" ? p.userId : p.id) === tech.id)) {
        list.push(tech)
      }
    })
    return list
  }, [pendingRequests, unapprovedTechs])

  const active = useMemo(() => technicians.filter((technician) => technician.isApproved && technician.isActive), [technicians])
  const available = useMemo(() => active.filter((technician) => technician.online && technician.available && !technician.currentJob), [active])

  const filteredTechnicians = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return technicians.filter((technician) => {
      const matchesSearch = !needle || [technician.name, technician.email, technician.phone, technician.employeeId, technician.specialization]
        .some((value) => value.toLowerCase().includes(needle))
      const matchesStatus = statusFilter === "all"
        || (statusFilter === "active" && technician.isApproved && technician.isActive)
        || (statusFilter === "inactive" && (!technician.isApproved || !technician.isActive))
        || (statusFilter === "online" && technician.online)
      return matchesSearch && matchesStatus
    })
  }, [search, statusFilter, technicians])

  const handleSaveTechnicianEdit = async (updatedData: any) => {
    if (!editingProfile) return
    try {
      const targetId = editingProfile.kind === "request" ? editingProfile.userId : editingProfile.id
      const payload: Record<string, any> = {
        name: updatedData.name,
        full_name: updatedData.name,
        email: updatedData.email,
        phone: updatedData.phone,
        whatsapp: updatedData.whatsapp,
        employeeId: updatedData.employeeId,
        technician_id: updatedData.employeeId,
        specialization: updatedData.specialization,
        experience_main_skill: updatedData.specialization,
        skills: updatedData.skills,
        nationality: updatedData.nationality,
        dob: updatedData.dob,
        gender: updatedData.gender,
        language: updatedData.language,
        service_areas: updatedData.service_areas,
        isActive: updatedData.isActive,
        isApproved: updatedData.isApproved,
        updatedAt: Timestamp.now(),
      }

      if (editingProfile.kind === "technician") {
        await updateDoc(doc(db, "technicians", targetId), payload)
      } else {
        await updateDoc(doc(db, "technician_requests", editingProfile.id), payload)
        await setDoc(doc(db, "technicians", targetId), payload, { merge: true })
      }

      setMessage({ type: "success", text: `Profile updated successfully.` })
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to save profile changes." })
    }
  }

  const handleDeleteTechnician = async (profile: Profile) => {
    setIsDeleting(true)
    setMessage(null)
    try {
      const targetId = profile.id
      const userId = profile.kind === "request" ? profile.userId : (profile.id || "")

      const res = await authorizedFetch("/api/admin/technicians/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicianId: targetId, action: "DELETE" }),
      })
      const result = await res.json()
      if (!res.ok || result.error) throw new Error(result.error || "Failed to delete technician")

      try {
        await deleteDoc(doc(db, "technicians", targetId)).catch(() => undefined)
        await deleteDoc(doc(db, "technician_requests", targetId)).catch(() => undefined)
        if (userId && userId !== targetId) {
          await deleteDoc(doc(db, "technicians", userId)).catch(() => undefined)
          await deleteDoc(doc(db, "technician_requests", userId)).catch(() => undefined)
        }
      } catch (clientErr) {
        console.warn("Client delete notice:", clientErr)
      }

      const techName = profile.kind === "request" ? profile.full_name : profile.name
      setMessage({ type: "success", text: `Technician "${techName || "Profile"}" deleted permanently.` })
      setDeleteConfirmOpen(false)
      setDeleteTarget(null)
      if (selectedProfile?.id === profile.id) setSelectedProfile(null)
      if (editingProfile?.id === profile.id) setEditingProfile(null)
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to delete technician" })
    } finally {
      setIsDeleting(false)
    }
  }

  const runAccountAction = async (technicianId: string, action: string, data?: any) => {
    setSavingId(technicianId)
    setMessage(null)
    try {
      const res = await authorizedFetch("/api/admin/technicians/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicianId, action, data }),
      })
      const result = await res.json()
      if (!res.ok || result.error) throw new Error(result.error || "Operation failed")

      if (result.temporaryPassword) {
        setTempPasswordModal(result.temporaryPassword)
      } else {
        setMessage({ type: "success", text: `Action [${action}] executed successfully.` })
      }
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Account action failed" })
    } finally {
      setSavingId(null)
    }
  }

  const runRemoteCommand = async (technicianId: string, action: string, payload?: any) => {
    setSavingId(technicianId)
    setMessage(null)
    try {
      const res = await authorizedFetch("/api/admin/remote-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicianId, action, payload }),
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.error || "Remote command failed")
      setMessage({ type: "success", text: `Remote command [${action}] dispatched.` })
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Command failed" })
    } finally {
      setSavingId(null)
    }
  }

  const handleCreateTechnician = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTechData.name || !newTechData.email) return
    setSavingId("new")
    await runAccountAction("", "CREATE", newTechData)
    setCreateDialogOpen(false)
    setNewTechData({ name: "", email: "", phone: "", specialization: "", password: "" })
  }

  const runAction = async (request: TechnicianRequest, action: "approve" | "reject" | "documents") => {
    setSavingId(request.id)
    setMessage(null)
    try {
      if (action === "approve") {
        const employeeId = `KBI-${request.userId.slice(0, 8).toUpperCase()}`
        const profile: Record<string, unknown> = {
          uid: request.userId,
          userId: request.userId,
          name: request.full_name,
          phone: request.phone,
          email: request.email,
          skills: request.skills,
          specialization: request.experience_main_skill,
          employeeId,
          technician_id: employeeId,
          status: "APPROVED",
          isApproved: true,
          isActive: true,
          service_areas: request.service_areas,
          updatedAt: Timestamp.now(),
          createdAt: Timestamp.now(),
        }
        if (request.whatsapp) profile.whatsapp = request.whatsapp
        if (request.profile_photo) profile.profile_photo = request.profile_photo
        if (request.nationality) profile.nationality = request.nationality
        if (request.dob) profile.dob = request.dob
        if (request.gender) profile.gender = request.gender
        if (request.language) profile.language = request.language
        if (request.latitude !== undefined) profile.latitude = request.latitude
        if (request.longitude !== undefined) profile.longitude = request.longitude
        if (Object.keys(request.documents).length) profile.documents = request.documents
        if (Object.keys(request.bank_details).length) profile.bank_details = request.bank_details

        await setDoc(doc(db, "technicians", request.userId), profile, { merge: true })
        await runAccountAction(request.userId, "APPROVE")
        await updateDoc(doc(db, "technician_requests", request.id), { status: "approved", updatedAt: Timestamp.now() })
        setMessage({ type: "success", text: "Technician approved and account access enabled." })
      } else {
        const nextStatus = action === "reject" ? "rejected" : "documents_requested"
        await updateDoc(doc(db, "technician_requests", request.id), { status: nextStatus, updatedAt: Timestamp.now() })
        setMessage({ type: "success", text: action === "reject" ? "Application rejected." : "Document request recorded." })
      }
      setSelectedProfile(null)
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "The application could not be updated." })
    } finally {
      setSavingId(null)
    }
  }

  const metrics = [
    { label: "Profiles", value: techniciansLoading ? "—" : technicians.length, detail: "Synced accounts", icon: UsersRound, tone: "bg-cyan-400/10 text-cyan-300 ring-cyan-400/20" },
    { label: "Available", value: techniciansLoading ? "—" : available.length, detail: "Ready for jobs", icon: Wifi, tone: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20" },
    { label: "Pending", value: requestsLoading ? "—" : pending.length, detail: "Awaiting review", icon: ClipboardCheck, tone: "bg-amber-400/10 text-amber-300 ring-amber-400/20" },
  ]

  return (
    <div className="mx-auto min-w-0 w-full max-w-7xl space-y-5">
      {/* Header Section */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20 shadow-sm shadow-primary/10">
            <UsersRound className="size-5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/80">Workforce</p>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight sm:text-3xl">{t("Technicians")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Master control center: profiles, edit capabilities, account security, remote actions, and live GPS.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setCreateDialogOpen(true)} className="bg-[#00f5c4] text-[#0b0f14] font-extrabold hover:bg-[#00d8a7] shadow-lg shadow-[#00f5c4]/20 h-9 rounded-xl">
            <UserPlus className="size-4 mr-1.5" /> Create Account
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="shadow-sm h-9 rounded-xl"><Settings2 /> Actions <ChevronDown /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Technician workspace</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setCreateDialogOpen(true)}><UserPlus />Add new technician</DropdownMenuItem>
              <DropdownMenuItem disabled={!search && statusFilter === "all"} onSelect={() => { setSearch(""); setStatusFilter("all") }}><FilterX />Clear filters</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => window.location.reload()}><RefreshCw />Reload live data</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="grid gap-3 sm:grid-cols-3" aria-label="Technician summary">
        {metrics.map(({ label, value, detail, icon: Icon, tone }) => (
          <Card key={label} size="sm" className="bg-card/80 shadow-lg shadow-black/5 ring-border/80">
            <CardContent className="flex items-center justify-between gap-4">
              <div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p><p className="mt-0.5 text-xs text-muted-foreground/75">{detail}</p></div>
              <span className={`flex size-10 items-center justify-center rounded-xl ring-1 ${tone}`}><Icon className="size-5" /></span>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Alert Notices */}
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          {message.type === "error" ? <CircleAlert /> : <CheckCircle2 />}
          <AlertTitle>{message.type === "error" ? "Action failed" : "Updated"}</AlertTitle>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Tabs Layout */}
      <Tabs defaultValue="directory" className="gap-4">
        <TabsList className="h-10 rounded-xl bg-muted/70 p-1">
          <TabsTrigger value="directory" className="min-w-32 rounded-lg"><UsersRound />Directory <span className="ml-1 rounded-md bg-background/70 px-1.5 py-0.5 text-[10px] tabular-nums">{technicians.length}</span></TabsTrigger>
          <TabsTrigger value="applications" className="min-w-36 rounded-lg"><ClipboardCheck />Applications <span className="ml-1 rounded-md bg-background/70 px-1.5 py-0.5 text-[10px] tabular-nums">{pending.length}</span></TabsTrigger>
          <TabsTrigger value="gps" className="min-w-36 rounded-lg"><Navigation />Live GPS Radar</TabsTrigger>
        </TabsList>

        <TabsContent value="directory">
          <Card className="min-w-0 gap-0 overflow-hidden bg-card/85 py-0 shadow-xl shadow-black/10 ring-border/80">
            <CardHeader className="border-b border-border/70 px-4 py-4">
              <CardTitle className="flex items-center gap-2.5 text-base"><span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary"><UsersRound className="size-4" /></span>Technician directory</CardTitle>
              <CardDescription className="pl-9">Live identity, specialty, profile editing, account controls, and remote security actions.</CardDescription>
              <CardAction><Badge variant="ghost" className="gap-1.5 text-emerald-300"><span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_3px_oklch(0.75_0.16_155/0.12)]" />Live</Badge></CardAction>
            </CardHeader>
            <CardContent className="min-w-0 overflow-hidden px-0">
              <div className="flex flex-col gap-2 border-b border-border/70 bg-muted/20 p-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, contact, ID, or specialty" className="h-9 border-input bg-background/65 pl-9 shadow-none" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger size="sm" className="w-full border-input bg-background/65 shadow-none sm:w-40" aria-label="Filter technicians"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All profiles</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {techniciansLoading ? (
                <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-11 w-full" />)}</div>
              ) : filteredTechnicians.length === 0 ? (
                <Empty className="min-h-52 border-0"><EmptyHeader><EmptyMedia variant="icon"><Users /></EmptyMedia><EmptyTitle>No technicians found</EmptyTitle><EmptyDescription>Try a different search or status filter.</EmptyDescription></EmptyHeader></Empty>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/25">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-9 pl-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Technician</TableHead>
                      <TableHead className="hidden h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground min-[1440px]:table-cell">ID</TableHead>
                      <TableHead className="hidden h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">Specialty</TableHead>
                      <TableHead className="h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                      <TableHead className="hidden h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">Availability</TableHead>
                      <TableHead className="h-9 w-12 pr-4 text-right"><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTechnicians.map((technician) => (
                      <TableRow key={technician.id} className="group border-border/70 hover:bg-primary/[0.045]">
                        <TableCell className="py-2.5 pl-4 cursor-pointer" onClick={() => setSelectedProfile(technician)}>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9 ring-1 ring-border">
                              {technician.profile_photo && <AvatarImage src={technician.profile_photo} alt={technician.name} />}
                              <AvatarFallback className="bg-muted text-xs">{initials(technician.name)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="max-w-48 truncate text-sm font-medium text-foreground group-hover:text-[#00f5c4] transition-colors">{recorded(technician.name)}</p>
                              <p className="max-w-48 truncate text-xs text-muted-foreground">{technician.email || technician.phone || "No contact recorded"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden font-mono text-xs text-muted-foreground min-[1440px]:table-cell">{recorded(technician.employeeId)}</TableCell>
                        <TableCell className="hidden max-w-56 truncate text-muted-foreground lg:table-cell">{recorded(technician.specialization)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={technician.isApproved && technician.isActive ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-amber-400/20 bg-amber-400/10 text-amber-300"}>
                            <span className={`size-1.5 rounded-full ${technician.isApproved && technician.isActive ? "bg-emerald-400" : "bg-amber-400"}`} />
                            {technician.isApproved && technician.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className={`inline-flex items-center gap-2 text-sm ${technician.online ? "text-emerald-300" : "text-muted-foreground"}`}>
                            {technician.online ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
                            {technician.online ? (technician.available && !technician.currentJob ? "Available" : "Busy") : "Offline"}
                          </span>
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm" className="rounded-full text-muted-foreground hover:text-foreground" aria-label={`Actions for ${recorded(technician.name)}`}>
                                <MoreHorizontal />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel>{recorded(technician.name)}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => setSelectedProfile(technician)}><Eye className="size-4 mr-2" />Inspect profile</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setEditingProfile(technician)}><Pencil className="size-4 mr-2 text-[#00f5c4]" />Edit profile</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => runAccountAction(technician.id, technician.isActive ? "SUSPEND" : "ACTIVATE")}>
                                {technician.isActive ? <AlertTriangle className="size-4 mr-2 text-amber-400" /> : <CheckCircle2 className="size-4 mr-2 text-emerald-400" />}
                                {technician.isActive ? "Suspend Account" : "Activate Account"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => runAccountAction(technician.id, technician.isLocked ? "UNLOCK" : "LOCK")}>
                                {technician.isLocked ? <Unlock className="size-4 mr-2 text-emerald-400" /> : <Lock className="size-4 mr-2 text-rose-400" />}
                                {technician.isLocked ? "Unlock Screen" : "Remote Lock Screen"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => runAccountAction(technician.id, "FORCE_LOGOUT")}>
                                <Power className="size-4 mr-2 text-rose-400" />Force Sign Out
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => {
                                setResetPasswordTarget(technician)
                                setResetPasswordOpen(true)
                              }}>
                                <KeyRound className="size-4 mr-2 text-cyan-400" />Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => runRemoteCommand(technician.id, "NAVIGATE", { screen: "INCOMING_ORDER" })}>
                                <Smartphone className="size-4 mr-2 text-cyan-400" />Dispatch Screen
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={() => {
                                  setDeleteTarget(technician)
                                  setDeleteConfirmOpen(true)
                                }}
                                className="text-rose-400 focus:text-rose-300 focus:bg-rose-950/40 cursor-pointer"
                              >
                                <Trash2 className="size-4 mr-2 text-rose-400" />Delete technician
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="flex items-center justify-between border-t border-border/70 px-4 py-2.5 text-xs text-muted-foreground">
                <span>Showing {filteredTechnicians.length} of {technicians.length}</span>
                <span className="hidden items-center gap-1.5 sm:flex"><span className="size-1.5 rounded-full bg-emerald-400" />Live sync</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <Card className="min-w-0 gap-0 overflow-hidden bg-card/85 py-0 shadow-xl shadow-black/10 ring-border/80">
            <CardHeader className="border-b border-border/70 px-4 py-4">
              <CardTitle className="flex items-center gap-2.5 text-base"><span className="flex size-7 items-center justify-center rounded-lg bg-amber-400/10 text-amber-300"><ClipboardCheck className="size-4" /></span>Applications</CardTitle>
              <CardDescription className="pl-9">Review applicant data before enabling account access.</CardDescription>
              <CardAction><Badge variant={pending.length ? "secondary" : "ghost"}>{pending.length} pending</Badge></CardAction>
            </CardHeader>
            <CardContent className="min-w-0 overflow-hidden px-0">
              {requestsLoading ? (
                <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-11 w-full" />)}</div>
              ) : applicationsList.length === 0 ? (
                <Empty className="min-h-52 border-0"><EmptyHeader><EmptyMedia variant="icon"><UserCheck /></EmptyMedia><EmptyTitle>No applications</EmptyTitle><EmptyDescription>Technician applications will appear here automatically.</EmptyDescription></EmptyHeader></Empty>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/25">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-9 pl-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Applicant</TableHead>
                      <TableHead className="hidden h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">Specialty</TableHead>
                      <TableHead className="hidden h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">Service areas</TableHead>
                      <TableHead className="h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                      <TableHead className="h-9 w-12 pr-4 text-right"><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applicationsList.map((item) => {
                      const name = item.kind === "request" ? item.full_name : item.name
                      const skill = item.kind === "request" ? item.experience_main_skill : item.specialization
                      const statusLabel = item.kind === "request" ? requestStatusLabel[item.status] : (item.isApproved ? "Approved" : "Pending Approval")
                      const statusVariant = item.kind === "request" ? requestStatusVariant[item.status] : (item.isApproved ? "default" : "secondary")
                      return (
                        <TableRow key={`${item.kind}-${item.id}`} className="border-border/70 hover:bg-primary/[0.045]">
                          <TableCell className="py-2.5 pl-4 cursor-pointer" onClick={() => setSelectedProfile(item)}>
                            <p className="text-sm font-medium hover:text-[#00f5c4] transition-colors">{recorded(name)}</p>
                            <p className="text-xs text-muted-foreground">{item.email || item.phone || "No contact recorded"}</p>
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground md:table-cell">{recorded(skill)}</TableCell>
                          <TableCell className="hidden max-w-60 truncate text-muted-foreground lg:table-cell">{item.service_areas?.length ? item.service_areas.join(", ") : "Not recorded"}</TableCell>
                          <TableCell><Badge variant={statusVariant}>{statusLabel}</Badge></TableCell>
                          <TableCell className="pr-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm" className="rounded-full text-muted-foreground hover:text-foreground" aria-label={`Actions for ${recorded(name)}`}>
                                  <MoreHorizontal />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Application</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => setSelectedProfile(item)}><Eye className="size-4 mr-2" />Review details</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setEditingProfile(item)}><Pencil className="size-4 mr-2 text-[#00f5c4]" />Edit profile</DropdownMenuItem>
                                {item.kind === "request" && (
                                  <>
                                    <DropdownMenuItem onSelect={() => runAction(item, "approve")}><CheckCircle2 className="size-4 mr-2 text-emerald-400" />Approve</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => runAction(item, "reject")} className="text-rose-400"><CircleAlert className="size-4 mr-2 text-rose-400" />Reject</DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setDeleteTarget(item)
                                    setDeleteConfirmOpen(true)
                                  }}
                                  className="text-rose-400 focus:text-rose-300 focus:bg-rose-950/40 cursor-pointer"
                                >
                                  <Trash2 className="size-4 mr-2 text-rose-400" />Delete application
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
              <div className="border-t border-border/70 px-4 py-2.5 text-xs text-muted-foreground">{applicationsList.length} application{applicationsList.length === 1 ? "" : "s"}</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gps">
          <Card className="min-w-0 gap-0 overflow-hidden bg-card border-border py-0 shadow-xl">
            <CardHeader className="border-b border-border px-6 py-4">
              <CardTitle className="flex items-center gap-2.5 text-base text-foreground">
                <Navigation className="size-5 text-cyan-600 dark:text-[#00f5c4] animate-pulse" /> Live Technician GPS Dispatch Radar
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Real-time field location telemetry stream. Open Full Dispatch Radar for active map controls.
              </CardDescription>
              <CardAction>
                <Button asChild size="sm" className="bg-cyan-600 dark:bg-[#00f5c4] text-white dark:text-[#0b0f14] font-bold text-xs hover:bg-cyan-500 dark:hover:bg-[#00d8a7] rounded-xl">
                  <Link href="/admin/tracking"><MapPin className="size-3.5 mr-1.5" /> Full Radar View</Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {technicians.map((t) => (
                  <div key={t.id} className="rounded-2xl bg-card border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 ring-1 ring-cyan-500/30 dark:ring-[#00f5c4]/30">
                          {t.profile_photo && <AvatarImage src={t.profile_photo} alt={t.name} />}
                          <AvatarFallback className="bg-muted text-xs font-bold text-cyan-600 dark:text-[#00f5c4]">{initials(t.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-foreground text-sm leading-tight">{t.name || "Technician"}</p>
                          <p className="text-[11px] text-muted-foreground">{t.specialization || "Field Specialist"}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={t.online ? "bg-emerald-500/10 text-emerald-600 dark:text-[#00f5c4] border-emerald-500/30" : "bg-muted text-muted-foreground"}>
                        {t.online ? "ONLINE" : "OFFLINE"}
                      </Badge>
                    </div>

                    {t.latitude !== undefined && t.longitude !== undefined && (
                      <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                        <span className="font-mono text-[11px] text-cyan-600 dark:text-[#00f5c4]">
                          {t.latitude.toFixed(4)}, {t.longitude.toFixed(4)}
                        </span>
                        <a href={`https://maps.google.com/?q=${t.latitude},${t.longitude}`} target="_blank" rel="noreferrer" className="text-cyan-600 dark:text-[#00f5c4] hover:underline font-bold flex items-center gap-1">
                          Map Pin <ExternalLink className="size-3" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Technician Account Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <UserPlus className="size-5 text-cyan-600 dark:text-[#00f5c4]" /> Create Technician Account
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Generate a new technician profile and credentials.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTechnician} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Full Name</Label>
              <Input
                required
                value={newTechData.name}
                onChange={(e) => setNewTechData({ ...newTechData, name: e.target.value })}
                placeholder="e.g. Mahmoud Rashad"
                className="bg-background border-input text-foreground text-xs h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Email Address</Label>
              <Input
                required
                type="email"
                value={newTechData.email}
                onChange={(e) => setNewTechData({ ...newTechData, email: e.target.value })}
                placeholder="tech@kbi.ae"
                className="bg-background border-input text-foreground text-xs h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Phone Number</Label>
              <Input
                value={newTechData.phone}
                onChange={(e) => setNewTechData({ ...newTechData, phone: e.target.value })}
                placeholder="+971501111111"
                className="bg-background border-input text-foreground text-xs h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Specialization / Skill</Label>
              <Input
                value={newTechData.specialization}
                onChange={(e) => setNewTechData({ ...newTechData, specialization: e.target.value })}
                placeholder="e.g. CCTV Installation, Hardware Repair"
                className="bg-background border-input text-foreground text-xs h-10 rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)} className="h-10 rounded-xl border-border text-xs font-bold">
                Cancel
              </Button>
              <Button type="submit" disabled={savingId === "new"} className="h-10 rounded-xl bg-cyan-600 dark:bg-[#00f5c4] text-white dark:text-[#0b0f14] font-extrabold text-xs px-5 hover:bg-cyan-500 dark:hover:bg-[#00d8a7]">
                {savingId === "new" ? "Creating…" : "Create Profile"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manual Password Reset Dialog */}
      <ManualResetPasswordDialog
        profile={resetPasswordTarget}
        open={resetPasswordOpen}
        busy={resetPasswordTarget ? savingId === (resetPasswordTarget.kind === "technician" ? resetPasswordTarget.id : resetPasswordTarget.userId) : false}
        onClose={() => {
          setResetPasswordOpen(false)
          setResetPasswordTarget(null)
        }}
        onSubmit={async (technicianId, password, mustChangePassword) => {
          await runAccountAction(technicianId, "RESET_PASSWORD", { password, mustChangePassword })
          setResetPasswordOpen(false)
        }}
      />

      {/* Temporary Password Display Dialog */}
      <Dialog open={!!tempPasswordModal} onOpenChange={() => {
        setTempPasswordModal(null)
        setResetPasswordTarget(null)
      }}>
        <DialogContent className="bg-card border-border text-foreground rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-cyan-600 dark:text-[#00f5c4]">
              <KeyRound className="size-5" /> Account Password Set
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              The technician password has been updated. You can copy it below.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/50 border border-cyan-500/30 p-4 rounded-xl space-y-2 text-center my-2">
            <span className="text-xs text-muted-foreground block font-medium">Technician Account Password</span>
            <div className="flex items-center justify-center gap-2">
              <p className="font-mono text-lg font-black text-cyan-600 dark:text-[#00f5c4] select-all tracking-wider">{tempPasswordModal}</p>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => {
                  if (tempPasswordModal) {
                    navigator.clipboard.writeText(tempPasswordModal)
                    setCopiedPassword(true)
                    setTimeout(() => setCopiedPassword(false), 2000)
                  }
                }}
                className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
                title="Copy Password"
              >
                {copiedPassword ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setTempPasswordModal(null)
                setResetPasswordTarget(null)
              }}
              className="h-10 rounded-xl bg-cyan-600 dark:bg-[#00f5c4] text-white dark:text-[#0b0f14] font-extrabold text-xs w-full shadow-sm"
            >
              Done & Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Profile Inspection Dialog */}
      <ProfileDialog
        profile={selectedProfile}
        busy={selectedProfile ? savingId === selectedProfile.id : false}
        onClose={() => setSelectedProfile(null)}
        onEdit={(profileToEdit) => setEditingProfile(profileToEdit)}
        onDelete={(profileToDelete) => {
          setDeleteTarget(profileToDelete)
          setDeleteConfirmOpen(true)
        }}
        onResetPassword={(profileToReset) => {
          setSelectedProfile(null)
          setResetPasswordTarget(profileToReset)
          setResetPasswordOpen(true)
        }}
        onApprove={(request) => runAction(request, "approve")}
        onReject={(request) => runAction(request, "reject")}
        onRequestDocuments={(request) => runAction(request, "documents")}
        onAccountControl={runAccountAction}
        onRemoteCommand={runRemoteCommand}
      />

      {/* Edit Technician Profile Dialog */}
      <EditTechnicianDialog
        profile={editingProfile}
        open={!!editingProfile}
        onClose={() => setEditingProfile(null)}
        onSave={handleSaveTechnicianEdit}
        onDelete={(profileToDelete) => {
          setDeleteTarget(profileToDelete)
          setDeleteConfirmOpen(true)
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationDialog
        profile={deleteTarget}
        open={deleteConfirmOpen}
        busy={isDeleting}
        onClose={() => {
          if (!isDeleting) {
            setDeleteConfirmOpen(false)
            setDeleteTarget(null)
          }
        }}
        onConfirm={handleDeleteTechnician}
      />
    </div>
  )
}
