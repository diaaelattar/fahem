-- =====================================================
-- Migration: 20260529000002_fix_profiles_rls_recursion.sql
-- Description: حل مشكلة التكرار اللانهائي (Infinite Recursion) في سياسات RLS لجدول public.profiles
-- =====================================================

-- 1. تحديث دالة public.is_admin لتعتمد على جدول admins بدلاً من profiles لتجنب التكرار اللانهائي
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.uid() IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE id = auth.uid()
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. إنشاء دالة public.is_teacher لتعتمد على جدول teachers بدلاً من profiles
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.uid() IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM public.teachers
            WHERE id = auth.uid()
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. إعادة إنشاء سياسة "Teachers view student profiles" على جدول profiles باستخدام دالة is_teacher الجديدة
DROP POLICY IF EXISTS "Teachers view student profiles" ON public.profiles;
CREATE POLICY "Teachers view student profiles" ON public.profiles
    FOR SELECT USING (
        public.is_teacher() AND role = 'student'
    );

-- 4. إعادة إنشاء سياسة "Teachers view students data" on public.students
DROP POLICY IF EXISTS "Teachers view students data" ON public.students;
CREATE POLICY "Teachers view students data" ON public.students
    FOR SELECT USING (
        public.is_teacher()
    );

-- 5. تبسيط سياسة "Users update own profile" على جدول profiles لحذف الاستعلام الفرعي الذي كان يسبب تكراراً
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 6. إضافة trigger لمنع تغيير العمود role لزيادة الأمان كبديل عن فحص RLS السابق
CREATE OR REPLACE FUNCTION public.prevent_profile_role_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        RAISE EXCEPTION 'Role column is read-only';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_prevent_profile_role_update ON public.profiles;
CREATE TRIGGER tr_prevent_profile_role_update
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_profile_role_update();
