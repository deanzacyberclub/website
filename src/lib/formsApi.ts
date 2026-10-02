/**
 * Client for the /forms signature store (netlify/functions/forms.mjs, backed
 * by Netlify Blobs). Public submit; officer-only list/delete authenticated
 * with the caller's existing Supabase session token.
 */
import { supabase } from "@/lib/supabase";

export type FormKey = "petition" | "roster";

export interface Sig {
  id: string;
  form: FormKey;
  signer_name: string;
  position: string;
  email: string | null;
  student_id: string | null;
  phone: string | null;
  signature_png: string;
  created_at: string;
}

export type NewSig = Omit<Sig, "id" | "created_at">;

const ENDPOINT = "/.netlify/functions/forms";

async function officerHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("not signed in");
  return { authorization: `Bearer ${token}` };
}

async function parse<T>(r: Response): Promise<T> {
  const body = (await r.json().catch(() => ({}))) as { error?: string } & T;
  if (!r.ok) throw new Error(body.error ?? `HTTP ${r.status}`);
  return body;
}

export async function submitSignatures(rows: NewSig[]): Promise<string[]> {
  const r = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(rows),
  });
  return (await parse<{ ids: string[] }>(r)).ids;
}

export async function listSignatures(): Promise<Sig[]> {
  const r = await fetch(ENDPOINT, { headers: await officerHeaders() });
  return (await parse<{ rows: Sig[] }>(r)).rows;
}

export async function deleteSignature(id: string): Promise<void> {
  const r = await fetch(`${ENDPOINT}?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: await officerHeaders(),
  });
  await parse(r);
}
