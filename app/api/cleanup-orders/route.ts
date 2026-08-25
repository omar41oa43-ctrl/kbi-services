import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin, getAdminDb } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
    try {
        const adminUser = await verifyAdmin(request, true)
        if (!adminUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const db = getAdminDb()
        const snapshot = await db.collection("orders").get()

        let deletedCount = 0
        const deletedIds: string[] = []
        const batch = db.batch()

        for (const doc of snapshot.docs) {
            const data = doc.data()

            // Delete orders with missing customer info or mock data indicators
            const hasNoName = !data.name && !data.customerName
            const isUnknown = data.customerName === "Unknown" || data.name === "Unknown"
            const hasNoPhone = !data.phone && !data.customerPhone
            const isLikelyMock = data.orderId?.startsWith("ORD-") // Old mock order IDs

            if (hasNoName || isUnknown || (hasNoPhone && isLikelyMock)) {
                batch.delete(doc.ref)
                deletedIds.push(doc.id)
                deletedCount++
            }
        }

        if (deletedCount > 0) {
            await batch.commit()
        }

        return NextResponse.json({
            success: true,
            message: `Cleaned up ${deletedCount} invalid orders`,
            deletedIds
        })
    } catch (error: any) {
        console.error("Cleanup error:", error)
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    const adminUser = await verifyAdmin(request, true)
    if (!adminUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({
        message: "POST to this endpoint to cleanup invalid orders",
        warning: "This will permanently delete orders with missing customer data"
    })
}

