-- =====================================================
-- Migration: 20260503000002_fix_student_rls.sql
-- Description: إصلاح صلاحيات الطلاب لتعديل بياناتهم عند التسجيل
-- =====================================================

CREATE POLICY "Students update own data" ON public.students
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Students insert own data" ON public.students
    FOR INSERT WITH CHECK (id = auth.uid());
