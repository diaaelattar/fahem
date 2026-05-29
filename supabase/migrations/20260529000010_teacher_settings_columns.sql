-- Migration: إضافة جميع أعمدة إعدادات المعلم (print + personal) + سياسات التخزين للوجو
-- هذه هجرة موحّدة تضيف الأعمدة إن لم تكن موجودة وتنشئ سياسات التخزين

-- 1. أعمدة إعدادات الطباعة الرسمية
ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS print_directorate TEXT,
  ADD COLUMN IF NOT EXISTS print_administration TEXT,
  ADD COLUMN IF NOT EXISTS print_school_name TEXT,
  ADD COLUMN IF NOT EXISTS print_academic_year TEXT DEFAULT '2025 / 2026';

-- 2. أعمدة الإعدادات الشخصية للمعلم
ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS print_header_type TEXT DEFAULT 'official',
  ADD COLUMN IF NOT EXISTS teacher_display_name TEXT,
  ADD COLUMN IF NOT EXISTS teacher_title TEXT,
  ADD COLUMN IF NOT EXISTS teacher_phone TEXT,
  ADD COLUMN IF NOT EXISTS teacher_social TEXT,
  ADD COLUMN IF NOT EXISTS teacher_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS teacher_watermark_text TEXT,
  ADD COLUMN IF NOT EXISTS show_watermark BOOLEAN DEFAULT false;

-- 3. سياسات التخزين للوجو المعلم (bucket: documents)
DO $$
BEGIN
  -- رفع اللوجو
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
      AND schemaname = 'storage'
      AND policyname = 'Teachers can upload their logos'
  ) THEN
    CREATE POLICY "Teachers can upload their logos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'documents'
      AND name LIKE 'teacher_logos/' || auth.uid()::text || '-%'
    );
  END IF;

  -- عرض اللوجو للجميع
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
      AND schemaname = 'storage'
      AND policyname = 'Anyone can view teacher logos'
  ) THEN
    CREATE POLICY "Anyone can view teacher logos"
    ON storage.objects FOR SELECT
    TO public
    USING (
      bucket_id = 'documents'
      AND name LIKE 'teacher_logos/%'
    );
  END IF;

  -- حذف اللوجو الخاص بالمعلم
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
      AND schemaname = 'storage'
      AND policyname = 'Teachers can delete their logos'
  ) THEN
    CREATE POLICY "Teachers can delete their logos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'documents'
      AND name LIKE 'teacher_logos/' || auth.uid()::text || '-%'
    );
  END IF;
END
$$;
