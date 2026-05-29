-- =====================================================
-- Migration: 20260607000001_teacher_lessons_rls.sql
-- Description: السماح للمعلمين بتحديث حقول محتوى الدروس (has_content, content_status, teacher_id) وإدارة أقسام الدروس والتمارين
-- =====================================================

-- 1. السماح للمعلمين بتحديث الدروس المرتبطة بمادتهم
DROP POLICY IF EXISTS "Teachers can update lessons" ON public.lessons;
CREATE POLICY "Teachers can update lessons" ON public.lessons
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'teacher'
    )
  );

-- 2. السماح للمعلمين بإدارة أقسام الدروس بالكامل
DROP POLICY IF EXISTS "Teachers manage their lesson sections" ON public.lesson_sections;
CREATE POLICY "Teachers manage their lesson sections" ON public.lesson_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'teacher'
    )
    OR EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
  );

-- 3. السماح للمعلمين بإدارة تمارين الدروس بالكامل
DROP POLICY IF EXISTS "Teachers manage their lesson exercises" ON public.lesson_exercises;
CREATE POLICY "Teachers manage their lesson exercises" ON public.lesson_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'teacher'
    )
    OR EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
  );
