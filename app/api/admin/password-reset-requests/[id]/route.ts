import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase-admin";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const identity = await authenticateAdmin(request);
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!id || id.includes("/") || id.length > 1500) {
    return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
  }
  try {
    const db = getAdminDb();
    const ref = db.collection("password_reset_requests").doc(id);
    const outcome = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) return "missing";
      if (snapshot.data()?.status === "deleted") return "deleted";
      if (snapshot.data()?.status !== "pending") return "processed";
      // Retain the request and audit trail; never delete the technician account.
      transaction.update(ref, {
        status: "deleted",
        deletedBy: identity.uid,
        deletedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.set(db.collection("audit_logs").doc(), {
        actorId: identity.uid,
        actorRole: identity.role,
        action: "PASSWORD_RESET_REQUEST_DELETED",
        targetId: id,
        createdAt: FieldValue.serverTimestamp(),
      });
      return "deleted";
    });
    if (outcome === "missing") return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (outcome === "processed") return NextResponse.json({ error: "This request has already been processed. Refresh the dashboard." }, { status: 409 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unable to delete password reset request", error);
    return NextResponse.json({ error: "Request could not be deleted. Please try again." }, { status: 500 });
  }
}
