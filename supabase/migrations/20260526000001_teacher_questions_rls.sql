-- =====================================================
-- Migration: السماح للمعلمين برؤية بنك الأسئلة
-- Date: 2026-05-26
-- Description: إضافة RLS Policy تسمح لمدير ومعلم النظام برؤية الأسئلة
-- =====================================================

-- السماح للمعلمين برؤية الأسئلة المعتمدة في النظام
CREATE POLICY "Teachers can view approved questions" ON public.questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
  AND (is_approved = true OR status = 'approved')
);
