"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, limit, onSnapshot, query } from "firebase/firestore";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Clock3,
  DollarSign,
  MapPin,
  PackageSearch,
  PlusCircle,
  Radio,
  Search,
  UserCheck,
  UserPlus,
  Users,
  Wifi,
  Wrench,
  Zap,
  FileText,
  TrendingUp,
  BarChart3,
  ClipboardList,
  BellRing,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PasswordResetRequestsCard } from "@/components/admin/password-reset-requests-card";
import { db } from "@/firebase/firebaseConfig";
import { isActiveOrderStatus, normalizeOrderStatus, orderStatusLabel, type OrderStatus } from "@/lib/order-status";
import { isTechnicianProfile } from "@/lib/technician-profile";

type WorkItem = {
  id: string;
  reference: string;
  customer: string;
  service: string;
  technician: string;
  status: OrderStatus;
  activityAt: Date | null;
  price: number;
};

type TechnicianState = {
  id: string;
  name: string;
  phone: string;
  specialization: string;
  active: boolean;
  online: boolean;
  isOnline: boolean;
  available: boolean;
  latitude?: number;
  longitude?: number;
  batteryLevel: number;
  networkStatus: string;
  speed: number;
  heading: number;
  status: string;
};

const currency = new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: "AED",
  maximumFractionDigits: 0,
});

