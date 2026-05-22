-- =====================================================
-- Migration: 20260529000001_teacher_questions_and_ads.sql
-- Description: تمكين المعلمين من إدارة الأسئلة الخاصة بهم، وإنشاء جدول الإعلانات
-- =====================================================

-- 1. تعديلات جدول الأسئلة (questions) لتمكين المعلمين من إنشاء وتعديل وحذف أسئلتهم
ALTER TABLE public.questions ALTER COLUMN admin_id DROP NOT NULL;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL;

ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_owner_check;
ALTER TABLE public.questions ADD CONSTRAINT questions_owner_check CHECK (admin_id IS NOT NULL OR teacher_id IS NOT NULL);

-- 2. سياسات الحماية RLS لجدول الأسئلة (questions) للمعلمين
DROP POLICY IF EXISTS "Teachers can view approved questions" ON public.questions;
CREATE POLICY "Teachers can view approved questions" ON public.questions 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
    AND (is_approved = true OR teacher_id = auth.uid())
  );

DROP POLICY IF EXISTS "Teachers can insert questions" ON public.questions;
CREATE POLICY "Teachers can insert questions" ON public.questions 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
    AND teacher_id = auth.uid()
  );

DROP POLICY IF EXISTS "Teachers can update their own questions" ON public.questions;
CREATE POLICY "Teachers can update their own questions" ON public.questions 
  FOR UPDATE USING (
    teacher_id = auth.uid()
  );

DROP POLICY IF EXISTS "Teachers can delete their own questions" ON public.questions;
CREATE POLICY "Teachers can delete their own questions" ON public.questions 
  FOR DELETE USING (
    teacher_id = auth.uid()
  );

-- 3. جدول إعلانات المنصة (Platform Announcements)
CREATE TABLE IF NOT EXISTS public.platform_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  cta_label TEXT,          -- نص زر الإجراء (مثال: "اشترك الآن")
  cta_url TEXT,            -- رابط الزر
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- تفعيل RLS لجدول الإعلانات
ALTER TABLE public.platform_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view active announcements" ON public.platform_announcements;
CREATE POLICY "Everyone can view active announcements" ON public.platform_announcements
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage announcements" ON public.platform_announcements;
CREATE POLICY "Admins can manage announcements" ON public.platform_announcements
  FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- ربط trigger لتحديث حقل updated_at لجدول الإعلانات
DROP TRIGGER IF EXISTS update_platform_announcements_updated_at ON public.platform_announcements;
CREATE TRIGGER update_platform_announcements_updated_at BEFORE UPDATE ON public.platform_announcements
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. تعديل جدول انضمام الطلاب لتمييز الطلاب المضافين من المعلم
ALTER TABLE public.group_students
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'self_joined'
  CHECK (source IN ('teacher_added', 'self_joined'));
