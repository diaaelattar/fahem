-- =====================================================
-- Migration: 20260509000001_student_education_type.sql
-- Description: إضافة نوعية التعليم للطلاب وتمييز لغة التدريس للمواد
-- =====================================================

-- 1. إضافة نوعية التعليم لجدول الطلاب
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS education_type TEXT 
    DEFAULT 'public'
    CHECK (education_type IN ('public', 'language', 'azhar'));

-- 2. إضافة لغة التدريس للمواد الدراسية
ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS teaching_language TEXT 
    DEFAULT 'arabic'
    CHECK (teaching_language IN ('arabic', 'english', 'french')),
  ADD COLUMN IF NOT EXISTS education_types TEXT[] 
    DEFAULT '{public,language,azhar}';

-- 3. تحديث المواد الموجودة بلغة التدريس الافتراضية حسب المنهج المصري
-- المواد التي تُدرَّس بالإنجليزية في تعليم اللغات
UPDATE public.subjects SET 
  teaching_language = 'english',
  education_types = '{language}'
WHERE name_ar IN ('العلوم', 'الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء', 'الجيولوجيا')
  AND teaching_language = 'arabic';

-- المواد المشتركة بين العام واللغات (عربي في كلاهما)
UPDATE public.subjects SET
  education_types = '{public,language}'
WHERE name_ar IN ('اللغة العربية', 'اللغة الإنجليزية', 'الدراسات الاجتماعية', 'التربية الدينية', 'الجغرافيا', 'التاريخ')
  AND (education_types IS NULL OR education_types = '{public,language,azhar}');

-- المواد الخاصة بالأزهر
UPDATE public.subjects SET
  education_types = '{azhar}'
WHERE name_ar IN ('الفقه', 'التفسير', 'التجويد', 'السيرة النبوية', 'الحديث', 'التوحيد', 'النحو والصرف');

-- المواد المشتركة (عام + لغات + أزهر) تبقى كما هي بالعربية
-- مثل: التربية الوطنية، التربية البدنية

COMMENT ON COLUMN public.students.education_type IS 'نوعية التعليم: public=عام، language=لغات، azhar=أزهر';
COMMENT ON COLUMN public.subjects.teaching_language IS 'لغة تدريس المادة: arabic=عربي، english=إنجليزي، french=فرنسي';
COMMENT ON COLUMN public.subjects.education_types IS 'أنواع التعليم التي تنتمي إليها المادة';
