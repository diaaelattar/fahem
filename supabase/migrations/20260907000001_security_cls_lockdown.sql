-- =====================================================
-- Migration: 20260907000001_security_cls_lockdown.sql
-- Description: التحصين الأمني الصارم ومنع تسريب الإجابات النموذجية للطلاب
-- =====================================================

-- 1. التأكد من وجود الأعمدة لضمان التوافق التام دون أي أخطاء
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS teacher_id UUID;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS context_passage TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS image_position TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS bloom_level TEXT;

-- 2. إسقاط السياسات القديمة التي كانت تتيح للطلاب قراءة عمود الإجابات
DROP POLICY IF EXISTS "Students view questions through exam links" ON public.questions;
DROP POLICY IF EXISTS "Students read exam questions" ON public.questions;
DROP POLICY IF EXISTS "Public read questions" ON public.questions;

-- 3. تأكيد تفعيل RLS على جدول الأسئلة
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- 4. صلاحيات كاملة للإدارة فقط
DROP POLICY IF EXISTS "Admins manage all questions" ON public.questions;
CREATE POLICY "Admins manage all questions" ON public.questions
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 5. صلاحيات المعلمين لإدارة وقراءة أسئلتهم والأسئلة المعتمدة
DROP POLICY IF EXISTS "Teachers manage own questions" ON public.questions;
CREATE POLICY "Teachers manage own questions" ON public.questions
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher')
        AND (is_approved = true OR teacher_id = auth.uid() OR admin_id = auth.uid())
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher')
        AND (teacher_id = auth.uid() OR admin_id = auth.uid())
    );

-- 6. إنشاء Secure View مخصص للطلاب خالي تماماً من عمود correct_answer
CREATE OR REPLACE VIEW public.student_exam_questions 
WITH (security_barrier = true) AS
SELECT 
    q.id,
    q.subject_id,
    q.grade_id,
    q.question_type,
    q.question_text,
    q.question_image_url,
    q.image_position,
    q.options,
    q.points,
    q.context_passage,
    q.bloom_level,
    q.difficulty_level,
    eq.exam_id,
    eq.question_order,
    COALESCE(eq.points_override, q.points, 1) AS effective_points
FROM public.questions q
JOIN public.exam_questions eq ON eq.question_id = q.id
JOIN public.exams e ON e.id = eq.exam_id
WHERE e.is_published = true;

-- 7. منح صلاحية القراءة للطلاب على العرض المعزول
GRANT SELECT ON public.student_exam_questions TO authenticated;
