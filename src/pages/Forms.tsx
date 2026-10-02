import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import SignaturePad, { type SignaturePadHandle } from "@/components/SignaturePad";
import { ROLE_ORDER } from "@/constants";
import { CheckCircle, Spinner, Warning } from "@/lib/cyberIcon";

type FormKey = "petition" | "roster";

const FORM_META: Record<FormKey, { label: string; blurb: string }> = {
  petition: {
    label: "Petition to Organize a New Club",
    blurb: "Club members page (ICC needs 10+ De Anza students). Needs name, signature, student ID, email.",
  },
  roster: {
    label: "ICC Club Financial Roster",
    blurb: "Officers only. Needs name, title, CWID, phone, email, signature.",
  },
};

const POSITIONS = [...ROLE_ORDER, "Member"];

function Forms() {
  const padRef = useRef<SignaturePadHandle>(null);
  const [forms, setForms] = useState<Record<FormKey, boolean>>({ petition: true, roster: true });
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [phone, setPhone] = useState("");
  const [padEmpty, setPadEmpty] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<FormKey[] | null>(null);

  const selected = (Object.keys(forms) as FormKey[]).filter((k) => forms[k]);
  const isOfficer = position !== "" && position !== "Member";
  const needsStudentId = forms.petition || forms.roster;
  const needsPhone = forms.roster;

  const canSubmit =
    name.trim().length >= 2 &&
    position !== "" &&
    selected.length > 0 &&
    !padEmpty &&
    !submitting &&
    (!needsStudentId || studentId.trim().length > 0) &&
    (!needsPhone || phone.trim().length > 0) &&
    email.trim().length > 0;

  const handleSubmit = async () => {
    setError(null);
    const png = padRef.current?.toDataURL();
    if (!png) {
      setError("Draw your signature first.");
      return;
    }
    if (forms.roster && !isOfficer) {
      setError("Only officers sign the Financial Roster. Uncheck it or pick your officer title.");
      return;
    }
    setSubmitting(true);
    try {
      const rows = selected.map((form) => ({
        form,
        signer_name: name.trim(),
        position,
        email: email.trim() || null,
        student_id: studentId.trim() || null,
        phone: phone.trim() || null,
        signature_png: png,
      }));
      const { error: dbError } = await supabase.from("form_signatures").insert(rows);
      if (dbError) throw dbError;
      setDone(selected);
    } catch (e) {
      console.error(e);
      setError("Submit failed. Try again or message an officer.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Shell cmd="./sign --status">
        <div className="terminal-body space-y-4">
          <div className="flex items-center gap-3 text-green-700 dark:text-matrix">
            <CheckCircle className="w-6 h-6" />
            <span className="font-terminal text-lg">[200] SIGNATURE RECORDED</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Thanks, {name.trim()}. Signed:{" "}
            {done.map((d) => FORM_META[d].label).join(" and ")}. Nothing else to do.
          </p>
          <button
            type="button"
            className="cli-btn-dashed"
            onClick={() => {
              setDone(null);
              setName("");
              setPosition("");
              setEmail("");
              setStudentId("");
              setPhone("");
              padRef.current?.clear();
              setPadEmpty(true);
            }}
          >
            SIGN FOR SOMEONE ELSE
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell cmd="./sign --form icc-reactivation">
      <div className="terminal-body space-y-6">
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
          DACC is reactivating with ICC for Fall 2026. Fill this out once; your
          signature gets placed on the forms below and sent to ICC. Takes 30 seconds.
        </p>

        {/* Form selection */}
        <fieldset className="space-y-2">
          <legend className="text-xs font-bold tracking-wider text-gray-900 dark:text-matrix mb-2">
            FORMS TO SIGN
          </legend>
          {(Object.keys(FORM_META) as FormKey[]).map((k) => (
            <label
              key={k}
              className={`flex items-start gap-3 p-3 border cursor-pointer transition-colors ${
                forms[k]
                  ? "border-green-600 dark:border-matrix bg-green-50/50 dark:bg-matrix/5"
                  : "border-gray-200 dark:border-gray-800"
              }`}
            >
              <input
                type="checkbox"
                className="mt-1 accent-green-600"
                checked={forms[k]}
                onChange={(e) => setForms({ ...forms, [k]: e.target.checked })}
              />
              <span>
                <span className="block text-sm font-semibold text-gray-900 dark:text-matrix">
                  {FORM_META[k].label}
                </span>
                <span className="block text-xs text-gray-500">{FORM_META[k].blurb}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {/* Fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="FULL NAME" required>
            <input
              className="input-hack w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="as printed on the form"
              autoComplete="name"
            />
          </Field>
          <Field label="POSITION" required>
            <select
              className="input-hack w-full"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            >
              <option value="">select</option>
              {POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
          <Field label="EMAIL" required>
            <input
              className="input-hack w-full"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
            />
          </Field>
          <Field label="STUDENT ID (CWID)" required={needsStudentId} hint={needsStudentId ? "goes on the form" : "optional"}>
            <input
              className="input-hack w-full"
              inputMode="numeric"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="2060xxxx"
            />
          </Field>
          <Field label="PHONE" required={needsPhone} hint={needsPhone ? "needed for the roster" : "optional"}>
            <input
              className="input-hack w-full"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="408 555 0100"
              autoComplete="tel"
            />
          </Field>
        </div>

        <Field label="SIGNATURE" required>
          <SignaturePad ref={padRef} onChange={setPadEmpty} />
        </Field>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-hack-red">
            <Warning className="w-4 h-4" />
            <span>[ERR] {error}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            type="button"
            className="cli-btn-filled disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {submitting ? <Spinner className="w-4 h-4 animate-spin" /> : null}
            SUBMIT SIGNATURE
          </button>
          <span className="text-xs text-gray-500">
            By submitting you agree to the terms printed on the ICC petition (open membership, ICC rep attendance, service to De Anza students).
          </span>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ cmd, children }: { cmd: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-terminal-bg text-gray-900 dark:text-matrix min-h-screen">
      <div className="relative max-w-3xl mx-auto px-6">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-gray-900 dark:text-matrix neon-text-subtle text-lg">$</span>
            <span className="text-gray-600 dark:text-gray-400 font-terminal">{cmd}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-matrix neon-text mb-2">
            SIGN CLUB PAPERWORK
          </h1>
          <p className="text-gray-600 dark:text-gray-500 text-sm">
            Fall 2026 reactivation · De Anza ML and Agentic Cybersecurity Club ·{" "}
            <Link to="/forms/compile" className="underline hover:text-matrix">
              officer view
            </Link>
          </p>
        </header>
        <div className="terminal-window mb-12">
          <div className="terminal-header">
            <div className="terminal-dot red" />
            <div className="terminal-dot yellow" />
            <div className="terminal-dot green" />
            <span className="ml-4 text-xs text-gray-600 dark:text-gray-500 font-terminal">
              forms/sign
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-bold tracking-wider text-gray-900 dark:text-matrix mb-2">
        {label}
        {required ? <span className="text-amber-500"> *</span> : null}
        {hint ? <span className="ml-2 font-normal text-gray-500 normal-case">({hint})</span> : null}
      </span>
      {children}
    </label>
  );
}

export default Forms;
