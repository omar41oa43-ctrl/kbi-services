import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import fs from "node:fs";

const email = String(process.env.KBI_TARGET_EMAIL || "").trim().toLowerCase();
if (!email) throw new Error("Set KBI_TARGET_EMAIL before running this check.");

const serviceAccount = JSON.parse(
  fs.readFileSync(new URL("../lib/service-account.json", import.meta.url), "utf8"),
);
initializeApp({ credential: cert(serviceAccount) });

const user = await getAuth().getUserByEmail(email);
const profile = (await getFirestore().collection("users").doc(user.uid).get()).data();

console.log(JSON.stringify({
  exists: true,
  enabled: !user.disabled,
  emailVerified: user.emailVerified,
  authRole: user.customClaims?.role ?? null,
  adminClaim: user.customClaims?.admin === true,
  superAdminClaim: user.customClaims?.super_admin === true,
  profileRole: profile?.role ?? null,
  mustChangePassword: profile?.mustChangePassword === true,
}));
