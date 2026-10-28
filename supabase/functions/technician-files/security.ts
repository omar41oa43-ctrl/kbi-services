export const MAX_BYTES = 10 * 1024 * 1024;
export const MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
export function validateUpload(body: Record<string, unknown>) {
  const category = String(body.category || "");
  const fileName = String(body.fileName || "");
  const size = Number(body.size);
  if (
    !/^(profile|job_before|job_after|documents\/[A-Za-z0-9_-]+|registration\/[A-Za-z0-9_-]+|jobs\/[A-Za-z0-9_-]+)$/
      .test(category)
  ) throw new Error("Invalid upload category.");
  if (
    !fileName || fileName.length > 200 || !Number.isSafeInteger(size) ||
    size < 1 || size > MAX_BYTES
  ) throw new Error("Select a nonempty file of 10 MB or smaller.");
  const extension = fileName.split(".").pop()?.toLowerCase();
  const contentType = extension === "pdf"
    ? MIME_TYPES[0]
    : ["jpg", "jpeg"].includes(extension || "")
    ? MIME_TYPES[1]
    : extension === "png"
    ? MIME_TYPES[2]
    : "";
  if (!contentType) {
    throw new Error("Only PDF, JPG, JPEG, and PNG files are allowed.");
  }
  return {
    category,
    fileName: fileName.replace(/[^A-Za-z0-9._-]/g, "_"),
    size,
    contentType,
  };
}
export function decodePart(value: string) {
  return Uint8Array.from(
    atob(value.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0),
  );
}
export async function verifyFirebaseToken(
  token: string,
  project: string,
  keys: JsonWebKey[],
  now = Math.floor(Date.now() / 1000),
) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Unauthorized");
  const header = JSON.parse(new TextDecoder().decode(decodePart(parts[0])));
  const claims = JSON.parse(new TextDecoder().decode(decodePart(parts[1])));
  const jwk = keys.find((k) =>
    (k as JsonWebKey & { kid?: string }).kid === header.kid
  );
  if (
    header.alg !== "RS256" || !jwk ||
    claims.iss !== `https://securetoken.google.com/${project}` ||
    claims.aud !== project || !Number.isFinite(claims.exp) ||
    claims.exp <= now || !Number.isFinite(claims.iat) ||
    claims.iat > now + 60 || typeof claims.sub !== "string" || !claims.sub ||
    claims.sub.length > 128 || claims.firebase?.sign_in_provider === "anonymous"
  ) throw new Error("Unauthorized");
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    decodePart(parts[2]),
    new TextEncoder().encode(parts[0] + "." + parts[1]),
  );
  if (!valid) throw new Error("Unauthorized");
  return claims.sub as string;
}
export async function hashToken(token: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return Array.from(
    new Uint8Array(digest),
    (x) => x.toString(16).padStart(2, "0"),
  ).join("");
}
