/**
 * ICC paperwork filling with pdf-lib. Pure functions, no React, so this can
 * be unit-tested in node against the real PDFs.
 *
 * Two layouts are known:
 *  - "petition":   Petition-to-Organize-a-New-Club-Fillable.pdf (4/11/2019)
 *                  page 2 has 15 member rows, each ONE text field "Member Info[_N]"
 *                  spanning the whole row. We stamp the signature into the
 *                  signature column of that rect and draw name / ID / email as text.
 *  - "roster2026": Fillable Financial Roster 2026.pdf
 *                  page 2 has 7 officer blocks (Name/CWID/Phone Number/Email Address[_N]),
 *                  page 3 has a 7-row officer signature block ("Name Print N" +
 *                  "Signature ink only N"). Advisor rows on page 3 are left alone.
 */
import {
  PDFCheckBox,
  PDFDocument,
  PDFName,
  PDFTextField,
  StandardFonts,
  rgb,
  type PDFField,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

export type FormKey = "petition" | "roster";
export type Layout = "petition" | "roster2026" | "unknown";

export interface Signer {
  signer_name: string;
  position: string;
  email: string | null;
  student_id: string | null;
  phone: string | null;
  signature_png: string;
}

export const CLUB_NAME = "De Anza ML and Agentic Cybersecurity Club";
export const CLUB_WEBSITE = "https://dacc.club";

export const FORM_LABEL: Record<FormKey, string> = {
  petition: "Petition to Organize a New Club",
  roster: "ICC Club Financial Roster",
};

/** Officer positions that map to a numbered block on the roster. */
const ROSTER_BLOCK: Record<string, number> = {
  President: 1,
  "Vice President": 2,
  Treasurer: 3,
  Secretary: 4,
  "ICC Representative": 5,
};
const ROSTER_ADDITIONAL = [6, 7];
const ROSTER_ORDER = [
  "President",
  "Vice President",
  "Treasurer",
  "Secretary",
  "ICC Representative",
];

export const PETITION_MAX_ROWS = 15;
export const ROSTER_MAX_OFFICERS = 7;

// ─── helpers ────────────────────────────────────────────────

export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const b64 = dataUrl.split(",")[1] ?? "";
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function drawSignature(
  doc: PDFDocument,
  page: PDFPage,
  png: string,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const img = await doc.embedPng(dataUrlToBytes(png));
  const pad = 1;
  const boxW = Math.max(w - pad * 2, 4);
  const boxH = Math.max(h - pad * 2, 4);
  const scale = Math.min(boxW / img.width, boxH / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  page.drawImage(img, {
    x: x + pad + (boxW - dw) / 2,
    y: y + pad + (boxH - dh) / 2,
    width: dw,
    height: dh,
  });
}

/** Draw text shrinking the font until it fits maxWidth (never below minSize). */
function drawFit(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size = 9,
  minSize = 5.5,
) {
  if (!text) return;
  let s = size;
  while (s > minSize && font.widthOfTextAtSize(text, s) > maxWidth) s -= 0.5;
  page.drawText(text, { x, y, size: s, font, color: rgb(0, 0, 0) });
}

function widgetPlacement(doc: PDFDocument, field: PDFField) {
  const pages = doc.getPages();
  const w = field.acroField.getWidgets()[0];
  const r = w.getRectangle();
  let pageIndex = pages.findIndex((p) => p.ref === w.P());
  if (pageIndex < 0) {
    pageIndex = pages.findIndex((p) => {
      const annots = p.node.Annots();
      if (!annots) return false;
      for (let i = 0; i < annots.size(); i++) {
        if (annots.get(i) === doc.context.getObjectRef(w.dict)) return true;
      }
      return false;
    });
  }
  return { page: pages[Math.max(pageIndex, 0)], ...r };
}

/**
 * Remove a field and its widgets without touching appearance streams.
 * pdf-lib's form.removeField() throws "Unexpected N type" on widgets that
 * have no /AP (both ICC forms), so we unlink by hand: drop each widget from
 * its page's /Annots and drop the field from the AcroForm tree. Anything we
 * cannot unlink is hidden (annotation flag bit 2) so it never renders or prints.
 */
function detachField(doc: PDFDocument, field: PDFField) {
  const pages = doc.getPages();
  for (const w of field.acroField.getWidgets()) {
    const ref = doc.context.getObjectRef(w.dict);
    let removed = false;
    if (ref) {
      for (const page of pages) {
        const annots = page.node.Annots();
        if (!annots) continue;
        for (let i = annots.size() - 1; i >= 0; i--) {
          if (annots.get(i) === ref) {
            annots.remove(i);
            removed = true;
          }
        }
      }
    }
    if (!removed) {
      w.dict.set(PDFName.of("F"), doc.context.obj(2)); // Hidden
    }
  }
  try {
    doc.getForm().acroForm.removeField(field.acroField);
  } catch {
    /* already detached */
  }
}

function tryText(doc: PDFDocument, name: string, value: string, onlyIfEmpty = false) {
  try {
    const f = doc.getForm().getField(name);
    if (!(f instanceof PDFTextField)) return false;
    if (onlyIfEmpty && (f.getText() ?? "").trim()) return false;
    f.setText(value);
    return true;
  } catch {
    return false;
  }
}

function tryCheck(doc: PDFDocument, name: string) {
  try {
    const f = doc.getForm().getField(name);
    if (f instanceof PDFCheckBox) f.check();
  } catch {
    /* field missing */
  }
}

/** Replace a field's widget with a stamped signature image. */
async function stampIntoField(doc: PDFDocument, name: string, png: string) {
  const form = doc.getForm();
  const field = form.getField(name);
  const { page, x, y, width, height } = widgetPlacement(doc, field);
  detachField(doc, field);
  await drawSignature(doc, page, png, x, y, width, height);
}

// ─── layout detection ───────────────────────────────────────

export function detectLayout(fieldNames: string[]): Layout {
  const set = new Set(fieldNames);
  if (set.has("Member Info") && set.has("Member Info_15")) return "petition";
  if (set.has("CWID") && set.has("Name Print 1_2") && set.has("Signature ink only 7")) return "roster2026";
  return "unknown";
}

export async function detectLayoutFromBytes(bytes: ArrayBuffer | Uint8Array): Promise<Layout> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return detectLayout(doc.getForm().getFields().map((f) => f.getName()));
}

/** Which form a layout belongs to, so we can refuse a petition PDF on the roster tab. */
export function layoutForm(layout: Layout): FormKey | null {
  if (layout === "petition") return "petition";
  if (layout === "roster2026") return "roster";
  return null;
}

// ─── roster slot assignment ─────────────────────────────────

export interface RosterAssignment {
  signer: Signer;
  block: number | null; // 1..7, null = did not fit
  coPresident: boolean;
  reason?: string;
}

export function assignRosterBlocks(signers: Signer[]): RosterAssignment[] {
  const sorted = [...signers].sort((a, b) => {
    const ia = ROSTER_ORDER.indexOf(a.position);
    const ib = ROSTER_ORDER.indexOf(b.position);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  const taken = new Set<number>();
  const extra = [...ROSTER_ADDITIONAL];
  return sorted.map((signer) => {
    let block: number | null = ROSTER_BLOCK[signer.position] ?? null;
    let coPresident = false;
    if (block === 1 && taken.has(1) && !taken.has(2)) {
      block = 2; // second President = Co-President in block 2
      coPresident = true;
    }
    if (block === null || taken.has(block)) {
      block = extra.shift() ?? null;
    }
    if (block === null) {
      return { signer, block, coPresident, reason: "no free officer block (max 7)" };
    }
    taken.add(block);
    return { signer, block, coPresident };
  });
}

// ─── fillers ────────────────────────────────────────────────

export interface FillResult {
  bytes: Uint8Array;
  placed: number;
  skipped: { name: string; reason: string }[];
  layout: Layout;
}

async function fillPetition(doc: PDFDocument, signers: Signer[]): Promise<Omit<FillResult, "layout" | "bytes">> {
  const form = doc.getForm();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const skipped: { name: string; reason: string }[] = [];

  // Column x positions come from the printed headers on page 2:
  // "Please Print Name" 72, "Signature" 216, "Student ID #" 322, "Email Address" 431
  const COL = { name: 70, sig: 212, sigW: 106, id: 324, email: 430, right: 541 };

  tryText(doc, "Name of the proposed club as listed in Club Constitution", CLUB_NAME, true);
  tryText(doc, "Club Website", CLUB_WEBSITE, true);
  // Page 2 "Name of Club:" line has no field; draw it.
  if (pages[1]) {
    drawFit(pages[1], font, CLUB_NAME, 166, 542, 390, 11, 8);
  }

  let placed = 0;
  for (let i = 0; i < signers.length; i++) {
    const s = signers[i];
    if (i >= PETITION_MAX_ROWS) {
      skipped.push({ name: s.signer_name, reason: "petition has 15 rows; attach the signature sheet" });
      continue;
    }
    const fieldName = i === 0 ? "Member Info" : `Member Info_${i + 1}`;
    let field: PDFField;
    try {
      field = form.getField(fieldName);
    } catch {
      skipped.push({ name: s.signer_name, reason: `field ${fieldName} missing` });
      continue;
    }
    const { page, y, height } = widgetPlacement(doc, field);
    detachField(doc, field);
    const baseline = y + height * 0.3;
    drawFit(page, font, s.signer_name, COL.name, baseline, COL.sig - COL.name - 6);
    await drawSignature(doc, page, s.signature_png, COL.sig, y - 1, COL.sigW, height + 2);
    drawFit(page, font, s.student_id ?? "", COL.id, baseline, COL.email - COL.id - 6);
    drawFit(page, font, s.email ?? "", COL.email, baseline, COL.right - COL.email, 8);
    placed++;
  }
  return { placed, skipped };
}

async function fillRoster(doc: PDFDocument, signers: Signer[]): Promise<Omit<FillResult, "layout" | "bytes">> {
  const skipped: { name: string; reason: string }[] = [];
  tryText(doc, "Club Name", CLUB_NAME, true);
  tryText(doc, "Club Website if applicable", CLUB_WEBSITE, true);

  let placed = 0;
  for (const a of assignRosterBlocks(signers)) {
    const s = a.signer;
    if (a.block === null) {
      skipped.push({ name: s.signer_name, reason: a.reason ?? "no slot" });
      continue;
    }
    const n = a.block;
    const sfx = n === 1 ? "" : `_${n}`;
    tryText(doc, `Name${sfx}`, s.signer_name);
    tryText(doc, `CWID${sfx}`, s.student_id ?? "");
    tryText(doc, `Phone Number${sfx}`, s.phone ?? "");
    tryText(doc, `Email Address${sfx}`, s.email ?? "");
    if (n === 2) tryCheck(doc, a.coPresident ? "CoPresident" : "Vice President");
    if (n >= 6) tryText(doc, `${n} Additional Officer position please specify`, s.position);

    // Page 3 officer signature block
    const printName = n <= 3 ? `Name Print ${n}_2` : `Name Print ${n}`;
    const sigName = n <= 3 ? `Signature ink only ${n}_2` : `Signature ink only ${n}`;
    tryText(doc, printName, s.signer_name);
    try {
      await stampIntoField(doc, sigName, s.signature_png);
    } catch (e) {
      skipped.push({ name: s.signer_name, reason: `signature slot ${sigName}: ${String(e)}` });
      continue;
    }
    placed++;
  }
  return { placed, skipped };
}

/**
 * Fill an ICC PDF with the collected signers. `form` is which tab the officer
 * is on; the PDF's own layout is detected and must agree.
 */
export async function fillIccPdf(
  bytes: ArrayBuffer | Uint8Array,
  form: FormKey,
  signers: Signer[],
): Promise<FillResult> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const layout = detectLayout(doc.getForm().getFields().map((f) => f.getName()));
  const expected = layoutForm(layout);
  if (!expected) {
    throw new Error(
      "Unrecognised PDF. Use the bundled blank or the official ICC fillable PDF (petition 2019 / financial roster 2026).",
    );
  }
  if (expected !== form) {
    throw new Error(`That PDF is the ${FORM_LABEL[expected]}, but you are on the ${FORM_LABEL[form]} tab.`);
  }

  const result = layout === "petition" ? await fillPetition(doc, signers) : await fillRoster(doc, signers);

  // Regenerate appearances for the text we set so every viewer shows it.
  try {
    doc.getForm().updateFieldAppearances();
  } catch {
    /* non-fatal: NeedAppearances below asks the viewer to do it */
  }
  doc.catalog.set(PDFName.of("NeedAppearances"), doc.context.obj(true));
  const out = await doc.save();
  return { bytes: out, layout, ...result };
}

// ─── Signature sheet (attach-a-sheet fallback, always works) ─

export async function buildSignatureSheet(form: FormKey, sigs: Signer[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const margin = 40;
  const rowH = 46;
  const cols =
    form === "petition"
      ? [
          { k: "n", w: 22 },
          { k: "name", w: 130 },
          { k: "signature", w: 120 },
          { k: "student_id", w: 80 },
          { k: "email", w: 180 },
        ]
      : [
          { k: "n", w: 22 },
          { k: "name", w: 100 },
          { k: "position", w: 85 },
          { k: "signature", w: 100 },
          { k: "student_id", w: 55 },
          { k: "phone", w: 65 },
          { k: "email", w: 105 },
        ];
  const header: Record<string, string> = {
    n: "#",
    name: "Print Name",
    signature: "Signature",
    student_id: form === "petition" ? "Student ID #" : "CWID",
    email: "Email",
    position: "Title",
    phone: "Phone",
  };
  const perPage = 12;
  const date = new Date().toLocaleDateString("en-US");
  const tableW = cols.reduce((a, c) => a + c.w, 0);

  for (let p = 0; p * perPage < Math.max(sigs.length, 1); p++) {
    const page = doc.addPage([612, 792]);
    let y = 792 - margin;
    page.drawText(`${FORM_LABEL[form]} - Signature Sheet`, { x: margin, y, size: 14, font: bold });
    y -= 18;
    page.drawText(`Name of Club: ${CLUB_NAME}`, { x: margin, y, size: 10, font });
    page.drawText(`Generated ${date} via dacc.club/forms  (page ${p + 1})`, {
      x: 360,
      y,
      size: 8,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= 10;
    page.drawText(
      form === "petition"
        ? "Attached sheet of De Anza students who are club members (see petition page 2). Signatures captured electronically."
        : "Attached sheet of club officer signatures (see Financial Roster Section C/D). Signatures captured electronically.",
      { x: margin, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) },
    );
    y -= 20;

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
      page.drawLine({
        start: { x: margin, y },
        end: { x: margin + tableW, y },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });
      const cell: Record<string, string> = {
        n: String(p * perPage + i + 1),
        name: s.signer_name,
        student_id: s.student_id ?? "",
        email: s.email ?? "",
        position: s.position,
        phone: s.phone ?? "",
      };
      for (const c of cols) {
        if (c.k === "signature") {
          await drawSignature(doc, page, s.signature_png, x, y - rowH + 4, c.w, rowH - 8);
        } else {
          drawFit(page, font, cell[c.k] ?? "", x + 3, y - rowH / 2 - 3, c.w - 6, 8.5, 5.5);
        }
        x += c.w;
      }
      y -= rowH;
    }
    page.drawLine({
      start: { x: margin, y },
      end: { x: margin + tableW, y },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
  }
  return doc.save();
}
