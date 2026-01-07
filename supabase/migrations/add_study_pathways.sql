-- Create pathways table for study routes (Security+, PEH, etc.)
CREATE TABLE public.pathways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT, -- emoji or icon identifier
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    estimated_hours INTEGER,
    color TEXT, -- for UI theming (e.g., 'hack-cyan', 'hack-purple')
    order_index INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create lessons table for pathway content
CREATE TABLE public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pathway_id UUID NOT NULL REFERENCES public.pathways(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT CHECK (type IN ('course', 'workshop', 'ctf', 'quiz', 'flashcard')) NOT NULL,
    order_index INTEGER NOT NULL,

    -- Content fields (JSONB for flexibility)
    content JSONB, -- For courses: { markdown, video_url, etc }

    -- Workshop linking
    meeting_id UUID REFERENCES public.meetings(id) ON DELETE SET NULL,
    is_self_paced BOOLEAN DEFAULT true,

    -- Quiz/Flashcard data
    quiz_data JSONB, -- { questions: [...], passing_score, time_limit_minutes }
    flashcard_data JSONB, -- { cards: [...] }

    -- Prerequisites & unlocking
    prerequisite_lesson_ids UUID[],
    required_score INTEGER, -- minimum score to unlock next (for quizzes)

    -- Metadata
    estimated_minutes INTEGER,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    topics TEXT[],
    resources JSONB, -- Similar to meetings resources

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(pathway_id, slug)
);

-- Create user_progress table for tracking individual lesson progress
CREATE TABLE public.user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,

    -- Progress tracking
    status TEXT CHECK (status IN ('locked', 'unlocked', 'in_progress', 'completed')) DEFAULT 'locked',
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),

    -- Quiz/test results
    quiz_score INTEGER,
    quiz_attempts INTEGER DEFAULT 0,
    quiz_best_score INTEGER,
    quiz_answers JSONB, -- Store user's answers for review

    -- Flashcard progress
    flashcard_mastery JSONB, -- { card_id: mastery_level, ... }

    -- Timestamps
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, lesson_id)
);

-- Create pathway_progress table for aggregate stats
CREATE TABLE public.pathway_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    pathway_id UUID NOT NULL REFERENCES public.pathways(id) ON DELETE CASCADE,

    -- Aggregate stats
    lessons_completed INTEGER DEFAULT 0,
    total_lessons INTEGER DEFAULT 0,
    completion_percentage INTEGER DEFAULT 0,
    current_streak_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,
    total_time_spent_minutes INTEGER DEFAULT 0,

    -- Achievements
    achievements JSONB DEFAULT '[]'::jsonb, -- Array of achievement IDs

    last_activity_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, pathway_id)
);

-- Create indexes for faster queries
CREATE INDEX idx_lessons_pathway ON public.lessons(pathway_id);
CREATE INDEX idx_lessons_meeting ON public.lessons(meeting_id);
CREATE INDEX idx_lessons_type ON public.lessons(type);
CREATE INDEX idx_user_progress_user ON public.user_progress(user_id);
CREATE INDEX idx_user_progress_lesson ON public.user_progress(lesson_id);
CREATE INDEX idx_user_progress_status ON public.user_progress(status);
CREATE INDEX idx_pathway_progress_user ON public.pathway_progress(user_id);
CREATE INDEX idx_pathway_progress_pathway ON public.pathway_progress(pathway_id);

-- Enable Row-Level Security on all tables
ALTER TABLE public.pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pathway_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pathways table
-- SELECT: Everyone can view active pathways
CREATE POLICY "Everyone can view active pathways"
ON public.pathways FOR SELECT
USING (is_active = true OR EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND is_officer = true
));

-- INSERT/UPDATE/DELETE: Only officers can manage pathways
CREATE POLICY "Officers can manage pathways"
ON public.pathways FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND is_officer = true
));

-- RLS Policies for lessons table
-- SELECT: Everyone can view lessons in active pathways
CREATE POLICY "Everyone can view lessons"
ON public.lessons FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.pathways
        WHERE id = pathway_id AND is_active = true
    )
    OR
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND is_officer = true
    )
);

