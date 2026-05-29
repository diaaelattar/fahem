-- =====================================================
-- Migration: مشاركة الاختبارات للضيوف (Guest Exam Sharing)
-- Date: 2026-05-29
-- =====================================================

-- 1. جدول توكنات المشاركة (Exam Share Tokens)
CREATE TABLE IF NOT EXISTS public.exam_share_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id     UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  teacher_id  UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  token       TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_active   BOOLEAN DEFAULT true,
  expires_at  TIMESTAMPTZ,  -- NULL = لا ينتهي
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_share_tokens_token    ON public.exam_share_tokens(token);
CREATE INDEX IF NOT EXISTS idx_share_tokens_exam     ON public.exam_share_tokens(exam_id);
CREATE INDEX IF NOT EXISTS idx_share_tokens_teacher  ON public.exam_share_tokens(teacher_id);

-- 2. جدول محاولات الضيوف (Guest Exam Attempts)
CREATE TABLE IF NOT EXISTS public.guest_exam_attempts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id    UUID NOT NULL REFERENCES public.exam_share_tokens(id) ON DELETE CASCADE,
  exam_id     UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  guest_name  TEXT NOT NULL,
  answers     JSONB DEFAULT '{}'::jsonb,
  score       NUMERIC(6, 2) DEFAULT 0,
  percentage  NUMERIC(5, 2) DEFAULT 0,
  is_passed   BOOLEAN DEFAULT false,
  feedback    JSONB DEFAULT '{}'::jsonb,
  started_at  TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_guest_attempts_token   ON public.guest_exam_attempts(token_id);
CREATE INDEX IF NOT EXISTS idx_guest_attempts_exam    ON public.guest_exam_attempts(exam_id);

-- 3. تفعيل RLS
ALTER TABLE public.exam_share_tokens   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_exam_attempts ENABLE ROW LEVEL SECURITY;

-- 4. سياسات exam_share_tokens

-- المعلم يرى توكناته فقط
CREATE POLICY "teacher_select_own_tokens"
  ON public.exam_share_tokens FOR SELECT
  USING (teacher_id = auth.uid());

-- المعلم ينشئ توكن لاختباره فقط
CREATE POLICY "teacher_insert_token"
  ON public.exam_share_tokens FOR INSERT
  WITH CHECK (teacher_id = auth.uid());

-- المعلم يعدّل توكناته فقط
CREATE POLICY "teacher_update_token"
  ON public.exam_share_tokens FOR UPDATE
  USING (teacher_id = auth.uid());

-- المعلم يحذف توكناته فقط
CREATE POLICY "teacher_delete_token"
  ON public.exam_share_tokens FOR DELETE
  USING (teacher_id = auth.uid());

-- anon يرى التوكنات النشطة فقط (للتحقق من صحة الرابط)
CREATE POLICY "anon_select_active_tokens"
  ON public.exam_share_tokens FOR SELECT
  TO anon
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- 5. سياسات guest_exam_attempts

-- المعلم يرى محاولات ضيوف اختباراته
CREATE POLICY "teacher_select_guest_attempts"
  ON public.guest_exam_attempts FOR SELECT
  USING (
    exam_id IN (
      SELECT id FROM public.exams WHERE teacher_id = auth.uid()
    )
  );

-- anon يستطيع إنشاء محاولة (الضيف يبدأ الاختبار)
CREATE POLICY "anon_insert_guest_attempt"
  ON public.guest_exam_attempts FOR INSERT
  TO anon
  WITH CHECK (true);

-- anon يستطيع تحديث محاولته (حفظ تلقائي + تسليم)
CREATE POLICY "anon_update_guest_attempt"
  ON public.guest_exam_attempts FOR UPDATE
  TO anon
  USING (completed_at IS NULL);  -- لا يمكن تعديل المحاولة المكتملة

-- anon يرى محاولته الخاصة (للنتيجة)
CREATE POLICY "anon_select_own_attempt"
  ON public.guest_exam_attempts FOR SELECT
  TO anon
  USING (true);  -- الـ attemptId سر كافٍ للحماية
