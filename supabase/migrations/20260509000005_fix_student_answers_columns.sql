-- Add missing columns to student_answers
ALTER TABLE public.student_answers
ADD COLUMN IF NOT EXISTS score_awarded INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS teacher_feedback TEXT;
