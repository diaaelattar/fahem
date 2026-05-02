-- إضافة عمود الفصل الدراسي لجدول الوحدات
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS semester text DEFAULT 'term_1';

-- إنشاء index لتسريع استعلامات الفصول الدراسية
CREATE INDEX IF NOT EXISTS idx_units_semester ON public.units(semester);

-- يمكنك استخدام القيم: 'term_1' للفصل الأول, 'term_2' للفصل الثاني, 'full_year' لعام كامل
