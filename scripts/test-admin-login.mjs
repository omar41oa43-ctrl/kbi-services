import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import fs from "node:fs";

const email = String(process.env.KBI_TARGET_EMAIL || "").trim().toLowerCase();
const password = String(process.env.KBI_TEMP_PASSWORD || "");
const expectedPasswordChange = String(process.env.KBI_EXPECT_PASSWORD_CHANGE || "true").toLowerCase() !== "false";
if (!email || !password) {
  throw new Error("Set KBI_TARGET_EMAIL and KBI_TEMP_PASSWORD before running this test.");
}

const localEnv = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const separator = line.indexOf("=");
      return [line.slice(0, separator), line.slice(separator + 1).replace(/^['\"]|['\"]$/g, "")];
    }),
);

const apiKey = localEnv.NEXT_PUBLIC_FIREBASE_API_KEY;
if (!apiKey) throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY is not configured.");

const response = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
  {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  },
);
const signIn = await response.json();
if (!response.ok || !signIn.idToken) {
  throw new Error(`Firebase sign-in failed (${signIn?.error?.message || response.status}).`);
}

const serviceAccount = JSON.parse(
  fs.readFileSync(new URL("../lib/service-account.json", import.meta.url), "utf8"),
);
initializeApp({ credential: cert(serviceAccount) });

const identity = await getAuth().verifyIdToken(signIn.idToken, true);
const profile = (await getFirestore().collection("users").doc(identity.uid).get()).data();
const result = {
  passwordSignIn: true,
  tokenVerified: true,
  enabled: identity.firebase?.sign_in_provider === "password",
  emailVerified: identity.email_verified === true,
  roleClaim: identity.role ?? null,
  adminClaim: identity.admin === true,
  superAdminClaim: identity.super_admin === true,
  profileRole: profile?.role ?? null,
  mustChangePassword: profile?.mustChangePassword === true,
  passwordChangeStateMatches: (profile?.mustChangePassword === true) === expectedPasswordChange,
};

console.log(JSON.stringify(result));
if (
  !result.enabled ||
  !result.emailVerified ||
  result.roleClaim !== "super_admin" ||
  !result.adminClaim ||
  !result.superAdminClaim ||
  result.profileRole !== "super_admin" ||
  !result.passwordChangeStateMatches
) {
  process.exitCode = 1;
}
