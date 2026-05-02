-- 1. إضافة عمود وقت الاطلاع على الإجابات
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exam_attempts' AND column_name='answers_viewed_at') THEN
        ALTER TABLE public.exam_attempts ADD COLUMN answers_viewed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 2. دالة تسجيل الاطلاع على الإجابات
CREATE OR REPLACE FUNCTION public.mark_answers_viewed(p_attempt_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.exam_attempts 
    SET answers_viewed_at = NOW() 
    WHERE id = p_attempt_id 
    AND student_id = auth.uid()
    AND completed_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. تحديث دالة التحقق من إمكانية المحاولة (لمنع المحاولة بعد الاطلاع)
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
    
    -- حساب عدد المحاولات
    SELECT COUNT(*) INTO v_attempt_count FROM public.exam_attempts WHERE exam_id = p_exam_id AND student_id = v_student_id;
    
    -- التحقق من الحد الأقصى للمحاولات
    IF v_exam.allowed_attempts != -1 AND v_attempt_count >= v_exam.allowed_attempts THEN
        RETURN json_build_object('can_attempt', false, 'reason', 'لقد استنفذت جميع المحاولات المتاحة', 'attempts_used', v_attempt_count, 'attempts_allowed', v_exam.allowed_attempts);
    END IF;
    
    -- التحقق من وجود محاولة جارية
    SELECT * INTO v_last_attempt FROM public.exam_attempts WHERE exam_id = p_exam_id AND student_id = v_student_id AND completed_at IS NULL ORDER BY started_at DESC LIMIT 1;
    
    IF FOUND THEN
        RETURN json_build_object('can_attempt', true, 'has_ongoing', true, 'attempt_id', v_last_attempt.id, 'started_at', v_last_attempt.started_at);
    END IF;
    
    RETURN json_build_object('can_attempt', true, 'has_ongoing', false, 'attempts_used', v_attempt_count, 'attempts_remaining', CASE WHEN v_exam.allowed_attempts = -1 THEN -1 ELSE v_exam.allowed_attempts - v_attempt_count END);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. تحديث دالة التصحيح (تصحيح منطق نسبة النجاح)
CREATE OR REPLACE FUNCTION public.grade_exam_attempt(p_attempt_id UUID)
RETURNS JSON AS $$
DECLARE
    v_attempt public.exam_attempts%ROWTYPE;
    v_exam public.exams%ROWTYPE;
    v_question RECORD;
    v_total_points INTEGER := 0;
    v_earned_points INTEGER := 0;
    v_feedback JSONB := '{}'::jsonb;
    v_student_answer TEXT;
    v_is_correct BOOLEAN;
    v_question_points INTEGER;
    v_percentage NUMERIC;
    v_passing_score NUMERIC;
BEGIN
    -- جلب المحاولة
    SELECT * INTO v_attempt FROM public.exam_attempts WHERE id = p_attempt_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'المحاولة غير موجودة'; END IF;
    
    -- التحقق من الصلاحية
    IF v_attempt.student_id != auth.uid() AND NOT public.is_admin() THEN RAISE EXCEPTION 'غير مصرح'; END IF;
    
    -- جلب بيانات الاختبار
    SELECT * INTO v_exam FROM public.exams WHERE id = v_attempt.exam_id;
    
    -- تصحيح كل سؤال
    FOR v_question IN
        SELECT eq.question_id, eq.points_override, q.correct_answer, q.explanation, q.points, q.question_type
        FROM public.exam_questions eq
        JOIN public.questions q ON q.id = eq.question_id
        WHERE eq.exam_id = v_attempt.exam_id
    LOOP
        v_question_points := COALESCE(v_question.points_override, v_question.points);
        v_total_points := v_total_points + v_question_points;
        v_student_answer := v_attempt.answers->>v_question.question_id::TEXT;
        v_is_correct := LOWER(TRIM(COALESCE(v_student_answer, ''))) = LOWER(TRIM(v_question.correct_answer));
        
        IF v_is_correct THEN v_earned_points := v_earned_points + v_question_points; END IF;
        
        v_feedback := v_feedback || jsonb_build_object(
            v_question.question_id::TEXT,
            jsonb_build_object(
                'is_correct', v_is_correct,
                'student_answer', v_student_answer,
                'correct_answer', v_question.correct_answer,
                'explanation', v_question.explanation,
                'points_earned', CASE WHEN v_is_correct THEN v_question_points ELSE 0 END,
                'points_possible', v_question_points
            )
        );
    END LOOP;
    
    -- حساب النسبة المئوية
    v_percentage := CASE WHEN v_total_points > 0 THEN ROUND((v_earned_points::NUMERIC / v_total_points) * 100, 2) ELSE 0 END;
    
    -- درجة النجاح كنسبة (الافتراضي 50%)
    v_passing_score := COALESCE(v_exam.passing_score, 50);
    
    -- تحديث المحاولة
    UPDATE public.exam_attempts SET
        score = v_earned_points,
        percentage = v_percentage,
        is_passed = v_percentage >= v_passing_score,
        feedback = v_feedback,
        time_spent_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
        completed_at = NOW()
    WHERE id = p_attempt_id;
    
    -- تحديث الحالات السابقة لهذا الطالب إذا كانت خاطئة (اختياري لكن يحل مشكلة الـ 83%)
    UPDATE public.exam_attempts SET is_passed = true 
    WHERE student_id = v_attempt.student_id AND percentage >= 50 AND is_passed = false;

    RETURN json_build_object(
        'score', v_earned_points,
        'total', v_total_points,
        'percentage', v_percentage,
        'is_passed', v_percentage >= v_passing_score,
        'feedback', v_feedback
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
