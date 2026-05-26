-- ===================================================
-- Migration: 20260530000004_lesson_content_system.sql
-- Description: نظام محتوى الدروس والتدريبات للمعلمين والطلاب
-- ===================================================

-- 1. إضافة أعمدة المحتوى لجدول الدروس الموجود (lessons)
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS content_body TEXT,                       -- النص الكامل للدرس (للعرض السريع)
  ADD COLUMN IF NOT EXISTS content_sections JSONB DEFAULT '[]',    -- أقسام الدرس المنظمة (للعرض المتقدم)
  ADD COLUMN IF NOT EXISTS has_content BOOLEAN DEFAULT false,      -- هل يوجد محتوى منشور؟
  ADD COLUMN IF NOT EXISTS content_status TEXT DEFAULT 'draft'
    CHECK (content_status IN ('draft', 'published')),
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS content_updated_at TIMESTAMPTZ;

-- 2. إنشاء جدول أقسام الدروس (lesson_sections)
-- كل درس له أقسام متعددة: مقدمة، نص الدرس الأصلي، مفردات، قواعد، أمثلة، ملخص
CREATE TABLE IF NOT EXISTS public.lesson_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id INTEGER NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  section_type TEXT NOT NULL DEFAULT 'content'
    CHECK (section_type IN (
      'intro',        -- مقدمة الدرس
      'content',      -- نص الدرس الأصلي الرئيسي
      'vocabulary',   -- مفردات وكلمات جديدة
      'rules',        -- قواعد وأساسيات
      'examples',     -- أمثلة مشروحة
      'summary',      -- ملخص الدرس
      'exercises'     -- تدريبات مدمجة (نصية)
    )),
  title TEXT,                          -- عنوان القسم (اختياري)
  body TEXT NOT NULL,                  -- محتوى القسم
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. إنشاء جدول تدريبات الدروس (lesson_exercises)
-- تدريبات تفاعلية مرتبطة بكل درس — المصدر: معلم أو AI أو مستوردة
CREATE TABLE IF NOT EXISTS public.lesson_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id INTEGER NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  question_type TEXT NOT NULL DEFAULT 'mcq'
    CHECK (question_type IN ('mcq', 'true_false', 'fill_blank', 'essay', 'match')),
  question_text TEXT NOT NULL,
  question_image_url TEXT,
  options JSONB,                        -- خيارات MCQ بصيغة ["أ- ...", "ب- ...", ...]
  correct_answer TEXT NOT NULL,
  explanation TEXT,                     -- شرح الإجابة الصحيحة
  difficulty_level TEXT DEFAULT 'medium'
    CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  sort_order INTEGER DEFAULT 0,
  points INTEGER DEFAULT 1,
  source TEXT DEFAULT 'teacher'
    CHECK (source IN ('teacher', 'ai_generated', 'imported')), -- مصدر التدريب
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,         -- كم مرة تم حل هذا التدريب
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. إنشاء جدول محاولات الطلاب على التدريبات (exercise_attempts)
CREATE TABLE IF NOT EXISTS public.exercise_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id INTEGER REFERENCES public.lessons(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.lesson_exercises(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  answer TEXT,
  is_correct BOOLEAN,
  time_spent_seconds INTEGER,
  xp_awarded INTEGER DEFAULT 0,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. فهارس لتسريع الاستعلامات
CREATE INDEX IF NOT EXISTS idx_lesson_sections_lesson ON public.lesson_sections(lesson_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_lesson_sections_teacher ON public.lesson_sections(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lesson_exercises_lesson ON public.lesson_exercises(lesson_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_lesson_exercises_teacher ON public.lesson_exercises(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lesson_exercises_active ON public.lesson_exercises(lesson_id, is_active);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_student ON public.exercise_attempts(student_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_exercise ON public.exercise_attempts(exercise_id);
CREATE INDEX IF NOT EXISTS idx_lessons_teacher_id ON public.lessons(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lessons_has_content ON public.lessons(has_content, content_status);

-- 6. سياسات الحماية RLS (Row Level Security)

-- تفعيل RLS
ALTER TABLE public.lesson_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_attempts ENABLE ROW LEVEL SECURITY;

-- ── lesson_sections policies ──────────────────────────────────────────────────

-- المعلمون يديرون أقسام دروسهم فقط
DROP POLICY IF EXISTS "Teachers manage their lesson sections" ON public.lesson_sections;
CREATE POLICY "Teachers manage their lesson sections" ON public.lesson_sections
  FOR ALL USING (
    teacher_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
  );

-- الطلاب يرون الأقسام المنشورة والنشطة فقط
DROP POLICY IF EXISTS "Students view published lesson sections" ON public.lesson_sections;
CREATE POLICY "Students view published lesson sections" ON public.lesson_sections
  FOR SELECT USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM public.lessons l
      WHERE l.id = lesson_id
        AND l.has_content = true
        AND l.content_status = 'published'
    )
  );

-- ── lesson_exercises policies ─────────────────────────────────────────────────

-- المعلمون يديرون تدريبات دروسهم
DROP POLICY IF EXISTS "Teachers manage their lesson exercises" ON public.lesson_exercises;
CREATE POLICY "Teachers manage their lesson exercises" ON public.lesson_exercises
  FOR ALL USING (
    teacher_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
  );

-- الطلاب يرون التدريبات النشطة فقط
DROP POLICY IF EXISTS "Students view active lesson exercises" ON public.lesson_exercises;
CREATE POLICY "Students view active lesson exercises" ON public.lesson_exercises
  FOR SELECT USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM public.lessons l
      WHERE l.id = lesson_id
        AND l.has_content = true
        AND l.content_status = 'published'
    )
  );

-- ── exercise_attempts policies ────────────────────────────────────────────────

-- الطلاب يديرون محاولاتهم فقط
DROP POLICY IF EXISTS "Students manage their exercise attempts" ON public.exercise_attempts;
CREATE POLICY "Students manage their exercise attempts" ON public.exercise_attempts
  FOR ALL USING (student_id = auth.uid());

-- المعلمون يرون محاولات طلابهم
DROP POLICY IF EXISTS "Teachers view exercise attempts of their lessons" ON public.exercise_attempts;
CREATE POLICY "Teachers view exercise attempts of their lessons" ON public.exercise_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lesson_exercises le
      JOIN public.lessons l ON l.id = le.lesson_id
      WHERE le.id = exercise_id
        AND l.teacher_id = auth.uid()
    )
  );

-- 7. Trigger لتحديث usage_count عند إضافة محاولة جديدة
CREATE OR REPLACE FUNCTION public.increment_exercise_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.lesson_exercises
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = NEW.exercise_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_exercise_attempt_insert ON public.exercise_attempts;
CREATE TRIGGER on_exercise_attempt_insert
  AFTER INSERT ON public.exercise_attempts
  FOR EACH ROW EXECUTE FUNCTION public.increment_exercise_usage();

-- 8. Trigger لتحديث has_content تلقائياً عند نشر درس
CREATE OR REPLACE FUNCTION public.update_lesson_has_content()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.content_status = 'published' THEN
    NEW.has_content := true;
    NEW.content_updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_lesson_content_status_change ON public.lessons;
CREATE TRIGGER on_lesson_content_status_change
  BEFORE UPDATE OF content_status ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_lesson_has_content();
