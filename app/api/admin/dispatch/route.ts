import { NextResponse } from "next/server";
import { AdminControlService } from "@/lib/services/admin-control-service";
import { authenticateAdmin } from "@/lib/api-auth";

export async function POST(req: Request) {
  try {
    const identity = await authenticateAdmin(req);
    if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { orderId, technicianId, action, serviceAmount } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    if (action === "ASSIGN" || action === "REASSIGN") {
      if (!technicianId) {
        return NextResponse.json({ error: "technicianId required for assignment" }, { status: 400 });
      }
      const parsedAmount = serviceAmount === undefined ? undefined : Number(serviceAmount);
      if (parsedAmount !== undefined && (!Number.isFinite(parsedAmount) || parsedAmount < 0)) {
        return NextResponse.json({ error: "serviceAmount must be a positive number" }, { status: 400 });
      }
      const result = await AdminControlService.assignOrder(orderId, technicianId, identity.uid, parsedAmount);
      return NextResponse.json({ success: true, order: result });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Dispatch API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process dispatch action" }, { status: 500 });
  }
}
