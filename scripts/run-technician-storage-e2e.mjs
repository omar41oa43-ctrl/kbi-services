import fs from "node:fs";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(new URL("../package.json", import.meta.url));
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
initializeApp({
  credential: cert(
    JSON.parse(
      fs.readFileSync(new URL("../lib/service-account.json", import.meta.url)),
    ),
  ),
});
const auth = getAuth();
const projectRef = process.env.SUPABASE_PROJECT_REF || "ydxbojizwxpehzfgqbku";
const keys = JSON.parse(
  execFileSync("supabase", [
    "projects",
    "api-keys",
    "--project-ref",
    projectRef,
    "--output",
    "json",
  ], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }),
);
const service = keys.find((k) => k.name === "service_role").api_key;
const anon = keys.find((k) => k.name === "anon").api_key;
const root = `https://${projectRef}.supabase.co`;
const base = root + "/functions/v1/technician-files";
const serviceHeaders = {
  apikey: service,
  Authorization: "Bearer " + service,
  "Content-Type": "application/json",
};
const source = fs.readFileSync(
  new URL("../last kbi app/lib/firebase_options.dart", import.meta.url),
  "utf8",
);
const apiKey = source.match(/'FIREBASE_API_KEY',\s*defaultValue: '([^']+)'/)[1];
let uid;
const uploads = [];
const verified = [];
try {
  const user = await auth.createUser({
    email: `storage-test-${Date.now()}@example.com`,
  });
  uid = user.uid;
  const token = await auth.createCustomToken(uid);
  let r = await fetch(
    "https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=" +
      apiKey,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, returnSecureToken: true }),
    },
  );
  let j = await r.json();
  assert.equal(r.status, 200);
  const idToken = j.idToken;
  const headers = {
    Authorization: "Bearer " + idToken,
    "Content-Type": "application/json",
  };
  r = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(r.status, 401);
  verified.push("unauthenticated uploads rejected");
  r = await fetch(base, {
    method: "POST",
    headers,
    body: JSON.stringify({
      category: "../escape",
      fileName: "a.png",
      size: 10,
    }),
  });
  assert.equal(r.status, 400);
  verified.push("unsafe upload paths rejected");
  for (
    const bad of [{ fileName: "a.svg", size: 10 }, {
      fileName: "a.pdf",
      size: 10485761,
    }]
  ) {
    r = await fetch(base, {
      method: "POST",
      headers,
      body: JSON.stringify({ category: "profile", ...bad }),
    });
    assert.equal(r.status, 400);
  }
  verified.push("unsupported and oversized files rejected");
  for (
    const [name, type, data] of [[
      "test.png",
      "image/png",
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==",
        "base64",
      ),
    ], [
      "test.pdf",
      "application/pdf",
      Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF"),
    ]]
  ) {
    r = await fetch(base, {
      method: "POST",
      headers,
      body: JSON.stringify({
        category: "profile",
        fileName: name,
        size: data.length,
      }),
    });
    j = await r.json();
    assert.equal(r.status, 200, JSON.stringify(j));
    uploads.push(j);
    r = await fetch(j.fileUrl, { redirect: "manual" });
    assert.equal(r.status, 404);
    r = await fetch(j.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": type, "x-upsert": "false" },
      body: data,
    });
    assert.ok(r.ok, await r.text());
    r = await fetch(`${base}/${j.id}/complete`, { method: "POST", headers });
    assert.equal(r.status, 200, await r.text());
    r = await fetch(j.fileUrl);
    assert.equal(r.status, 200);
    assert.deepEqual(Buffer.from(await r.arrayBuffer()), data);
    const wrong = new URL(j.fileUrl);
    wrong.searchParams.set("token", "0".repeat(64));
    r = await fetch(wrong, { redirect: "manual" });
    assert.equal(r.status, 404);
    r = await fetch(root + "/rest/v1/technician_files?id=eq." + j.id, {
      headers: { apikey: anon, Authorization: "Bearer " + anon },
    });
    assert.ok([401, 403].includes(r.status));
    verified.push(
      `${type} upload, confirmation, download integrity and wrong-token rejection`,
    );
  }
  r = await fetch(base, { method: "DELETE", headers });
  assert.equal(r.status, 200);
  for (const upload of uploads) {
    r = await fetch(upload.fileUrl, { redirect: "manual" });
    assert.equal(r.status, 404);
  }
  verified.push(
    "account-file deletion removes objects and revokes download links",
  );
  console.log(JSON.stringify({ success: true, verified }, null, 2));
} finally {
  if (uid) {
    const r = await fetch(
      root + "/rest/v1/technician_files?owner_uid=eq." + uid,
      { headers: serviceHeaders },
    );
    const rows = await r.json();
    if (Array.isArray(rows) && rows.length) {
      await fetch(root + "/storage/v1/object/technician-files", {
        method: "DELETE",
        headers: serviceHeaders,
        body: JSON.stringify({ prefixes: rows.map((x) => x.object_path) }),
      });
      await fetch(root + "/rest/v1/technician_files?owner_uid=eq." + uid, {
        method: "DELETE",
        headers: serviceHeaders,
      });
    }
    await auth.deleteUser(uid);
    console.log("Temporary upload-test files and user removed.");
  }
}
