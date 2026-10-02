import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { deleteSignature, listSignatures, type Sig } from "@/lib/formsApi";
import { useOfficerVerification } from "@/hooks/useOfficerVerification";
import { Tabs } from "@/components/Tabs";
import { Download, Spinner, Trash, Warning } from "@/lib/cyberIcon";
import {
  FORM_LABEL,
  PETITION_MAX_ROWS,
  ROSTER_MAX_OFFICERS,
  assignRosterBlocks,
  buildSignatureSheet,
  detectLayoutFromBytes,
  fillIccPdf,
  layoutForm,
  type FormKey,
  type Layout,
} from "@/lib/iccForms";

/** Blank ICC PDFs shipped with the site (public/forms/). */
const BUNDLED: Record<FormKey, { path: string; label: string }> = {
  petition: { path: "/forms/petition-blank.pdf", label: "Petition to Organize a New Club (ICC, 2019 fillable)" },
  roster: { path: "/forms/financial-roster-2026-blank.pdf", label: "Fillable Financial Roster 2026 (ICC)" },
};

function download(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function FormsCompile() {
  const { isVerifiedOfficer, isLoading: verifying } = useOfficerVerification();
  const [tab, setTab] = useState<FormKey>("roster");
  const [sigs, setSigs] = useState<Sig[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Source PDF: bundled blank by default, or an uploaded copy (e.g. with
  // Section A/B already typed in by an officer).
  const [upload, setUpload] = useState<{ name: string; bytes: ArrayBuffer; layout: Layout } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setSigs(await listSignatures());
    } catch (e) {
      setError(`Could not load signatures: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVerifiedOfficer) load();
  }, [isVerifiedOfficer]);

  useEffect(() => {
    setError(null);
    setNotice(null);
  }, [tab]);

  const current = useMemo(() => sigs.filter((s) => s.form === tab), [sigs, tab]);

  const plan = useMemo(() => {
    if (tab === "roster") {
      return assignRosterBlocks(current).map((a) => ({
        name: a.signer.signer_name,
        slot: a.block ? `block ${a.block}${a.coPresident ? " (co-president)" : ""}` : "no slot",
        fits: a.block !== null,
      }));
    }
    return current.map((s, i) => ({
      name: s.signer_name,
      slot: i < PETITION_MAX_ROWS ? `row ${i + 1}` : "overflow",
      fits: i < PETITION_MAX_ROWS,
    }));
  }, [current, tab]);

  const remove = async (id: string) => {
    if (!confirm("Delete this signature?")) return;
    try {
      await deleteSignature(id);
      setSigs((s) => s.filter((x) => x.id !== id));
    } catch (e) {
      setError(`Delete failed: ${String(e)}`);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/forms`);
    setBusy("copied");
    setTimeout(() => setBusy(null), 1200);
  };

  const sheet = async () => {
    setBusy("sheet");
    setError(null);
    try {
      download(await buildSignatureSheet(tab, current), `DACC-${tab}-signature-sheet.pdf`);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  };

  const onUpload = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setBusy("analyze");
    try {
      const bytes = await file.arrayBuffer();
      const layout = await detectLayoutFromBytes(bytes);
      if (layoutForm(layout) !== tab) {
        setUpload(null);
        setError(
          layout === "unknown"
            ? `${file.name} is not a recognised ICC fillable PDF. Use the bundled blank below.`
            : `${file.name} is the ${FORM_LABEL[layoutForm(layout)!]}; switch to that tab or upload the other form.`,
        );
        return;
      }
      setUpload({ name: file.name, bytes, layout });
    } catch (e) {
      setError(`Could not read PDF: ${String(e)}`);
    } finally {
      setBusy(null);
    }
  };

  const fill = async () => {
    setBusy("fill");
    setError(null);
    setNotice(null);
    try {
      let bytes: ArrayBuffer;
      let base: string;
      if (upload) {
        bytes = upload.bytes;
        base = upload.name.replace(/\.pdf$/i, "");
      } else {
        const res = await fetch(BUNDLED[tab].path);
        if (!res.ok) throw new Error(`bundled blank missing (${res.status})`);
        bytes = await res.arrayBuffer();
        base = tab === "petition" ? "DACC-petition" : "DACC-financial-roster-2026";
      }
      const result = await fillIccPdf(bytes, tab, current);
      download(result.bytes, `${base}-signed.pdf`);
      if (result.skipped.length) {
        setNotice(
          `Placed ${result.placed} of ${current.length}. Not placed: ` +
            result.skipped.map((s) => `${s.name} (${s.reason})`).join("; ") +
            ". Attach the signature sheet for them.",
        );
      } else {
        setNotice(`Placed all ${result.placed} signers.`);
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

  const overflow = plan.filter((p) => !p.fits);

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
        {notice && (
          <div className="mb-4 text-sm text-gray-700 dark:text-matrix font-terminal">[OK] {notice}</div>
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
              <div className="flex items-center gap-2 text-sm">
                <Spinner className="w-4 h-4 animate-spin" /> loading
              </div>
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
                      <th className="py-2 pr-3">CWID</th>
                      {tab === "roster" && <th className="py-2 pr-3">PHONE</th>}
                      <th className="py-2 pr-3">SIGNATURE</th>
                      <th className="py-2 pr-3">SLOT</th>
                      <th className="py-2 pr-3">WHEN</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {current.map((s, i) => {
                      const p = plan.find((x) => x.name === s.signer_name);
                      return (
                        <tr key={s.id} className="border-t border-gray-200 dark:border-matrix/20">
                          <td className="py-2 pr-3 text-gray-500">{i + 1}</td>
                          <td className="py-2 pr-3 font-semibold">{s.signer_name}</td>
                          <td className="py-2 pr-3">{s.position}</td>
                          <td className="py-2 pr-3 text-gray-500">{s.email}</td>
                          <td className="py-2 pr-3 text-gray-500">{s.student_id}</td>
                          {tab === "roster" && <td className="py-2 pr-3 text-gray-500">{s.phone}</td>}
                          <td className="py-2 pr-3">
                            <img src={s.signature_png} alt="" className="h-8 bg-white border border-gray-200" />
                          </td>
                          <td className={`py-2 pr-3 font-terminal text-xs ${p?.fits ? "text-gray-500" : "text-amber-600"}`}>
                            {p?.slot}
                          </td>
                          <td className="py-2 pr-3 text-gray-500 whitespace-nowrap">
                            {new Date(s.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-2">
                            <button
                              onClick={() => remove(s.id)}
                              className="text-gray-400 hover:text-red-500"
                              aria-label="delete"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Output */}
        <div className="terminal-window mb-12">
          <div className="terminal-header">
            <div className="terminal-dot red" />
            <div className="terminal-dot yellow" />
            <div className="terminal-dot green" />
            <span className="ml-4 text-xs text-gray-600 dark:text-gray-500 font-terminal">fill/{tab}</span>
          </div>
          <div className="terminal-body space-y-5">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {tab === "petition"
                ? `Fills page 2 of the petition: name, stamped signature, student ID and email in each of the ${PETITION_MAX_ROWS} member rows, plus the club name. Page 1 (description, advisor) is left for you to type in any PDF viewer, before or after.`
                : `Fills Section C (name, CWID, phone, email per officer block, ${ROSTER_MAX_OFFICERS} max) and the officer rows of Section D with stamped signatures. Section A/B and the advisor signature are left for you and Kotas.`}
            </p>

            <div className="text-sm">
              <span className="block text-xs font-bold tracking-wider mb-1">SOURCE PDF</span>
              <div className="font-terminal text-xs text-gray-600 dark:text-gray-400">
                {upload ? (
                  <>
                    {upload.name}{" "}
                    <button className="underline" onClick={() => setUpload(null)}>
                      use bundled blank instead
                    </button>
                  </>
                ) : (
                  <>
                    bundled: {BUNDLED[tab].label}{" "}
                    <a className="underline" href={BUNDLED[tab].path} target="_blank" rel="noreferrer">
                      view
                    </a>
                  </>
                )}
              </div>
              <label className="block mt-2 text-xs text-gray-500">
                or upload your own copy (e.g. with Section A/B already typed in):
                <input
                  type="file"
                  accept="application/pdf"
                  className="input-hack w-full text-sm mt-1"
                  onChange={(e) => onUpload(e.target.files?.[0])}
                />
              </label>
              {busy === "analyze" && (
                <div className="text-sm mt-1">
                  <Spinner className="inline w-4 h-4 animate-spin" /> reading fields
                </div>
              )}
            </div>

            {overflow.length > 0 && (
              <p className="text-xs text-amber-600">
                {overflow.length} signer{overflow.length > 1 ? "s" : ""} will not fit on the form (
                {overflow.map((o) => o.name).join(", ")}). They go on the signature sheet.
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button className="cli-btn-filled" onClick={fill} disabled={busy !== null || current.length === 0}>
                {busy === "fill" ? <Spinner className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                FILL AND DOWNLOAD
              </button>
              <button className="cli-btn-dashed" onClick={sheet} disabled={busy !== null || current.length === 0}>
                {busy === "sheet" ? <Spinner className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                SIGNATURE SHEET
              </button>
            </div>
            <p className="text-xs text-gray-500">
              The signature sheet is a clean attach-a-sheet PDF with everyone&apos;s name, title, CWID, phone, email and
              drawn signature. The petition explicitly allows attached sheets; for the roster, upload the filled PDF (plus
              the sheet if needed) to the ICC Financial Roster Microsoft Form.
            </p>
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
