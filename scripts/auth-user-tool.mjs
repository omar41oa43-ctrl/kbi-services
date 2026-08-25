import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import fs from "node:fs";

export async function runAuthUserTool({ role }) {
  const apply = process.argv.includes("--apply");
  const email = String(process.env.KBI_TARGET_EMAIL || "").trim().toLowerCase();
  const sourceEmail = String(process.env.KBI_SOURCE_EMAIL || "").trim().toLowerCase();
  const password = String(process.env.KBI_TEMP_PASSWORD || "");
  const displayName = String(process.env.KBI_TARGET_NAME || "").trim();
  const requirePasswordChange = String(process.env.KBI_REQUIRE_PASSWORD_CHANGE || "true").toLowerCase() !== "false";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Set KBI_TARGET_EMAIL to a valid email address.");
  }
  if (sourceEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sourceEmail)) {
    throw new Error("KBI_SOURCE_EMAIL must be a valid email address when provided.");
  }
  if (password.length < 12) {
    throw new Error("Set KBI_TEMP_PASSWORD to at least 12 characters.");
  }
  if (!apply) {
    throw new Error("Dry run only. Add --apply to create or update the requested user.");
  }

  const serviceAccount = JSON.parse(
    fs.readFileSync(new URL("../lib/service-account.json", import.meta.url), "utf8"),
  );
  initializeApp({ credential: cert(serviceAccount) });
  const auth = getAuth();
  const db = getFirestore();

  let user;
  try {
    user = await auth.getUserByEmail(email);
    user = await auth.updateUser(user.uid, {
      password,
      disabled: false,
      emailVerified: true,
      ...(displayName ? { displayName } : {}),
    });
  } catch (error) {
    if (error?.code !== "auth/user-not-found") throw error;
    if (sourceEmail && sourceEmail !== email) {
      const sourceUser = await auth.getUserByEmail(sourceEmail);
      user = await auth.updateUser(sourceUser.uid, {
        email,
        password,
        emailVerified: true,
        disabled: false,
        ...(displayName ? { displayName } : {}),
      });
    } else {
      user = await auth.createUser({
        email,
        password,
        emailVerified: true,
        disabled: false,
        ...(displayName ? { displayName } : {}),
      });
    }
  }

  const claims = role === "super_admin"
    ? { role, admin: true, super_admin: true }
    : { role };
  await auth.setCustomUserClaims(user.uid, claims);
  await db.collection("users").doc(user.uid).set(
    {
      uid: user.uid,
      email,
      name: displayName || user.displayName || "",
      role,
      mustChangePassword: role === "super_admin" && requirePasswordChange,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  if (role === "technician") {
    await db.collection("technicians").doc(user.uid).set(
      {
        email,
        isActive: true,
        isApproved: true,
        isOnline: false,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  console.log(JSON.stringify({
    ok: true,
    uid: user.uid,
    email,
    role,
    mustChangePassword: role === "super_admin" && requirePasswordChange,
  }));
}
