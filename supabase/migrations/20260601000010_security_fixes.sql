-- =====================================================
-- Migration: 20260601000010_security_fixes.sql
-- Description: إصلاحات أمنية حرجة موثقة في مراجعة الكود
--   1. ثغرة Privilege Escalation في handle_new_user Trigger
--   2. بيانات المعلمين مكشوفة للـ anon
--   3. guest_exam_attempts — SELECT مفتوح + حد الإنشاء
--   4. RLS المدارس تستعلم profiles بدل admins
--   5. جدول ip_rate_limits لـ Rate Limiting المركزي
-- =====================================================

-- ===================================================
-- الإصلاح 1: ثغرة Privilege Escalation في handle_new_user
-- المشكلة: الكود القديم يقبل role من raw_user_meta_data مما يتيح
--          لأي شخص التسجيل كـ admin
-- ===================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 🔒 الأمان الحرج: الدور دائماً 'student' عند التسجيل
    -- لا يُثق أبداً بـ raw_user_meta_data->>'role' من الخارج
    -- الترقية لـ admin/teacher/school_admin تتم فقط عبر service role من لوحة تحكم Supabase
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'student'  -- 🔒 Fixed: never trust external role claim
    )
    ON CONFLICT (id) DO NOTHING; -- تجنب خطأ إذا كان البروفايل موجوداً مسبقاً
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================
-- الإصلاح 2: بيانات المعلمين — تقييد الوصول للـ anon
-- المشكلة: phone_number و school_name مكشوفان لأي زائر
-- ===================================================

-- حذف السياسة المفتوحة القديمة
DROP POLICY IF EXISTS "الجميع يرى بيانات المعلمين الأساسية" ON public.teachers;

-- سياسة جديدة: المعلم يرى بياناته الكاملة، المسجلون يرون بيانات محدودة
CREATE POLICY "teachers_select_authenticated" ON public.teachers FOR SELECT 
  TO authenticated
  USING (true);
  -- ملاحظة: تقييد الأعمدة الحساسة يتم على مستوى الـ API لا RLS

-- المعلم نفسه والأدمن: صلاحيات كاملة
-- (هذه السياسة موجودة مسبقاً: "المعلم يدير بياناته")

-- منع anon من رؤية أي بيانات
CREATE POLICY "teachers_no_anon_access" ON public.teachers FOR SELECT
  TO anon
  USING (false);

-- ===================================================
-- الإصلاح 3A: guest_exam_attempts — إغلاق SELECT المفتوح للـ anon
-- المشكلة: USING (true) يكشف كل المحاولات لأي زائر عارف UUID
-- ===================================================
DROP POLICY IF EXISTS "anon_select_own_attempt" ON public.guest_exam_attempts;

-- لا يوجد SELECT للـ anon — النتائج تُرجع فقط عبر Server API
-- الـ API Route يتحقق من token_id قبل إرجاع البيانات

-- ===================================================
-- الإصلاح 3B: guest_exam_attempts — حد 10 محاولات لكل token
-- المشكلة: مهاجم يُنشئ ملايين المحاولات → DoS على DB
-- ===================================================
DROP POLICY IF EXISTS "anon_insert_guest_attempt" ON public.guest_exam_attempts;

CREATE POLICY "anon_insert_guest_attempt_limited"
  ON public.guest_exam_attempts FOR INSERT
  TO anon
  WITH CHECK (
    -- التوكن يجب أن يكون نشطاً وصالحاً
    EXISTS (
      SELECT 1 FROM public.exam_share_tokens t
      WHERE t.id = token_id
        AND t.is_active = true
        AND (t.expires_at IS NULL OR t.expires_at > NOW())
    )
    -- حد أقصى 10 محاولات لكل token للحماية من DoS
    AND (
      SELECT COUNT(*) 
      FROM public.guest_exam_attempts 
      WHERE token_id = guest_exam_attempts.token_id
    ) < 10
  );

-- ===================================================
-- الإصلاح 4: RLS المدارس — استخدام is_admin() بدل profiles
-- المشكلة: استعلام profiles.role قابل للتلاعب في حالات نادرة
-- ===================================================
DROP POLICY IF EXISTS "الأدمن العام يدير المدارس" ON public.schools;

CREATE POLICY "admin_manage_schools" ON public.schools FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ===================================================
-- الإصلاح 5: جدول ip_rate_limits لـ Rate Limiting المركزي
-- يحل مشكلة Memory-based Rate Limiter في بيئات Serverless
-- ===================================================
CREATE TABLE IF NOT EXISTS public.ip_rate_limits (
  id          BIGSERIAL PRIMARY KEY,
  ip_address  TEXT NOT NULL,
  endpoint    TEXT NOT NULL DEFAULT 'auth',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- فهرس للبحث السريع وتصفية الوقت
CREATE INDEX IF NOT EXISTS idx_ip_rate_limits_lookup 
  ON public.ip_rate_limits(ip_address, endpoint, created_at);

-- تفعيل RLS
ALTER TABLE public.ip_rate_limits ENABLE ROW LEVEL SECURITY;

-- فقط service role يكتب (عبر rate-limiter.ts)
CREATE POLICY "service_role_manage_rate_limits" ON public.ip_rate_limits
  FOR ALL USING (false); -- لا أحد يصل إلا عبر SECURITY DEFINER functions

-- دالة ذرية للتحقق من Rate Limit وتسجيله
CREATE OR REPLACE FUNCTION public.check_and_log_ip_rate_limit(
  p_ip       TEXT,
  p_endpoint TEXT DEFAULT 'auth',
  p_limit    INTEGER DEFAULT 20,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS JSON AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count        INTEGER;
  v_allowed      BOOLEAN;
BEGIN
  v_window_start := NOW() - (p_window_seconds || ' seconds')::INTERVAL;
  
  -- حساب الطلبات في النافذة الزمنية
  SELECT COUNT(*) INTO v_count
  FROM public.ip_rate_limits
  WHERE ip_address = p_ip
    AND endpoint   = p_endpoint
    AND created_at >= v_window_start;
  
  v_allowed := v_count < p_limit;
  
  -- تسجيل الطلب إذا كان مسموحاً
  IF v_allowed THEN
    INSERT INTO public.ip_rate_limits (ip_address, endpoint) 
    VALUES (p_ip, p_endpoint);
    v_count := v_count + 1;
  END IF;
  
  RETURN json_build_object(
    'allowed',    v_allowed,
    'count',      v_count,
    'limit',      p_limit,
    'remaining',  GREATEST(0, p_limit - v_count)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تنظيف تلقائي للسجلات القديمة (أكثر من ساعة) لتوفير المساحة
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.ip_rate_limits
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
