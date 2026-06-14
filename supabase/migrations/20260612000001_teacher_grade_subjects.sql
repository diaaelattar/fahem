-- =====================================================
-- Migration: 20260612000001_teacher_grade_subjects.sql
-- Description: جدول ربط المعلم بالمواد والصفوف (Multi-grade multi-subject)
-- =====================================================

-- 1. جدول ربط المعلم بالمواد والصفوف (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.teacher_grade_subjects (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id   UUID    NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  grade_id     INTEGER NOT NULL REFERENCES public.grades(id) ON DELETE CASCADE,
  subject_id   INTEGER NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, grade_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_tgs_teacher   ON public.teacher_grade_subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tgs_grade     ON public.teacher_grade_subjects(grade_id);
CREATE INDEX IF NOT EXISTS idx_tgs_subject   ON public.teacher_grade_subjects(subject_id);

-- 2. RLS
ALTER TABLE public.teacher_grade_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_reads_own_tgs"
  ON public.teacher_grade_subjects FOR SELECT
  USING (teacher_id = auth.uid());

CREATE POLICY "teacher_manages_own_tgs"
  ON public.teacher_grade_subjects FOR ALL
  USING (teacher_id = auth.uid());

CREATE POLICY "admin_manages_tgs"
  ON public.teacher_grade_subjects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. إضافة عمود المسار للمرحلة الثانوية (إن لم يكن موجوداً)
ALTER TABLE public.grades
  ADD COLUMN IF NOT EXISTS track TEXT
    CHECK (track IN ('bacc', 'old', 'coming_soon', NULL));

-- تعيين المسار البكالوريا للصف الأول والثاني الثانوي
UPDATE public.grades SET track = 'bacc'
WHERE name_ar IN ('الصف الأول الثانوي', 'الصف الثاني الثانوي');

-- تعيين المسار القديم للصف الثالث الثانوي
UPDATE public.grades SET track = 'old'
WHERE name_ar = 'الصف الثالث الثانوي';
