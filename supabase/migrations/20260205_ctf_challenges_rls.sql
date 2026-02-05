-- ============================================================
-- CTF CHALLENGES TABLE & RLS POLICIES
-- ============================================================
-- This migration ensures the ctf_challenges table has proper
-- Row Level Security policies to prevent unauthorized access

-- Create ctf_challenges table if it doesn't exist
CREATE TABLE IF NOT EXISTS ctf_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 100,
    hint TEXT,
    flag TEXT NOT NULL,
    solution TEXT,
    author TEXT,
    files JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on ctf_challenges
ALTER TABLE ctf_challenges ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Officers can view all challenges" ON ctf_challenges;
DROP POLICY IF EXISTS "Officers can insert challenges" ON ctf_challenges;
DROP POLICY IF EXISTS "Officers can update challenges" ON ctf_challenges;
DROP POLICY IF EXISTS "Officers can delete challenges" ON ctf_challenges;

-- Officers can view all challenges (including flags and solutions)
CREATE POLICY "Officers can view all challenges"
ON ctf_challenges FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.is_officer = true
    )
);

-- Officers can insert challenges
CREATE POLICY "Officers can insert challenges"
ON ctf_challenges FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.is_officer = true
    )
);

-- Officers can update challenges
CREATE POLICY "Officers can update challenges"
ON ctf_challenges FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.is_officer = true
    )
);

-- Officers can delete challenges
CREATE POLICY "Officers can delete challenges"
ON ctf_challenges FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.is_officer = true
    )
);

-- Create public view that excludes sensitive fields (flag, solution)
DROP VIEW IF EXISTS ctf_challenges_public;

CREATE VIEW ctf_challenges_public AS
SELECT
    id,
    title,
    description,
    category,
    difficulty,
    points,
    hint,
    author,
    files,
    is_active,
    created_at,
    updated_at
FROM ctf_challenges
WHERE is_active = true;

-- Grant access to the public view
GRANT SELECT ON ctf_challenges_public TO anon, authenticated;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_ctf_challenges_category ON ctf_challenges(category);
CREATE INDEX IF NOT EXISTS idx_ctf_challenges_difficulty ON ctf_challenges(difficulty);
CREATE INDEX IF NOT EXISTS idx_ctf_challenges_is_active ON ctf_challenges(is_active);
