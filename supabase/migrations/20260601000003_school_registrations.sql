-- ===================================================
-- Migration: 20260601000003_school_registrations.sql
-- Description: إنشاء جدول تسجيلات واهتمامات المدارس لبوابة المدارس الذكية
-- ===================================================

CREATE TABLE IF NOT EXISTS public.school_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- تفعيل فهارس لتسريع القراءة والفلترة للمسؤول
CREATE INDEX IF NOT EXISTS idx_school_registrations_email ON public.school_registrations(email);
CREATE INDEX IF NOT EXISTS idx_school_registrations_created ON public.school_registrations(created_at);

-- تفعيل سياسات الحماية RLS لجدول التسجيلات الجديد
ALTER TABLE public.school_registrations ENABLE ROW LEVEL SECURITY;

-- سياسات RLS:
-- السماح لأي زائر بإدخال بيانات المدرسة الخاصة به (للتسجيل من صفحة الهبوط)
DROP POLICY IF EXISTS "Anyone can insert school registrations" ON public.school_registrations;
CREATE POLICY "Anyone can insert school registrations" ON public.school_registrations
  FOR INSERT WITH CHECK (true);

-- السماح للمسؤولين (Admins) فقط بقراءة وإدارة تسجيلات المدارس
DROP POLICY IF EXISTS "Admins can view all school registrations" ON public.school_registrations;
CREATE POLICY "Admins can view all school registrations" ON public.school_registrations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
  );
