import "server-only"

import { getAdminDb } from "@/lib/firebase-admin"

const MAX_RESERVATION_ATTEMPTS = 100

/** Atomically reserves a short public order number such as KBI-000018. */
export async function reserveNextOrderNumber(): Promise<string> {
  const db = getAdminDb()
  const counterRef = db.collection("counters").doc("orders")
  const reservations = db.collection("order_number_reservations")

  return db.runTransaction(async (transaction) => {
    const counter = await transaction.get(counterRef)
    const stored = Number(counter.data()?.current || 0)
    let next = Number.isFinite(stored) && stored >= 0 ? Math.floor(stored) + 1 : 1

    for (let attempt = 0; attempt < MAX_RESERVATION_ATTEMPTS; attempt += 1, next += 1) {
      const orderNumber = `KBI-${String(next).padStart(6, "0")}`
      const reservationRef = reservations.doc(orderNumber)
      const [reservation, existingOrder, existingBooking] = await Promise.all([
        transaction.get(reservationRef),
        transaction.get(db.collection("orders").where("orderNumber", "==", orderNumber).limit(1)),
        transaction.get(db.collection("bookings").where("orderNumber", "==", orderNumber).limit(1)),
      ])

      if (reservation.exists || !existingOrder.empty || !existingBooking.empty) continue

      const now = new Date()
      transaction.set(counterRef, { current: next, updatedAt: now }, { merge: true })
      transaction.set(reservationRef, { orderNumber, sequence: next, createdAt: now })
      return orderNumber
    }

    throw new Error("Unable to reserve a unique KBI order number")
  })
}
