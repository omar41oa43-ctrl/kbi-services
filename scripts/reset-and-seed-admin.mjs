import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import fs from "node:fs";

async function main() {
  const serviceAccount = JSON.parse(
    fs.readFileSync(new URL("../lib/service-account.json", import.meta.url), "utf8")
  );

  if (getApps().length === 0) {
    initializeApp({ credential: cert(serviceAccount) });
  }

  const auth = getAuth();
  const db = getFirestore();

  console.log("=== 1. Setting up clean Admin User ===");
  const targetEmail = "admin@kbi.ae";
  const targetPassword = "AdminPassword2026!";
  const targetName = "KBI Master Admin";

  let adminUid;
  try {
    const existingAdmin = await auth.getUserByEmail(targetEmail);
    adminUid = existingAdmin.uid;
    console.log(`Found existing admin user ${adminUid}, updating password and properties...`);
    await auth.updateUser(adminUid, {
      password: targetPassword,
      displayName: targetName,
      emailVerified: true,
      disabled: false,
    });
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      console.log(`Creating new admin user ${targetEmail}...`);
      const newAdmin = await auth.createUser({
        email: targetEmail,
        password: targetPassword,
        displayName: targetName,
        emailVerified: true,
        disabled: false,
      });
      adminUid = newAdmin.uid;
    } else {
      throw err;
    }
  }

  // Set Admin Custom Claims
  await auth.setCustomUserClaims(adminUid, {
    role: "super_admin",
    admin: true,
    superAdmin: true,
    super_admin: true,
  });
  console.log(`Custom claims set for ${targetEmail} (${adminUid})`);

  // Ensure Admin User Document in Firestore
  await db.collection("users").doc(adminUid).set(
    {
      uid: adminUid,
      email: targetEmail,
      name: targetName,
      displayName: targetName,
      role: "super_admin",
      isActive: true,
      mustChangePassword: false,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log("=== 2. Cleaning other Firebase Auth users ===");
  const listUsersResult = await auth.listUsers(1000);
  for (const userRecord of listUsersResult.users) {
    if (userRecord.email?.toLowerCase() !== targetEmail.toLowerCase()) {
      console.log(`Deleting Auth user: ${userRecord.email} (${userRecord.uid})`);
      try {
        await auth.deleteUser(userRecord.uid);
      } catch (delErr) {
        console.warn(`Failed to delete user ${userRecord.uid}:`, delErr.message);
      }
    }
  }

  console.log("=== 3. Cleaning Firestore Collections (Orders, Bookings, Service Requests) ===");
  const collectionsToClean = [
    "orders",
    "bookings",
    "service_requests",
    "corporate_requests",
    "notifications",
    "customer_reviews",
  ];

  for (const collName of collectionsToClean) {
    const snap = await db.collection(collName).get();
    console.log(`Cleaning collection '${collName}' (${snap.size} documents)...`);
    const batch = db.batch();
    let count = 0;
    for (const doc of snap.docs) {
      batch.delete(doc.ref);
      count++;
      if (count >= 400) {
        await batch.commit();
        count = 0;
      }
    }
    if (count > 0) {
      await batch.commit();
    }
  }

  console.log("=== 4. Cleaning non-admin documents in 'users' and 'technicians' ===");
  const usersSnap = await db.collection("users").get();
  for (const doc of usersSnap.docs) {
    if (doc.id !== adminUid && doc.data().email?.toLowerCase() !== targetEmail.toLowerCase()) {
      await doc.ref.delete();
    }
  }

  const techsSnap = await db.collection("technicians").get();
  for (const doc of techsSnap.docs) {
    if (doc.data().email?.toLowerCase() !== targetEmail.toLowerCase()) {
      await doc.ref.delete();
    }
  }

  console.log("=== SUCCESS: Database and Auth have been reset. Only admin@kbi.ae is active! ===");
}

main().catch((err) => {
  console.error("Cleanup script error:", err);
  process.exit(1);
});
