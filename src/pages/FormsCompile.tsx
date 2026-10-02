import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  PDFDocument,
  PDFName,
  PDFTextField,
  StandardFonts,
  rgb,
  type PDFField,
  type PDFPage,
} from "pdf-lib";
import { supabase } from "@/lib/supabase";
import { useOfficerVerification } from "@/hooks/useOfficerVerification";
import { Tabs } from "@/components/Tabs";
import { Download, Spinner, Trash, Warning } from "@/lib/cyberIcon";
import type { Database } from "@/types/database.types";

type Sig = Database["public"]["Tables"]["form_signatures"]["Row"];
type FormKey = "petition" | "roster";
type ColRole = "name" | "signature" | "student_id" | "email" | "position" | "skip";

const CLUB_NAME = "De Anza ML and Agentic Cybersecurity Club";
const FORM_LABEL: Record<FormKey, string> = {
  petition: "Petition to Organize a New Club",
  roster: "ICC Club Financial Roster",
};

// ─── Detected PDF field geometry ─────────────────────────────
interface Slot {
  field: PDFField;
  name: string;
  type: "text" | "other";
  pageIndex: number;
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Row {
  pageIndex: number;
  y: number;
  slots: Slot[]; // sorted by x
}

function guessRole(name: string): ColRole {
  const n = name.toLowerCase();
  if (/sig/.test(n)) return "signature";
  if (/mail/.test(n)) return "email";
  if (/student|id\b|id#|id_|cwid/.test(n)) return "student_id";
  if (/title|position|office|role/.test(n)) return "position";
  if (/name|print/.test(n)) return "name";
  return "skip";
}

async function analyzePdf(bytes: ArrayBuffer): Promise<{ doc: PDFDocument; rows: Row[] }> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pages = doc.getPages();
  const form = doc.getForm();
  const slots: Slot[] = [];

  const pageIndexOf = (widgetRef: unknown, pRef: unknown): number => {
    let idx = pages.findIndex((p) => p.ref === pRef);
    if (idx >= 0) return idx;
    // Fallback: search Annots on each page for the widget ref
    idx = pages.findIndex((p) => {
      const annots = p.node.Annots();
      if (!annots) return false;
      for (let i = 0; i < annots.size(); i++) {
        if (annots.get(i) === widgetRef) return true;
      }
      return false;
    });
    return idx;
  };

  for (const field of form.getFields()) {
    const widgets = field.acroField.getWidgets();
    const isText = field instanceof PDFTextField;
    widgets.forEach((w) => {
      const r = w.getRectangle();
      const widgetRef = (field.acroField as any).dict.context.getObjectRef?.(w.dict) ?? null;
      const pageIndex = pageIndexOf(widgetRef, w.P());
      slots.push({
        field,
        name: field.getName(),
        type: isText ? "text" : "other",
        pageIndex: pageIndex < 0 ? 0 : pageIndex,
        x: r.x,
        y: r.y,
        w: r.width,
        h: r.height,
      });
    });
  }

  // Group into rows: same page, |Δy| < 6pt
  const sorted = [...slots].sort((a, b) =>
    a.pageIndex !== b.pageIndex ? a.pageIndex - b.pageIndex : b.y - a.y || a.x - b.x,
  );
  const rows: Row[] = [];
  for (const s of sorted) {
    const last = rows[rows.length - 1];
    if (last && last.pageIndex === s.pageIndex && Math.abs(last.y - s.y) < 6) {
      last.slots.push(s);
    } else {
      rows.push({ pageIndex: s.pageIndex, y: s.y, slots: [s] });
    }
  }
  rows.forEach((r) => r.slots.sort((a, b) => a.x - b.x));
  return { doc, rows };
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const b64 = dataUrl.split(",")[1] ?? "";
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function download(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function drawSignature(doc: PDFDocument, page: PDFPage, png: string, x: number, y: number, w: number, h: number) {
  const img = await doc.embedPng(dataUrlToBytes(png));
  const pad = 1.5;
  const boxW = Math.max(w - pad * 2, 4);
  const boxH = Math.max(h - pad * 2, 4);
  const scale = Math.min(boxW / img.width, boxH / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  page.drawImage(img, { x: x + pad + (boxW - dw) / 2, y: y + pad + (boxH - dh) / 2, width: dw, height: dh });
}

// ─── Signature sheet (attach-a-sheet fallback, always works) ──
async function buildSignatureSheet(form: FormKey, sigs: Sig[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const margin = 40;
  const rowH = 46;
  const cols = form === "petition"
    ? [{ k: "n", w: 22 }, { k: "name", w: 130 }, { k: "signature", w: 120 }, { k: "student_id", w: 80 }, { k: "email", w: 180 }]
    : [{ k: "n", w: 22 }, { k: "name", w: 130 }, { k: "position", w: 110 }, { k: "signature", w: 120 }, { k: "email", w: 150 }];
  const header: Record<string, string> = {
    n: "#", name: "Print Name", signature: "Signature", student_id: "Student ID #", email: "Email", position: "Title",
  };
  const perPage = 12;
  const date = new Date().toLocaleDateString("en-US");

  for (let p = 0; p * perPage < Math.max(sigs.length, 1); p++) {
    const page = doc.addPage([612, 792]);
    let y = 792 - margin;
    page.drawText(`${FORM_LABEL[form]} - Signature Sheet`, { x: margin, y, size: 14, font: bold });
    y -= 18;
    page.drawText(`Name of Club: ${CLUB_NAME}`, { x: margin, y, size: 10, font });
    page.drawText(`Generated ${date} via dacc.club/forms  (page ${p + 1})`, { x: 360, y, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
    y -= 10;
    page.drawText(
      form === "petition"
        ? "Attached sheet of De Anza students who are club members (see petition page 2). Signatures captured electronically."
        : "Attached sheet of club officer signatures (see Financial Roster Section C). Signatures captured electronically.",
      { x: margin, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) },
    );
    y -= 20;

    // header row
    let x = margin;
    for (const c of cols) {
      page.drawText(header[c.k], { x: x + 3, y: y - 12, size: 9, font: bold });
      x += c.w;
    }
    y -= 16;
    const slice = sigs.slice(p * perPage, (p + 1) * perPage);
    for (let i = 0; i < slice.length; i++) {
      const s = slice[i];
      x = margin;
      page.drawLine({ start: { x: margin, y }, end: { x: margin + cols.reduce((a, c) => a + c.w, 0), y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
      for (const c of cols) {
        const cell: Record<string, string> = {
          n: String(p * perPage + i + 1),
          name: s.signer_name,
          student_id: s.student_id ?? "",
          email: s.email ?? "",
          position: s.position,
        };
        if (c.k === "signature") {
          await drawSignature(doc, page, s.signature_png, x, y - rowH + 4, c.w, rowH - 8);
        } else {
          page.drawText(cell[c.k] ?? "", { x: x + 3, y: y - rowH / 2 - 3, size: 8.5, font, maxWidth: c.w - 6 });
        }
        x += c.w;
      }
      y -= rowH;
    }
    page.drawLine({ start: { x: margin, y }, end: { x: margin + cols.reduce((a, c) => a + c.w, 0), y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
  }
  return doc.save();
}

// ─── Page ────────────────────────────────────────────────────
function FormsCompile() {
  const { isVerifiedOfficer, isLoading: verifying } = useOfficerVerification();
  const [tab, setTab] = useState<FormKey>("roster");
  const [sigs, setSigs] = useState<Sig[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // PDF filling state
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [pdfName, setPdfName] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [startRow, setStartRow] = useState(0);
  const [roles, setRoles] = useState<ColRole[]>([]);

  const load = async () => {
    setLoading(true);
    const { data, error: e } = await supabase
      .from("form_signatures")
      .select("*")
      .order("created_at", { ascending: true });
    if (e) setError(e.message);
    setSigs((data as Sig[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (isVerifiedOfficer) load();
  }, [isVerifiedOfficer]);

  const current = useMemo(() => sigs.filter((s) => s.form === tab), [sigs, tab]);

  const remove = async (id: string) => {
    if (!confirm("Delete this signature?")) return;
    const { error: e } = await supabase.from("form_signatures").delete().eq("id", id);
    if (e) setError(e.message);
    else setSigs((s) => s.filter((x) => x.id !== id));
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/forms`);
    setBusy("copied");
    setTimeout(() => setBusy(null), 1200);
  };

  const sheet = async () => {
    setBusy("sheet");
    try {
      download(await buildSignatureSheet(tab, current), `DACC-${tab}-signature-sheet.pdf`);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  };

  const onPdf = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setBusy("analyze");
    try {
      const bytes = await file.arrayBuffer();
      const { rows: r } = await analyzePdf(bytes);
      setPdfBytes(bytes);
      setPdfName(file.name);
      setRows(r);
      // Default: first row with a signature-ish slot and 3+ columns
      const idx = r.findIndex((row) => row.slots.length >= 3 && row.slots.some((s) => /sig/i.test(s.name)));
      const start = idx >= 0 ? idx : 0;
      setStartRow(start);
      setRoles(r[start]?.slots.map((s) => guessRole(s.name)) ?? []);
    } catch (e) {
      setError(`Could not read PDF: ${String(e)}`);
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => {
    if (rows[startRow]) setRoles(rows[startRow].slots.map((s) => guessRole(s.name)));
  }, [startRow, rows]);

  const fill = async () => {
    if (!pdfBytes) return;
    setBusy("fill");
    setError(null);
    try {
      const { doc, rows: liveRows } = await analyzePdf(pdfBytes);
      const form = doc.getForm();
      const pages = doc.getPages();
      const toRemove: PDFField[] = [];
      let placed = 0;
      for (let i = 0; i < current.length; i++) {
        const row = liveRows[startRow + i];
        if (!row) break;
        const s = current[i];
        for (let c = 0; c < row.slots.length; c++) {
          const role = roles[c] ?? "skip";
          const slot = row.slots[c];
          if (role === "skip") continue;
          if (role === "signature") {
            await drawSignature(doc, pages[slot.pageIndex], s.signature_png, slot.x, slot.y, slot.w, slot.h);
            toRemove.push(slot.field);
          } else if (slot.type === "text") {
            const value =
              role === "name" ? s.signer_name
              : role === "email" ? s.email ?? ""
              : role === "student_id" ? s.student_id ?? ""
              : s.position;
            (slot.field as PDFTextField).setText(value);
          }
        }
        placed++;
      }
      // Remove the signature widgets so their (possibly opaque) appearance doesn't cover the image
      for (const f of toRemove) {
        try {
          form.removeField(f);
        } catch {
          /* already removed (shared field) */
        }
      }
      // Make sure viewers regenerate appearances for the text we set
      try {
        form.updateFieldAppearances();
      } catch {
        /* non-fatal */
      }
      doc.catalog.set(PDFName.of("NeedAppearances"), doc.context.obj(true));
      download(await doc.save(), pdfName.replace(/\.pdf$/i, "") + `-signed-${tab}.pdf`);
      if (placed < current.length) {
        setError(`Only ${placed} of ${current.length} signers fit in the detected rows. Download the signature sheet for the rest.`);
      }
    } catch (e) {
      setError(`Fill failed: ${String(e)}`);
    } finally {
      setBusy(null);
    }
  };

  if (verifying) return <Centered>verifying officer status...</Centered>;
  if (!isVerifiedOfficer)
    return (
      <Centered>
        [403] officers only.{" "}
        <Link to="/forms" className="underline">
          go to the signing page
        </Link>
      </Centered>
    );

  return (
    <div className="bg-white dark:bg-terminal-bg text-gray-900 dark:text-matrix min-h-screen">
      <div className="relative max-w-5xl mx-auto px-6">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-gray-900 dark:text-matrix neon-text-subtle text-lg">$</span>
            <span className="text-gray-600 dark:text-gray-400 font-terminal">./compile --form {tab}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold neon-text mb-2">COMPILE SIGNATURES</h1>
              <p className="text-gray-600 dark:text-gray-500 text-sm">
                {sigs.filter((s) => s.form === "roster").length} roster ·{" "}
                {sigs.filter((s) => s.form === "petition").length} petition ·{" "}
                <button onClick={copyLink} className="underline hover:text-matrix">
                  {busy === "copied" ? "copied" : "copy signing link"}
                </button>
              </p>
            </div>
            <Tabs
              tabs={[
                { id: "roster", label: "Roster" },
                { id: "petition", label: "Petition" },
              ]}
              activeTab={tab}
              onTabChange={(t) => setTab(t as FormKey)}
            />
          </div>
        </header>

        {error && (
          <div className="mb-4 flex items-start gap-2 text-sm text-red-600 dark:text-hack-red">
            <Warning className="w-4 h-4 mt-0.5" />
            <span>[ERR] {error}</span>
          </div>
        )}

        {/* Signers */}
        <div className="terminal-window mb-8">
          <div className="terminal-header">
            <div className="terminal-dot red" />
            <div className="terminal-dot yellow" />
            <div className="terminal-dot green" />
            <span className="ml-4 text-xs text-gray-600 dark:text-gray-500 font-terminal">signers/{tab}</span>
          </div>
          <div className="terminal-body">
            {loading ? (
              <div className="flex items-center gap-2 text-sm"><Spinner className="w-4 h-4 animate-spin" /> loading</div>
            ) : current.length === 0 ? (
              <p className="text-sm text-gray-500">no signatures yet. share dacc.club/forms.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-gray-500 text-left">
                    <tr>
                      <th className="py-2 pr-3">#</th>
                      <th className="py-2 pr-3">NAME</th>
                      <th className="py-2 pr-3">POSITION</th>
                      <th className="py-2 pr-3">EMAIL</th>
                      {tab === "petition" && <th className="py-2 pr-3">STUDENT ID</th>}
                      <th className="py-2 pr-3">SIGNATURE</th>
                      <th className="py-2 pr-3">WHEN</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {current.map((s, i) => (
                      <tr key={s.id} className="border-t border-gray-200 dark:border-matrix/20">
                        <td className="py-2 pr-3 text-gray-500">{i + 1}</td>
                        <td className="py-2 pr-3 font-semibold">{s.signer_name}</td>
                        <td className="py-2 pr-3">{s.position}</td>
                        <td className="py-2 pr-3 text-gray-500">{s.email}</td>
                        {tab === "petition" && <td className="py-2 pr-3 text-gray-500">{s.student_id}</td>}
                        <td className="py-2 pr-3">
                          <img src={s.signature_png} alt="" className="h-8 bg-white border border-gray-200" />
                        </td>
                        <td className="py-2 pr-3 text-gray-500 whitespace-nowrap">
                          {new Date(s.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-2">
                          <button onClick={() => remove(s.id)} className="text-gray-400 hover:text-red-500" aria-label="delete">
                            <Trash className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="cli-btn-filled" onClick={sheet} disabled={busy !== null || current.length === 0}>
                {busy === "sheet" ? <Spinner className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                DOWNLOAD SIGNATURE SHEET
              </button>
              <span className="text-xs text-gray-500 self-center max-w-md">
                Clean attach-a-sheet PDF with everyone's name, title, ID, email, and drawn signature. ICC accepts attached sheets on the petition.
              </span>
            </div>
          </div>
        </div>

        {/* Fill the actual fillable PDF */}
        <div className="terminal-window mb-12">
          <div className="terminal-header">
            <div className="terminal-dot red" />
            <div className="terminal-dot yellow" />
            <div className="terminal-dot green" />
            <span className="ml-4 text-xs text-gray-600 dark:text-gray-500 font-terminal">fill/{tab}</span>
          </div>
          <div className="terminal-body space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upload the blank fillable ICC PDF. It detects the signature rows, you confirm what each column is, and it writes names, titles, IDs, emails and stamps the signature images in place.
            </p>
            <input
              type="file"
              accept="application/pdf"
              className="input-hack w-full text-sm"
              onChange={(e) => onPdf(e.target.files?.[0])}
            />
            {busy === "analyze" && <div className="text-sm"><Spinner className="inline w-4 h-4 animate-spin" /> reading fields</div>}

            {rows.length > 0 && (
              <>
                <div className="text-xs text-gray-500">
                  {pdfName}: {rows.length} field rows detected across {Math.max(...rows.map((r) => r.pageIndex)) + 1} page(s).
                </div>
                <label className="block text-sm">
                  <span className="block text-xs font-bold tracking-wider mb-1">FIRST SIGNER ROW</span>
                  <select className="input-hack w-full" value={startRow} onChange={(e) => setStartRow(Number(e.target.value))}>
                    {rows.map((r, i) => (
                      <option key={i} value={i}>
                        row {i + 1} · page {r.pageIndex + 1} · {r.slots.length} fields · {r.slots.map((s) => s.name).join(" | ").slice(0, 90)}
                      </option>
                    ))}
                  </select>
                </label>
                {rows[startRow] && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {rows[startRow].slots.map((s, c) => (
                      <label key={c} className="text-xs">
                        <span className="block text-gray-500 truncate mb-1" title={s.name}>
                          col {c + 1}: {s.name} ({s.type})
                        </span>
                        <select
                          className="input-hack w-full text-sm"
                          value={roles[c] ?? "skip"}
                          onChange={(e) => setRoles(roles.map((r, i) => (i === c ? (e.target.value as ColRole) : r)))}
                        >
                          {(["name", "signature", "position", "student_id", "email", "skip"] as ColRole[]).map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Signers are written one per row starting at the selected row, in submission order ({current.length} signers, {rows.length - startRow} rows available).
                </p>
                <button className="cli-btn-filled" onClick={fill} disabled={busy !== null || current.length === 0}>
                  {busy === "fill" ? <Spinner className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  FILL AND DOWNLOAD
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center font-terminal text-sm text-gray-600 dark:text-matrix">
      <span>&gt; {children}</span>
    </div>
  );
}

export default FormsCompile;
