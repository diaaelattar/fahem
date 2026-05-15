-- 1. Create Subscription Plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar VARCHAR(255) NOT NULL,
    description_ar TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_days INTEGER NOT NULL,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Student Subscriptions table
CREATE TABLE IF NOT EXISTS public.student_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    reference_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans
CREATE POLICY "Plans are viewable by everyone" ON public.subscription_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage plans" ON public.subscription_plans FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for student_subscriptions
CREATE POLICY "Students can view own subscriptions" ON public.student_subscriptions FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Admins can manage subscriptions" ON public.student_subscriptions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for transactions
CREATE POLICY "Students can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Admins can manage transactions" ON public.transactions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Seed Default Plans
INSERT INTO public.subscription_plans (name_ar, description_ar, price, duration_days, features)
VALUES 
('الباقة الشهرية VIP', 'وصول غير محدود لجميع الاختبارات وبنك الأسئلة لمدة 30 يوماً.', 150.00, 30, '["وصول غير محدود للامتحانات", "الاطلاع على الإجابات النموذجية", "شروحات تفصيلية للأسئلة", "أولوية الدعم الفني"]'::jsonb),
('الباقة السنوية VIP', 'الخيار الأفضل! استمتع بجميع مميزات المنصة طوال العام الدراسي.', 1000.00, 365, '["وصول غير محدود طوال العام", "الاطلاع على الإجابات النموذجية", "شروحات تفصيلية للأسئلة", "مراجعات ليلة الامتحان مجاناً", "خصم 45% مقارنة بالاشتراك الشهري"]'::jsonb);

-- 4. Update can_attempt_exam function
CREATE OR REPLACE FUNCTION public.can_attempt_exam(
    p_exam_id UUID,
    p_student_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_student_id UUID;
    v_exam public.exams%ROWTYPE;
    v_attempt_count INTEGER;
    v_last_attempt public.exam_attempts%ROWTYPE;
    v_viewed_answers BOOLEAN;
    v_daily_subject_attempts INTEGER;
    
    -- Variables for settings and premium
    v_has_active_subscription BOOLEAN := false;
    v_limit_enabled BOOLEAN := true;
    v_free_limit INTEGER := 3;
BEGIN
    v_student_id := COALESCE(p_student_id, auth.uid());
    
    -- Fetch settings
    SELECT enable_exam_limit, free_exam_limit INTO v_limit_enabled, v_free_limit
    FROM public.system_settings WHERE id = 1;
    
    -- Fetch profile premium status from new subscriptions table
    SELECT EXISTS (
        SELECT 1 FROM public.student_subscriptions 
        WHERE student_id = v_student_id 
          AND status = 'active' 
          AND end_date > NOW()
    ) INTO v_has_active_subscription;
    
    -- Fallback to legacy is_premium if no active subscription (for backward compatibility)
    IF NOT v_has_active_subscription THEN
        SELECT is_premium INTO v_has_active_subscription FROM public.profiles WHERE id = v_student_id;
        IF v_has_active_subscription IS NULL THEN v_has_active_subscription := false; END IF;
    END IF;
    
    -- Fetch exam data
    SELECT * INTO v_exam FROM public.exams WHERE id = p_exam_id;
    IF NOT FOUND THEN RETURN json_build_object('can_attempt', false, 'reason', 'الاختبار غير موجود'); END IF;
    
    -- Published check
    IF NOT v_exam.is_published THEN RETURN json_build_object('can_attempt', false, 'reason', 'الاختبار غير منشور بعد'); END IF;
    
    -- Answers viewed check
    SELECT EXISTS (
        SELECT 1 FROM public.exam_attempts 
        WHERE exam_id = p_exam_id AND student_id = v_student_id AND answers_viewed_at IS NOT NULL
    ) INTO v_viewed_answers;
    
    IF v_viewed_answers THEN
        RETURN json_build_object('can_attempt', false, 'reason', 'عفواً، لا يمكن إعادة المحاولة لأنك قمت بالاطلاع على الإجابات النموذجية لمراجعتها.');
    END IF;

    -- Time period check
    IF v_exam.available_from IS NOT NULL AND NOW() < v_exam.available_from THEN
        RETURN json_build_object('can_attempt', false, 'reason', 'الاختبار لم يبدأ بعد', 'starts_at', v_exam.available_from);
    END IF;
    IF v_exam.available_until IS NOT NULL AND NOW() > v_exam.available_until THEN
        RETURN json_build_object('can_attempt', false, 'reason', 'انتهت فترة الاختبار');
    END IF;
    
    -- Attempts count for THIS exam
    SELECT COUNT(*) INTO v_attempt_count FROM public.exam_attempts WHERE exam_id = p_exam_id AND student_id = v_student_id;
    
    -- Max attempts allowed per exam check
    IF v_exam.allowed_attempts != -1 AND v_attempt_count >= v_exam.allowed_attempts THEN
        RETURN json_build_object('can_attempt', false, 'reason', 'لقد استنفذت جميع المحاولات المتاحة لهذا الاختبار', 'attempts_used', v_attempt_count, 'attempts_allowed', v_exam.allowed_attempts);
    END IF;
    
    -- Check for ongoing attempt
    SELECT * INTO v_last_attempt FROM public.exam_attempts WHERE exam_id = p_exam_id AND student_id = v_student_id AND completed_at IS NULL ORDER BY started_at DESC LIMIT 1;
    IF FOUND THEN
        RETURN json_build_object('can_attempt', true, 'has_ongoing', true, 'attempt_id', v_last_attempt.id, 'started_at', v_last_attempt.started_at);
    END IF;

    -- Premium & Global Daily Limit Check
    IF v_limit_enabled AND NOT v_has_active_subscription THEN
        SELECT COUNT(*) INTO v_daily_subject_attempts 
        FROM public.exam_attempts ea
        JOIN public.exams e ON e.id = ea.exam_id
        WHERE ea.student_id = v_student_id 
          AND e.subject_id = v_exam.subject_id
          AND DATE(ea.started_at) = CURRENT_DATE;

        IF v_daily_subject_attempts >= v_free_limit THEN
            RETURN json_build_object(
                'can_attempt', false, 
                'is_limit_reached', true,
                'reason', 'لقد استنفذت الحد الأقصى للاختبارات. يرجى ترقية حسابك إلى باقة VIP للحصول على وصول غير محدود.'
            );
        END IF;
    END IF;
    
    RETURN json_build_object('can_attempt', true, 'has_ongoing', false, 'attempts_used', v_attempt_count, 'attempts_remaining', CASE WHEN v_exam.allowed_attempts = -1 THEN -1 ELSE v_exam.allowed_attempts - v_attempt_count END);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
