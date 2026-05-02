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
    v_percentage NUMERIC;
    v_is_passed BOOLEAN;
BEGIN
    SELECT * INTO v_attempt FROM public.exam_attempts WHERE id = p_attempt_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'المحاولة غير موجودة'; END IF;
    
    IF v_attempt.student_id != auth.uid() AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'غير مصرح';
    END IF;
    
    SELECT * INTO v_exam FROM public.exams WHERE id = v_attempt.exam_id;
    
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
    
    v_percentage := CASE WHEN v_total_points > 0 THEN ROUND((v_earned_points::NUMERIC / v_total_points) * 100, 2) ELSE 0 END;
    
    v_is_passed := v_percentage >= COALESCE(v_exam.passing_score, 50);
    
    UPDATE public.exam_attempts SET
        score = v_earned_points,
        percentage = v_percentage,
        is_passed = v_is_passed,
        feedback = v_feedback,
        time_spent_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
        completed_at = NOW()
    WHERE id = p_attempt_id;
    
    RETURN json_build_object(
        'score', v_earned_points,
        'total', v_total_points,
        'percentage', v_percentage,
        'is_passed', v_is_passed,
        'feedback', v_feedback
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
