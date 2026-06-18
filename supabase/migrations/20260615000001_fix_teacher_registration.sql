-- =====================================================
-- Migration: 20260615000001_fix_teacher_registration.sql
-- Description: إصلاح تسجيل حسابات المعلمين
--
-- المشكلة:
--   1. trigger `handle_new_user` كان يفرض دور 'student' دائماً
--      مما يمنع المعلمين من التسجيل بدورهم الصحيح.
--   2. trigger `prevent_profile_role_update` كان يمنع تعديل الدور
--      حتى من خلال service_role، مما يمنع callback جوجل من
--      تعيين الدور الصحيح.
--
-- الحل:
--   1. تعديل `handle_new_user` للسماح بـ 'teacher' فقط من الـ metadata
--      مع الإبقاء على حظر 'admin' و 'school_admin' لمنع ثغرات الترقية.
--   2. تعديل `prevent_profile_role_update` للسماح لـ service_role
--      بتغيير الدور (مطلوب لـ callback جوجل ودعوات المدارس).
-- =====================================================

-- =====================================================
-- الإصلاح 1: تحديث دالة handle_new_user
-- نسمح بدور 'teacher' من الـ metadata، لكن نحظر دائماً
-- أدوار الامتياز العالية (admin, school_admin)
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_requested_role TEXT;
  v_safe_role TEXT;
BEGIN
  -- استخراج الدور المطلوب من البيانات الوصفية
  v_requested_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');

  -- 🔒 الأمان الحرج: نسمح فقط بـ 'student' أو 'teacher'
  -- أي دور آخر (admin, school_admin, etc.) يُحوَّل قسراً إلى 'student'
  IF v_requested_role IN ('student', 'teacher') THEN
    v_safe_role := v_requested_role;
  ELSE
    v_safe_role := 'student';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    v_safe_role
  )
  ON CONFLICT (id) DO NOTHING; -- تجنب خطأ إذا كان البروفايل موجوداً مسبقاً

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- الإصلاح 2: تحديث trigger منع تعديل الأدوار
-- نسمح لـ service_role بتعديل الدور (لـ Google OAuth callback
-- ودعوات المدارس وعمليات الأدمن)
-- ونحظر ذلك على المستخدمين العاديين فقط
-- =====================================================
CREATE OR REPLACE FUNCTION public.prevent_profile_role_update()
RETURNS TRIGGER AS $$
BEGIN
  -- السماح لـ service_role بأي تعديل (الأدمن، callbacks، دعوات المدارس)
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- 🔒 حظر تعديل الدور من طرف المستخدمين العاديين
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Role column is read-only for non-admin users';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- التأكد من وجود الـ trigger (إعادة إنشاؤه للتأكد)
DROP TRIGGER IF EXISTS tr_prevent_profile_role_update ON public.profiles;
CREATE TRIGGER tr_prevent_profile_role_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_update();

-- =====================================================
-- إضافة سياسة INSERT للمستخدمين الجدد على جدول profiles
-- مطلوبة للسماح للمستخدم بإنشاء بروفايله عند التسجيل
-- (قبل تفعيل الـ trigger)
-- =====================================================
DROP POLICY IF EXISTS "Allow authenticated users to insert own profile" ON public.profiles;
CREATE POLICY "Allow authenticated users to insert own profile" ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- سياسة للسماح لـ service_role بالقراءة والكتابة الكاملة
-- مطلوبة لـ Server Actions و API Routes الداخلية
-- =====================================================
DROP POLICY IF EXISTS "Service role full access to profiles" ON public.profiles;
CREATE POLICY "Service role full access to profiles" ON public.profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- إضافة سياسة INSERT للمعلمين على جدول teachers
-- مطلوبة عند تسجيل المعلم لأول مرة
-- =====================================================
DROP POLICY IF EXISTS "Teachers can insert own record" ON public.teachers;
CREATE POLICY "Teachers can insert own record" ON public.teachers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- التحقق من أن السياسات موجودة على teachers للتحديث
-- =====================================================
DROP POLICY IF EXISTS "Teachers can update own data" ON public.teachers;
CREATE POLICY "Teachers can update own data" ON public.teachers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
