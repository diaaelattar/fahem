-- =====================================================
-- Migration: 20260513000001_student_answer_images.sql
-- Description: Add image support for essay/handwritten answers
-- =====================================================

-- 1. Add image_url column to student_answers table
ALTER TABLE public.student_answers
  ADD COLUMN IF NOT EXISTS answer_image_url TEXT,
  ADD COLUMN IF NOT EXISTS ai_vision_feedback TEXT,
  ADD COLUMN IF NOT EXISTS grading_method TEXT DEFAULT 'auto' CHECK (grading_method IN ('auto', 'image', 'manual'));

-- 2. Add image_urls support to exam_attempts answers JSONB (no schema change needed, it's already JSONB)
-- We'll store image URLs as a separate key in the answers JSON: answers_images: { questionId: imageUrl }

-- 3. Create storage bucket for student answer images (done via Supabase dashboard or MJS script)
-- Bucket name: student-answers-images
-- Public: false (private, authenticated access only)

-- 4. RLS Policy update for student_answers - allow update for students (to add image grading feedback)
DROP POLICY IF EXISTS "Students update own answers" ON public.student_answers;
CREATE POLICY "Students update own answers" ON public.student_answers 
  FOR UPDATE USING (student_id = auth.uid());

-- 5. Add teacher_feedback column if not exists (used by AI & manual grading)
ALTER TABLE public.student_answers
  ADD COLUMN IF NOT EXISTS teacher_feedback TEXT,
  ADD COLUMN IF NOT EXISTS score_awarded NUMERIC(5,2) DEFAULT 0;

-- 6. Update RLS to allow admin to update student_answers (for manual grading)
DROP POLICY IF EXISTS "Admins manage student_answers" ON public.student_answers;
CREATE POLICY "Admins manage student_answers" ON public.student_answers FOR ALL USING (public.is_admin());
