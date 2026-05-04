-- =====================================================
-- Migration: 20260505000001_architecture_phase1.sql
-- Description: Phase 1 of Master Architecture Plan
-- Adds Bloom's Taxonomy, Draft Status, Learning Outcomes, and Student Answers
-- =====================================================

-- 1. Create Learning Outcomes Table
CREATE TABLE IF NOT EXISTS public.learning_outcomes (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER REFERENCES public.subjects(id) ON DELETE CASCADE,
    grade_id INTEGER REFERENCES public.grades(id) ON DELETE CASCADE,
    unit_id INTEGER REFERENCES public.units(id) ON DELETE CASCADE,
    lesson_id INTEGER REFERENCES public.lessons(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    code TEXT, -- e.g., MATH-G7-U1-L1-OBJ1
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Modify Questions Table
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS bloom_level TEXT CHECK (bloom_level IN ('remember', 'understand', 'apply', 'analyze', 'evaluate', 'create')),
ADD COLUMN IF NOT EXISTS learning_outcome_id INTEGER REFERENCES public.learning_outcomes(id) ON DELETE SET NULL;

-- Migrate existing approved questions to 'approved' status
UPDATE public.questions SET status = 'approved' WHERE is_approved = true;

-- 3. Create Student Answers Table (for granular analytics)
CREATE TABLE IF NOT EXISTS public.student_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    student_answer TEXT,
    is_correct BOOLEAN,
    points_awarded INTEGER DEFAULT 0,
    time_spent_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(attempt_id, question_id)
);

-- 4. RLS Policies for new tables
ALTER TABLE public.learning_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;

-- Learning Outcomes: Anyone can read, Admin manages
CREATE POLICY "Public read learning_outcomes" ON public.learning_outcomes FOR SELECT USING (true);
CREATE POLICY "Admins manage learning_outcomes" ON public.learning_outcomes FOR ALL USING (public.is_admin());

-- Student Answers: Student can insert/read own, Admin manages
CREATE POLICY "Students insert own answers" ON public.student_answers FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Students view own answers" ON public.student_answers FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Admins manage student_answers" ON public.student_answers FOR ALL USING (public.is_admin());
