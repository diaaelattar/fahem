-- Ensure Primary Stage exists
INSERT INTO public.educational_stages (id, name_ar, name_en, sort_order)
VALUES (1, 'المرحلة الابتدائية', 'Primary Stage', 1)
ON CONFLICT (name_ar) DO NOTHING;

-- Insert Primary Grades
INSERT INTO public.grades (stage_id, name_ar, name_en, grade_number, sort_order)
SELECT 
  (SELECT id FROM public.educational_stages WHERE name_ar = 'المرحلة الابتدائية' LIMIT 1),
  name_ar, name_en, grade_number, sort_order
FROM (VALUES 
  ('الصف الأول الابتدائي', 'Primary 1', 1, 1),
  ('الصف الثاني الابتدائي', 'Primary 2', 2, 2),
  ('الصف الثالث الابتدائي', 'Primary 3', 3, 3),
  ('الصف الرابع الابتدائي', 'Primary 4', 4, 4),
  ('الصف الخامس الابتدائي', 'Primary 5', 5, 5),
  ('الصف السادس الابتدائي', 'Primary 6', 6, 6)
) AS v(name_ar, name_en, grade_number, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.grades 
  WHERE stage_id = (SELECT id FROM public.educational_stages WHERE name_ar = 'المرحلة الابتدائية' LIMIT 1) 
  AND grade_number = v.grade_number
);
