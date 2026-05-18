-- =====================================================
-- Migration: السماح للمعلمين بإنشاء الاختبارات
-- Date: 2026-05-26
-- Description: إزالة قيد NOT NULL من حقل admin_id وإضافة سياسات exam_questions
-- =====================================================

-- 1. إزالة قيد NOT NULL من حقل admin_id في جدول الاختبارات
ALTER TABLE public.exams ALTER COLUMN admin_id DROP NOT NULL;

-- 2. التحقق من إضافة قيد لضمان وجود إما admin_id أو teacher_id
ALTER TABLE public.exams 
  DROP CONSTRAINT IF EXISTS exams_owner_check;

ALTER TABLE public.exams 
  ADD CONSTRAINT exams_owner_check CHECK (admin_id IS NOT NULL OR teacher_id IS NOT NULL);

-- 3. تفعيل السماح للمعلمين بإدارة الأسئلة المرتبطة باختباراتهم
CREATE POLICY "Teachers manage their exam questions" ON public.exam_questions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.exams WHERE id = exam_questions.exam_id AND teacher_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.exams WHERE id = exam_questions.exam_id AND teacher_id = auth.uid())
);
