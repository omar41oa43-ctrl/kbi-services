"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Star, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { doc, getDoc, updateDoc, Timestamp, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/firebase/firebaseConfig"

export default function RateOrderPage() {
    const { orderId } = useParams()
    const router = useRouter()
    const [order, setOrder] = useState<any>(null)
    const [docId, setDocId] = useState<string>("")
    const [loading, setLoading] = useState(true)
    const [rating, setRating] = useState(0)
    const [hoveredRating, setHoveredRating] = useState(0)
    const [feedback, setFeedback] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (!orderId) return

        const fetchOrder = async () => {
            try {
                // Search by orderId field instead of document ID
                const ordersRef = collection(db, "orders")
                const q = query(ordersRef, where("orderId", "==", orderId))
                const snapshot = await getDocs(q)

                if (!snapshot.empty) {
                    const docSnap = snapshot.docs[0]
                    const data = docSnap.data()
                    setOrder({ id: docSnap.id, ...data })
                    setDocId(docSnap.id)

                    // Check if already rated
                    if (data.rating) {
                        setRating(data.rating.score)
                        setFeedback(data.rating.feedback || "")
                        setSubmitted(true)
                    }
                } else {
                    setError("Order not found")
                }
            } catch {
                setError("Failed to load order")
            } finally {
                setLoading(false)
            }
        }

        fetchOrder()
    }, [orderId])

    const handleSubmit = async () => {
        if (rating === 0) {
            setError("Please select a rating")
            return
        }

        if (!docId) {
            setError("Order not found")
            return
        }

        setSubmitting(true)
        setError("")

        try {
            const docRef = doc(db, "orders", docId)
            await updateDoc(docRef, {
                rating: {
                    score: rating,
                    feedback: feedback.trim(),
                    submittedAt: Timestamp.now()
                },
                updatedAt: Timestamp.now()
            })

            setSubmitted(true)
        } catch {
            setError("Failed to submit rating. Please try again.")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
        )
    }

    if (error && !order) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center p-4">
                <Card className="bg-white/5 border-white/10 max-w-md w-full">
                    <CardContent className="p-8 text-center">
                        <p className="text-red-400">{error}</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center p-4">
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
                                        className={`w-8 h-8 ${star <= rating
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
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoveredRating(star)}
                                        onMouseLeave={() => setHoveredRating(0)}
                                        className="transition-transform hover:scale-110"
                                    >
                                        <Star
                                            className={`w-10 h-10 transition-colors ${star <= (hoveredRating || rating)
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
                                <label className="block text-sm text-white/60 mb-2">
                                    Share your feedback (optional)
                                </label>
                                <Textarea
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
    )
}
