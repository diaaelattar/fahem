-- =====================================================
-- Migration: 20260529000003_teacher_trial_trigger.sql
-- Description: تفعيل الفترة التجريبية للمعلمين تلقائياً عند التسجيل (15 يوم) والترقية إلى Premium عند التوثيق
-- =====================================================

-- 1. دالة معالجة التحقق والاشتراك للمعلمين
CREATE OR REPLACE FUNCTION public.handle_teacher_verification_and_subscription()
RETURNS TRIGGER AS $$
BEGIN
    -- عند الإضافة (INSERT)
    IF (TG_OP = 'INSERT') THEN
        IF NEW.is_verified = true THEN
            NEW.subscription_status := 'premium';
            NEW.subscription_ends_at := NULL;
        ELSE
            NEW.subscription_status := 'trial';
            -- فترة تجريبية مدتها 15 يوماً
            NEW.subscription_ends_at := NOW() + INTERVAL '15 days';
        END IF;
    -- عند التحديث (UPDATE)
    ELSIF (TG_OP = 'UPDATE') THEN
        -- إذا تغيرت حالة التوثيق (is_verified)
        IF OLD.is_verified IS DISTINCT FROM NEW.is_verified THEN
            IF NEW.is_verified = true THEN
                NEW.subscription_status := 'premium';
                NEW.subscription_ends_at := NULL;
            ELSE
                NEW.subscription_status := 'trial';
                NEW.subscription_ends_at := NOW() + INTERVAL '15 days';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. ربط الدالة بزناد (Trigger) قبل الإضافة أو التحديث على جدول teachers
DROP TRIGGER IF EXISTS tr_handle_teacher_verification_and_subscription ON public.teachers;
CREATE TRIGGER tr_handle_teacher_verification_and_subscription
    BEFORE INSERT OR UPDATE ON public.teachers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_teacher_verification_and_subscription();
