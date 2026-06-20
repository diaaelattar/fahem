-- =====================================================
-- Migration: 20260620000001_auth_metadata_sync.sql
-- Description: مزامنة الأدوار وحالة الـ Onboarding لـ auth.users لتفادي استعلامات الـ Middleware
-- =====================================================

-- 1. دالة مساعدة للتحقق من دور الطالب دون التسبب في تكرار لانهائي
CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.uid() IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM public.students
            WHERE id = auth.uid()
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. تريجر لمزامنة الدور (role) من profiles إلى auth.users metadata
CREATE OR REPLACE FUNCTION public.sync_profile_role_to_auth()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role)
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_profile_role ON public.profiles;
CREATE TRIGGER tr_sync_profile_role
AFTER INSERT OR UPDATE OF role ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role_to_auth();

-- 3. تريجر لمزامنة الصف الدراسي (grade_id) من students إلى auth.users metadata
CREATE OR REPLACE FUNCTION public.sync_student_grade_to_auth()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('grade_id', NEW.grade_id)
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_student_grade ON public.students;
CREATE TRIGGER tr_sync_student_grade
AFTER INSERT OR UPDATE OF grade_id ON public.students
FOR EACH ROW EXECUTE FUNCTION public.sync_student_grade_to_auth();

-- 4. تريجر لمزامنة المادة الدراسية (subject_id) من teachers إلى auth.users metadata
CREATE OR REPLACE FUNCTION public.sync_teacher_subject_to_auth()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('subject_id', NEW.subject_id)
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_teacher_subject ON public.teachers;
CREATE TRIGGER tr_sync_teacher_subject
AFTER INSERT OR UPDATE OF subject_id ON public.teachers
FOR EACH ROW EXECUTE FUNCTION public.sync_teacher_subject_to_auth();

-- 5. مزامنة البيانات الحالية لجميع المستخدمين المسجلين مسبقاً في المنصة
UPDATE auth.users u
SET raw_user_meta_data = COALESCE(u.raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', p.role)
FROM public.profiles p
WHERE u.id = p.id;

UPDATE auth.users u
SET raw_user_meta_data = COALESCE(u.raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('grade_id', s.grade_id)
FROM public.students s
WHERE u.id = s.id AND s.grade_id IS NOT NULL;

UPDATE auth.users u
SET raw_user_meta_data = COALESCE(u.raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('subject_id', t.subject_id)
FROM public.teachers t
WHERE u.id = t.id AND t.subject_id IS NOT NULL;
