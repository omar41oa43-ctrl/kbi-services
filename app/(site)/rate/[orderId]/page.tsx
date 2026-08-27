"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Star,
  CheckCircle,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  doc,
  updateDoc,
  Timestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

export default function RateOrderPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [docId, setDocId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) return;

    let isActive = true;
    const loadingDeadline = window.setTimeout(() => {
      if (!isActive) return;
      setError("We could not load this order. Please try again.");
      setLoading(false);
    }, 6000);

    const fetchOrder = async () => {
      try {
        // Search by orderId field instead of document ID
        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, where("orderId", "==", orderId));
        const snapshot = await getDocs(q);

        if (!isActive) return;

        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          const data = docSnap.data();
          setOrder({ id: docSnap.id, ...data });
          setDocId(docSnap.id);

          // Check if already rated
          if (data.rating) {
            setRating(data.rating.score);
            setFeedback(data.rating.feedback || "");
            setSubmitted(true);
          }
        } else {
          setError("Order not found");
        }
      } catch {
        if (isActive) setError("Failed to load order");
      } finally {
        window.clearTimeout(loadingDeadline);
        if (isActive) setLoading(false);
      }
    };

    fetchOrder();

    return () => {
      isActive = false;
      window.clearTimeout(loadingDeadline);
    };
  }, [orderId]);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (!docId) {
      setError("Order not found");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const docRef = doc(db, "orders", docId);
      await updateDoc(docRef, {
        rating: {
          score: rating,
          feedback: feedback.trim(),
          submittedAt: Timestamp.now(),
        },
        updatedAt: Timestamp.now(),
      });

      setSubmitted(true);
    } catch {
      setError("Failed to submit rating. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        className="adaptive-theme-page min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
        <span className="sr-only">Loading order</span>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="adaptive-theme-page min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center p-4">
        <Card className="bg-white/5 border-white/10 max-w-md w-full shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10">
              <AlertCircle
                className="h-8 w-8 text-red-500 dark:text-red-400"
                aria-hidden="true"
              />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Order not found
            </h1>
            <p className="mt-3 text-muted-foreground">{error}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                asChild
                className="bg-cyan-500 font-bold text-black hover:bg-cyan-400"
              >
                <Link href="/track">Track another order</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-border text-foreground hover:bg-muted"
              >
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" /> Back home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="adaptive-theme-page min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center p-4">
      <Card className="bg-white/5 border-white/10 max-w-md w-full backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            {submitted ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <Star className="w-8 h-8 text-cyan-500" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            {submitted ? "Thank You!" : "Rate Your Experience"}
          </CardTitle>
          {order && (
            <p className="text-white/60 text-sm mt-2">
              Order #{order.orderId || order.id}
              {order.technicianName && ` • ${order.technicianName}`}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          {submitted ? (
            <div className="text-center space-y-4">
              <p className="text-white/80">
                Your feedback helps us improve our service!
              </p>
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-8 h-8 ${
                      star <= rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-white/20"
                    }`}
                  />
                ))}
              </div>
              {feedback && (
                <p className="text-white/60 text-sm italic">"{feedback}"</p>
              )}
            </div>
          ) : (
            <>
              {/* Star Rating */}
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    aria-label={`${star} star${star === 1 ? "" : "s"}`}
                    aria-pressed={rating === star}
                    className="rounded-lg p-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        star <= (hoveredRating || rating)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-white/20"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <p className="text-center text-white/60 text-sm">
                {rating === 0 && "Tap a star to rate"}
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent!"}
              </p>

              {/* Feedback */}
              <div>
                <label
                  htmlFor="rating-feedback"
                  className="block text-sm text-white/60 mb-2"
                >
                  Share your feedback (optional)
                </label>
                <Textarea
                  id="rating-feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us about your experience..."
                  className="bg-white/5 border-white/10 text-white resize-none"
                  rows={3}
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}

              <Button
                onClick={handleSubmit}
                disabled={submitting || rating === 0}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Rating"
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
