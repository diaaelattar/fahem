-- ================================================================
-- Migration: 20260607000002_school_portal_system.sql
-- Description: إنشاء الجداول والتعديلات لبوابة المدارس والتحكم بالوصول
-- ================================================================

-- 1. تحديث الأدوار المسموح بها في جدول profiles لتشمل school_admin
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'school_admin', 'teacher', 'student'));

-- 2. جدول المدارس (Schools)
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE,
  type TEXT CHECK (type IN ('public','private','language','azhar','technical')),
  stage TEXT CHECK (stage IN ('primary','preparatory','secondary','all')),
  governorate TEXT NOT NULL,
  district TEXT,
  logo_url TEXT,
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free','basic','pro','enterprise')),
  subscription_ends_at TIMESTAMPTZ,
  max_students INT DEFAULT 500,
  max_teachers INT DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول الفصول الدراسية (School Classes)
CREATE TABLE IF NOT EXISTS public.school_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade_id INTEGER REFERENCES public.grades(id) ON DELETE SET NULL,
  semester_id INTEGER REFERENCES public.semesters(id) ON DELETE SET NULL,
  academic_year TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. جدول ربط الطلاب بالفصول (Class Students)
CREATE TABLE IF NOT EXISTS public.class_students (
  class_id UUID NOT NULL REFERENCES public.school_classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  seat_number INT,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (class_id, student_id)
);

-- 5. جدول دعوات المدارس (School Invitations)
CREATE TABLE IF NOT EXISTS public.school_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  used_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. إضافة أعمدة الربط للجداول القائمة
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.school_classes(id) ON DELETE SET NULL;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL;

-- 7. تفعيل Row Level Security (RLS) للجداول الجديدة
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_invitations ENABLE ROW LEVEL SECURITY;

-- 8. سياسات RLS لجدول المدارس (Schools)
CREATE POLICY "الجميع يرى المدارس النشطة" ON public.schools FOR SELECT USING (is_active = true);
CREATE POLICY "الأدمن العام يدير المدارس" ON public.schools FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "مدير المدرسة يرى مدرسته فقط" ON public.schools FOR SELECT USING (
  id = (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role = 'school_admin' LIMIT 1)
);
CREATE POLICY "مدير المدرسة يعدل مدرسته فقط" ON public.schools FOR UPDATE USING (
  id = (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role = 'school_admin' LIMIT 1)
);

-- 9. سياسات RLS لجدول الفصول (School Classes)
CREATE POLICY "أعضاء المدرسة يرون الفصول" ON public.school_classes FOR SELECT USING (
  school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
);
CREATE POLICY "مدير المدرسة يدير فصول مدرسته" ON public.school_classes FOR ALL USING (
  school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role = 'school_admin' LIMIT 1)
);

-- 10. سياسات RLS لربط الطلاب بالفصول (Class Students)
CREATE POLICY "أعضاء المدرسة يرون ربط فصول الطلاب" ON public.class_students FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.school_classes c
    WHERE c.id = class_id AND c.school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
  )
);
CREATE POLICY "مدير المدرسة يتحكم بربط فصول الطلاب" ON public.class_students FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.school_classes c
    WHERE c.id = class_id AND c.school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role = 'school_admin' LIMIT 1)
  )
);

-- 11. سياسات RLS لدعوات المدارس (School Invitations)
CREATE POLICY "مدير المدرسة يدير دعوات مدرسته" ON public.school_invitations FOR ALL USING (
  school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role = 'school_admin' LIMIT 1)
);
CREATE POLICY "الجميع يقرأ الدعوة للتحقق بالرمز" ON public.school_invitations FOR SELECT USING (true);

-- 12. تحديث سياسات الامتحانات لتراعي عزل المدارس
DROP POLICY IF EXISTS "School admin see school exams" ON public.exams;
CREATE POLICY "School admin see school exams" ON public.exams FOR ALL USING (
  school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role = 'school_admin' LIMIT 1)
);

-- تطبيق التحديث التلقائي للوقت المحدث على الجداول الجديدة
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON public.schools
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
