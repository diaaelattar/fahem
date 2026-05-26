-- ===================================================
-- Migration: 20260601000001_ai_quota_system.sql
-- Description: نظام حماية كوتا (Rate Limiting) واستهلاك الـ AI للطلاب والمعلمين
-- ===================================================

-- 1. إضافة عمود الحد اليومي المجاني لعمليات الذكاء الاصطناعي في الإعدادات العامة
ALTER TABLE public.system_settings 
  ADD COLUMN IF NOT EXISTS free_ai_limit INTEGER DEFAULT 5;

-- 2. إنشاء جدول سجل استهلاك ميزات الذكاء الاصطناعي (ai_usage_logs)
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    api_route TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. تفعيل الفهارس لتسريع الاستعلامات والفلترة اليومية
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON public.ai_usage_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_route ON public.ai_usage_logs(api_route);

-- 4. تفعيل سياسات الحماية RLS لجدول السجلات الجديد
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- سياسات RLS:
-- المستخدم يرى سجل استهلاكه فقط
DROP POLICY IF EXISTS "Users view their own AI usage logs" ON public.ai_usage_logs;
CREATE POLICY "Users view their own AI usage logs" ON public.ai_usage_logs
  FOR SELECT USING (user_id = auth.uid());

-- المسؤول (Admin) يملك صلاحيات كاملة لرؤية ومسح السجلات للتحليل
DROP POLICY IF EXISTS "Admins manage all AI usage logs" ON public.ai_usage_logs;
CREATE POLICY "Admins manage all AI usage logs" ON public.ai_usage_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
  );

-- 5. إنشاء دالة التحقق الذري (Atomic Check & Log) لكوتا الاستخدام اليومي للـ AI
CREATE OR REPLACE FUNCTION public.check_and_log_ai_usage(
    p_user_id UUID,
    p_api_route TEXT
)
RETURNS JSON AS $$
DECLARE
    v_is_premium BOOLEAN := false;
    v_free_limit INTEGER := 5;
    v_daily_limit INTEGER;
    v_current_usage INTEGER;
    v_allowed BOOLEAN := false;
    v_role TEXT := 'student';
BEGIN
    -- 1. جلب رتبة وحالة اشتراك المستخدم
    SELECT is_premium, role INTO v_is_premium, v_role 
    FROM public.profiles 
    WHERE id = p_user_id;
    
    IF v_is_premium IS NULL THEN v_is_premium := false; END IF;
    IF v_role IS NULL THEN v_role := 'student'; END IF;

    -- 2. جلب الحد اليومي المجاني العام من الإعدادات
    SELECT free_ai_limit INTO v_free_limit 
    FROM public.system_settings WHERE id = 1;
    IF v_free_limit IS NULL THEN v_free_limit := 5; END IF;

    -- 3. تحديد الحد الكلي للمستخدم الحالي:
    -- المعلمون والأدمنز لهم حد مرتفع جداً (100 عملية يومياً) لتسهيل العمل والتدريس
    -- الطلاب المميزون (Premium) لهم حد مرتفع جداً (100 عملية يومياً) لمنع إساءة الاستخدام الآلي
    -- الطلاب المجانيون لهم الحد العام المحدد (v_free_limit)
    IF v_role = 'admin' OR v_role = 'teacher' OR v_is_premium THEN
        v_daily_limit := 100;
    ELSE
        v_daily_limit := v_free_limit;
    END IF;

    -- 4. حساب استهلاك المستخدم في اليوم الحالي (UTC)
    SELECT COUNT(*) INTO v_current_usage 
    FROM public.ai_usage_logs 
    WHERE user_id = p_user_id 
      AND DATE(created_at) = CURRENT_DATE;

    -- 5. التحقق من إمكانية إجراء العملية
    IF v_current_usage < v_daily_limit THEN
        v_allowed := true;
        
        -- تسجيل استهلاك العملية
        INSERT INTO public.ai_usage_logs (user_id, api_route)
        VALUES (p_user_id, p_api_route);
        
        v_current_usage := v_current_usage + 1;
    END IF;

    -- 6. إرجاع النتيجة بتنسيق JSON مفصل
    RETURN json_build_object(
        'allowed', v_allowed,
        'limit', v_daily_limit,
        'usage', v_current_usage,
        'remaining', GREATEST(0, v_daily_limit - v_current_usage),
        'is_premium', v_is_premium,
        'role', v_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
