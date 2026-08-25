import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import fs from "node:fs";

const apply = process.argv.includes("--apply");
const serviceAccount = JSON.parse(
  fs.readFileSync(new URL("../lib/service-account.json", import.meta.url), "utf8"),
);

initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();
const db = getFirestore();

const snapshot = await db.collection("technicians").get();
const changes = [];

for (const document of snapshot.docs) {
  const data = document.data();
  let authDisabled = false;
  try {
    authDisabled = (await auth.getUser(document.id)).disabled;
  } catch (error) {
    if (error?.code !== "auth/user-not-found") throw error;
  }

  if (data.isActive !== true || data.isApproved !== true || authDisabled) {
    changes.push({
      uid: document.id,
      active: data.isActive === true,
      approved: data.isApproved === true,
      authDisabled,
    });
  }

  if (apply) {
    await document.ref.set(
      {
        isActive: true,
        isApproved: true,
        isOnline: false,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    if (authDisabled) await auth.updateUser(document.id, { disabled: false });
  }
}

console.log(JSON.stringify({ apply, technicians: snapshot.size, changes }, null, 2));