-- INSERT/UPDATE/DELETE: Only officers can manage lessons
CREATE POLICY "Officers can manage lessons"
ON public.lessons FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND is_officer = true
));

-- RLS Policies for user_progress table
-- SELECT: Users can view their own progress, officers can view all
CREATE POLICY "Users can view own progress"
ON public.user_progress FOR SELECT
USING (
    auth.uid() = user_id
    OR
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND is_officer = true
    )
);

-- INSERT/UPDATE: Users can manage their own progress
CREATE POLICY "Users can manage own progress"
ON public.user_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
ON public.user_progress FOR UPDATE
USING (auth.uid() = user_id);

-- DELETE: Users can delete their own progress, officers can delete all
CREATE POLICY "Users can delete own progress"
ON public.user_progress FOR DELETE
USING (
    auth.uid() = user_id
    OR
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND is_officer = true
    )
);

-- RLS Policies for pathway_progress table
-- SELECT: Users can view their own pathway progress, officers can view all
CREATE POLICY "Users can view own pathway progress"
ON public.pathway_progress FOR SELECT
USING (
    auth.uid() = user_id
    OR
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND is_officer = true
    )
);

-- INSERT/UPDATE: Users can manage their own pathway progress
CREATE POLICY "Users can manage own pathway progress"
ON public.pathway_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pathway progress"
ON public.pathway_progress FOR UPDATE
USING (auth.uid() = user_id);

-- DELETE: Users can delete their own pathway progress, officers can delete all
CREATE POLICY "Users can delete own pathway progress"
ON public.pathway_progress FOR DELETE
USING (
    auth.uid() = user_id
    OR
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND is_officer = true
    )
);

-- Function to automatically update updated_at timestamp for lessons
CREATE OR REPLACE FUNCTION update_lessons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lessons_updated_at
BEFORE UPDATE ON public.lessons
FOR EACH ROW
EXECUTE FUNCTION update_lessons_updated_at();

-- Function to automatically update updated_at timestamp for user_progress
CREATE OR REPLACE FUNCTION update_user_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_progress_updated_at
BEFORE UPDATE ON public.user_progress
FOR EACH ROW
EXECUTE FUNCTION update_user_progress_updated_at();

-- Function to automatically update updated_at timestamp for pathway_progress
CREATE OR REPLACE FUNCTION update_pathway_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pathway_progress_updated_at
BEFORE UPDATE ON public.pathway_progress
FOR EACH ROW
EXECUTE FUNCTION update_pathway_progress_updated_at();

-- Function to auto-complete workshop lessons when user attends meeting
CREATE OR REPLACE FUNCTION auto_complete_workshop_lesson()
RETURNS TRIGGER AS $$
BEGIN
    -- Find workshop lessons linked to this meeting
    UPDATE public.user_progress
    SET status = 'completed',
        progress_percentage = 100,
        completed_at = NOW(),
        updated_at = NOW()
    FROM public.lessons
    WHERE user_progress.lesson_id = lessons.id
    AND user_progress.user_id = NEW.user_id
    AND lessons.meeting_id = NEW.meeting_id
    AND lessons.type = 'workshop'
    AND user_progress.status != 'completed';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-complete workshop lessons when attendance is recorded
CREATE TRIGGER attendance_completes_workshop_lesson
AFTER INSERT ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION auto_complete_workshop_lesson();

-- Insert initial pathways (Security+ and Professional Ethical Hacker)
INSERT INTO public.pathways (slug, title, description, icon, difficulty, estimated_hours, color, order_index, is_active) VALUES
('security-plus', 'Security+ Certification', 'Comprehensive preparation for CompTIA Security+ certification covering network security, compliance, threats, and cryptography.', '🛡️', 'beginner', 40, 'hack-cyan', 1, true),
('professional-ethical-hacker', 'Professional Ethical Hacker', 'Master offensive security techniques including reconnaissance, scanning, exploitation, and post-exploitation in controlled environments.', '🎯', 'intermediate', 60, 'hack-purple', 2, true);

