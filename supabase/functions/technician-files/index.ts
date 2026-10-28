import { createClient } from "npm:@supabase/supabase-js@2.103.2";
import {
  hashToken,
  MAX_BYTES,
  MIME_TYPES,
  validateUpload,
  verifyFirebaseToken,
} from "./security.ts";

const project = Deno.env.get("FIREBASE_PROJECT_ID") || "kbi2-f4f19";
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const client = createClient(
  supabaseUrl,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);
const bucket = client.storage.from("technician-files");
const cors = {
  "Access-Control-Allow-Origin": "https://kbi.services",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
};
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: cors });
let keys: JsonWebKey[] = [];
let keysExpire = 0;
async function authenticate(request: Request) {
  const token = /^Bearer ([^\s]+)$/i.exec(
    request.headers.get("authorization") || "",
  )?.[1];
  if (!token) throw new Error("Unauthorized");
  if (Date.now() > keysExpire) {
    const response = await fetch(
      "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
      { signal: AbortSignal.timeout(10000) },
    );
    if (!response.ok) throw new Error("Authentication service unavailable.");
    keys = (await response.json()).keys;
    keysExpire = Date.now() + 300000;
  }
  return verifyFirebaseToken(token, project, keys);
}
Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const marker = segments.indexOf("technician-files");
  const id = segments[marker + 1];
  try {
    if (request.method === "DELETE" && !id) {
      const uid = await authenticate(request);
      while (true) {
        const { data: files, error } = await client.from("technician_files")
          .select("id,object_path").eq("owner_uid", uid).limit(100);
        if (error) {
          return json({ error: "Unable to remove files. Please retry." }, 503);
        }
        if (!files?.length) break;
        const { error: storageError } = await bucket.remove(
          files.map((file) => file.object_path),
        );
        if (storageError) {
          return json({ error: "Unable to remove files. Please retry." }, 503);
        }
        const { error: metadataError } = await client.from("technician_files")
          .delete().eq("owner_uid", uid).in("id", files.map((file) => file.id));
        if (metadataError) {
          return json({ error: "Unable to remove files. Please retry." }, 503);
        }
      }
      return json({ success: true });
    }
    if (request.method === "POST" && !id) {
      const uid = await authenticate(request);
      if (Number(request.headers.get("content-length") || 0) > 4096) {
        return json({ error: "Request too large." }, 413);
      }
      const raw = await request.text();
      if (raw.length > 4096) return json({ error: "Request too large." }, 413);
      let input;
      try {
        input = validateUpload(JSON.parse(raw));
      } catch (error) {
        return json({ error: (error as Error).message }, 400);
      }
      const fileId = crypto.randomUUID();
      const secret = Array.from(
        crypto.getRandomValues(new Uint8Array(32)),
        (x) => x.toString(16).padStart(2, "0"),
      ).join("");
      const path = `technicians/${
        encodeURIComponent(uid)
      }/${input.category}/${fileId}_${input.fileName}`;
      const { error: reserveError } = await client.rpc(
        "reserve_technician_file",
        {
          p_id: fileId,
          p_uid: uid,
          p_path: path,
          p_name: input.fileName,
          p_type: input.contentType,
          p_hash: await hashToken(secret),
        },
      );
      if (reserveError) {
        return json({
          error:
            "Upload storage limit reached or storage is unavailable. Contact KBI support.",
        }, 409);
      }
      const { data, error } = await bucket.createSignedUploadUrl(path, {
        upsert: false,
      });
      if (error || !data) {
        await client.from("technician_files").delete().eq("id", fileId);
        return json({ error: "Unable to prepare upload. Try again." }, 503);
      }
      return json({
        id: fileId,
        uploadUrl: data.signedUrl,
        contentType: input.contentType,
        fileUrl:
          `${supabaseUrl}/functions/v1/technician-files/${fileId}?token=${secret}`,
      });
    }
    if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
      return json({ error: "Not found." }, 404);
    }
    if (request.method === "POST" && segments[marker + 2] === "complete") {
      const uid = await authenticate(request);
      const { data: file } = await client.from("technician_files").select("*")
        .eq("id", id).eq("owner_uid", uid).maybeSingle();
      if (!file) return json({ error: "Not found." }, 404);
      const { data: info, error } = await bucket.info(file.object_path);
      if (error || !info) {
        return json({ error: "Upload has not completed. Please retry." }, 409);
      }
      const actualSize = Number(info.size);
      if (
        !Number.isSafeInteger(actualSize) || actualSize < 1 ||
        actualSize > MAX_BYTES ||
        !MIME_TYPES.includes(info.contentType || "") ||
        info.contentType !== file.content_type
      ) {
        return json({
          error: "Uploaded file does not meet the file requirements.",
        }, 400);
      }
      const { error: updateError } = await client.from("technician_files")
        .update({ completed: true, reserved_bytes: actualSize }).eq("id", id)
        .eq("owner_uid", uid);
      if (updateError) {
        return json({ error: "Unable to confirm upload. Try again." }, 503);
      }
      return json({ success: true });
    }
    if (request.method === "GET" && segments.length === marker + 2) {
      const token = url.searchParams.get("token") || "";
      if (!/^[0-9a-f]{64}$/.test(token)) {
        return json({ error: "Not found." }, 404);
      }
      const { data: file } = await client.from("technician_files").select(
        "object_path,completed",
      ).eq("id", id).eq("download_token_hash", await hashToken(token))
        .maybeSingle();
      if (!file?.completed) return json({ error: "Not found." }, 404);
      const { data, error } = await bucket.createSignedUrl(
        file.object_path,
        60,
      );
      if (error || !data) return json({ error: "File is unavailable." }, 404);
      return new Response(null, {
        status: 302,
        headers: { ...cors, Location: data.signedUrl },
      });
    }
    return json({ error: "Method not allowed." }, 405);
  } catch (error) {
    const unauthorized = String((error as Error).message) === "Unauthorized";
    return json({
      error: unauthorized
        ? "You must be signed in to upload files."
        : "File service unavailable. Please try again.",
    }, unauthorized ? 401 : 503);
  }
});
