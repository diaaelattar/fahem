-- =====================================================
-- Migration: 20240320000004_fix_rls_questions.sql
-- Description: تمكين الطلاب من قراءة الأسئلة المرتبطة باختباراتهم
-- =====================================================

-- التحقق من وجود السياسة قبل إنشائها لتجنب الأخطاء
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'questions' AND policyname = 'Students view questions through exam links'
    ) THEN
        CREATE POLICY "Students view questions through exam links" ON public.questions
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.exam_questions eq
                    JOIN public.exams e ON e.id = eq.exam_id
                    WHERE eq.question_id = questions.id
                    AND e.is_published = true
                    AND e.grade_id = public.get_student_grade()
                )
            );
    END IF;
END $$;
