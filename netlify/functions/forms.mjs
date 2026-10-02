// Signature store for /forms, backed by Netlify Blobs (no database needed).
//
//   POST   /.netlify/functions/forms          public: body = row | row[] (max 2)
//   GET    /.netlify/functions/forms          officers: { rows }
//   DELETE /.netlify/functions/forms?id=...   officers
//
// "Officer" = the caller's Supabase session token passes the existing
// verify_officer_status() RPC on the club's Supabase project. Only the
// public (anon/publishable) key is used here; it is the same key shipped
// in the site bundle.
import { getStore } from "@netlify/blobs";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://yhwpaclstjhylrphdrae.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "sb_publishable_wwOzIVj_xl85dID28RB_tw_foL783G5";

const FORMS = new Set(["petition", "roster"]);
const MAX_PNG = 400_000;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const opt = (v, max) => (str(v, max) ? str(v, max) : null);

function validate(r) {
  if (!r || typeof r !== "object") return "row must be an object";
  if (!FORMS.has(r.form)) return "form must be petition or roster";
  if (str(r.signer_name, 120).length < 2) return "signer_name too short";
  if (str(r.position, 60).length < 1) return "position required";
  if (typeof r.signature_png !== "string" || !r.signature_png.startsWith("data:image/png;base64,"))
    return "signature_png must be a PNG data URL";
  if (r.signature_png.length > MAX_PNG) return "signature too large";
  return null;
}

async function isOfficer(req) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return false;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/verify_officer_status`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, authorization: auth, "content-type": "application/json" },
      body: "{}",
    });
    if (!r.ok) return false;
    return (await r.json()) === true;
  } catch {
    return false;
  }
}

export default async (req) => {
  const store = getStore({ name: "form-signatures", consistency: "strong" });
  const url = new URL(req.url);

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "bad json" }, 400);
    }
    const rows = Array.isArray(body) ? body : [body];
    if (rows.length < 1 || rows.length > 2) return json({ error: "send 1 or 2 rows" }, 400);
    for (const r of rows) {
      const err = validate(r);
      if (err) return json({ error: err }, 400);
    }
    const ids = [];
    for (const r of rows) {
      const id = crypto.randomUUID();
      const created_at = new Date().toISOString();
      const row = {
        id,
        form: r.form,
        signer_name: str(r.signer_name, 120),
        position: str(r.position, 60),
        email: opt(r.email, 254),
        student_id: opt(r.student_id, 20),
        phone: opt(r.phone, 30),
        signature_png: r.signature_png,
        created_at,
      };
      await store.setJSON(`${row.form}/${created_at}_${id}`, row);
      ids.push(id);
    }
    return json({ ok: true, ids }, 201);
  }

  if (!(await isOfficer(req))) return json({ error: "officers only" }, 403);

  if (req.method === "GET") {
    const { blobs } = await store.list();
    const rows = (await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })))).filter(Boolean);
    rows.sort((a, b) => a.created_at.localeCompare(b.created_at));
    return json({ rows });
  }

  if (req.method === "DELETE") {
    const id = url.searchParams.get("id") || "";
    if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: "bad id" }, 400);
    const { blobs } = await store.list();
    const hit = blobs.find((b) => b.key.endsWith(`_${id}`));
    if (!hit) return json({ error: "not found" }, 404);
    await store.delete(hit.key);
    return json({ ok: true });
  }

  return json({ error: "method not allowed" }, 405);
};
