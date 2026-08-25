import { NextResponse } from "next/server";
import { AdminControlService } from "@/lib/services/admin-control-service";
import { authenticateAdmin } from "@/lib/api-auth";

const allowedActions = new Set([
  "NAVIGATE", "FORCE_LOGOUT", "LOCK_SCREEN", "POPUP_ALERT",
  "EMERGENCY_ALERT", "FORCE_SYNC",
]);

export async function POST(req: Request) {
  try {
    const identity = await authenticateAdmin(req);
    if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { technicianId, action, payload } = body;

    if (!technicianId || !action) {
      return NextResponse.json({ error: "technicianId and action are required" }, { status: 400 });
    }
    if (!allowedActions.has(action)) {
      return NextResponse.json({ error: "Unsupported remote action" }, { status: 400 });
    }

    const commandResult = await AdminControlService.sendRemoteCommand({
      technicianId,
      action,
      payload,
      adminUser: identity.uid,
    });

    return NextResponse.json({ success: true, command: commandResult });
  } catch (error: any) {
    console.error("Remote Command API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to dispatch remote command" }, { status: 500 });
  }
}
