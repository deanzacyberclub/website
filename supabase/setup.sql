-- ============================================
-- De Anza Cyber Security Club - Supabase Setup
-- ============================================
-- Run this SQL in Supabase SQL Editor to set up the database

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT NOT NULL,
    student_id TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
    ON public.users FOR DELETE
    USING (auth.uid() = id);

-- ============================================
-- ATTENDANCE TABLE (for future use)
-- ============================================
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    meeting_id TEXT NOT NULL,
    meeting_title TEXT NOT NULL,
    meeting_date DATE NOT NULL,
    secret_code TEXT NOT NULL,
    student_id TEXT NOT NULL,
    checked_in_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, meeting_id)
);

-- Enable Row Level Security
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attendance table
CREATE POLICY "Users can view own attendance"
    ON public.attendance FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attendance"
    ON public.attendance FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- STORAGE BUCKET FOR PROFILE PICTURES
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile pictures
CREATE POLICY "Public can view profile pictures"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can upload own profile picture"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'profile-pictures'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update own profile picture"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'profile-pictures'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own profile picture"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'profile-pictures'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_attendance_user_id ON public.attendance(user_id);
CREATE INDEX idx_attendance_meeting_id ON public.attendance(meeting_id);
