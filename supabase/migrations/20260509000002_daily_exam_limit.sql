-- تقييد الطالب بأداء 3 اختبارات فقط للمادة الواحدة يومياً (للحفاظ على باقات الذكاء الاصطناعي المجانية)

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
BEGIN
    v_student_id := COALESCE(p_student_id, auth.uid());
    
    -- جلب بيانات الاختبار
    SELECT * INTO v_exam FROM public.exams WHERE id = p_exam_id;
    IF NOT FOUND THEN RETURN json_build_object('can_attempt', false, 'reason', 'الاختبار غير موجود'); END IF;
    
    -- التحقق من النشر
    IF NOT v_exam.is_published THEN RETURN json_build_object('can_attempt', false, 'reason', 'الاختبار غير منشور بعد'); END IF;
    
    -- التحقق مما إذا كان الطالب قد اطلع على الإجابات في أي محاولة سابقة لهذا الاختبار
    SELECT EXISTS (
        SELECT 1 FROM public.exam_attempts 
        WHERE exam_id = p_exam_id AND student_id = v_student_id AND answers_viewed_at IS NOT NULL
    ) INTO v_viewed_answers;
    
    IF v_viewed_answers THEN
        RETURN json_build_object('can_attempt', false, 'reason', 'عفواً، لا يمكن إعادة المحاولة لأنك قمت بالاطلاع على الإجابات النموذجية لمراجعتها.');
    END IF;

    -- التحقق من الفترة الزمنية
    IF v_exam.available_from IS NOT NULL AND NOW() < v_exam.available_from THEN
        RETURN json_build_object('can_attempt', false, 'reason', 'الاختبار لم يبدأ بعد', 'starts_at', v_exam.available_from);
    END IF;
    
    IF v_exam.available_until IS NOT NULL AND NOW() > v_exam.available_until THEN
        RETURN json_build_object('can_attempt', false, 'reason', 'انتهت فترة الاختبار');
    END IF;
    
    -- حساب عدد المحاولات للاختبار الحالي
    SELECT COUNT(*) INTO v_attempt_count FROM public.exam_attempts WHERE exam_id = p_exam_id AND student_id = v_student_id;
    
    -- التحقق من الحد الأقصى للمحاولات للاختبار
    IF v_exam.allowed_attempts != -1 AND v_attempt_count >= v_exam.allowed_attempts THEN
        RETURN json_build_object('can_attempt', false, 'reason', 'لقد استنفذت جميع المحاولات المتاحة', 'attempts_used', v_attempt_count, 'attempts_allowed', v_exam.allowed_attempts);
    END IF;
    
    -- التحقق من وجود محاولة جارية لنفس الاختبار (يُسمح بالاستكمال)
    SELECT * INTO v_last_attempt FROM public.exam_attempts WHERE exam_id = p_exam_id AND student_id = v_student_id AND completed_at IS NULL ORDER BY started_at DESC LIMIT 1;
    
    IF FOUND THEN
        RETURN json_build_object('can_attempt', true, 'has_ongoing', true, 'attempt_id', v_last_attempt.id, 'started_at', v_last_attempt.started_at);
    END IF;

    -- [الجديد] التحقق من حد 3 اختبارات للمادة في اليوم
    -- يتم حساب المحاولات (المكتملة أو الجارية) التي بدأها الطالب اليوم في نفس المادة
    SELECT COUNT(*) INTO v_daily_subject_attempts 
    FROM public.exam_attempts ea
    JOIN public.exams e ON e.id = ea.exam_id
    WHERE ea.student_id = v_student_id 
      AND e.subject_id = v_exam.subject_id
      AND DATE(ea.started_at) = CURRENT_DATE;

    IF v_daily_subject_attempts >= 3 THEN
        RETURN json_build_object('can_attempt', false, 'reason', 'نظراً لوجود ضغط على الأنظمة المجانية، يُسمح لك بأداء 3 اختبارات كحد أقصى للمادة الواحدة يومياً. يرجى المحاولة غداً!');
    END IF;
    
    RETURN json_build_object('can_attempt', true, 'has_ongoing', false, 'attempts_used', v_attempt_count, 'attempts_remaining', CASE WHEN v_exam.allowed_attempts = -1 THEN -1 ELSE v_exam.allowed_attempts - v_attempt_count END);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
