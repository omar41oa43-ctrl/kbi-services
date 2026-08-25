"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPublicOrderAction } from "@/app/actions/public-tracking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  Clock,
  Smartphone,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  UserCheck,
  Phone,
  Navigation,
  ShieldCheck,
  Radio,
} from "lucide-react";
import { format } from "date-fns";
import { useLanguage, useT } from "@/components/language-provider";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

export default function PublicOrderTrackingPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<any>(null);
  const [technician, setTechnician] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const cleanId = decodeURIComponent(orderId).trim();
    // If orderId contains concatenated identifiers like 'KBI-007395, ORD-000013', take the individual candidates
    const rawTokens = cleanId.split(/[,;\s]+/).map((t) => t.trim().replace(/^#/, "")).filter(Boolean);
    const ordMatches = cleanId.match(/(?:ORD|KBI)-?\d+/gi)?.map((m) => m.trim()) || [];
    const lookupKeys = Array.from(new Set([cleanId, orderId.trim(), ...rawTokens, ...ordMatches])).filter(Boolean);

    let isActive = true;
    let fallbackStarted = false;
    let fallbackDeadline: any;
    let technicianUnsub: (() => void) | undefined;

    const loadFallback = () => {
      if (fallbackStarted || !isActive) return;
      fallbackStarted = true;

      fallbackDeadline = window.setTimeout(() => {
        if (!isActive) return;
        setError(true);
        setLoading(false);
      }, 5000);

      getPublicOrderAction(cleanId)
        .then((data) => {
          if (!isActive) return;
          if (data) {
            setOrder(data);
            setError(false);
          } else {
            setError(true);
          }
        })
        .catch(() => {
          if (isActive) setError(true);
        })
        .finally(() => {
          if (!isActive) return;
          if (fallbackDeadline) window.clearTimeout(fallbackDeadline);
          setLoading(false);
        });
    };

    const listenerFallback = window.setTimeout(loadFallback, 1500);

    // Try listening to real-time updates across candidate keys
    const primaryKey = lookupKeys[0] || cleanId;
    const unsub = onSnapshot(
      doc(db, "orders", primaryKey),
      (snap) => {
        if (snap.exists()) {
          window.clearTimeout(listenerFallback);
          const data: any = { id: snap.id, ...snap.data() };
          setOrder(data);
          setError(false);
          setLoading(false);

          const techId = data.assignedTechnician || data.technicianId;
          if (techId) {
            technicianUnsub?.();
            technicianUnsub = onSnapshot(
              doc(db, "technicians", techId),
              (tSnap) => {
                if (tSnap.exists()) {
                  setTechnician(tSnap.data());
                }
              },
            );
          }
        } else {
          loadFallback();
        }
      },
      (err) => {
        console.warn("Real-time public tracking notice:", err);
        loadFallback();
      },
    );

    return () => {
      isActive = false;
      window.clearTimeout(listenerFallback);
      if (fallbackDeadline) window.clearTimeout(fallbackDeadline);
      technicianUnsub?.();
      unsub();
    };
  }, [orderId]);

  const getStatusInfo = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "delivered":
        return {
          color: "bg-emerald-950/60 text-emerald-400 border-emerald-800",
          icon: CheckCircle,
          label: "Repair Completed",
          step: 3,
        };
      case "in_progress":
      case "in_repair":
        return {
          color: "bg-cyan-950/60 text-cyan-400 border-cyan-800",
          icon: Clock,
          label: "In Repair",
          step: 2,
        };
      case "assigned":
      case "on_way":
        return {
          color: "bg-blue-950/60 text-blue-400 border-blue-800",
          icon: Navigation,
          label: "Technician En Route",
          step: 1,
        };
      case "waiting_parts":
        return {
          color: "bg-amber-950/60 text-amber-400 border-amber-800",
          icon: AlertTriangle,
          label: "Waiting for Parts",
          step: 2,
        };
      default:
        return {
          color: "bg-slate-900 text-slate-300 border-slate-800",
          icon: Clock,
          label: "Request Received",
          step: 0,
        };
    }
  };

  const { lang } = useLanguage();
  const t = useT();

  if (loading)
    return (
      <div
        className="adaptive-theme-page min-h-screen bg-[#090D16] flex items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="sr-only">{t("Loading order")}</span>
      </div>
    );

  if (error || !order)
    return (
      <div
        className="adaptive-theme-page min-h-screen bg-[#090D16] flex flex-col items-center justify-center p-4 text-white"
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10">
          <AlertTriangle
            className="h-8 w-8 text-red-500 dark:text-red-400"
            aria-hidden="true"
          />
        </div>
        <h1 className="text-2xl font-bold mb-4">{t("Order Not Found")}</h1>
        <p className="text-muted-foreground mb-8 max-w-md text-center">
          {t("Could not find order")} #{orderId}.{" "}
          {t("Please check the ID and try again.")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a href="/track">
            <Button className="bg-cyan-500 font-bold text-black hover:bg-cyan-400">
              {t("Try Another Order")}
            </Button>
          </a>
          <a href="/">
            <Button
              variant="outline"
              className="border-border text-foreground hover:bg-muted"
            >
              {t("Back to Home")}
            </Button>
          </a>
        </div>
      </div>
    );

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div
      className="adaptive-theme-page min-h-screen bg-[#090D16] text-white p-4 md:p-8 flex justify-center items-start"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <Card className="w-full max-w-lg bg-[#0F172A] border-slate-800 text-white rounded-2xl shadow-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-800/80 pb-4 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <a
              href="/"
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 font-medium transition"
            >
              {lang === "ar" ? (
                <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
              ) : (
                <ArrowLeft className="w-3.5 h-3.5" />
              )}
              {t("Back to Home")}
            </a>
            <span className="font-mono text-xs text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2.5 py-1 rounded-lg">
              #{orderId.substring(0, 8)}
            </span>
          </div>
          <CardTitle className="text-xl font-bold mt-3 text-white">
            {t(statusInfo.label)}
          </CardTitle>
          <p className="text-xs text-slate-400">
            {order.device || "Electronic Device"} ·{" "}
            {order.service || order.issue || "Diagnostic & Repair"}
          </p>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Status Alert Banner */}
          <div
            className={`p-4 rounded-xl border flex items-center gap-3.5 ${statusInfo.color}`}
          >
            <StatusIcon className="w-6 h-6 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-sm capitalize">
                {t(order.status) || order.status.replace("_", " ")}
              </p>
              <p className="text-xs opacity-80 mt-0.5">
                {t("Last updated")}:{" "}
                {order.updatedAt?.seconds
                  ? format(new Date(order.updatedAt.seconds * 1000), "PP p")
                  : "Live tracking active"}
              </p>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between text-[11px] font-bold text-slate-400">
              <span className={statusInfo.step >= 0 ? "text-cyan-400" : ""}>
                1. Received
              </span>
              <span className={statusInfo.step >= 1 ? "text-cyan-400" : ""}>
                2. Dispatched
              </span>
              <span className={statusInfo.step >= 2 ? "text-cyan-400" : ""}>
                3. In Repair
              </span>
              <span className={statusInfo.step >= 3 ? "text-emerald-400" : ""}>
                4. Completed
              </span>
            </div>
            <div className="h-2 bg-slate-900 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-cyan-500 transition-all duration-700"
                style={{
                  width: `${((statusInfo.step + 1) / 4) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Assigned Technician Live Card */}
          {technician && (
            <div className="bg-slate-950 p-4 rounded-xl border border-cyan-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-400 font-bold">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      {technician.name || "Assigned Technician"}
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {technician.specialization || "Certified Specialist"}
                    </p>
                  </div>
                </div>

                <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-full font-bold">
                  <Radio className="w-3 h-3 animate-pulse" /> Live
                </span>
              </div>

              {technician.phone && (
                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Direct Contact:</span>
                  <a
                    href={`tel:${technician.phone}`}
                    className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" /> {technician.phone}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Device & Location Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400 mb-1">
                {t("Device")}
              </div>
              <div className="font-semibold text-sm text-white flex items-center gap-2 truncate">
                <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="truncate">{order.device || "Smartphone"}</span>
              </div>
            </div>
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400 mb-1">
                {t("Issue")}
              </div>
              <div
                className="font-semibold text-sm text-white truncate"
                title={order.issue || order.service}
              >
                {order.issue || order.service || "Diagnostic"}
              </div>
            </div>
          </div>

          {/* Order Address */}
          {order.address && (
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3">
              <Navigation className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="text-xs truncate">
                <span className="text-slate-400 block text-[10px]">
                  Service Location:
                </span>
                <span className="text-white font-medium truncate block">
                  {order.address}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