-- Insert sample lessons for Security+ pathway
INSERT INTO public.lessons (pathway_id, slug, title, description, type, order_index, content, estimated_minutes, difficulty, topics, is_self_paced)
SELECT
    p.id,
    'intro-to-security',
    'Introduction to Security Concepts',
    'Learn fundamental security concepts including the CIA triad, defense in depth, and risk management principles.',
    'course',
    0,
    '{"markdown": "# Introduction to Security Concepts\n\n## CIA Triad\n- **Confidentiality**: Protecting information from unauthorized access\n- **Integrity**: Ensuring data accuracy and trustworthiness\n- **Availability**: Ensuring systems and data are accessible when needed\n\n## Defense in Depth\nMultiple layers of security controls throughout an IT system.\n\n## Risk Management\nIdentifying, assessing, and prioritizing risks to minimize their impact.", "video_url": null}'::jsonb,
    30,
    'easy',
    ARRAY['security-fundamentals', 'cia-triad', 'risk-management'],
    true
FROM public.pathways p WHERE p.slug = 'security-plus';

INSERT INTO public.lessons (pathway_id, slug, title, description, type, order_index, quiz_data, estimated_minutes, difficulty, topics, is_self_paced, prerequisite_lesson_ids)
SELECT
    p.id,
    'security-quiz-1',
    'Security Fundamentals Quiz',
    'Test your knowledge of basic security concepts.',
    'quiz',
    1,
    '{"passing_score": 70, "time_limit_minutes": 15, "questions": [{"id": "q1", "type": "multiple_choice", "question": "What does the C in CIA triad stand for?", "options": ["Confidentiality", "Cryptography", "Compliance", "Control"], "correct_answer": "Confidentiality", "explanation": "The CIA triad stands for Confidentiality, Integrity, and Availability.", "points": 10}, {"id": "q2", "type": "multiple_choice", "question": "Which principle involves implementing multiple layers of security?", "options": ["Least Privilege", "Defense in Depth", "Separation of Duties", "Need to Know"], "correct_answer": "Defense in Depth", "explanation": "Defense in Depth is the practice of implementing multiple layers of security controls.", "points": 10}, {"id": "q3", "type": "true_false", "question": "Availability in the CIA triad means ensuring data is accessible only to authorized users.", "options": ["True", "False"], "correct_answer": "False", "explanation": "Availability means ensuring systems and data are accessible when needed. Confidentiality refers to restricting access to authorized users.", "points": 10}]}'::jsonb,
    15,
    'easy',
    ARRAY['security-fundamentals', 'assessment'],
    true,
    ARRAY(SELECT id FROM public.lessons WHERE slug = 'intro-to-security' AND pathway_id = p.id)
FROM public.pathways p WHERE p.slug = 'security-plus';

INSERT INTO public.lessons (pathway_id, slug, title, description, type, order_index, flashcard_data, estimated_minutes, difficulty, topics, is_self_paced)
SELECT
    p.id,
    'security-terms-flashcards',
    'Security Terminology Flashcards',
    'Master essential security terminology with interactive flashcards.',
    'flashcard',
    2,
    '{"cards": [{"id": "fc1", "front": "What is a vulnerability?", "back": "A weakness in a system that can be exploited by a threat.", "category": "fundamentals"}, {"id": "fc2", "front": "What is a threat?", "back": "A potential danger that can exploit a vulnerability.", "category": "fundamentals"}, {"id": "fc3", "front": "What is an exploit?", "back": "Code or technique that takes advantage of a vulnerability to gain unauthorized access.", "category": "fundamentals"}, {"id": "fc4", "front": "What is the principle of least privilege?", "back": "Users should only have the minimum access rights necessary to perform their job functions.", "category": "access-control"}, {"id": "fc5", "front": "What is multi-factor authentication (MFA)?", "back": "A security method requiring two or more verification factors to gain access to a resource.", "category": "authentication"}]}'::jsonb,
    20,
    'easy',
    ARRAY['security-fundamentals', 'terminology'],
    true
