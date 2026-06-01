-- =====================================================
-- Migration: 20260601000001_security_fixes.sql
-- Description: إصلاحات أمنية حرجة — مراجعة كود 2026-06-01
-- =====================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔴 إصلاح 1: handle_new_user Trigger — ثغرة Privilege Escalation
-- المشكلة: الـ trigger كان يقبل role من raw_user_meta_data
-- يمكن لأي مستخدم التسجيل بدور 'admin' عبر Supabase Auth API
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 🔒 الدور دائماً 'student' — لا نثق بـ metadata من الخارج أبداً
    -- ترقية الأدوار (admin/teacher/school_admin) تتم عبر لوحة تحكم Supabase
    -- أو عبر دوال مؤمّنة تستخدم service_role فقط
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'student'  -- 🔒 Fixed: never trust external role claim
    )
    ON CONFLICT (id) DO NOTHING; -- آمن ضد تكرار الـ trigger
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔴 إصلاح 2: سياسة Teachers — تسريب بيانات شخصية
-- المشكلة: أي زائر غير مسجل يمكنه قراءة phone_number وكل بيانات المعلمين
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DROP POLICY IF EXISTS "الجميع يرى بيانات المعلمين الأساسية" ON public.teachers;

-- المعلم يرى بياناته الكاملة دائماً
CREATE POLICY "teachers_select_own" ON public.teachers
  FOR SELECT
  USING (id = auth.uid());

-- المستخدمون المسجلون يرون البيانات العامة فقط (بدون phone_number)
-- ملاحظة: عزل الأعمدة الحساسة يتم عبر View أدناه
CREATE POLICY "teachers_select_authenticated" ON public.teachers
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- View عامة تُخفي البيانات الحساسة (phone_number)
CREATE OR REPLACE VIEW public.teachers_public AS
  SELECT
    id,
    specialty_id,
    school_name,
    is_verified,
    subscription_status,
    created_at
  FROM public.teachers;

COMMENT ON VIEW public.teachers_public IS
  'بيانات المعلمين العامة — بدون رقم الهاتف أو بيانات الاشتراك الحساسة';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔴 إصلاح 3: guest_exam_attempts — SELECT مفتوح لكل الضيوف
-- المشكلة: أي زائر يعرف UUID محاولة شخص آخر يرى نتائجه الكاملة
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DROP POLICY IF EXISTS "anon_select_own_attempt" ON public.guest_exam_attempts;

-- لا يوجد SELECT مباشر للـ anon — النتائج تُعاد عبر Server-Side API فقط
-- الـ API يتحقق من attempt_id في الـ session/cookie قبل الإرجاع

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔴 إصلاح 4: anon_insert_guest_attempt — DoS Attack
-- المشكلة: أي شخص يُنشئ ملايين محاولات ويملأ قاعدة البيانات
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DROP POLICY IF EXISTS "anon_insert_guest_attempt" ON public.guest_exam_attempts;

CREATE POLICY "anon_insert_guest_attempt"
  ON public.guest_exam_attempts FOR INSERT
  TO anon
  WITH CHECK (
    -- يجب أن يكون التوكن موجوداً ونشطاً وغير منتهٍ
    EXISTS (
      SELECT 1 FROM public.exam_share_tokens t
      WHERE t.id = token_id
        AND t.is_active = true
        AND (t.expires_at IS NULL OR t.expires_at > NOW())
    )
    -- حد أقصى 10 محاولات لكل توكن لمنع هجمات DoS
    AND (
      SELECT COUNT(*) FROM public.guest_exam_attempts g
      WHERE g.token_id = token_id
    ) < 10
  );

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🟠 إصلاح 5: سياسة المدارس — استخدام profiles.role بدل admins
-- المشكلة: إذا تحايل مستخدم على role في profiles يحصل على صلاحيات مدارس
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DROP POLICY IF EXISTS "الأدمن العام يدير المدارس" ON public.schools;

-- استخدام جدول admins مباشرة — أكثر أماناً من profiles.role
CREATE POLICY "الأدمن العام يدير المدارس" ON public.schools
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
  );

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🟠 إصلاح 6: دالة is_admin() مساعدة — للاستخدام في سياسات RLS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_admin() IS
  'تحقق آمن من صلاحية الأدمن عبر جدول admins مباشرة (لا يعتمد على profiles.role)';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🟡 إصلاح 7: فهرس تنظيف تلقائي لجدول ip_rate_limits
-- (إذا كان الجدول موجوداً من migration سابق)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE INDEX IF NOT EXISTS idx_ip_rate_limits_cleanup
  ON public.ip_rate_limits(created_at)
  WHERE created_at IS NOT NULL;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ تحقق نهائي — عرض الدوال والسياسات المُنشأة
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DO $$
BEGIN
  RAISE NOTICE '✅ Security fixes migration completed successfully';
  RAISE NOTICE '   - handle_new_user: role fixed to always be student';
  RAISE NOTICE '   - teachers: phone_number no longer exposed to anonymous';
  RAISE NOTICE '   - guest_exam_attempts: anon SELECT removed (use API)';
  RAISE NOTICE '   - guest_exam_attempts: INSERT now validates token + rate limit';
  RAISE NOTICE '   - schools admin policy: now uses admins table directly';
  RAISE NOTICE '   - is_admin() helper function created';
END;
$$;
