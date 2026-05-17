-- =====================================================
-- Migration: بوابة المعلم (Teacher Portal) - B2B2C Pivot
-- Date: 2026-05-17
-- =====================================================

-- 1. تحديث الأدوار المسموح بها في جدول profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'student', 'teacher'));

-- 2. جدول المعلمين (Teachers)
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialty_id INTEGER REFERENCES public.subjects(id) ON DELETE SET NULL,
  school_name TEXT,
  phone_number TEXT,
  is_verified BOOLEAN DEFAULT false,
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium', 'trial')),
  subscription_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول مجموعات الطلاب (Student Groups / Classes)
CREATE TABLE IF NOT EXISTS public.student_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  grade_id INTEGER REFERENCES public.grades(id) ON DELETE SET NULL,
  invite_code VARCHAR(10) UNIQUE NOT NULL, -- كود الانضمام (مثل: X7M9K)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهرس لتسريع البحث بكود الانضمام
CREATE INDEX IF NOT EXISTS idx_groups_invite_code ON public.student_groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_groups_teacher ON public.student_groups(teacher_id);

-- 4. جدول ربط الطلاب بالمجموعات (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.group_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.student_groups(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'left')),
  UNIQUE(group_id, student_id) -- لا يمكن للطالب الانضمام لنفس المجموعة مرتين
);

CREATE INDEX IF NOT EXISTS idx_group_students_student ON public.group_students(student_id);

-- 5. تحديث جدول الاختبارات لدعم اختبارات المعلمين الخاصة
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.student_groups(id) ON DELETE CASCADE;

-- إضافة حقل للتحكم برؤية الاختبار: عام (للمنصة) أو خاص (لمجموعة المعلم فقط)
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private'));

-- 6. تفعيل Row Level Security (RLS)

-- تفعيل RLS للجداول الجديدة
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_students ENABLE ROW LEVEL SECURITY;

-- سياسات المعلمين (Teachers)
CREATE POLICY "الجميع يرى بيانات المعلمين الأساسية" ON public.teachers FOR SELECT USING (true);
CREATE POLICY "المعلم يدير بياناته" ON public.teachers FOR ALL USING (auth.uid() = id);

-- سياسات المجموعات (Student Groups)
CREATE POLICY "الطلاب والمعلمون يرون المجموعات" ON public.student_groups FOR SELECT USING (
  is_active = true OR teacher_id = auth.uid()
);
CREATE POLICY "المعلم يدير مجموعاته فقط" ON public.student_groups FOR ALL USING (
  teacher_id = auth.uid()
);

-- سياسات انضمام الطلاب (Group Students)
CREATE POLICY "الطالب يرى المجموعات المنضم لها" ON public.group_students FOR SELECT USING (
  student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.student_groups WHERE id = group_id AND teacher_id = auth.uid())
);
CREATE POLICY "الطالب ينضم للمجموعة" ON public.group_students FOR INSERT WITH CHECK (
  student_id = auth.uid()
);
CREATE POLICY "المعلم يحذف أو يوقف طلابه" ON public.group_students FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.student_groups WHERE id = group_id AND teacher_id = auth.uid())
);
CREATE POLICY "المعلم يطرد طلابه" ON public.group_students FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.student_groups WHERE id = group_id AND teacher_id = auth.uid())
);

-- تحديث سياسات الاختبارات (Exams)
-- الإبقاء على السياسات الحالية (يفضل مراجعة سياسات exams في المشروع لضمان توافقها)
-- قاعدة قراءة جديدة: الطالب يرى الاختبارات العامة (public) + الاختبارات الخاصة במجموعاته
CREATE POLICY "Students see public exams and their group exams" ON public.exams FOR SELECT USING (
  is_published = true AND (
    visibility = 'public' 
    OR 
    (visibility = 'private' AND EXISTS (SELECT 1 FROM public.group_students WHERE group_id = exams.group_id AND student_id = auth.uid() AND status = 'active'))
  )
);

CREATE POLICY "Teachers can manage their own private exams" ON public.exams FOR ALL USING (
  teacher_id = auth.uid()
);
