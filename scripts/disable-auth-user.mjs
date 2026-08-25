import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import fs from "node:fs";

const apply = process.argv.includes("--apply");
const email = String(process.env.KBI_TARGET_EMAIL || "").trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("Set KBI_TARGET_EMAIL to the account that should be disabled.");
}
if (!apply) throw new Error("Dry run only. Add --apply to disable the requested user.");

const serviceAccount = JSON.parse(
  fs.readFileSync(new URL("../lib/service-account.json", import.meta.url), "utf8"),
);
initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();
const user = await auth.getUserByEmail(email);
await auth.updateUser(user.uid, { disabled: true });
await auth.setCustomUserClaims(user.uid, { role: "disabled" });
await getFirestore().collection("users").doc(user.uid).set(
  {
    role: "disabled",
    isActive: false,
    updatedAt: FieldValue.serverTimestamp(),
  },
  { merge: true },
);

console.log(JSON.stringify({ ok: true, uid: user.uid, email, disabled: true }));
