-- ============================================================
-- FORM SIGNATURES
-- Collects digital signatures for ICC paperwork (club petition,
-- financial roster). Anyone with the /forms link can submit;
-- only officers can read, compile, or delete.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.form_signatures (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form          TEXT NOT NULL CHECK (form IN ('petition', 'roster')),
  signer_name   TEXT NOT NULL CHECK (char_length(signer_name) BETWEEN 2 AND 120),
  position      TEXT NOT NULL CHECK (char_length(position) BETWEEN 2 AND 60),
  email         TEXT CHECK (email IS NULL OR char_length(email) <= 254),
  student_id    TEXT CHECK (student_id IS NULL OR char_length(student_id) <= 20),
  -- PNG data URL of the drawn signature (transparent background)
  signature_png TEXT NOT NULL CHECK (
    signature_png LIKE 'data:image/png;base64,%'
    AND char_length(signature_png) <= 400000
  ),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS form_signatures_form_idx
  ON public.form_signatures (form, created_at);

ALTER TABLE public.form_signatures ENABLE ROW LEVEL SECURITY;

-- Public submit (the signing link is shared with members who may not have accounts)
DROP POLICY IF EXISTS "form_signatures_public_insert" ON public.form_signatures;
CREATE POLICY "form_signatures_public_insert" ON public.form_signatures
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Officers only can read / delete
DROP POLICY IF EXISTS "form_signatures_officer_select" ON public.form_signatures;
CREATE POLICY "form_signatures_officer_select" ON public.form_signatures
  FOR SELECT TO authenticated
  USING (public.is_officer());

DROP POLICY IF EXISTS "form_signatures_officer_delete" ON public.form_signatures;
CREATE POLICY "form_signatures_officer_delete" ON public.form_signatures
  FOR DELETE TO authenticated
  USING (public.is_officer());

GRANT INSERT ON public.form_signatures TO anon, authenticated;
GRANT SELECT, DELETE ON public.form_signatures TO authenticated;

COMMENT ON TABLE public.form_signatures IS
  'Digital signatures collected via /forms for ICC club paperwork. Compiled onto the fillable PDFs at /forms/compile by officers.';
