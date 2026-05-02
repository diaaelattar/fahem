-- Migration: V3.5 AI Engine (Context Passage, Essay, AI Feedback)

-- 1. إضافة الأعمدة لجدول الأسئلة
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS context_passage text,
ADD COLUMN IF NOT EXISTS learning_outcome text;

-- 2. تحديث قيد أنواع الأسئلة (إن وجد) ليسمح بالمقالي والتصويب
DO $$ 
BEGIN
    ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_question_type_check;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

ALTER TABLE public.questions 
ADD CONSTRAINT questions_question_type_check 
CHECK (question_type IN ('mcq', 'true_false', 'fill_blank', 'essay', 'correction'));

-- 3. إضافة حقول التغذية الراجعة لجداول الإجابات
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'exam_attempt_answers') THEN
        ALTER TABLE public.exam_attempt_answers ADD COLUMN IF NOT EXISTS ai_feedback text;
    END IF;
END $$;

DO $$ 
BEGIN
    -- في حال كان جدول بنك الأخطاء موجوداً
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wrong_answers_bank') THEN
        ALTER TABLE public.wrong_answers_bank ADD COLUMN IF NOT EXISTS ai_feedback text;
    END IF;
END $$;
