"use client";

import React, { useState, useEffect } from "react";
import { Navigation, CheckCircle2, X, Search, ShoppingBag, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { cn } from "@/lib/utils";
import { authorizedFetch } from "@/lib/authorized-fetch";

interface TechnicianItem {
  id: string;
  name: string;
  phone: string;
  specialization?: string;
  vehicleType?: string;
  distanceKm?: number;
  rating?: number;
  etaMinutes?: number;
  isAvailable?: boolean;
  isOnline?: boolean;
  completedJobs?: number;
}

interface OrderOption {
  id: string;
  orderNumber: string;
  customerName: string;
  device: string;
  amount: number;
  address?: string;
}

interface AssignTechnicianModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderAddress?: string;
  onAssigned: () => void;
}

export default function AssignTechnicianModal({
  isOpen,
  onClose,
  orderId: initialOrderId,
  onAssigned,
}: AssignTechnicianModalProps) {
  const [technicians, setTechnicians] = useState<TechnicianItem[]>([]);
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(initialOrderId || "");
  const [serviceAmount, setServiceAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (initialOrderId) {
      setSelectedOrderId(initialOrderId);
    }
  }, [initialOrderId]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, initialOrderId]);

  // Update serviceAmount when selected order changes
  useEffect(() => {
    const selectedObj = orders.find((o) => o.orderNumber === selectedOrderId);
    if (selectedObj && selectedObj.amount) {
      setServiceAmount(selectedObj.amount);
    }
  }, [selectedOrderId, orders]);

  const fetchData = async () => {
    setLoading(true);

    const fetchedOrdersMap = new Map<string, OrderOption>();

    const isCompletedStatus = (status?: string) => {
      if (!status) return false;
      const s = status.toString().toLowerCase();
      return s === "completed" || s === "paid" || s === "finished" || s === "cancelled" || s === "done";
    };

    try {
      const srSnap = await getDocs(query(collection(db, "service_requests"), limit(25)));
      srSnap.docs.forEach((d) => {
        const raw = d.data();
        if (isCompletedStatus(raw.status)) return; // Exclude completed orders
        const num = raw.orderId || raw.bookingId || d.id;
        fetchedOrdersMap.set(num, {
          id: d.id,
          orderNumber: num,
          customerName: raw.customerName || raw.name || "Not recorded",
          device: raw.description || raw.type || "Service not recorded",
          amount: Number(raw.totalAmount || raw.price || raw.serviceAmount || 0),
          address: raw.location?.address || "",
        });
      });
    } catch (error) {
      console.warn("Unable to load service requests:", error);
    }

    try {
      const ordersSnap = await getDocs(query(collection(db, "orders"), limit(25)));
      ordersSnap.docs.forEach((d) => {
        const raw = d.data();
        if (isCompletedStatus(raw.status)) return; // Exclude completed orders
        const num = raw.orderId || raw.bookingId || d.id;
        fetchedOrdersMap.set(num, {
          id: d.id,
          orderNumber: num,
          customerName: raw.customerName || raw.name || "Not recorded",
          device: `${raw.brand || ""} ${raw.model || ""} ${raw.issue || ""}`.trim() || "Not recorded",
          amount: Number(raw.totalAmount || raw.price || raw.serviceAmount || 0),
          address: raw.address || "",
        });
      });
    } catch (error) {
      console.warn("Unable to load orders:", error);
    }

    try {
      const bSnap = await getDocs(query(collection(db, "bookings"), limit(20)));
      bSnap.docs.forEach((d) => {
        const raw = d.data();
        if (isCompletedStatus(raw.status)) return; // Exclude completed orders
        const num = raw.bookingId || raw.orderNumber || d.id;
        fetchedOrdersMap.set(num, {
          id: d.id,
          orderNumber: num,
          customerName: raw.customerName || raw.name || "Not recorded",
          device: raw.device || raw.serviceType || "Service not recorded",
          amount: Number(raw.totalAmount || raw.price || raw.serviceAmount || 0),
          address: raw.address || "",
        });
      });
    } catch (error) {
      console.warn("Unable to load bookings:", error);
    }

    const orderList = Array.from(fetchedOrdersMap.values());
    setOrders(orderList);

    const targetOrd = initialOrderId && fetchedOrdersMap.has(initialOrderId) ? initialOrderId : orderList[0]?.orderNumber;
    if (targetOrd) {
      setSelectedOrderId(targetOrd);
      const selObj = fetchedOrdersMap.get(targetOrd);
      if (selObj?.amount) setServiceAmount(selObj.amount);
    }

    try {
      const res = await authorizedFetch("/api/admin/users?role=TECHNICIAN");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unable to load technicians");
      if (data.users && data.users.length > 0) {
        const formatted: TechnicianItem[] = data.users
          .filter((u: any) => {
            const role = (u.role || "").toUpperCase();
            const name = (u.name || "").toLowerCase();
            if (role.includes("ADMIN") || name.includes("admin")) return false;
            return true;
          })
          .map((u: any) => ({
            id: u.technician?.id || u.id,
            name: u.name || "Not recorded",
            phone: u.phone || "Not provided",
            specialization: u.technician?.specialization || "Not recorded",
            vehicleType: u.technician?.vehicleType || "Unassigned",
            distanceKm: Number(u.technician?.distanceKm || 0),
            rating: Number(u.technician?.rating || 0),
            etaMinutes: Number(u.technician?.etaMinutes || 0),
            isAvailable: u.technician?.available === true || u.technician?.isAvailable === true,
            isOnline: u.technician?.online === true || u.technician?.isOnline === true,
            completedJobs: Number(u.technician?.completedJobs || 0),
          }));
        setTechnicians(formatted);
      } else {
        setTechnicians([]);
      }
    } catch (error) {
      console.warn("Unable to load technicians:", error);
      setTechnicians([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (technicianId: string) => {
    setAssigningId(technicianId);
    const techObj = technicians.find((t) => t.id === technicianId);
    const targetOrder = orders.find((o) => o.orderNumber === selectedOrderId);
    const finalPrice = Number(serviceAmount) || targetOrder?.amount || 0;

    try {
      if (!selectedOrderId || finalPrice <= 0) throw new Error("Select an order and enter a valid service amount");
      const response = await authorizedFetch("/api/admin/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrderId,
          technicianId,
          serviceAmount: finalPrice,
          action: "ASSIGN",
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Assignment failed");
      alert(`Job #${selectedOrderId} assigned to ${techObj?.name || "Technician"} with service amount AED ${finalPrice}.`);
      onAssigned();
      onClose();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Assignment failed.");
    } finally {
      setAssigningId(null);
    }
  };

  const filteredTechs = technicians.filter((t) =>
    search.trim() === ""
      ? true
      : t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.specialization && t.specialization.toLowerCase().includes(search.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="bg-[#0F172A] border border-[#334155] rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 text-white p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#334155]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-[#06B6D4]">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Assign Technician to Job</h2>
              <p className="text-xs text-slate-400 mt-0.5">Select target order, set service amount (price), and dispatch in real-time</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#1E293B] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Real Order & Service Amount Selector Toolbar */}
        <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155] space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Target Order Dropdown */}
            <div className="flex items-center gap-2 w-full md:w-auto flex-1">
              <span className="text-xs font-bold text-[#06B6D4] flex items-center gap-1.5 shrink-0">
                <ShoppingBag className="w-4 h-4 text-[#06B6D4]" /> Order:
              </span>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="bg-[#0F172A] border border-[#06B6D4]/60 text-[#06B6D4] font-mono font-bold text-xs rounded-xl px-3.5 h-11 w-full focus:outline-none focus:border-[#06B6D4] cursor-pointer shadow-inner"
              >
                {orders.map((ord) => (
                  <option key={ord.id} value={ord.orderNumber}>
                    [{ord.orderNumber}] • {ord.customerName} ({ord.device})
                  </option>
                ))}
              </select>
            </div>

            {/* Editable Service Amount Input */}
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 shrink-0">
                <Wallet className="w-4 h-4 text-emerald-400" /> Service Amount (AED):
              </span>
              <Input
                type="number"
                value={serviceAmount}
                onChange={(e) => setServiceAmount(Number(e.target.value))}
                className="w-32 bg-[#0F172A] border-[#22C55E]/60 text-emerald-400 font-extrabold text-sm h-11 rounded-xl text-center focus:border-[#22C55E]"
              />
            </div>
          </div>

          {/* Quick Price Presets */}
          <div className="flex items-center gap-2 pt-1 border-t border-[#334155]/60 text-[11px]">
            <span className="text-slate-400 font-medium">Quick Price Presets:</span>
            <button
              type="button"
              onClick={() => setServiceAmount(250)}
              className="px-2.5 py-1 rounded-lg bg-[#0F172A] border border-[#334155] text-emerald-400 font-bold hover:bg-[#334155]"
            >
              250 AED
            </button>
            <button
              type="button"
              onClick={() => setServiceAmount(350)}
              className="px-2.5 py-1 rounded-lg bg-[#0F172A] border border-[#334155] text-emerald-400 font-bold hover:bg-[#334155]"
            >
              350 AED
            </button>
            <button
              type="button"
              onClick={() => setServiceAmount(450)}
              className="px-2.5 py-1 rounded-lg bg-[#0F172A] border border-[#334155] text-emerald-400 font-bold hover:bg-[#334155]"
            >
              450 AED
            </button>
            <button
              type="button"
              onClick={() => setServiceAmount(650)}
              className="px-2.5 py-1 rounded-lg bg-[#0F172A] border border-[#334155] text-emerald-400 font-bold hover:bg-[#334155]"
            >
              650 AED
            </button>
            <button
              type="button"
              onClick={() => setServiceAmount(850)}
              className="px-2.5 py-1 rounded-lg bg-[#0F172A] border border-[#334155] text-emerald-400 font-bold hover:bg-[#334155]"
            >
              850 AED
            </button>
          </div>
        </div>

        {/* Search */}
        <div>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search technician by name or specialization..."
              className="pl-10 bg-[#1E293B] border-[#334155] text-white h-10 text-xs rounded-xl focus:border-[#06B6D4]"
            />
          </div>
        </div>

        {/* Harmonized Cards Grid */}
        <div className="max-h-[50vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading technicians...</div>
          ) : filteredTechs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">No active technicians found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredTechs.map((tech) => {
                const isAvail = tech.isOnline && tech.isAvailable;

                return (
                  <div
                    key={tech.id}
                    className="p-4 rounded-xl border border-[#334155] bg-[#1E293B] hover:border-[#06B6D4]/60 transition-all flex flex-col justify-between h-full space-y-3.5 group shadow-md"
                  >
                    {/* Row 1: Avatar Left + Status Badge Right */}
                    <div className="flex items-center justify-between">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-[#0F172A] border border-[#334155] flex items-center justify-center font-bold text-xs text-white">
                          {tech.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span
                          className={cn(
                            "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-[#1E293B]",
                            tech.isOnline ? "bg-[#22C55E]" : "bg-slate-500"
                          )}
                        />
                      </div>

                      <span
                        className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase shrink-0",
                          isAvail
                            ? "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        )}
                      >
                        {isAvail ? "Available" : "Unavailable"}
                      </span>
                    </div>

                    {/* Row 2: Full Width Name & Specialization */}
                    <div>
                      <h4 className="font-bold text-white text-sm truncate group-hover:text-[#06B6D4] transition-colors">
                        {tech.name}
                      </h4>
                      <p className="text-[11px] text-[#06B6D4] font-medium truncate mt-0.5">
                        {tech.specialization}
                      </p>
                    </div>

                    {/* Row 3: Metrics Bar */}
                    <div className="flex items-center justify-between text-[11px] text-slate-300 bg-[#0F172A]/70 px-3 py-2 rounded-lg border border-[#334155]/60">
                      <span className="text-amber-400 font-semibold flex items-center gap-1">
                        ⭐ {tech.rating}
                      </span>
                      <span className="text-emerald-400 font-extrabold">
                        {serviceAmount} AED
                      </span>
                    </div>

                    {/* Row 4: Primary Button */}
                    <Button
                      disabled={!isAvail || !selectedOrderId || serviceAmount <= 0 || assigningId === tech.id}
                      onClick={() => handleAssign(tech.id)}
                      className={cn(
                        "w-full h-9 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm",
                        isAvail
                          ? "bg-[#06B6D4] hover:bg-[#0891B2] text-slate-950 cursor-pointer active:scale-[0.98]"
                          : "bg-[#0F172A] border border-[#334155] text-slate-500 cursor-not-allowed"
                      )}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        {assigningId === tech.id
                          ? "Assigning..."
                          : isAvail
                          ? `Assign (${serviceAmount} AED)`
                          : "Unavailable"}
                      </span>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
