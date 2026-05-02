-- =====================================================
-- Migration: 20240320000002_rls_policies.sql
-- Description: سياسات أمان الصفوف (Row Level Security)
-- =====================================================

-- =====================================================
-- تفعيل RLS على جميع الجداول
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educational_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- دالة مساعدة: التحقق من صلاحية المدير
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin' AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- دالة للحصول على grade_id الطالب الحالي
CREATE OR REPLACE FUNCTION public.get_student_grade()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT grade_id FROM public.students WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- 1. سياسات الجداول العامة (قراءة للجميع)
-- =====================================================

-- المراحل والصفوف والمواد - قراءة للجميع (بيانات المناهج عامة)
CREATE POLICY "Public read educational_stages" ON public.educational_stages FOR SELECT USING (true);
CREATE POLICY "Public read grades" ON public.grades FOR SELECT USING (true);
CREATE POLICY "Public read semesters" ON public.semesters FOR SELECT USING (true);
CREATE POLICY "Public read subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Public read units" ON public.units FOR SELECT USING (true);
CREATE POLICY "Public read lessons" ON public.lessons FOR SELECT USING (true);

-- المدير فقط يعدل بيانات المناهج
CREATE POLICY "Admins manage educational_stages" ON public.educational_stages FOR ALL USING (public.is_admin());
CREATE POLICY "Admins manage grades" ON public.grades FOR ALL USING (public.is_admin());
CREATE POLICY "Admins manage semesters" ON public.semesters FOR ALL USING (public.is_admin());
CREATE POLICY "Admins manage subjects" ON public.subjects FOR ALL USING (public.is_admin());
CREATE POLICY "Admins manage units" ON public.units FOR ALL USING (public.is_admin());
CREATE POLICY "Admins manage lessons" ON public.lessons FOR ALL USING (public.is_admin());

-- =====================================================
-- 2. سياسات جدول profiles
-- =====================================================

-- المستخدم يرى ملفه الشخصي + المدير يرى الكل
CREATE POLICY "Users view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin());

-- المستخدم يعدل ملفه الشخصي فقط
CREATE POLICY "Users update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- المدير يمكنه إنشاء ملفات مستخدمين (عند إنشاء طلاب)
CREATE POLICY "Admins insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (public.is_admin());

-- المدير يمكنه تعطيل/تفعيل الحسابات
CREATE POLICY "Admins update all profiles" ON public.profiles
    FOR UPDATE USING (public.is_admin());

-- =====================================================
-- 3. سياسات جدول students
-- =====================================================

-- الطالب يرى بيانات نفسه فقط
CREATE POLICY "Students view own data" ON public.students
    FOR SELECT USING (id = auth.uid() OR public.is_admin());

-- المدير يدير بيانات الطلاب
CREATE POLICY "Admins manage students" ON public.students
    FOR ALL USING (public.is_admin());

-- =====================================================
-- 4. سياسات جدول admins
-- =====================================================

-- المدير يرى بياناته + المديرون الآخرون
CREATE POLICY "Admins view admin profiles" ON public.admins
    FOR SELECT USING (id = auth.uid() OR public.is_admin());

-- فقط النظام يمكنه إنشاء مديرين (عبر service role)
CREATE POLICY "Service role manages admins" ON public.admins
    FOR ALL USING (public.is_admin());

-- =====================================================
-- 5. سياسات جدول documents
-- =====================================================

-- المدير فقط يمكنه إدارة المستندات
CREATE POLICY "Admins full access to documents" ON public.documents
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ⛔ الطالب لا يملك أي صلاحية لجدول documents

-- =====================================================
-- 6. سياسات جدول questions
-- =====================================================

-- المدير فقط يملك صلاحيات كاملة على بنك الأسئلة
CREATE POLICY "Admins full access to questions" ON public.questions
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ⛔ الطالب لا يصل للأسئلة مباشرة (يصل عبر exam_questions فقط)

-- =====================================================
-- 7. سياسات جدول exams
-- =====================================================

-- المدير: صلاحيات كاملة
CREATE POLICY "Admins full access to exams" ON public.exams
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- الطالب: يرى الاختبارات المنشورة لصفه فقط وخلال فترة الإتاحة
CREATE POLICY "Students view published exams for their grade" ON public.exams
    FOR SELECT USING (
        is_published = true
        AND grade_id = public.get_student_grade()
        AND (available_from IS NULL OR available_from <= NOW())
        AND (available_until IS NULL OR available_until >= NOW())
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student')
    );

-- =====================================================
-- 8. سياسات جدول exam_questions
-- =====================================================

-- المدير: صلاحيات كاملة
CREATE POLICY "Admins full access to exam_questions" ON public.exam_questions
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- الطالب: يمكنه رؤية أسئلة الاختبارات المتاحة لصفه (بدون الإجابات - يتم إخفاؤها في طبقة التطبيق)
CREATE POLICY "Students view questions of available exams" ON public.exam_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.exams e
            WHERE e.id = exam_id
            AND e.is_published = true
            AND e.grade_id = public.get_student_grade()
            AND (e.available_from IS NULL OR e.available_from <= NOW())
            AND (e.available_until IS NULL OR e.available_until >= NOW())
        )
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student')
    );

-- =====================================================
-- 9. سياسات جدول exam_attempts
-- =====================================================

-- الطالب ينشئ محاولة لنفسه فقط
CREATE POLICY "Students insert own attempts" ON public.exam_attempts
    FOR INSERT WITH CHECK (
        student_id = auth.uid()
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student')
    );

-- الطالب يرى محاولاته فقط
CREATE POLICY "Students view own attempts" ON public.exam_attempts
    FOR SELECT USING (
        student_id = auth.uid()
        OR public.is_admin()
    );

-- الطالب يحدث محاولته فقط (لحفظ الإجابات وإنهاء الاختبار)
CREATE POLICY "Students update own attempts" ON public.exam_attempts
    FOR UPDATE USING (
        student_id = auth.uid()
        AND completed_at IS NULL  -- لا يمكن تعديل محاولة مكتملة
    );

-- المدير يرى جميع المحاولات
CREATE POLICY "Admins view all attempts" ON public.exam_attempts
    FOR SELECT USING (public.is_admin());

-- =====================================================
-- 10. سياسات جدول notifications
-- =====================================================

CREATE POLICY "Users view own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins manage notifications" ON public.notifications
    FOR ALL USING (public.is_admin());

-- =====================================================
-- 11. سياسات Supabase Storage
-- =====================================================

-- يتم تطبيق هذه السياسات في لوحة تحكم Supabase > Storage > Policies
-- Bucket: documents (خاص - للمديرين فقط)
-- Bucket: question-images (عام - للقراءة)
-- Bucket: avatars (خاص - لكل مستخدم)
