"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Star, CheckCircle2, ThumbsUp, Sparkles, Heart, ShieldCheck, UserCheck, MessageSquare, Award } from "lucide-react";
import { doc, getDoc, collection, addDoc, serverTimestamp, updateDoc, increment } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

const COMPLIMENTS = [
  { id: "fast", label: "⚡ Super Fast Repair" },
  { id: "polite", label: "🤝 Very Polite & Respectful" },
  { id: "clean", label: "🧼 Clean & Meticulous Work" },
  { id: "expert", label: "🛠️ Highly Skilled & Knowledgeable" },
  { id: "ontime", label: "⏰ Punctual & On Time" },
  { id: "warranty", label: "🛡️ Clear Warranty Explanation" },
];

function RatingContent() {
  const searchParams = useSearchParams();
  const techId = searchParams.get("tech") || "RKqCZJcOfdS8jYVbQ1jgpp5WsAn1";
  const orderId = searchParams.get("order") || "KBI-2026-LIVE";
  const initialTechName = searchParams.get("name") || "Rashad";

  const [techName, setTechName] = useState(initialTechName);
  const [techRole, setTechRole] = useState("Master Hardware Specialist");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedCompliments, setSelectedCompliments] = useState<string[]>(["fast", "clean", "expert"]);
  const [feedback, setFeedback] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [tip, setTip] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function loadTech() {
      if (!techId) return;
      try {
        const snap = await getDoc(doc(db, "technicians", techId));
        if (snap.exists()) {
          const data = snap.data();
          if (data.name) setTechName(data.name);
          if (data.role || data.specialty) setTechRole(data.role || data.specialty);
        }
      } catch (err) {
        console.warn("Could not load tech profile:", err);
      }
    }
    loadTech();
  }, [techId]);

  const toggleCompliment = (id: string) => {
    setSelectedCompliments((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || submitted) return;
    setSubmitting(true);

    try {
      // 1. Save review to Firestore
      await addDoc(collection(db, "technician_reviews"), {
        technicianId: techId,
        technicianName: techName,
        orderId,
        rating,
        compliments: selectedCompliments,
        feedback: feedback.trim(),
        customerName: customerName.trim() || "Verified Customer",
        tipAmount: tip || 0,
        createdAt: serverTimestamp(),
      });

      // 2. Safely update technician review stats
      try {
        await updateDoc(doc(db, "technicians", techId), {
          reviewCount: increment(1),
          lastReviewRating: rating,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn("Technician stats update notice:", err);
      }

      // 3. Add in-app alert for technician
      try {
        await addDoc(collection(db, "notifications"), {
          userId: techId,
          technicianId: techId,
          title: `🌟 5-Star Review Received!`,
          body: `${customerName || "A customer"} left a ${rating}-star rating for Order #${orderId}: "${feedback || "Great service!"}"`,
          type: "review",
          category: "Performance",
          isRead: false,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn("Notification send notice:", err);
      }

      setSubmitted(true);
    } catch (err: any) {
      alert("Failed to submit rating: " + (err?.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const ratingLabels: Record<number, { title: string; desc: string; emoji: string }> = {
    5: { title: "Outstanding Experience!", desc: "Exceeded all expectations in quality and speed.", emoji: "🤩" },
    4: { title: "Great Service", desc: "Very satisfied with the repair and support.", emoji: "😊" },
    3: { title: "Good / Average", desc: "Service was completed as requested.", emoji: "🙂" },
    2: { title: "Needs Improvement", desc: "Encountered some delays or issues.", emoji: "😕" },
    1: { title: "Unsatisfactory", desc: "Did not meet expectations.", emoji: "😞" },
  };

  const activeRating = hoverRating || rating;

  return (
    <main className="min-h-screen bg-[#070B14] text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-lg bg-[#0F172A] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Background glow accents */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {submitted ? (
          <div className="text-center py-12 space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="inline-flex p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Thank You for Your Feedback!</h2>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">
                Your rating has been shared directly with <strong className="text-cyan-400">{techName}</strong> and the KBI Operations Team.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1">
              <p>🛡️ <strong>6-Month KBI Warranty Active</strong> on your repaired device.</p>
              <p>Order Reference: <span className="font-mono text-cyan-400">#{orderId}</span></p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {/* Header / Brand */}
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified KBI On-Site Service
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Rate Your Technician</h1>
              <p className="text-slate-400 text-xs sm:text-sm">
                How was your repair service with <strong className="text-slate-200">{techName}</strong> today?
              </p>
            </div>

            {/* Technician Profile Card */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xl font-extrabold text-white shadow-lg shrink-0">
                {techName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-white truncate">{techName}</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                    <UserCheck className="w-3 h-3" /> Certified
                  </span>
                </div>
                <p className="text-xs text-slate-400">{techRole}</p>
                <p className="text-[11px] font-mono text-cyan-400 mt-0.5">Order #{orderId}</p>
              </div>
            </div>

            {/* 5-Star Interactive Rating */}
            <div className="text-center space-y-3 py-2">
              <div className="flex justify-center items-center gap-2 sm:gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1.5 transition-transform hover:scale-125 active:scale-95 focus:outline-none"
                    aria-label={`${star} Stars`}
                  >
                    <Star
                      className={`w-9 h-9 sm:w-10 sm:h-10 transition-colors duration-200 ${
                        star <= activeRating
                          ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                          : "text-slate-700 fill-transparent"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="space-y-0.5 animate-in fade-in duration-200">
                <p className="text-base font-bold text-amber-300">
                  {ratingLabels[activeRating]?.emoji} {ratingLabels[activeRating]?.title}
                </p>
                <p className="text-xs text-slate-400">
                  {ratingLabels[activeRating]?.desc}
                </p>
              </div>
            </div>

            {/* Compliments Quick-Pills */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                What went well? (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {COMPLIMENTS.map((item) => {
                  const isSelected = selectedCompliments.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleCompliment(item.id)}
                      className={`text-xs px-3 py-2 rounded-xl font-semibold transition-all duration-200 border ${
                        isSelected
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm"
                          : "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Tip */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Add an Optional Tip for {techName}</span>
                <span className="text-[10px] text-slate-500 font-normal">100% goes to technician</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 50].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setTip(tip === amount ? null : amount)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      tip === amount
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                        : "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    AED {amount}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setTip(null)}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    tip === null
                      ? "bg-slate-800 text-slate-200 border-slate-700"
                      : "bg-slate-900/60 text-slate-500 border-slate-800"
                  }`}
                >
                  No Tip
                </button>
              </div>
            </div>

            {/* Comments / Notes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Additional Comments & Praise
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={`Write a few words about your experience with ${techName}...`}
                rows={3}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition resize-none"
              />
            </div>

            {/* Customer Name */}
            <div className="space-y-1">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Your Name (Optional)"
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/20 hover:brightness-110 active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span>Submitting Review...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Submit {rating}-Star Rating</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function RatingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070B14] flex items-center justify-center text-slate-400">Loading Rating Portal...</div>}>
      <RatingContent />
    </Suspense>
  );
}
