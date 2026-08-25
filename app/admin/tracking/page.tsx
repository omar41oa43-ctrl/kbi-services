"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  MapPin,
  Navigation,
  Battery,
  Wifi,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Power,
  Lock,
  Smartphone,
  Send,
  Clock,
  UserCheck,
  Radio,
  ExternalLink,
  Search,
  Users,
  Activity,
  Layers,
  Zap,
  Phone,
  AlertTriangle,
  ArrowRight,
  Wrench,
  MessageCircle,
} from "lucide-react";
import { collection, onSnapshot, query, doc, updateDoc, setDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { authorizedFetch } from "@/lib/authorized-fetch";
import { isTechnicianProfile } from "@/lib/technician-profile";

const InteractiveMap = dynamic(
  () => import("@/components/admin/tracking/interactive-map"),
  { ssr: false, loading: () => <div className="w-full h-[380px] bg-[#0B0F19] flex items-center justify-center text-xs text-slate-400">Loading interactive satellite dispatch radar...</div> }
);

const MiniRouteMap = dynamic(
  () => import("@/components/admin/tracking/mini-route-map"),
  { ssr: false, loading: () => <div className="h-28 w-full bg-muted/40 rounded-xl flex items-center justify-center text-[10px] text-muted-foreground">Loading mini map...</div> }
);

interface TechMarker {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  role?: string;
  latitude?: number;
  longitude?: number;
  batteryLevel: number;
  isCharging?: boolean;
  networkStatus: string;
  speed: number;
  heading: number;
  status: string;
  currentOrder?: string;
  isOnline: boolean;
  specialization?: string;
  lastActive?: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
  accuracy?: number;
  ipAddress?: string;
  lastLocationTime?: string;
  vehicle?: string;
  rating?: number;
  jobsCompleted?: number;
  level?: string;
  etaText?: string;
  etaDistance?: string;
  currentJobTitle?: string;
  currentJobArea?: string;
  destLat?: number;
  destLng?: number;
  destAddress?: string;
}

interface PendingBooking {
  id: string;
  device?: string;
  service?: string;
  customerName?: string;
  customerPhone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  assignedTechnician?: string;
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export default function LiveTrackingPage() {
  const [technicians, setTechnicians] = useState<TechMarker[]>([]);
  const [bookings, setBookings] = useState<PendingBooking[]>([]);
  const [selectedTech, setSelectedTech] = useState<TechMarker | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<PendingBooking | null>(null);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [alertMessage, setAlertMessage] = useState("");
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ONLINE" | "AVAILABLE" | "ON_JOB" | "OFFLINE">("ALL");
  const [rightTab, setRightTab] = useState<"INSPECTOR" | "SMART_DISPATCH">("INSPECTOR");

  // Bookings Real-time Listener
  useEffect(() => {
    const bookQ = query(collection(db, "bookings"));
    const unsub = onSnapshot(bookQ, (snap) => {
      const list: PendingBooking[] = snap.docs.map((d) => {
        const data = d.data();
        const lat = Number(data.location?.lat ?? data.latitude ?? data.lat);
        const lng = Number(data.location?.lng ?? data.longitude ?? data.lng);
        return {
          id: d.id,
          device: data.device || data.serviceType || "Device Repair",
          service: data.service || data.issue || "Diagnostic & Repair",
          customerName: data.customerName || data.clientName || "Customer",
          customerPhone: data.customerPhone || data.phone || "",
          address: data.address || data.locationName || data.city || "Abu Dhabi, UAE",
          latitude: Number.isFinite(lat) ? lat : undefined,
          longitude: Number.isFinite(lng) ? lng : undefined,
          status: data.status || "pending",
          assignedTechnician: data.assignedTechnician || data.technicianId,
        };
      });
      setBookings(list);
    });

    return () => unsub();
  }, []);

  // Technicians Real-time Listener
  useEffect(() => {
    const techQ = query(collection(db, "technicians"));
    const unsub = onSnapshot(
      techQ,
      (snap) => {
        const liveList: TechMarker[] = snap.docs
          .filter((d) => isTechnicianProfile(d.data()))
          .map((d) => {
            const raw = d.data();
            const lat = Number(raw.latitude ?? raw.lat ?? raw.location?.lat ?? raw.lastKnownLatitude);
            const lng = Number(raw.longitude ?? raw.lng ?? raw.location?.lng ?? raw.lastKnownLongitude);
            const isOnline = raw.online === true || raw.isOnline === true;
            
            const avatar = raw.profile_photo || raw.avatar || raw.photoURL || raw.photo || "";
            const deviceModel =
              raw.deviceModel ||
              raw.deviceInfo?.model ||
              raw.device?.model ||
              raw.device_name ||
              raw.hardware ||
              (raw.platform ? `${raw.platform} Device` : "") ||
              (raw.userAgent ? (raw.userAgent.includes("iPhone") ? "iPhone" : raw.userAgent.includes("Android") ? "Android" : "Mobile Client") : "") ||
              (isOnline ? "Mobile App (Active)" : "Offline");

            const osVersion =
              raw.osVersion ||
              raw.deviceInfo?.os ||
              raw.device?.os ||
              raw.device_os ||
              raw.platformVersion ||
              (raw.platform ? `Platform: ${raw.platform}` : "") ||
              (isOnline ? "Connected" : "Disconnected");

            const appVersion = raw.appVersion || raw.deviceInfo?.appVersion || raw.version || "KBI Tech App";
            const accuracy = raw.accuracy !== undefined ? Number(raw.accuracy) : (raw.location?.accuracy ? Number(raw.location.accuracy) : undefined);
            const isCharging = raw.isCharging === true || raw.batteryCharging === true;
            const vehicle = raw.vehicle || raw.vehicleInfo || raw.car || raw.transport || "Field Vehicle";
            const rating = Number(raw.rating ?? raw.averageRating ?? 4.8);
            const jobsCompleted = Number(raw.jobsCompleted ?? raw.completedJobs ?? raw.totalJobs ?? 0);
            const level = raw.level || raw.rank || (jobsCompleted > 50 ? "Gold" : jobsCompleted > 10 ? "Silver" : "Standard");

            const activeJobId = raw.currentJob || raw.currentOrder || raw.activeBookingId;
            const isBusy = Boolean(activeJobId) || raw.status === "BUSY" || raw.status === "ON_JOB";

            return {
              id: d.id,
              name: raw.name || raw.full_name || raw.displayName || "Technician",
              phone: raw.phone || raw.phoneNumber || "Not provided",
              email: raw.email || raw.userEmail || "",
              avatar: avatar || undefined,
              role: raw.role || "TECHNICIAN",
              latitude: Number.isFinite(lat) ? lat : undefined,
              longitude: Number.isFinite(lng) ? lng : undefined,
              batteryLevel: Number(raw.batteryLevel ?? (isOnline ? 100 : 0)),
              isCharging,
              networkStatus: raw.networkStatus || (isOnline ? "Active" : "Offline"),
              speed: Number(raw.speed ?? 0),
              heading: Number(raw.heading ?? 0),
              status: isBusy ? "ON_JOB" : (isOnline ? "AVAILABLE" : "OFFLINE"),
              currentOrder: activeJobId,
              isOnline,
              specialization: raw.specialization || raw.experience_main_skill || "Certified Technician",
              lastActive: isOnline ? "Active Now (Realtime)" : (raw.lastSeen ? new Date(raw.lastSeen).toLocaleTimeString() : "Offline"),
              deviceModel,
              osVersion,
              appVersion,
              accuracy,
              ipAddress: raw.ipAddress || (isOnline ? "Connected" : "—"),
              lastLocationTime: raw.updatedAt ? (typeof raw.updatedAt.toDate === "function" ? raw.updatedAt.toDate().toLocaleTimeString() : String(raw.updatedAt)) : new Date().toLocaleTimeString(),
              vehicle,
              rating,
              jobsCompleted,
              level,
            };
          });
        setTechnicians(liveList);
        setSelectedTech((current) => liveList.find((item) => item.id === current?.id) || liveList[0] || null);
        setLastSync(new Date());
      },
      (err) => {
        console.warn("Firestore tracking listener notice:", err);
        setTechnicians([]);
        setSelectedTech(null);
      }
    );

    return () => unsub();
  }, []);

  const unassignedBookings = bookings.filter(
    (b) => !b.assignedTechnician || b.status.toLowerCase() === "pending" || b.status.toLowerCase() === "unassigned"
  );

  const onlineCount = technicians.filter((t) => t.isOnline).length;
  const availableCount = technicians.filter((t) => t.status === "AVAILABLE").length;
  const onJobCount = technicians.filter((t) => t.status === "ON_JOB").length;
  const offlineCount = technicians.filter((t) => !t.isOnline).length;

  // Compute dynamic ETA, real distance, and current job for each technician
  const enrichedTechnicians = technicians.map((tech) => {
    const activeBooking = bookings.find(
      (b) =>
        b.assignedTechnician === tech.id ||
        b.id === tech.currentOrder ||
        (tech.currentOrder && b.id.startsWith(tech.currentOrder))
    );

    let etaText = tech.isOnline ? (tech.status === "ON_JOB" ? "On assigned job" : "Ready for dispatch") : "Offline";
    let etaDistance = "";
    let currentJobTitle = activeBooking ? `${activeBooking.device} · ${activeBooking.service}` : (tech.currentOrder ? `Order #${tech.currentOrder.slice(0, 8)}` : "No active job");
    let currentJobArea = activeBooking ? activeBooking.address : (tech.currentOrder ? "Customer Location" : "Standby");

    let destLat = activeBooking?.latitude;
    let destLng = activeBooking?.longitude;
    let destAddress = activeBooking?.address;

    if (tech.latitude !== undefined && tech.longitude !== undefined && activeBooking?.latitude !== undefined && activeBooking?.longitude !== undefined) {
      const distKm = getDistanceKm(tech.latitude, tech.longitude, activeBooking.latitude, activeBooking.longitude);
      // Assuming avg urban speed in UAE of 30 km/h (2 min per km + 3 min buffer)
      const minutes = Math.max(1, Math.round(distKm * 2 + 3));
      etaText = `ETA: ${minutes} min`;
      etaDistance = `${distKm} km away`;
    }

    return {
      ...tech,
      etaText,
      etaDistance,
      currentJobTitle,
      currentJobArea,
      destLat,
      destLng,
      destAddress,
    };
  });

  const filteredTechnicians = enrichedTechnicians.filter((t) => {
    const matchesSearch =
      !searchQuery.trim() ||
      [t.name, t.phone, t.specialization, t.id].some((v) =>
        v?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ONLINE" && t.isOnline) ||
      (statusFilter === "AVAILABLE" && t.status === "AVAILABLE") ||
      (statusFilter === "ON_JOB" && t.status === "ON_JOB") ||
      (statusFilter === "OFFLINE" && !t.isOnline);
    return matchesSearch && matchesStatus;
  });

  const selectedEnrichedTech = enrichedTechnicians.find((t) => t.id === selectedTech?.id) || selectedTech;

  const sendRemoteAction = async (action: string, payload?: any) => {
    if (!selectedTech) return;

    try {
      const res = await authorizedFetch("/api/admin/remote-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          technicianId: selectedTech.id,
          action,
          payload,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Remote command failed");
      setNotice({
        type: "success",
        text: `Remote command [${action}] dispatched to ${selectedTech.name}.`,
      });
      if (action === "POPUP_ALERT" || action === "EMERGENCY_ALERT") setAlertMessage("");
    } catch (error: unknown) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Remote command failed.",
      });
    }
  };

  const dispatchTechnicianToBooking = async (techId: string, techName: string, bookingId: string) => {
    try {
      const payload = {
        assignedTechnician: techId,
        assignedTechnicianId: techId,
        technicianId: techId,
        technicianName: techName,
        assignedTechnicians: [techId],
        assignedTechnicianNames: [techName],
        technicianIds: [techId],
        technicianNames: [techName],
        status: "assigned",
        assignedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // 1. Update in bookings collection
      await setDoc(doc(db, "bookings", bookingId), payload, { merge: true });

      // 2. Mirror update in orders and service_requests collections
      try {
        await setDoc(doc(db, "orders", bookingId), payload, { merge: true });
      } catch (err) {
        console.warn("Orders mirror write notice:", err);
      }
      try {
        await setDoc(doc(db, "service_requests", bookingId), payload, { merge: true });
      } catch (err) {
        console.warn("service_requests mirror write notice:", err);
      }

      // 3. Update technician active state & dispatch direct remote screen trigger
      await setDoc(
        doc(db, "technicians", techId),
        {
          currentJob: bookingId,
          currentOrder: bookingId,
          status: "ON_JOB",
          available: false,
          pendingRemoteCommand: {
            cmdId: `cmd-${Date.now()}`,
            action: "NAVIGATE",
            payload: {
              screen: "INCOMING_ORDER",
              orderId: bookingId,
              reference: String(bookingId),
            },
            createdAt: serverTimestamp(),
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 4. Create in-app dispatch notification
      try {
        await addDoc(collection(db, "notifications"), {
          userId: techId,
          technicianId: techId,
          title: `New Dispatch: ${bookingId}`,
          body: `You have been dispatched to order #${bookingId}. Open app to view location and job details.`,
          type: "job",
          category: "Jobs",
          orderId: bookingId,
          isRead: false,
          createdAt: serverTimestamp(),
        });
      } catch (notifErr) {
        console.warn("In-app notification write notice:", notifErr);
      }

      setNotice({
        type: "success",
        text: `Directly dispatched ${techName} to Order #${bookingId}!`,
      });
      setSelectedBooking(null);
    } catch (e: any) {
      setNotice({
        type: "error",
        text: `Dispatch failed: ${e?.message || e}`,
      });
    }
  };

  return (
    <div className="relative p-6 sm:p-8 bg-background min-h-screen text-foreground space-y-6 font-sans">
      {/* Notice Alert */}
      {notice && (
        <div
          className={`fixed top-6 right-6 z-[100] max-w-md rounded-xl p-4 shadow-xl border flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 ${
            notice.type === "success"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/40"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/40"
          }`}
        >
          <div className="flex items-center gap-3">
            {notice.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
            )}
            <p className="text-xs font-semibold">{notice.text}</p>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-muted-foreground hover:text-foreground text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-xl">
              <Navigation className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Command Center
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Dispatch, monitoring, and telemetry operations
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs text-muted-foreground bg-muted/40 border border-border px-3.5 py-2 rounded-xl flex items-center gap-2 font-mono">
            <Clock className="w-4 h-4 text-primary" />
            <span>Sync: {lastSync.toLocaleTimeString()}</span>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Reconnect
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{onlineCount}</div>
            <div className="text-[11px] text-muted-foreground font-medium">Online</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-primary">{availableCount}</div>
            <div className="text-[11px] text-muted-foreground font-medium">Available</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{onJobCount}</div>
            <div className="text-[11px] text-muted-foreground font-medium">On Job</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-foreground">{offlineCount}</div>
            <div className="text-[11px] text-muted-foreground font-medium">Offline</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{unassignedBookings.length}</div>
            <div className="text-[11px] text-muted-foreground font-medium">Unassigned Orders</div>
          </div>
        </div>
      </div>

      {/* Main Command Center Layout */}
      <div className="space-y-4">
        {/* Top Search & Filter Floating Card */}
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3">
          {/* Top Search Bar & Main Segments */}
          <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search technician, job or skill..."
                className="w-full bg-background border border-border text-xs text-foreground pl-10 pr-4 h-11 rounded-2xl focus:outline-none focus:border-cyan-500 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-muted/40 border border-border rounded-2xl shrink-0">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                  statusFilter === "ALL"
                    ? "bg-[#0F2850] text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("ON_JOB")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                  statusFilter === "ON_JOB"
                    ? "bg-[#0F2850] text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                On Job
              </button>
              <button
                onClick={() => setStatusFilter("OFFLINE")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                  statusFilter === "OFFLINE"
                    ? "bg-[#0F2850] text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Offline
              </button>
            </div>
          </div>

          {/* Filter Status Pills (All, Available, On Job, Busy, Offline) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition shrink-0 ${
                statusFilter === "ALL"
                  ? "bg-[#0F2850] text-white shadow-xs"
                  : "bg-background border border-border text-foreground hover:bg-muted"
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> All ({technicians.length})
            </button>
            <button
              onClick={() => setStatusFilter("AVAILABLE")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition shrink-0 ${
                statusFilter === "AVAILABLE"
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40"
                  : "bg-background border border-border text-foreground hover:bg-muted"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Available ({availableCount})
            </button>
            <button
              onClick={() => setStatusFilter("ON_JOB")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition shrink-0 ${
                statusFilter === "ON_JOB"
                  ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/40"
                  : "bg-background border border-border text-foreground hover:bg-muted"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-500" /> On Job ({onJobCount})
            </button>
            <button
              onClick={() => setStatusFilter("ON_JOB")}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold bg-background border border-border text-foreground hover:bg-muted shrink-0"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Busy ({onJobCount})
            </button>
            <button
              onClick={() => setStatusFilter("OFFLINE")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition shrink-0 ${
                statusFilter === "OFFLINE"
                  ? "bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/40"
                  : "bg-background border border-border text-foreground hover:bg-muted"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-400" /> Offline ({offlineCount})
            </button>
          </div>
        </div>

        {/* Map View & Floating Bottom Technician Profile Sheet */}
        <div className="relative rounded-3xl overflow-hidden border border-border bg-card shadow-sm">
          {/* Radar Leaflet Map */}
          <div className="w-full">
            <InteractiveMap
              technicians={filteredTechnicians}
              selectedTechId={selectedTech?.id}
              onSelectTech={(t) => {
                setSelectedTech(t);
              }}
            />
          </div>

          {/* Floating Bottom Technician Inspector Card */}
          {selectedEnrichedTech && (
            <div className="p-4 sm:p-6 bg-card/95 backdrop-blur-md border-t border-border space-y-5 shadow-2xl">
              {/* Drag bar indicator */}
              <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Left: Tech Bio, Rating, ID, Metrics */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {selectedEnrichedTech.avatar ? (
                        <img
                          src={selectedEnrichedTech.avatar}
                          alt={selectedEnrichedTech.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-primary/40 shadow-sm"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-[#0F2850] text-white flex items-center justify-center font-black text-xl shadow-sm">
                          {selectedEnrichedTech.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span
                        className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-card ${
                          selectedEnrichedTech.isOnline ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                      />
                    </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-extrabold text-foreground">{selectedEnrichedTech.name}</h2>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                            selectedEnrichedTech.status === "ON_JOB"
                              ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800"
                              : "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
                          }`}>
                            {selectedEnrichedTech.status === "ON_JOB" ? "BUSY" : "AVAILABLE"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="text-amber-500 font-bold">★ {selectedEnrichedTech.rating || 4.8}</span>
                          <span>({selectedEnrichedTech.jobsCompleted || 0} jobs)</span>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <span className="px-2.5 py-0.5 rounded-lg bg-muted text-[11px] font-semibold text-muted-foreground border border-border">
                            Level: {selectedEnrichedTech.level || "Standard"}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-mono font-bold border border-blue-500/20">
                            ID: KBI-{selectedEnrichedTech.id.slice(0, 4).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 3 Detail Badges: Current Job, ETA to Next, Vehicle */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs w-full">
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 border border-border min-w-0 overflow-hidden">
                        <div className="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center text-primary shrink-0">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] text-muted-foreground block font-medium">Current Job</span>
                          <p className="font-bold text-foreground truncate">{selectedEnrichedTech.currentJobTitle || "No Active Job"}</p>
                          <span className="text-[10px] text-muted-foreground truncate block">{selectedEnrichedTech.currentJobArea || "Standby"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 border border-border min-w-0 overflow-hidden">
                        <div className="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center text-primary shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] text-muted-foreground block font-medium">ETA to Destination</span>
                          <p className="font-bold text-foreground truncate">{selectedEnrichedTech.etaText || "Standby"}</p>
                          <span className="text-[10px] text-muted-foreground truncate block">{selectedEnrichedTech.etaDistance || (selectedEnrichedTech.isOnline ? "GPS Connected" : "Offline")}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 border border-border min-w-0 overflow-hidden">
                        <div className="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center text-primary shrink-0">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] text-muted-foreground block font-medium">Device & Hardware</span>
                          <p className="font-bold text-foreground truncate">{selectedEnrichedTech.deviceModel || (selectedEnrichedTech.isOnline ? "Mobile App" : "Offline")}</p>
                          <span className="text-[10px] text-muted-foreground truncate block">{selectedEnrichedTech.osVersion || "Connected"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Primary Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <a
                        href={`https://wa.me/${selectedEnrichedTech.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-5 py-2.5 bg-[#0F2850] hover:bg-[#16386d] text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-xs transition"
                      >
                        <MessageCircle className="w-4 h-4" /> Message on WhatsApp
                      </a>

                      {selectedEnrichedTech.phone && (
                        <a
                          href={`tel:${selectedEnrichedTech.phone}`}
                          className="px-4 py-2.5 bg-background border border-border hover:bg-muted text-foreground text-xs font-bold rounded-2xl flex items-center gap-1.5 shadow-2xs transition"
                        >
                          <Phone className="w-3.5 h-3.5 text-primary" /> Call
                        </a>
                      )}

                      {selectedEnrichedTech.latitude !== undefined && selectedEnrichedTech.longitude !== undefined && (
                        <a
                          href={`https://maps.google.com/?q=${selectedEnrichedTech.latitude},${selectedEnrichedTech.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2.5 bg-background border border-border hover:bg-muted text-foreground text-xs font-bold rounded-2xl flex items-center gap-1.5 shadow-2xs transition"
                        >
                          <Navigation className="w-3.5 h-3.5 text-primary" /> Directions
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Right: Live Location Mini Map & Profile Link */}
                  <div className="lg:col-span-5 space-y-3">
                    <div className="p-3.5 bg-muted/20 border border-border rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground">Live Location Radar</span>
                        <span className="text-emerald-500 font-bold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live
                        </span>
                      </div>

                      {/* Real Interactive Mini Route Map */}
                      <MiniRouteMap
                        techLat={selectedEnrichedTech.latitude}
                        techLng={selectedEnrichedTech.longitude}
                        techName={selectedEnrichedTech.name}
                        destLat={selectedEnrichedTech.destLat}
                        destLng={selectedEnrichedTech.destLng}
                        destAddress={selectedEnrichedTech.destAddress}
                      />
                    </div>

                    <Link
                      href={`/admin/technicians`}
                      className="w-full py-3 px-4 rounded-2xl border border-border bg-card hover:bg-muted flex items-center justify-between text-xs font-bold text-foreground transition shadow-2xs"
                    >
                      <span className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-primary" /> View Technician Profile
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
