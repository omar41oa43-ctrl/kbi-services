"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { useT } from "@/components/language-provider"
import { Trash2, Plus, Loader2 } from "lucide-react"
import { ImageUpload } from "@/components/ui/image-upload"
import { AppSelect } from "@/components/ui/app-select"
import { PartsInventory } from "@/components/parts-inventory"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import {
  getDevicesAction,
  addDeviceAction,
  deleteDeviceAction,
  getBrandsAction,
  addBrandAction,
  deleteBrandAction,
  getModelsAction,
  addModelAction,
  deleteModelAction,
  getIssuesAction,
  addIssueAction,
  updateIssueAction,
  deleteIssueAction
} from "@/app/actions/admin-inventory"

interface Device { id: string; name: string; icon: string; description?: string }
interface Brand { id: string; deviceId: string; name: string }
interface Model { id: string; brandId: string; name: string }
interface Issue { id: string; deviceId: string; name: string; durationMinutes: number }

import { auth } from "@/firebase/authClient"

export default function AdminInventoryPage() {
  const t = useT()
  const { toast } = useToast()
  const [tab, setTab] = useState<"devices" | "models" | "issues" | "parts">("parts")
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const isMounted = useRef(true)

  // Data
  const [devices, setDevices] = useState<Device[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [issues, setIssues] = useState<Issue[]>([])

  // UI State
  const [newDeviceName, setNewDeviceName] = useState("")
  const [newDeviceIcon, setNewDeviceIcon] = useState("")

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("")
  const [selectedBrandId, setSelectedBrandId] = useState<string>("")
  const [newBrandName, setNewBrandName] = useState("")
  const [newModelName, setNewModelName] = useState("")

  const [issueDeviceId, setIssueDeviceId] = useState<string>("")
  const [newIssueName, setNewIssueName] = useState("")
  const [newIssueDuration, setNewIssueDuration] = useState<string>("30")

  const fetchData = async () => {
    if (loading && devices.length > 0) return // Already loading
    setLoading(true)
    try {
      const [d, b, m, i] = await Promise.all([
        getDevicesAction(),
        getBrandsAction(),
        getModelsAction(),
        getIssuesAction()
      ])

      if (!isMounted.current) return

      setDevices(d as Device[])
      setBrands(b as Brand[])
      setModels(m as Model[])
      setIssues(i as Issue[])

      if (d.length > 0 && !selectedDeviceId) setSelectedDeviceId(d[0].id)
      if (d.length > 0 && !issueDeviceId) setIssueDeviceId(d[0].id)

    } catch (e: any) {
      if (!isMounted.current) return
      const errorStr = String(e?.message || e?.name || "").toLowerCase()
      if (errorStr.includes('abort') || errorStr.includes('cancelled') || errorStr.includes('aborted')) return
      toast({ variant: "destructive", title: "Error", description: "Failed to load data" })
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }

  useEffect(() => {
    isMounted.current = true
    fetchData()
    return () => { isMounted.current = false }
  }, [])

  // Derived State
  const filteredBrands = useMemo(() => brands.filter(b => b.deviceId === selectedDeviceId), [brands, selectedDeviceId])
  const filteredModels = useMemo(() => models.filter(m => m.brandId === selectedBrandId), [models, selectedBrandId])
  const filteredIssues = useMemo(() => issues.filter(i => i.deviceId === issueDeviceId), [issues, issueDeviceId])

  // --- ACTIONS ---

  const addDevice = async () => {
    if (!newDeviceName.trim()) return
    setProcessing(true)
    const iconToUse = newDeviceIcon || "Smartphone"
    try {
      const user = auth.currentUser
      if (!user) throw new Error("Not logged in")
      const idToken = await user.getIdToken()

      const res = await addDeviceAction(newDeviceName, iconToUse, idToken)
      if (res.error) throw new Error(res.error)
      setNewDeviceName("")
      setNewDeviceIcon("")
      toast({ title: "Success", description: "Device added" })
      fetchData()
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message || "Failed to add device" })
    } finally { setProcessing(false) }
  }

  const deleteDevice = async (id: string) => {
    if (!confirm("Delete this device?")) return
    try {
      const user = auth.currentUser
      if (!user) throw new Error("Not logged in")
      const idToken = await user.getIdToken()

      const res = await deleteDeviceAction(id, idToken)
      if (res.error) throw new Error(res.error)

      setDevices(prev => prev.filter(d => d.id !== id))
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message || "Failed to delete" })
    }
  }

  const addBrand = async () => {
    if (!selectedDeviceId || !newBrandName.trim()) return
    setProcessing(true)
    try {
      const user = auth.currentUser
      if (!user) throw new Error("Not logged in")
      const idToken = await user.getIdToken()

      await addBrandAction(selectedDeviceId, newBrandName, idToken)
      setNewBrandName("")
      toast({ title: "Success", description: "Brand added" })
      fetchData()
    } catch (e: any) { toast({ variant: "destructive", title: "Error", description: e.message }) }
    finally { setProcessing(false) }
  }

  const deleteBrand = async (id: string) => {
    try {
      const user = auth.currentUser
      if (!user) throw new Error("Not logged in")
      const idToken = await user.getIdToken()

      await deleteBrandAction(id, idToken)
      setBrands(prev => prev.filter(b => b.id !== id))
    } catch (e: any) { toast({ variant: "destructive", title: "Error", description: e.message }) }
  }

  const addModel = async () => {
    if (!selectedBrandId || !newModelName.trim()) return
    setProcessing(true)
    try {
      const user = auth.currentUser
      if (!user) throw new Error("Not logged in")
      const idToken = await user.getIdToken()

      await addModelAction(selectedBrandId, newModelName, idToken)
      setNewModelName("")
      toast({ title: "Success", description: "Model added" })
      fetchData()
    } catch (e: any) { toast({ variant: "destructive", title: "Error", description: e.message }) }
    finally { setProcessing(false) }
  }

  const deleteModel = async (id: string) => {
    try {
      const user = auth.currentUser
      if (!user) throw new Error("Not logged in")
      const idToken = await user.getIdToken()

      await deleteModelAction(id, idToken)
      setModels(prev => prev.filter(m => m.id !== id))
    } catch (e: any) { toast({ variant: "destructive", title: "Error", description: e.message }) }
  }

  const addIssue = async () => {
    if (!issueDeviceId || !newIssueName.trim()) return
    setProcessing(true)
    try {
      const user = auth.currentUser
      if (!user) throw new Error("Not logged in")
      const idToken = await user.getIdToken()

      await addIssueAction(issueDeviceId, newIssueName, Number(newIssueDuration) || 30, idToken)
      setNewIssueName("")
      toast({ title: "Success", description: "Issue added" })
      fetchData()
    } catch (e: any) { toast({ variant: "destructive", title: "Error", description: e.message }) }
    finally { setProcessing(false) }
  }

  const updateIssueDurationHandler = async (id: string, minutes: number) => {
    try {
      const user = auth.currentUser
      if (!user) throw new Error("Not logged in")
      const idToken = await user.getIdToken()

      await updateIssueAction(id, { durationMinutes: minutes }, idToken)
    } catch (e: any) { toast({ variant: "destructive", title: "Error", description: e.message }) }
  }

  const deleteIssue = async (id: string) => {
    try {
      const user = auth.currentUser
      if (!user) throw new Error("Not logged in")
      const idToken = await user.getIdToken()

      await deleteIssueAction(id, idToken)
      setIssues(prev => prev.filter(i => i.id !== id))
    } catch (e: any) { toast({ variant: "destructive", title: "Error", description: e.message }) }
  }

  if (loading && devices.length === 0) return <div className="p-8 text-center text-white/50">{t("Loading...")}</div>

  return (
    <section className="pt-2 pb-8">
      <Toaster />
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setTab("parts")} className={`px-3 py-2 rounded-lg text-sm ${tab === "parts" ? "bg-cyan-500 text-black" : "bg-white/5 border border-white/10"}`}>{t("Spare Parts")}</button>
          <button onClick={() => setTab("devices")} className={`px-3 py-2 rounded-lg text-sm ${tab === "devices" ? "bg-cyan-500 text-black" : "bg-white/5 border border-white/10"}`}>{t("Devices List")}</button>
          <button onClick={() => setTab("models")} className={`px-3 py-2 rounded-lg text-sm ${tab === "models" ? "bg-cyan-500 text-black" : "bg-white/5 border border-white/10"}`}>{t("Models Management")}</button>
          <button onClick={() => setTab("issues")} className={`px-3 py-2 rounded-lg text-sm ${tab === "issues" ? "bg-cyan-500 text-black" : "bg-white/5 border border-white/10"}`}>{t("Issues Management")}</button>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchData} title="Refresh">
          <Loader2 className={cn("w-4 h-4", loading && "animate-spin")} />
        </Button>
      </div>

      {tab === "devices" && (
        <div className="grid md:grid-cols-1 gap-6">
          <GlassCard>
            <h2 className="text-xl font-semibold mb-4">{t("Devices List")}</h2>
            <div className="flex flex-col md:flex-row gap-6 mb-8 items-start bg-white/5 p-6 rounded-xl border border-white/10">
              <div className="shrink-0">
                <label className="text-xs text-white/50 mb-2 block">{t("Device Icon")}</label>
                <ImageUpload value={newDeviceIcon} onChange={setNewDeviceIcon} path="devices" />
              </div>
              <div className="flex-1 w-full">
                <label className="text-xs text-white/50 mb-2 block">{t("Device Name")}</label>
                <div className="flex gap-2">
                  <input value={newDeviceName} onChange={(e) => setNewDeviceName(e.target.value)} placeholder={t("Device Name")} className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500" />
                  <button disabled={processing} onClick={addDevice} className="px-6 py-3 bg-cyan-500 text-black rounded-xl font-semibold flex items-center gap-2">
                    <Plus className="w-5 h-5" /> {t("Add")}
                  </button>
                </div>
                <p className="text-xs text-white/30 mt-2">{t("Upload an icon or a default placeholder will be used.")}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices.map((d) => (
                <div key={d.id} className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
                      {d.icon.startsWith("http") ? (
                        <img src={d.icon} alt={d.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-white/50">{d.icon.substring(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-lg">{d.name}</p>
                      <p className="text-xs text-white/50">
                        {brands.filter(b => b.deviceId === d.id).length} {t("Brand")} •
                        {issues.filter(i => i.deviceId === d.id).length} {t("Issue")}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => deleteDevice(d.id)} className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {tab === "models" && (
        <div className="grid md:grid-cols-2 gap-6">
          <GlassCard>
            <h2 className="text-xl font-semibold mb-4">{t("Brands Management")}</h2>
            <div className="mb-4">
              <label className="text-xs text-white/50 mb-1 block">{t("Select Device")}</label>
              <AppSelect
                value={selectedDeviceId}
                onValueChange={setSelectedDeviceId}
                placeholder={t("Choose device...")}
                items={devices.map(d => ({ value: d.id, label: d.name }))}
              />
            </div>
            <div className="flex gap-2 mb-6">
              <input value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} placeholder={t("Brand Name")} className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-cyan-500" />
              <button disabled={processing} onClick={addBrand} className="px-4 py-2 bg-cyan-500 text-black rounded-lg font-semibold flex items-center gap-2">
                <Plus className="w-4 h-4" /> {t("Add")}
              </button>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
              {filteredBrands.map(b => (
                <div key={b.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors group cursor-pointer ${selectedBrandId === b.id ? "bg-cyan-500/10 border-cyan-500/50" : "bg-white/5 border-white/10 hover:border-white/20"}`} onClick={() => setSelectedBrandId(b.id)}>
                  <span className="font-medium">{b.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); deleteBrand(b.id) }} className="p-1.5 rounded-md hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {filteredBrands.length === 0 && <p className="text-center text-white/20 py-8 italic text-sm">{t("No brands for this device")}</p>}
            </div>
          </GlassCard>

          <GlassCard>
            <h2 className="text-xl font-semibold mb-4">{t("Models Management")}</h2>
            <div className="mb-4">
              <label className="text-xs text-white/50 mb-1 block">{t("Select Brand")}</label>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 font-medium text-cyan-400">
                {brands.find(b => b.id === selectedBrandId)?.name || t("Select a brand on the left")}
              </div>
            </div>
            <div className="flex gap-2 mb-6">
              <input value={newModelName} onChange={(e) => setNewModelName(e.target.value)} placeholder={t("Model Name")} className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-cyan-500" />
              <button disabled={processing || !selectedBrandId} onClick={addModel} className="px-4 py-2 bg-cyan-500 text-black rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50">
                <Plus className="w-4 h-4" /> {t("Add")}
              </button>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
              {filteredModels.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors group">
                  <span className="font-medium">{m.name}</span>
                  <button onClick={() => deleteModel(m.id)} className="p-1.5 rounded-md hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {filteredModels.length === 0 && <p className="text-center text-white/20 py-8 italic text-sm">{selectedBrandId ? t("No models for this brand") : t("Select a brand first")}</p>}
            </div>
          </GlassCard>
        </div>
      )}

      {tab === "issues" && (
        <div className="grid md:grid-cols-1 gap-6">
          <GlassCard>
            <h2 className="text-xl font-semibold mb-4">{t("Issues Management")}</h2>
            <div className="mb-6 grid md:grid-cols-3 gap-4 bg-white/5 p-4 rounded-xl border border-white/10 items-end">
              <div>
                <label className="text-xs text-white/50 mb-1 block">{t("Device Type")}</label>
                <AppSelect
                  value={issueDeviceId}
                  onValueChange={setIssueDeviceId}
                  placeholder={t("Choose device...")}
                  items={devices.map(d => ({ value: d.id, label: d.name }))}
                />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">{t("Issue Description")}</label>
                <input value={newIssueName} onChange={(e) => setNewIssueName(e.target.value)} placeholder={t("e.g. Screen Replacement")} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-cyan-500" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-white/50 mb-1 block">{t("Duration (Mins)")}</label>
                  <input type="number" value={newIssueDuration} onChange={(e) => setNewIssueDuration(e.target.value)} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-cyan-500" />
                </div>
                <button disabled={processing || !issueDeviceId} onClick={addIssue} className="px-6 py-2 bg-cyan-500 text-black rounded-lg font-semibold flex items-center gap-2 h-[42px] mt-auto">
                  <Plus className="w-4 h-4" /> {t("Add")}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIssues.map((i) => (
                <div key={i.id} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-colors group">
                  <div className="flex items-start justify-between mb-3">
                    <p className="font-medium flex-1">{i.name}</p>
                    <button onClick={() => deleteIssue(i.id)} className="p-1.5 rounded-md hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/30 uppercase font-bold">{t("Standard Duration")}:</span>
                    <input
                      type="number"
                      defaultValue={i.durationMinutes}
                      onBlur={(e) => updateIssueDurationHandler(i.id, Number(e.target.value))}
                      className="w-16 bg-transparent border-b border-white/10 text-cyan-400 text-sm focus:outline-none focus:border-cyan-500"
                    />
                    <span className="text-xs text-white/40">{t("mins")}</span>
                  </div>
                </div>
              ))}
              {filteredIssues.length === 0 && <p className="col-span-full text-center text-white/20 py-12 italic">{t("No issues defined for this device type")}</p>}
            </div>
          </GlassCard>
        </div>
      )}

      {tab === "parts" && (
        <PartsInventory isAdmin={true} />
      )}
    </section>
  )
}
