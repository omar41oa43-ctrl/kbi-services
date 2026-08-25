import fs from "node:fs";

const baseUrl = String(process.env.KBI_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const email = String(process.env.KBI_TARGET_EMAIL || "").trim().toLowerCase();
const password = String(process.env.KBI_TEMP_PASSWORD || "");
if (!email || !password) {
  throw new Error("Set KBI_TARGET_EMAIL and KBI_TEMP_PASSWORD before running this smoke test.");
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

const signInResponse = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
  {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  },
);
const signIn = await signInResponse.json();
if (!signInResponse.ok || !signIn.idToken) {
  throw new Error(`Firebase sign-in failed (${signIn?.error?.message || signInResponse.status}).`);
}

const bearerHeaders = { authorization: `Bearer ${signIn.idToken}` };
const sessionResponse = await fetch(`${baseUrl}/api/admin/session`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ idToken: signIn.idToken }),
});
const setCookie = sessionResponse.headers.get("set-cookie") || "";
const sessionCookie = setCookie.split(";", 1)[0];
if (!sessionResponse.ok || !sessionCookie.startsWith("kbi_admin_session=")) {
  throw new Error(`Admin session creation failed (${sessionResponse.status}).`);
}
const cookieHeaders = { cookie: sessionCookie };
const results = [];

async function check(name, path, options, allowedStatuses) {
  try {
    const response = await fetch(`${baseUrl}${path}`, { redirect: "manual", ...options });
    const passed = allowedStatuses.includes(response.status);
    const detail = passed ? undefined : (await response.text()).slice(0, 240);
    results.push({ name, status: response.status, passed, ...(detail ? { detail } : {}) });
  } catch (error) {
    results.push({ name, status: "network-error", passed: false, error: error?.message || String(error) });
  }
}

const publicPages = [
  "/", "/about", "/book", "/contact", "/corporate", "/services", "/terms", "/track",
];
const adminPages = [
  "/admin", "/admin/analytics", "/admin/inbox/corporate", "/admin/inventory",
  "/admin/invoice-export", "/admin/orders", "/admin/requests", "/admin/settings",
  "/admin/settings/security", "/admin/subscriptions", "/admin/technicians", "/admin/tracking",
];

await Promise.all(publicPages.map((path) => check(`public ${path}`, path, {}, [200])));
await Promise.all(adminPages.map((path) => check(`admin page ${path}`, path, { headers: cookieHeaders }, [200])));

await Promise.all([
  check("admin redirect without token", "/admin", {}, [307, 308]),
  check("admin orders API", "/api/admin/orders", { headers: bearerHeaders }, [200]),
  check("admin CRM API", "/api/admin/crm/customers", { headers: bearerHeaders }, [200]),
  check("admin users API", "/api/admin/users/list", { headers: bearerHeaders }, [200]),
  check("admin users export API", "/api/admin/users/export", { headers: bearerHeaders }, [200]),
  check("cleanup preview API", "/api/cleanup-orders", { headers: bearerHeaders }, [200]),
  check("missing admin order", "/api/admin/orders/smoke-missing-order", { headers: bearerHeaders }, [404]),
  check("orders API rejects anonymous", "/api/admin/orders", {}, [401]),
  check("users API rejects anonymous", "/api/admin/users/list", {}, [403]),
  check("CRM API rejects anonymous", "/api/admin/crm/customers", {}, [401]),
  check("cleanup API rejects anonymous", "/api/cleanup-orders", {}, [401]),
]);

const protectedMutations = [
  ["dispatch mutation rejects anonymous", "/api/admin/dispatch", "POST"],
  ["remote command rejects anonymous", "/api/admin/remote-command", "POST"],
  ["technician control rejects anonymous", "/api/admin/technicians/control", "POST"],
  ["create admin rejects anonymous", "/api/admin/users/create-super-admin", "POST"],
  ["password mutation rejects anonymous", "/api/admin/users/password", "POST"],
  ["cleanup mutation rejects anonymous", "/api/cleanup-orders", "POST"],
  ["order delete rejects anonymous", "/api/orders/__smoke_missing__", "DELETE"],
  ["order status rejects anonymous", "/api/admin/orders/__smoke_missing__/status", "PATCH"],
];
await Promise.all(protectedMutations.map(([name, path, method]) => check(
  name,
  path,
  { method, headers: { "content-type": "application/json" }, body: "{}" },
  [401, 403],
)));

const failed = results.filter((result) => !result.passed);
console.log(JSON.stringify({
  passed: failed.length === 0,
  total: results.length,
  passedCount: results.length - failed.length,
  failed,
}));
if (failed.length) process.exitCode = 1;