FROM public.pathways p WHERE p.slug = 'security-plus';

-- Insert sample lessons for Professional Ethical Hacker pathway
INSERT INTO public.lessons (pathway_id, slug, title, description, type, order_index, content, estimated_minutes, difficulty, topics, is_self_paced)
SELECT
    p.id,
    'reconnaissance-basics',
    'Reconnaissance Fundamentals',
    'Learn passive and active reconnaissance techniques to gather information about targets.',
    'course',
    0,
    '{"markdown": "# Reconnaissance Fundamentals\n\n## Types of Reconnaissance\n\n### Passive Reconnaissance\n- Gathering information without directly interacting with the target\n- Examples: OSINT, social media research, WHOIS lookups\n- Tools: theHarvester, Maltego, Shodan\n\n### Active Reconnaissance\n- Directly interacting with the target system\n- Examples: Port scanning, network mapping, service enumeration\n- Tools: Nmap, Netcat, Nikto\n\n## Information to Gather\n- Domain names and subdomains\n- IP address ranges\n- Email addresses\n- Employee information\n- Technologies in use\n- Network topology", "video_url": null}'::jsonb,
    45,
    'medium',
    ARRAY['reconnaissance', 'osint', 'information-gathering'],
    true
FROM public.pathways p WHERE p.slug = 'professional-ethical-hacker';

INSERT INTO public.lessons (pathway_id, slug, title, description, type, order_index, quiz_data, estimated_minutes, difficulty, topics, is_self_paced, prerequisite_lesson_ids)
SELECT
    p.id,
    'recon-quiz-1',
    'Reconnaissance Knowledge Check',
    'Test your understanding of reconnaissance techniques.',
    'quiz',
    1,
    '{"passing_score": 75, "time_limit_minutes": 20, "questions": [{"id": "q1", "type": "multiple_choice", "question": "Which of the following is an example of passive reconnaissance?", "options": ["Port scanning with Nmap", "WHOIS lookup", "Vulnerability scanning", "Banner grabbing"], "correct_answer": "WHOIS lookup", "explanation": "WHOIS lookups do not directly interact with the target system, making it passive reconnaissance.", "points": 10}, {"id": "q2", "type": "multiple_choice", "question": "What tool is commonly used for network mapping?", "options": ["Wireshark", "Nmap", "Burp Suite", "John the Ripper"], "correct_answer": "Nmap", "explanation": "Nmap (Network Mapper) is the industry-standard tool for network discovery and port scanning.", "points": 10}]}'::jsonb,
    20,
    'medium',
    ARRAY['reconnaissance', 'assessment'],
    true,
    ARRAY(SELECT id FROM public.lessons WHERE slug = 'reconnaissance-basics' AND pathway_id = p.id)
FROM public.pathways p WHERE p.slug = 'professional-ethical-hacker';

INSERT INTO public.lessons (pathway_id, slug, title, description, type, order_index, flashcard_data, estimated_minutes, difficulty, topics, is_self_paced)
SELECT
    p.id,
    'recon-tools-flashcards',
    'Reconnaissance Tools Flashcards',
    'Memorize common reconnaissance tools and their purposes.',
    'flashcard',
    2,
    '{"cards": [{"id": "fc1", "front": "What is Nmap used for?", "back": "Network mapping, port scanning, and service/version detection.", "category": "tools"}, {"id": "fc2", "front": "What is theHarvester?", "back": "OSINT tool for gathering emails, subdomains, and names from public sources.", "category": "tools"}, {"id": "fc3", "front": "What is Shodan?", "back": "Search engine for internet-connected devices and services, useful for finding exposed systems.", "category": "tools"}, {"id": "fc4", "front": "What is Maltego?", "back": "Data mining and link analysis tool for gathering and visualizing OSINT.", "category": "tools"}]}'::jsonb,
    15,
    'medium',
    ARRAY['reconnaissance', 'tools'],
    true
FROM public.pathways p WHERE p.slug = 'professional-ethical-hacker';
