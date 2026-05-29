-- =====================================================
-- Migration: 20260606000001_admin_teachers_rls.sql
-- Description: السماح للمديرين (Admins) بإدارة جدول المعلمين، المجموعات، والطلاب المنضمين بالكامل
-- =====================================================

-- 1. السماح للمديرين بالتحكم في جدول المعلمين (التوثيق، التعديل، إلخ)
DROP POLICY IF EXISTS "Admins manage teachers" ON public.teachers;
CREATE POLICY "Admins manage teachers" ON public.teachers
    FOR ALL USING (public.is_admin());

-- 2. السماح للمديرين بالتحكم ورؤية جميع المجموعات الدراسية (النشطة وغير النشطة)
DROP POLICY IF EXISTS "Admins manage student_groups" ON public.student_groups;
CREATE POLICY "Admins manage student_groups" ON public.student_groups
    FOR ALL USING (public.is_admin());

-- 3. السماح للمديرين بالتحكم ورؤية جميع الطلاب المنضمين للمجموعات
DROP POLICY IF EXISTS "Admins manage group_students" ON public.group_students;
CREATE POLICY "Admins manage group_students" ON public.group_students
    FOR ALL USING (public.is_admin());
