-- =====================================================
-- Migration: 20260507000001_exam_type_and_lesson.sql
-- Description: إضافة تصنيف الاختبار (نوع الاختبار) وربط الاختبار بالدرس
-- Purpose: تمكين الفلترة الهرمية في باني الاختبارات
-- =====================================================

-- 1. إضافة عمود نوع الاختبار (exam_type)
--    يصنّف الاختبار حسب طبيعته في المنظومة التعليمية المصرية
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS exam_type TEXT DEFAULT 'partial'
    CHECK (exam_type IN ('partial', 'monthly', 'midterm', 'final', 'homework', 'custom'));

-- 2. إضافة ربط الاختبار بالمنهج (semester, unit, lesson)
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS semester_id INTEGER REFERENCES public.semesters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS unit_id INTEGER REFERENCES public.units(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lesson_id INTEGER REFERENCES public.lessons(id) ON DELETE SET NULL;

-- 3. فهرس لتسريع الاستعلامات حسب النوع
CREATE INDEX IF NOT EXISTS idx_exams_exam_type ON public.exams(exam_type);
CREATE INDEX IF NOT EXISTS idx_exams_unit_id   ON public.exams(unit_id);
CREATE INDEX IF NOT EXISTS idx_exams_lesson_id ON public.exams(lesson_id);

-- 4. إضافة semester_id لجدول الأسئلة (إن لم يكن موجوداً) — للحماية
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS semester_id INTEGER REFERENCES public.semesters(id);

-- 5. تحديث is_approved/status consistency
--    الأسئلة القديمة التي كان لها status='approved' أو is_approved=true تظل صالحة
--    (لا يلزم تعديل بيانات موجودة)

-- 6. ملاحظة معمارية (Architecture Decision):
--    اخترنا TEXT مع CHECK بدلاً من ENUM لأن:
--    - يتيح الإضافة المستقبلية بدون migration معقدة
--    - مدعوم بشكل أفضل عند الـ type generation في Supabase
