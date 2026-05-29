-- ============================================================
-- اذهب إلى: Supabase Dashboard → SQL Editor → New query
-- ثم انسخ هذا الكود كله والصقه → اضغط Run
-- ============================================================

-- 1. إضافة أعمدة إعدادات الطباعة الرسمية
ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS print_directorate     TEXT,
  ADD COLUMN IF NOT EXISTS print_administration  TEXT,
  ADD COLUMN IF NOT EXISTS print_school_name     TEXT,
  ADD COLUMN IF NOT EXISTS print_academic_year   TEXT DEFAULT '2025 / 2026';

-- 2. إضافة أعمدة الإعدادات الشخصية
ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS print_header_type     TEXT    DEFAULT 'official',
  ADD COLUMN IF NOT EXISTS teacher_display_name  TEXT,
  ADD COLUMN IF NOT EXISTS teacher_title         TEXT,
  ADD COLUMN IF NOT EXISTS teacher_phone         TEXT,
  ADD COLUMN IF NOT EXISTS teacher_social        TEXT,
  ADD COLUMN IF NOT EXISTS teacher_logo_url      TEXT,
  ADD COLUMN IF NOT EXISTS teacher_watermark_text TEXT,
  ADD COLUMN IF NOT EXISTS show_watermark        BOOLEAN DEFAULT false;

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

  -- حذف اللوجو الخاص بالمعلم فقط
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

-- 4. تحديث الـ RLS على teachers للسماح للمعلم بتحديث إعداداته
DROP POLICY IF EXISTS "Teachers can update own data" ON public.teachers;
CREATE POLICY "Teachers can update own data"
  ON public.teachers FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 5. التحقق من النتيجة
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'teachers'
  AND column_name IN (
    'print_directorate', 'print_administration', 'print_school_name',
    'print_academic_year', 'print_header_type', 'teacher_display_name',
    'teacher_title', 'teacher_phone', 'teacher_social',
    'teacher_logo_url', 'teacher_watermark_text', 'show_watermark'
  )
ORDER BY column_name;
