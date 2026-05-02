-- =====================================================
-- Migration: 20240320000001_initial_schema.sql
-- Description: الهيكل الأساسي لقاعدة بيانات استباق مصر
-- =====================================================

-- =====================================================
-- 1. جداول المناهج المصرية
-- =====================================================

-- المراحل الدراسية
CREATE TABLE public.educational_stages (
    id SERIAL PRIMARY KEY,
    name_ar TEXT NOT NULL UNIQUE,
    name_en TEXT,
    sort_order INTEGER DEFAULT 0
);

-- الصفوف الدراسية
CREATE TABLE public.grades (
    id SERIAL PRIMARY KEY,
    stage_id INTEGER REFERENCES public.educational_stages(id) ON DELETE CASCADE,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    grade_number INTEGER NOT NULL,
    sort_order INTEGER DEFAULT 0,
    UNIQUE(stage_id, grade_number)
);

-- الفصول الدراسية
CREATE TABLE public.semesters (
    id SERIAL PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    sort_order INTEGER DEFAULT 0
);

-- المواد الدراسية
CREATE TABLE public.subjects (
    id SERIAL PRIMARY KEY,
    name_ar TEXT NOT NULL UNIQUE,
    name_en TEXT,
    category TEXT CHECK (category IN ('علوم', 'آداب', 'لغات', 'عام')),
    applicable_stages TEXT[], -- ['primary','preparatory','secondary']
    icon TEXT DEFAULT '📚',
    color TEXT DEFAULT '#1B4F72'
);

-- الوحدات الدراسية
CREATE TABLE public.units (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER REFERENCES public.subjects(id) ON DELETE CASCADE,
    grade_id INTEGER REFERENCES public.grades(id) ON DELETE CASCADE,
    semester_id INTEGER REFERENCES public.semesters(id),
    name_ar TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0
);

-- الدروس
CREATE TABLE public.lessons (
    id SERIAL PRIMARY KEY,
    unit_id INTEGER REFERENCES public.units(id) ON DELETE CASCADE,
    name_ar TEXT NOT NULL,
    learning_objectives TEXT[],
    sort_order INTEGER DEFAULT 0
);

-- =====================================================
-- 2. جداول المستخدمين
-- =====================================================

-- ملفات المستخدمين (يمتد من auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'student')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- تفاصيل الطلاب
CREATE TABLE public.students (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    grade_id INTEGER REFERENCES public.grades(id),
    class_section TEXT,  -- مثال: "3/1"
    student_code TEXT UNIQUE,  -- كود تسجيل فريد
    parent_phone TEXT,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    notes TEXT
);

-- تفاصيل المديرين
CREATE TABLE public.admins (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    department TEXT,
    school_name TEXT,
    permissions JSONB DEFAULT '{"can_manage_users": true, "can_create_exams": true, "can_view_reports": true}'::jsonb
);

-- =====================================================
-- 3. جداول المحتوى والأسئلة
-- =====================================================

-- المستندات المرفوعة
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'docx', 'pptx', 'mp3', 'mp4', 'wav', 'jpg', 'jpeg', 'png', 'youtube', 'text')),
    youtube_url TEXT,
    file_size_bytes BIGINT,
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    extracted_text TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    subject_id INTEGER REFERENCES public.subjects(id),
    grade_id INTEGER REFERENCES public.grades(id),
    unit_id INTEGER REFERENCES public.units(id),
    lesson_id INTEGER REFERENCES public.lessons(id),
    questions_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- بنك الأسئلة
CREATE TABLE public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'true_false', 'fill_blank')),
    question_text TEXT NOT NULL,
    question_image_url TEXT,
    options JSONB,  -- ["الخيار أ", "الخيار ب", ...]
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    points INTEGER DEFAULT 1 CHECK (points > 0),
    tags TEXT[] DEFAULT '{}',
    subject_id INTEGER REFERENCES public.subjects(id),
    grade_id INTEGER REFERENCES public.grades(id),
    unit_id INTEGER REFERENCES public.units(id),
    lesson_id INTEGER REFERENCES public.lessons(id),
    is_approved BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس للبحث السريع
CREATE INDEX idx_questions_grade_subject ON public.questions(grade_id, subject_id);
CREATE INDEX idx_questions_type ON public.questions(question_type);
CREATE INDEX idx_questions_difficulty ON public.questions(difficulty_level);
CREATE INDEX idx_questions_approved ON public.questions(is_approved);
CREATE INDEX idx_questions_tags ON public.questions USING GIN(tags);
CREATE INDEX idx_questions_document ON public.questions(document_id);