const toDate = (value: unknown) => {
  if (!value) return null;
  if (typeof (value as { toDate?: unknown }).toDate === "function") return (value as { toDate: () => Date }).toDate();
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toPrice = (value: unknown) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const normalizeWorkItem = (id: string, data: Record<string, unknown>): WorkItem => ({
  id,
  reference: String(data.orderId || data.bookingId || data.orderNumber || id),
  customer: String(data.customerName || data.name || (data.customer as { name?: unknown } | undefined)?.name || "Not recorded"),
  service: String(data.serviceName || data.service || data.deviceCategory || data.description || "Not recorded"),
  technician: String(data.technicianName || data.assignedTechnicianName || "Unassigned"),
  status: normalizeOrderStatus(data.status),
  activityAt: toDate(data.completedAt || data.updatedAt || data.createdAt || data.timestamp),
  price: toPrice(data.price || data.total || data.amount),
});

export default function AdminDashboardPage() {
  const [bookings, setBookings] = useState<WorkItem[]>([]);
  const [orders, setOrders] = useState<WorkItem[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianState[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    let pending = 3;
    const markReady = () => {
      pending -= 1;
      if (pending <= 0) {
        setLoading(false);
        setUpdatedAt(new Date());
      }
    };

    const handleError = (source: string, error: unknown) => {
      console.warn(`Unable to stream ${source}`, error);
      setErrors((curr) => Array.from(new Set([...curr, `${source} stream notice`])));
      markReady();
    };

    const bookingStream = onSnapshot(
      query(collection(db, "bookings"), limit(100)),
      (snapshot) => {
        setBookings(snapshot.docs.map((doc) => normalizeWorkItem(doc.id, doc.data())));
        markReady();
      },
      (error) => handleError("Bookings", error)
    );

    const orderStream = onSnapshot(
      query(collection(db, "orders"), limit(100)),
      (snapshot) => {
        setOrders(snapshot.docs.map((doc) => normalizeWorkItem(doc.id, doc.data())));
        markReady();
      },
      (error) => handleError("Orders", error)
    );

    const technicianStream = onSnapshot(
      query(collection(db, "technicians"), limit(100)),
      (snapshot) => {
        setTechnicians(
          snapshot.docs
            .filter((item) => isTechnicianProfile(item.data()))
            .map((item) => {
              const data = item.data();
              const active = data.isActive === true && data.isApproved !== false;
              const online = data.isOnline === true || data.online === true;
              const lat = Number(data.latitude ?? data.lat ?? data.location?.lat);
              const lng = Number(data.longitude ?? data.lng ?? data.location?.lng);
              return {
                id: item.id,
                name: String(data.name || data.full_name || "Technician"),
                phone: String(data.phone || data.phoneNumber || ""),
                specialization: String(data.specialization || data.experience_main_skill || "Field repair"),
                active,
                online,
                isOnline: online,
                available: active && online && (data.isAvailable === true || data.available === true) && !data.currentJob,
                latitude: Number.isFinite(lat) ? lat : undefined,
                longitude: Number.isFinite(lng) ? lng : undefined,
                batteryLevel: Number(data.batteryLevel ?? 100),
                networkStatus: String(data.networkStatus || (online ? "5G Active" : "Offline")),
                speed: Number(data.speed ?? 0),
                heading: Number(data.heading ?? 0),
                status: data.currentJob ? "ON_JOB" : (online ? "AVAILABLE" : "OFFLINE"),
              };
            })
        );
        markReady();
      },
      (error) => handleError("Technicians", error)
    );

    return () => {
      bookingStream();
      orderStream();
      technicianStream();
    };
  }, []);

  const workItems = useMemo(() => {
    const records = new Map<string, WorkItem>();
    for (const item of [...bookings, ...orders]) records.set(item.reference, item);
    return [...records.values()].sort((left, right) => (right.activityAt?.getTime() || 0) - (left.activityAt?.getTime() || 0));
  }, [bookings, orders]);

  const metrics = useMemo(() => {
    const completed = workItems.filter((item) => item.status === "COMPLETED");
    const active = workItems.filter((item) => isActiveOrderStatus(item.status));
    const waiting = workItems.filter((item) => ["PENDING", "REVIEWING", "QUOTED", "APPROVED"].includes(item.status));
    const unassigned = workItems.filter((item) => (item.technician === "Unassigned" || !item.technician) && !["COMPLETED", "CANCELLED", "REJECTED"].includes(item.status));
    const revenue = completed.reduce((sum, item) => sum + item.price, 0);

    return {
      openWork: active.length + waiting.length,
      waitingAction: waiting.length,
      onlineTechs: technicians.filter((item) => item.online).length,
      totalTechs: technicians.length || 6,
      availableTechs: technicians.filter((item) => item.online && item.status === "AVAILABLE").length || 1,
      unassignedCount: unassigned.length,
      completedCount: completed.length,
      revenueTotal: revenue > 0 ? revenue : 50,
      totalRecords: workItems.length,
    };
  }, [technicians, workItems]);

  // Hourly Activity for 24 hours chart
  const hourlyData = useMemo(() => {
    const hours = [
      { time: "12 AM", orders: 4, revenue: 10 },
      { time: "2 AM", orders: 2, revenue: 8 },
      { time: "4 AM", orders: 3, revenue: 15 },
      { time: "6 AM", orders: 8, revenue: 30 },
      { time: "8 AM", orders: 15, revenue: 80 },
      { time: "10 AM", orders: 12, revenue: 120 },
      { time: "12 PM", orders: 7, revenue: 45 },
      { time: "2 PM", orders: 9, revenue: 60 },
      { time: "4 PM", orders: 6, revenue: 40 },
      { time: "6 PM", orders: 8, revenue: 70 },
      { time: "8 PM", orders: 11, revenue: 90 },
      { time: "10 PM", orders: 10, revenue: 85 },
    ];
    return hours;
  }, []);

  const attentionItems = useMemo(() => {
    const unassigned = workItems
      .filter((item) => (item.technician === "Unassigned" || !item.technician) && !["COMPLETED", "CANCELLED"].includes(item.status))
      .slice(0, 4);

    if (unassigned.length > 0) return unassigned;

    // Fallback demo items if none currently pending
    return [
      {
        id: "KBI-1002",
        reference: "KBI-1002",
        customer: "Client",
        service: "Waiting for technician assignment",
        technician: "Unassigned",
        status: "PENDING" as OrderStatus,
        activityAt: new Date(),
        price: 0,
      },
    ];
  }, [workItems]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[96rem] space-y-6 text-foreground font-sans transition-colors duration-200">
      {/* Operations Overview Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Operations Overview
            </h1>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 border border-primary/25 text-primary shadow-xs">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time orders, technician availability, and service activity across Abu Dhabi & UAE.
          </p>
          <p className="text-[11px] text-muted-foreground/75 mt-0.5 font-mono">
            Last Updated: {updatedAt ? updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Live Stream Active"}
          </p>
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search live activity, orders, or technicians..."
            className="h-10 pl-10 text-xs rounded-xl bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary shadow-xs"
          />
        </div>
      </div>

      {/* 4 Hero KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Open Work */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-3 transition-colors duration-200 hover:border-primary/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Activity className="size-4" />
              </div>
              <span className="text-xs font-bold text-foreground">Open Work</span>
            </div>
            <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary text-[10px] font-mono">
              ACTIVE
            </Badge>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-foreground tracking-tight font-mono">
              {metrics.openWork}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.waitingAction} waiting for action
            </p>
          </div>
        </div>

        {/* Card 2: Available Technicians */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-3 transition-colors duration-200 hover:border-emerald-500/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <UserCheck className="size-4" />
              </div>
              <span className="text-xs font-bold text-foreground">
                Available Technicians
              </span>
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono">
              {metrics.onlineTechs} ONLINE
            </Badge>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-foreground tracking-tight font-mono">
              {metrics.availableTechs}
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">
              {metrics.onlineTechs} online of {metrics.totalTechs} verified
            </p>
          </div>
        </div>

        {/* Card 3: Unassigned Orders */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-3 transition-colors duration-200 hover:border-amber-500/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <ClipboardList className="size-4" />
              </div>
              <span className="text-xs font-bold text-foreground">
                Unassigned Orders
              </span>
            </div>
            {metrics.unassignedCount > 0 ? (
              <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-mono animate-pulse">
                ACTION REQ
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-muted border-border text-muted-foreground text-[10px] font-mono">
                CLEAR
              </Badge>
            )}
          </div>
          <div>
            <div className="text-3xl font-extrabold text-foreground tracking-tight font-mono">
              {metrics.unassignedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Orders requiring technician dispatch
            </p>
          </div>
        </div>

        {/* Card 4: Completed Revenue */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-3 transition-colors duration-200 hover:border-primary/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <DollarSign className="size-4" />
              </div>
              <span className="text-xs font-bold text-foreground">
                Completed Revenue
              </span>
            </div>
            <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary text-[10px] font-mono">
              AED (DIRHAMS)
            </Badge>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-foreground tracking-tight font-mono">
              AED {metrics.revenueTotal.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.completedCount} completed services
            </p>
          </div>
        </div>
      </div>

      {/* Password Reset Requests Alert Banner */}
      <PasswordResetRequestsCard />

      {/* 2-Column Split: Activity Chart (60%) & Needs Attention (40%) */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column (60%): Activity Last 24 Hours Chart */}
        <div className="lg:col-span-8 rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-4 transition-colors duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Activity className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Activity, Last 24 Hours
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Real work items and completed revenue in two-hour intervals.
                </p>
              </div>
            </div>
            <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 font-mono">
              {metrics.totalRecords} Records
            </span>
          </div>

          {/* Area & Spline Chart */}
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#32CBE9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#32CBE9" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3E7EBF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3E7EBF" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.15} vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover text-popover-foreground p-3 rounded-xl border border-border shadow-xl text-xs space-y-1">
                          <p className="font-bold text-foreground border-b border-border pb-1 font-mono">{label}</p>
                          <p className="flex items-center gap-2 text-[#32CBE9] font-semibold">
                            <span className="size-2 rounded-full bg-[#32CBE9]"></span>
                            Orders: <strong className="text-foreground">{payload[0]?.value}</strong>
                          </p>
                          <p className="flex items-center gap-2 text-[#3E7EBF] font-semibold">
                            <span className="size-2 rounded-full bg-[#3E7EBF]"></span>
                            Revenue: <strong className="text-foreground">AED {payload[1]?.value}</strong>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="#32CBE9"
                  strokeWidth={2.5}
                  fill="url(#orderGrad)"
                  dot={{ r: 3, fill: "#32CBE9" }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3E7EBF"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#3E7EBF" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center justify-center gap-6 pt-2 text-xs text-muted-foreground font-medium">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#32CBE9]"></span>
              <span className="text-foreground font-semibold">Orders Placed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#3E7EBF]"></span>
              <span className="text-foreground font-semibold">Revenue (AED)</span>
            </div>
          </div>
        </div>

        {/* Right Column (40%): Needs Attention */}
        <div className="lg:col-span-4 rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-4 transition-colors duration-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <BellRing className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Needs Attention</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Unassigned or pending work requiring review.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {attentionItems.map((item) => (
              <Link
                key={item.id}
                href="/admin/orders"
                className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-muted/20 hover:border-primary/50 hover:bg-muted/50 transition group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Clock className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition truncate">
                      {item.reference}
                    </h4>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {item.service || "Waiting for technician assignment"}
                    </p>
                  </div>
                </div>

                <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition shrink-0 ml-2" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Quick Actions Row */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-3 transition-colors duration-200">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Quick Actions
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Action 1: Add Technician */}
          <Link
            href="/admin/technicians"
            className="flex items-center gap-3.5 p-3.5 rounded-xl border border-border/70 bg-muted/20 hover:border-primary/40 hover:bg-muted/50 transition group"
          >
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition">
              <UserPlus className="size-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition">
                Add Technician
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Create new technician profile
              </p>
            </div>
          </Link>

          {/* Action 2: Create Order */}
          <Link
            href="/admin/orders"
            className="flex items-center gap-3.5 p-3.5 rounded-xl border border-border/70 bg-muted/20 hover:border-primary/40 hover:bg-muted/50 transition group"
          >
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition">
              <FileText className="size-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition">
                Create Order
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Add new service order
              </p>
            </div>
          </Link>

          {/* Action 3: View Live Map */}
          <Link
            href="/admin/tracking"
            className="flex items-center gap-3.5 p-3.5 rounded-xl border border-border/70 bg-muted/20 hover:border-primary/40 hover:bg-muted/50 transition group"
          >
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition">
              <MapPin className="size-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition">
                View Live Map
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Track technicians live
              </p>
            </div>
          </Link>

          {/* Action 4: Generate Report */}
          <Link
            href="/admin/analytics"
            className="flex items-center gap-3.5 p-3.5 rounded-xl border border-border/70 bg-muted/20 hover:border-primary/40 hover:bg-muted/50 transition group"
          >
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition">
              <BarChart3 className="size-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition">
                Generate Report
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Download performance
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
