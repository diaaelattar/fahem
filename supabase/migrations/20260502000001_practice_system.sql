-- ====================================================
-- Migration: Practice & Training System
-- Date: 2026-05-02
-- ====================================================

-- 1. بنك الإجابات الخاطئة
CREATE TABLE IF NOT EXISTS public.wrong_answers_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  source_attempt_id UUID REFERENCES public.exam_attempts(id) ON DELETE SET NULL,
  times_wrong INTEGER NOT NULL DEFAULT 1,
  times_correct_after INTEGER NOT NULL DEFAULT 0,
  is_mastered BOOLEAN NOT NULL DEFAULT false,
  last_practiced_at TIMESTAMPTZ,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, question_id)
);

-- 2. جلسات التدريب (subject_id is INTEGER matching subjects.id)
CREATE TABLE IF NOT EXISTS public.practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES public.subjects(id) ON DELETE SET NULL,
  session_type TEXT NOT NULL DEFAULT 'free',
  answers JSONB NOT NULL DEFAULT '{}',
  score INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. الإنجازات
CREATE TABLE IF NOT EXISTS public.student_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  achievement_code TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, achievement_code)
);

-- ====================================================
-- RLS Policies
-- ====================================================

ALTER TABLE public.wrong_answers_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;

-- wrong_answers_bank: الطالب يرى ويعدل بياناته فقط
CREATE POLICY "Students can manage own wrong answers"
  ON public.wrong_answers_bank
  FOR ALL USING (student_id = auth.uid());

-- practice_sessions: الطالب يرى ويعدل جلساته فقط
CREATE POLICY "Students can manage own practice sessions"
  ON public.practice_sessions
  FOR ALL USING (student_id = auth.uid());

-- student_achievements: الطالب يرى فقط، الإدراج عبر service_role
CREATE POLICY "Students can view own achievements"
  ON public.student_achievements
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Service role can insert achievements"
  ON public.student_achievements
  FOR INSERT WITH CHECK (true);

-- ====================================================
-- Helper Functions
-- ====================================================

-- دالة: إضافة سؤال لبنك الأخطاء أو زيادة عدد المرات
CREATE OR REPLACE FUNCTION public.add_to_wrong_answers(
  p_student_id UUID,
  p_question_id UUID,
  p_attempt_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.wrong_answers_bank (student_id, question_id, source_attempt_id, times_wrong)
  VALUES (p_student_id, p_question_id, p_attempt_id, 1)
  ON CONFLICT (student_id, question_id) DO UPDATE
    SET times_wrong = wrong_answers_bank.times_wrong + 1,
        is_mastered = false,
        source_attempt_id = COALESCE(p_attempt_id, wrong_answers_bank.source_attempt_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة: تسجيل إجابة صحيحة في التدريب (يزيد times_correct_after)
CREATE OR REPLACE FUNCTION public.mark_wrong_answer_practiced(
  p_student_id UUID,
  p_question_id UUID,
  p_correct BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.wrong_answers_bank
  SET
    times_correct_after = CASE WHEN p_correct THEN times_correct_after + 1 ELSE times_correct_after END,
    is_mastered = CASE WHEN p_correct AND times_correct_after >= 2 THEN true ELSE is_mastered END,
    last_practiced_at = NOW()
  WHERE student_id = p_student_id AND question_id = p_question_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