-- =====================================================
-- 4. جداول الاختبارات
-- =====================================================

-- الاختبارات
CREATE TABLE public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    subject_id INTEGER REFERENCES public.subjects(id),
    grade_id INTEGER REFERENCES public.grades(id),
    semester_id INTEGER REFERENCES public.semesters(id),
    unit_id INTEGER REFERENCES public.units(id),
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    total_points INTEGER NOT NULL DEFAULT 0,
    passing_score INTEGER,  -- درجة النجاح
    instructions TEXT,
    cover_image_url TEXT,
    is_published BOOLEAN DEFAULT false,
    available_from TIMESTAMPTZ,
    available_until TIMESTAMPTZ,
    shuffle_questions BOOLEAN DEFAULT true,
    shuffle_options BOOLEAN DEFAULT true,
    show_results_immediately BOOLEAN DEFAULT true,
    allowed_attempts INTEGER DEFAULT 1 CHECK (allowed_attempts >= -1),  -- -1 = غير محدود
    questions_count INTEGER DEFAULT 0,
    attempts_count INTEGER DEFAULT 0,
    avg_score NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exams_grade_subject ON public.exams(grade_id, subject_id);
CREATE INDEX idx_exams_published ON public.exams(is_published);

-- ربط الأسئلة بالاختبارات
CREATE TABLE public.exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    question_order INTEGER NOT NULL,
    points_override INTEGER,
    UNIQUE(exam_id, question_id),
    UNIQUE(exam_id, question_order)
);

-- محاولات الطلاب
CREATE TABLE public.exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    time_spent_seconds INTEGER,
    score INTEGER,
    percentage NUMERIC(5,2),
    is_passed BOOLEAN,
    answers JSONB DEFAULT '{}'::jsonb,  -- {question_id: answer}
    feedback JSONB DEFAULT '{}'::jsonb,  -- {question_id: {is_correct, correct_answer, explanation}}
    attempt_number INTEGER DEFAULT 1,
    ip_address TEXT,
    UNIQUE(exam_id, student_id, attempt_number)
);

CREATE INDEX idx_attempts_student ON public.exam_attempts(student_id);
CREATE INDEX idx_attempts_exam ON public.exam_attempts(exam_id);
CREATE INDEX idx_attempts_completed ON public.exam_attempts(completed_at);

-- =====================================================
-- 5. جداول إضافية
-- =====================================================

-- تقارير الأداء المجمعة
CREATE TABLE public.performance_reports (
    id SERIAL PRIMARY KEY,
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    grade_id INTEGER REFERENCES public.grades(id),
    subject_id INTEGER REFERENCES public.subjects(id),
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    report_data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- إشعارات النظام
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);

-- =====================================================
-- 6. Triggers للتحديث التلقائي
-- =====================================================

-- دالة تحديث updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق الـ trigger على الجداول
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON public.exams
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger لإنشاء profile تلقائياً عند تسجيل مستخدم جديد
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger لتحديث عداد الأسئلة في الاختبارات
CREATE OR REPLACE FUNCTION public.update_exam_questions_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.exams 
        SET questions_count = questions_count + 1,
            total_points = total_points + COALESCE(
                NEW.points_override,
                (SELECT points FROM public.questions WHERE id = NEW.question_id)
            )
        WHERE id = NEW.exam_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.exams 
        SET questions_count = GREATEST(questions_count - 1, 0),
            total_points = GREATEST(total_points - COALESCE(
                OLD.points_override,
                (SELECT points FROM public.questions WHERE id = OLD.question_id)
            ), 0)
        WHERE id = OLD.exam_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_exam_questions_count_trigger
    AFTER INSERT OR DELETE ON public.exam_questions
    FOR EACH ROW EXECUTE FUNCTION public.update_exam_questions_count();

-- Trigger لتحديث إحصائيات الاختبار بعد كل محاولة
CREATE OR REPLACE FUNCTION public.update_exam_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
        UPDATE public.exams
        SET attempts_count = attempts_count + 1,
            avg_score = (
                SELECT AVG(percentage) 
                FROM public.exam_attempts 
                WHERE exam_id = NEW.exam_id AND completed_at IS NOT NULL
            )
        WHERE id = NEW.exam_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_exam_stats_trigger
    AFTER UPDATE ON public.exam_attempts
    FOR EACH ROW EXECUTE FUNCTION public.update_exam_stats();
