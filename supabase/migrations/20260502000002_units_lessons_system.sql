-- ====================================================
-- Migration: Units, Lessons & Question Mapping System
-- Date: 2026-05-02
-- ====================================================

-- 1. تحديث جدول units (إضافة الأعمدة الناقصة)
ALTER TABLE public.units
  ADD COLUMN IF NOT EXISTS subject_id INTEGER REFERENCES public.subjects(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS grade_id   INTEGER REFERENCES public.grades(id)   ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS sort_order  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active   BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT now();

-- 2. تحديث جدول lessons (إضافة الأعمدة الناقصة)
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS sort_order       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 45,
  ADD COLUMN IF NOT EXISTS is_active        BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS objectives       TEXT,
  ADD COLUMN IF NOT EXISTS created_at       TIMESTAMPTZ NOT NULL DEFAULT now();

-- تأكد أن lessons لديها unit_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='lessons' AND column_name='unit_id'
  ) THEN
    ALTER TABLE public.lessons
      ADD COLUMN unit_id INTEGER REFERENCES public.units(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. ربط الأسئلة بالوحدات والدروس
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS unit_id   INTEGER REFERENCES public.units(id)   ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lesson_id INTEGER REFERENCES public.lessons(id) ON DELETE SET NULL;

-- 4. فهارس لتسريع الاستعلامات
CREATE INDEX IF NOT EXISTS idx_questions_unit_id    ON public.questions(unit_id);
CREATE INDEX IF NOT EXISTS idx_questions_lesson_id  ON public.questions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_units_subject_grade  ON public.units(subject_id, grade_id);
CREATE INDEX IF NOT EXISTS idx_units_sort           ON public.units(subject_id, grade_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_lessons_unit_id      ON public.lessons(unit_id);
CREATE INDEX IF NOT EXISTS idx_lessons_sort         ON public.lessons(unit_id, sort_order);

-- 5. دالة مساعدة: إحصائيات الوحدة
CREATE OR REPLACE FUNCTION public.get_unit_stats(p_unit_id INTEGER)
RETURNS JSON AS $$
DECLARE
  v_lesson_count INTEGER;
  v_question_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_lesson_count FROM public.lessons WHERE unit_id = p_unit_id AND is_active = true;
  SELECT COUNT(*) INTO v_question_count FROM public.questions WHERE unit_id = p_unit_id;
  RETURN json_build_object(
    'lesson_count', v_lesson_count,
    'question_count', v_question_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. دالة مساعدة: إحصائيات الدرس
CREATE OR REPLACE FUNCTION public.get_lesson_stats(p_lesson_id INTEGER)
RETURNS JSON AS $$
DECLARE
  v_question_count INTEGER;
  v_mcq_count INTEGER;
  v_tf_count INTEGER;
  v_fill_count INTEGER;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE question_type = 'mcq'),
    COUNT(*) FILTER (WHERE question_type = 'true_false'),
    COUNT(*) FILTER (WHERE question_type = 'fill_blank')
  INTO v_question_count, v_mcq_count, v_tf_count, v_fill_count
  FROM public.questions WHERE lesson_id = p_lesson_id;

  RETURN json_build_object(
    'total', v_question_count,
    'mcq', v_mcq_count,
    'true_false', v_tf_count,
    'fill_blank', v_fill_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
