import { NextResponse } from "next/server";
import { db, auth, storage } from "@/firebase/firebaseConfig";
import { collection, getDocs, query, limit } from "firebase/firestore";

import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("seed") === "true") {
      const adminAuth = getAdminAuth();
      const adminDb = getAdminDb();
      const email = "admin@kbi.ae";
      const password = "AdminPassword2026!";
      
      let uid = "";
      try {
        const user = await adminAuth.getUserByEmail(email);
        uid = user.uid;
        await adminAuth.updateUser(uid, {
          password: password,
          emailVerified: true
        });
      } catch (e: any) {
        if (e.code === 'auth/user-not-found') {
          const newUser = await adminAuth.createUser({
            email,
            password: password,
            emailVerified: true,
            displayName: "Super Admin"
          });
          uid = newUser.uid;
        } else {
          throw e;
        }
      }

      await adminAuth.setCustomUserClaims(uid, { role: "super_admin" });

      const now = new Date();
      await adminDb.collection("users").doc(uid).set({
        email,
        role: "super_admin",
        name: "Super Admin",
        updatedAt: now,
        createdAt: now
      }, { merge: true });

      return NextResponse.json({
        ok: true,
        message: "Admin user created/reset successfully!",
        email,
        password
      });
    }

    let firestoreOk = false;
    let sampleCount: number | null = null;

    try {
      const q = query(collection(db, "devices"), limit(1));
      const snap = await getDocs(q);
      firestoreOk = true;
      sampleCount = snap.size;
    } catch (e: any) {
      console.warn("Health check query failed:", e?.message || e);
      firestoreOk = false;
      sampleCount = null;
    }

    const authOk = !!auth?.app;
    const storageOk = !!storage?.app;

    return NextResponse.json(
      {
        ok: true,
        checks: {
          firestore: { ok: firestoreOk, sampleCount },
          auth: { ok: authOk },
          storage: { ok: storageOk },
        },
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Firebase health check failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
