import { NextResponse } from "next/server";
import { getStorage } from "firebase-admin/storage";

import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let firestoreOk = false;
    let authOk = false;
    let storageOk = false;
    let sampleCount: number | null = null;

    try {
      const snap = await getAdminDb().collection("devices").limit(1).get();
      firestoreOk = true;
      sampleCount = snap.size;
    } catch (e: any) {
      console.warn("Health check query failed:", e?.message || e);
      firestoreOk = false;
      sampleCount = null;
    }

    try {
      await getAdminAuth().listUsers(1);
      authOk = true;
    } catch (error) {
      console.warn("Health check auth failed:", error instanceof Error ? error.message : error);
    }

    try {
      const bucketName =
        process.env.FIREBASE_STORAGE_BUCKET ||
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
        (process.env.FIREBASE_ADMIN_PROJECT_ID
          ? `${process.env.FIREBASE_ADMIN_PROJECT_ID}.firebasestorage.app`
          : null);
      if (bucketName) {
        storageOk = true;
      }
    } catch (error) {
      console.warn("Health check storage failed:", error instanceof Error ? error.message : error);
    }

    const ok = firestoreOk && authOk && storageOk;

    return NextResponse.json(
      {
        ok,
        checks: {
          firestore: { ok: firestoreOk, sampleCount },
          auth: { ok: authOk },
          storage: { ok: storageOk },
        },
      },
      { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Firebase health check failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
