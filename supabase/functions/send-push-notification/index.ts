/**
 * send-push-notification
 *
 * Accepts a payload of { userIds, title, body, data? }, looks up each
 * user's APNs device tokens, and sends a push notification via Apple's
 * HTTP/2 APNs API with ES256 JWT authentication.
 *
 * Required environment variables (set in Supabase dashboard):
 *   APNS_KEY_ID      — 10-char Key ID from Apple Developer
 *   APNS_TEAM_ID     — Apple Developer Team ID
 *   APNS_PRIVATE_KEY — Full .p8 file content (including header/footer)
 *   APNS_BUNDLE_ID   — App bundle ID, e.g. com.aaronma.DACC
 *   APNS_SANDBOX     — "true" for development, "false" for production
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APNS_KEY_ID = Deno.env.get("APNS_KEY_ID") ?? "";
const APNS_TEAM_ID = Deno.env.get("APNS_TEAM_ID") ?? "";
const APNS_PRIVATE_KEY = Deno.env.get("APNS_PRIVATE_KEY") ?? "";
const APNS_BUNDLE_ID = Deno.env.get("APNS_BUNDLE_ID") ?? "";
const APNS_SANDBOX = Deno.env.get("APNS_SANDBOX") === "true";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ─── APNs JWT ─────────────────────────────────────────────────────────────────

/** Decodes a PEM private key into an ArrayBuffer. */
function pemToBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

/** URL-safe base-64 without padding. */
function b64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/** Builds a signed APNs JWT valid for ~1 hour. */
async function makeAPNsJWT(): Promise<string> {
  const enc = new TextEncoder();
  const header = b64url(enc.encode(JSON.stringify({ alg: "ES256", kid: APNS_KEY_ID })).buffer);
  const payload = b64url(
    enc.encode(JSON.stringify({ iss: APNS_TEAM_ID, iat: Math.floor(Date.now() / 1000) })).buffer
  );
  const signingInput = `${header}.${payload}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToBuffer(APNS_PRIVATE_KEY),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    enc.encode(signingInput)
  );

  return `${signingInput}.${b64url(sig)}`;
}

// ─── APNs delivery ────────────────────────────────────────────────────────────

interface DeliveryResult {
  token: string;
  ok: boolean;
  apnsId?: string;
  error?: string;
}

async function sendToAPNs(
  deviceToken: string,
  title: string,
  body: string,
  data: Record<string, string>,
  jwt: string
): Promise<DeliveryResult> {
  const host = APNS_SANDBOX
    ? "https://api.sandbox.push.apple.com"
    : "https://api.push.apple.com";

  const apnsPayload = {
    aps: { alert: { title, body }, sound: "default" },
    ...data,
  };

  try {
    const res = await fetch(`${host}/3/device/${deviceToken}`, {
      method: "POST",
      headers: {
        authorization: `bearer ${jwt}`,
        "apns-topic": APNS_BUNDLE_ID,
        "apns-push-type": "alert",
        "apns-priority": "10",
        "content-type": "application/json",
      },
      body: JSON.stringify(apnsPayload),
    });

    if (res.status === 200) {
      return { token: deviceToken, ok: true, apnsId: res.headers.get("apns-id") ?? undefined };
    }

    const body_ = await res.json().catch(() => ({})) as { reason?: string };
    return { token: deviceToken, ok: false, error: body_.reason ?? `HTTP ${res.status}` };
  } catch (e) {
    return { token: deviceToken, ok: false, error: String(e) };
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

interface RequestBody {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { userIds, title, body, data = {} } = (await req.json()) as RequestBody;

    if (!Array.isArray(userIds) || userIds.length === 0 || !title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userIds, title, body" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    if (!APNS_KEY_ID || !APNS_TEAM_ID || !APNS_PRIVATE_KEY || !APNS_BUNDLE_ID) {
      return new Response(
        JSON.stringify({ error: "APNs environment variables not configured" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Fetch device tokens for the requested users
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: rows, error: dbError } = await supabase
      .from("device_tokens")
      .select("token")
      .in("user_id", userIds);

    if (dbError) throw dbError;

    if (!rows || rows.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No device tokens found for these users" }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Write one inbox record per user regardless of APNs outcome.
    // meeting_id may be absent; coerce empty string → null for the UUID column.
    const rawMeetingId = (data as Record<string, string>).meetingId;
    const meetingId = rawMeetingId && rawMeetingId.length > 0 ? rawMeetingId : null;
    const notifType = (data as Record<string, string>).type ?? "new_meeting";

    await supabase.from("notifications").insert(
      userIds.map((uid) => ({
        user_id: uid,
        title,
        body,
        type: notifType,
        meeting_id: meetingId,
      }))
    );

    const jwt = await makeAPNsJWT();
    const results = await Promise.all(
      rows.map(({ token }) => sendToAPNs(token, title, body, data, jwt))
    );

    // Remove stale tokens reported by APNs
    const staleTokens = results
      .filter((r) => !r.ok && (r.error === "BadDeviceToken" || r.error === "Unregistered"))
      .map((r) => r.token);

    if (staleTokens.length > 0) {
      await supabase.from("device_tokens").delete().in("token", staleTokens);
    }

    const sent = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;

    return new Response(
      JSON.stringify({ sent, failed, total: rows.length }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-push-notification error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
