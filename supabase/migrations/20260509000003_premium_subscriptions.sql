-- 1. Add is_premium to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- 2. Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id SERIAL PRIMARY KEY,
    free_exam_limit INTEGER DEFAULT 3,
    enable_exam_limit BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default row if not exists
INSERT INTO public.system_settings (id, free_exam_limit, enable_exam_limit)
SELECT 1, 3, true
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE id = 1);

-- 3. Ensure answers_viewed_at exists in exam_attempts
ALTER TABLE public.exam_attempts ADD COLUMN IF NOT EXISTS answers_viewed_at TIMESTAMP WITH TIME ZONE;

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
    v_is_premium BOOLEAN := false;
    v_limit_enabled BOOLEAN := true;
    v_free_limit INTEGER := 3;
BEGIN
    v_student_id := COALESCE(p_student_id, auth.uid());
    
    -- Fetch settings
    SELECT enable_exam_limit, free_exam_limit INTO v_limit_enabled, v_free_limit
    FROM public.system_settings WHERE id = 1;
    
    -- Fetch profile premium status
    SELECT is_premium INTO v_is_premium FROM public.profiles WHERE id = v_student_id;
    IF v_is_premium IS NULL THEN v_is_premium := false; END IF;
    
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
    IF v_limit_enabled AND NOT v_is_premium THEN
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
