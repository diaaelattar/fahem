-- =====================================================
-- Migration: 20260528000001_fix_teacher_student_rls.sql
-- Description: إصلاح صلاحيات المعلمين لرؤية بيانات الطلاب وإضافتهم للمجموعات
-- =====================================================

-- 1. تمكين المعلمين من رؤية الملفات الشخصية للطلاب للبحث عنهم وعرضهم في قائمة المجموعة
DROP POLICY IF EXISTS "Teachers view student profiles" ON public.profiles;
CREATE POLICY "Teachers view student profiles" ON public.profiles
    FOR SELECT USING (
        (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher'))
        AND role = 'student'
    );

-- 2. تمكين المعلمين من رؤية بيانات جدول الطلاب (students)
DROP POLICY IF EXISTS "Teachers view students data" ON public.students;
CREATE POLICY "Teachers view students data" ON public.students
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'teacher'
        )
    );

-- 3. تمكين المعلمين من إضافة طلاب إلى المجموعات التي يملكونها
DROP POLICY IF EXISTS "المعلم يضيف طلاب لمجموعاته" ON public.group_students;
CREATE POLICY "المعلم يضيف طلاب لمجموعاته" ON public.group_students
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.student_groups
            WHERE id = group_id AND teacher_id = auth.uid()
        )
    );
