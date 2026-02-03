-- Add unique constraint on secret_code for meetings
-- This ensures each meeting has a unique code for lookup-based attendance

-- First, check for any duplicate secret_codes and handle them
-- (This will fail if duplicates exist - handle manually if needed)
ALTER TABLE public.meetings
ADD CONSTRAINT meetings_secret_code_unique UNIQUE (secret_code);

-- Add an index for faster lookups by secret_code
CREATE INDEX IF NOT EXISTS meetings_secret_code_idx ON public.meetings(secret_code);

COMMENT ON CONSTRAINT meetings_secret_code_unique ON public.meetings
IS 'Ensures each meeting has a unique secret code for attendance lookup';
