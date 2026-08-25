import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin, getAdminDb } from "@/lib/firebase-admin"

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const adminUser = await verifyAdmin(request)
        if (!adminUser || (adminUser.role !== "admin" && adminUser.role !== "super_admin")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: orderId } = await context.params

        if (!orderId) {
            return NextResponse.json({ error: "Order ID required" }, { status: 400 })
        }

        const db = getAdminDb()
        const orderRef = db.collection("orders").doc(orderId)
        const orderSnap = await orderRef.get()

        if (!orderSnap.exists) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 })
        }

        // Delete the order
        await orderRef.delete()

        return NextResponse.json({
            success: true,
            message: `Order ${orderId} deleted successfully`
        })
    } catch (error: any) {
        console.error("Delete order error:", error)
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}

