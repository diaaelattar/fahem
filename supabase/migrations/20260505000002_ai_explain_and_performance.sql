-- =====================================================
-- Migration: 20260505000002_ai_explain_and_performance.sql
-- Description: AI explanations cache & performance indexes
-- =====================================================

-- 1. Add bloom_level to exam_questions for inherited context
ALTER TABLE public.exam_questions 
  ADD COLUMN IF NOT EXISTS points_override INTEGER; -- allow per-exam point override

-- 2. Performance indexes for student_answers analytics
CREATE INDEX IF NOT EXISTS idx_student_answers_student_id 
  ON public.student_answers(student_id);

CREATE INDEX IF NOT EXISTS idx_student_answers_question_id 
  ON public.student_answers(question_id);

CREATE INDEX IF NOT EXISTS idx_student_answers_attempt_id 
  ON public.student_answers(attempt_id);

CREATE INDEX IF NOT EXISTS idx_questions_bloom_level 
  ON public.questions(bloom_level);

CREATE INDEX IF NOT EXISTS idx_questions_status 
  ON public.questions(status);

-- 3. Add cached_explanation column to questions (store AI explanations)
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS cached_explanation TEXT; -- AI-generated detailed explanation

-- 4. Function to get Bloom's performance per student
CREATE OR REPLACE FUNCTION public.get_student_bloom_stats(p_student_id UUID)
RETURNS TABLE(
  bloom_level TEXT,
  total_answers BIGINT,
  correct_answers BIGINT,
  success_rate NUMERIC
) 
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.bloom_level,
    COUNT(sa.id) AS total_answers,
    COUNT(sa.id) FILTER (WHERE sa.is_correct = true) AS correct_answers,
    ROUND(
      COUNT(sa.id) FILTER (WHERE sa.is_correct = true)::NUMERIC / 
      NULLIF(COUNT(sa.id), 0) * 100, 
    1) AS success_rate
  FROM public.student_answers sa
  JOIN public.questions q ON q.id = sa.question_id
  WHERE sa.student_id = p_student_id
    AND q.bloom_level IS NOT NULL
  GROUP BY q.bloom_level
  ORDER BY 
    CASE q.bloom_level
      WHEN 'remember'  THEN 1
      WHEN 'understand' THEN 2
      WHEN 'apply'     THEN 3
      WHEN 'analyze'   THEN 4
      WHEN 'evaluate'  THEN 5
      WHEN 'create'    THEN 6
    END;
END;
$$;

-- 5. Function to get hardest questions (wrong most often - for Content Factory analytics)
CREATE OR REPLACE FUNCTION public.get_hardest_questions(p_subject_id INTEGER DEFAULT NULL, p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
  question_id UUID,
  question_text TEXT,
  subject_name TEXT,
  grade_name TEXT,
  bloom_level TEXT,
  total_attempts BIGINT,
  wrong_count BIGINT,
  error_rate NUMERIC
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id AS question_id,
    q.question_text,
    s.name_ar AS subject_name,
    g.name_ar AS grade_name,
    q.bloom_level,
    COUNT(sa.id) AS total_attempts,
    COUNT(sa.id) FILTER (WHERE sa.is_correct = false) AS wrong_count,
    ROUND(
      COUNT(sa.id) FILTER (WHERE sa.is_correct = false)::NUMERIC /
      NULLIF(COUNT(sa.id), 0) * 100,
    1) AS error_rate
  FROM public.student_answers sa
  JOIN public.questions q ON q.id = sa.question_id
  JOIN public.subjects s ON s.id = q.subject_id
  JOIN public.grades g ON g.id = q.grade_id
  WHERE (p_subject_id IS NULL OR q.subject_id = p_subject_id)
    AND q.status = 'approved'
  GROUP BY q.id, q.question_text, s.name_ar, g.name_ar, q.bloom_level
  HAVING COUNT(sa.id) >= 3 -- minimum 3 attempts to be meaningful
  ORDER BY error_rate DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_student_bloom_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_hardest_questions(INTEGER, INTEGER) TO authenticated;
