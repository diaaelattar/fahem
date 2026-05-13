-- =====================================================
-- Storage RLS Policies for student-answers-images bucket
-- شغّل هذا الـ SQL في Supabase Dashboard → SQL Editor
-- =====================================================

-- 1. السماح للطلاب المسجَّلين برفع الصور
CREATE POLICY "Students can upload answer images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'student-answers-images'
);

-- 2. السماح للطلاب بقراءة صورهم
CREATE POLICY "Students can view answer images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'student-answers-images'
);

-- 3. السماح للأدمن بقراءة كل الصور
CREATE POLICY "Admins can view all answer images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'student-answers-images'
  AND public.is_admin()
);

-- 4. السماح للأدمن بحذف الصور
CREATE POLICY "Admins can delete answer images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'student-answers-images'
  AND public.is_admin()
);
