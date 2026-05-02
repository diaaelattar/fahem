-- =====================================================
-- Migration: 20240320000003_functions.sql
-- Description: دوال PostgreSQL المساعدة
-- =====================================================

-- =====================================================
-- 1. دوال إدارة المستخدمين
-- =====================================================

-- إنشاء حساب طالب جديد (يستخدمها المدير فقط)
CREATE OR REPLACE FUNCTION public.create_student(
    p_email TEXT,
    p_full_name TEXT,
    p_grade_id INTEGER,
    p_class_section TEXT DEFAULT NULL,
    p_parent_phone TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_student_code TEXT;
    v_result JSON;
BEGIN
    -- التحقق من صلاحية المدير
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'غير مصرح: فقط المديرون يمكنهم إنشاء حسابات الطلاب';
    END IF;
    
    -- توليد كود طالب فريد
    v_student_code := 'STU-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 99999)::TEXT, 5, '0');
    
    -- التحقق من عدم تكرار الكود
    WHILE EXISTS (SELECT 1 FROM public.students WHERE student_code = v_student_code) LOOP
        v_student_code := 'STU-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 99999)::TEXT, 5, '0');
    END LOOP;
    
    v_result := json_build_object(
        'student_code', v_student_code,
        'email', p_email,
        'full_name', p_full_name,
        'grade_id', p_grade_id
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. دوال الاختبارات
-- =====================================================

-- التحقق من إمكانية بدء محاولة جديدة
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
BEGIN
    v_student_id := COALESCE(p_student_id, auth.uid());
    
    -- جلب بيانات الاختبار
    SELECT * INTO v_exam FROM public.exams WHERE id = p_exam_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('can_attempt', false, 'reason', 'الاختبار غير موجود');
    END IF;
    
    -- التحقق من النشر
    IF NOT v_exam.is_published THEN
        RETURN json_build_object('can_attempt', false, 'reason', 'الاختبار غير منشور بعد');
    END IF;
    
    -- التحقق من الفترة الزمنية
    IF v_exam.available_from IS NOT NULL AND NOW() < v_exam.available_from THEN
        RETURN json_build_object('can_attempt', false, 'reason', 'الاختبار لم يبدأ بعد', 'starts_at', v_exam.available_from);
    END IF;
    
    IF v_exam.available_until IS NOT NULL AND NOW() > v_exam.available_until THEN
        RETURN json_build_object('can_attempt', false, 'reason', 'انتهت فترة الاختبار');
    END IF;
    
    -- حساب عدد المحاولات
    SELECT COUNT(*) INTO v_attempt_count
    FROM public.exam_attempts
    WHERE exam_id = p_exam_id AND student_id = v_student_id;
    
    -- التحقق من الحد الأقصى للمحاولات
    IF v_exam.allowed_attempts != -1 AND v_attempt_count >= v_exam.allowed_attempts THEN
        RETURN json_build_object(
            'can_attempt', false, 
            'reason', 'لقد استنفذت جميع المحاولات المتاحة',
            'attempts_used', v_attempt_count,
            'attempts_allowed', v_exam.allowed_attempts
        );
    END IF;
    
    -- التحقق من وجود محاولة جارية
    SELECT * INTO v_last_attempt
    FROM public.exam_attempts
    WHERE exam_id = p_exam_id AND student_id = v_student_id AND completed_at IS NULL
    ORDER BY started_at DESC
    LIMIT 1;
    
    IF FOUND THEN
        RETURN json_build_object(
            'can_attempt', true,
            'has_ongoing', true,
            'attempt_id', v_last_attempt.id,
            'started_at', v_last_attempt.started_at
        );
    END IF;
    
    RETURN json_build_object(
        'can_attempt', true,
        'has_ongoing', false,
        'attempts_used', v_attempt_count,
        'attempts_remaining', CASE WHEN v_exam.allowed_attempts = -1 THEN -1 ELSE v_exam.allowed_attempts - v_attempt_count END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- تصحيح إجابات الاختبار وحساب النتيجة
CREATE OR REPLACE FUNCTION public.grade_exam_attempt(
    p_attempt_id UUID
)
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
BEGIN
    -- جلب المحاولة
    SELECT * INTO v_attempt FROM public.exam_attempts WHERE id = p_attempt_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'المحاولة غير موجودة'; END IF;
    
    -- التحقق من الصلاحية
    IF v_attempt.student_id != auth.uid() AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'غير مصرح';
    END IF;
    
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
        
        -- مقارنة الإجابة (غير حساسة لحالة الأحرف لملء الفراغات)
        v_is_correct := LOWER(TRIM(COALESCE(v_student_answer, ''))) = LOWER(TRIM(v_question.correct_answer));
        
        IF v_is_correct THEN
            v_earned_points := v_earned_points + v_question_points;
        END IF;
        
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
    
    -- تحديث المحاولة بالنتيجة
    UPDATE public.exam_attempts SET
        score = v_earned_points,
        percentage = CASE WHEN v_total_points > 0 THEN ROUND((v_earned_points::NUMERIC / v_total_points) * 100, 2) ELSE 0 END,
        is_passed = v_earned_points >= COALESCE(v_exam.passing_score, CEIL(v_total_points * 0.5)),
        feedback = v_feedback,
        time_spent_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
        completed_at = NOW()
    WHERE id = p_attempt_id;
    
    RETURN json_build_object(
        'score', v_earned_points,
        'total', v_total_points,
        'percentage', CASE WHEN v_total_points > 0 THEN ROUND((v_earned_points::NUMERIC / v_total_points) * 100, 2) ELSE 0 END,
        'is_passed', v_earned_points >= COALESCE(v_exam.passing_score, CEIL(v_total_points * 0.5)),
        'feedback', v_feedback
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. دوال التقارير
-- =====================================================

-- إحصائيات الاختبار التفصيلية
CREATE OR REPLACE FUNCTION public.get_exam_statistics(p_exam_id UUID)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'غير مصرح';
    END IF;
    
    SELECT json_build_object(
        'exam_id', p_exam_id,
        'total_attempts', COUNT(*),
        'completed_attempts', COUNT(completed_at),
        'avg_score', ROUND(AVG(percentage), 2),
        'max_score', MAX(percentage),
        'min_score', MIN(percentage),
        'pass_rate', ROUND(AVG(CASE WHEN is_passed THEN 100 ELSE 0 END), 2),
        'avg_time_minutes', ROUND(AVG(time_spent_seconds) / 60, 1),
        'score_distribution', json_build_object(
            '0-49', COUNT(CASE WHEN percentage < 50 THEN 1 END),
            '50-59', COUNT(CASE WHEN percentage >= 50 AND percentage < 60 THEN 1 END),
            '60-69', COUNT(CASE WHEN percentage >= 60 AND percentage < 70 THEN 1 END),
            '70-79', COUNT(CASE WHEN percentage >= 70 AND percentage < 80 THEN 1 END),
            '80-89', COUNT(CASE WHEN percentage >= 80 AND percentage < 90 THEN 1 END),
            '90-100', COUNT(CASE WHEN percentage >= 90 THEN 1 END)
        )
    ) INTO v_result
    FROM public.exam_attempts
    WHERE exam_id = p_exam_id;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- إحصائيات لوحة المدير
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS JSON AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'غير مصرح';
    END IF;
    
    RETURN (
        SELECT json_build_object(
            'total_students', (SELECT COUNT(*) FROM public.students),
            'total_exams', (SELECT COUNT(*) FROM public.exams),
            'published_exams', (SELECT COUNT(*) FROM public.exams WHERE is_published = true),
            'total_questions', (SELECT COUNT(*) FROM public.questions),
            'approved_questions', (SELECT COUNT(*) FROM public.questions WHERE is_approved = true),
            'total_attempts', (SELECT COUNT(*) FROM public.exam_attempts WHERE completed_at IS NOT NULL),
            'avg_platform_score', (SELECT ROUND(AVG(percentage), 2) FROM public.exam_attempts WHERE completed_at IS NOT NULL),
            'total_documents', (SELECT COUNT(*) FROM public.documents),
            'recent_activity', (
                SELECT json_agg(a) FROM (
                    SELECT 
                        p.full_name as student_name,
                        e.title as exam_title,
                        ea.percentage as score,
                        ea.is_passed,
                        ea.completed_at
                    FROM public.exam_attempts ea
                    JOIN public.students s ON s.id = ea.student_id
                    JOIN public.profiles p ON p.id = s.id
                    JOIN public.exams e ON e.id = ea.exam_id
                    WHERE ea.completed_at IS NOT NULL
                    ORDER BY ea.completed_at DESC
                    LIMIT 10
                ) a
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
