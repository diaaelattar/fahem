-- =====================================================
-- Seed: egyptian_curriculum.sql
-- Description: بيانات المناهج المصرية الأولية
-- =====================================================

-- =====================================================
-- 1. المراحل الدراسية
-- =====================================================
INSERT INTO public.educational_stages (name_ar, name_en, sort_order) VALUES
    ('المرحلة الابتدائية', 'Primary', 1),
    ('المرحلة الإعدادية', 'Preparatory', 2),
    ('المرحلة الثانوية', 'Secondary', 3);

-- =====================================================
-- 2. الصفوف الدراسية
-- =====================================================
-- المرحلة الابتدائية (الصف الأول → السادس)
INSERT INTO public.grades (stage_id, name_ar, name_en, grade_number, sort_order) VALUES
    (1, 'الصف الأول الابتدائي', 'Grade 1', 1, 1),
    (1, 'الصف الثاني الابتدائي', 'Grade 2', 2, 2),
    (1, 'الصف الثالث الابتدائي', 'Grade 3', 3, 3),
    (1, 'الصف الرابع الابتدائي', 'Grade 4', 4, 4),
    (1, 'الصف الخامس الابتدائي', 'Grade 5', 5, 5),
    (1, 'الصف السادس الابتدائي', 'Grade 6', 6, 6),
    -- المرحلة الإعدادية
    (2, 'الصف الأول الإعدادي', 'Grade 7', 7, 7),
    (2, 'الصف الثاني الإعدادي', 'Grade 8', 8, 8),
    (2, 'الصف الثالث الإعدادي', 'Grade 9', 9, 9),
    -- المرحلة الثانوية
    (3, 'الصف الأول الثانوي', 'Grade 10', 10, 10),
    (3, 'الصف الثاني الثانوي', 'Grade 11', 11, 11),
    (3, 'الصف الثالث الثانوي', 'Grade 12', 12, 12);

-- =====================================================
-- 3. الفصول الدراسية
-- =====================================================
INSERT INTO public.semesters (name_ar, name_en, sort_order) VALUES
    ('الفصل الدراسي الأول', 'First Semester', 1),
    ('الفصل الدراسي الثاني', 'Second Semester', 2);

-- =====================================================
-- 4. المواد الدراسية
-- =====================================================
INSERT INTO public.subjects (name_ar, name_en, category, applicable_stages, icon, color) VALUES
    -- مواد عامة (جميع المراحل)
    ('اللغة العربية', 'Arabic Language', 'لغات', ARRAY['primary','preparatory','secondary'], '📖', '#C5A028'),
    ('اللغة الإنجليزية', 'English Language', 'لغات', ARRAY['primary','preparatory','secondary'], '🌍', '#1B4F72'),
    ('الرياضيات', 'Mathematics', 'علوم', ARRAY['primary','preparatory','secondary'], '🔢', '#117A65'),
    ('العلوم', 'Science', 'علوم', ARRAY['primary','preparatory'], '🔬', '#1A5276'),
    ('الدراسات الاجتماعية', 'Social Studies', 'آداب', ARRAY['primary','preparatory'], '🗺️', '#784212'),
    ('التربية الدينية الإسلامية', 'Islamic Education', 'آداب', ARRAY['primary','preparatory','secondary'], '☪️', '#145A32'),
    ('التربية الوطنية', 'Civic Education', 'آداب', ARRAY['primary','preparatory'], '🇪🇬', '#7D6608'),
    -- مواد المرحلة الثانوية فقط
    ('الفيزياء', 'Physics', 'علوم', ARRAY['secondary'], '⚡', '#1B2631'),
    ('الكيمياء', 'Chemistry', 'علوم', ARRAY['secondary'], '🧪', '#4A235A'),
    ('الأحياء', 'Biology', 'علوم', ARRAY['secondary'], '🧬', '#1D8348'),
    ('الجيولوجيا', 'Geology', 'علوم', ARRAY['secondary'], '🪨', '#7B241C'),
    ('الفلسفة والمنطق', 'Philosophy & Logic', 'آداب', ARRAY['secondary'], '🤔', '#2C3E50'),
    ('علم النفس والاجتماع', 'Psychology & Sociology', 'آداب', ARRAY['secondary'], '🧠', '#6C3483'),
    ('التاريخ', 'History', 'آداب', ARRAY['secondary'], '📜', '#784212'),
    ('الجغرافيا', 'Geography', 'آداب', ARRAY['secondary'], '🌐', '#117864'),
    ('الحاسوب', 'Computer Science', 'علوم', ARRAY['preparatory','secondary'], '💻', '#1A5276'),
    ('التربية الفنية', 'Arts Education', 'عام', ARRAY['primary','preparatory'], '🎨', '#B7950B'),
    ('التربية الموسيقية', 'Music Education', 'عام', ARRAY['primary','preparatory'], '🎵', '#A93226'),
    ('التربية الرياضية', 'Physical Education', 'عام', ARRAY['primary','preparatory','secondary'], '⚽', '#148F77');

-- =====================================================
-- 5. نماذج من الوحدات (للصف الثالث الثانوي - رياضيات)
-- =====================================================
-- الحصول على معرفات الصف والمادة والفصل
DO $$
DECLARE
    v_grade_id INTEGER;
    v_subject_id INTEGER;
    v_unit_id INTEGER;
BEGIN
    SELECT id INTO v_grade_id FROM public.grades WHERE grade_number = 12;
    SELECT id INTO v_subject_id FROM public.subjects WHERE name_ar = 'الرياضيات';
    
    IF v_grade_id IS NOT NULL AND v_subject_id IS NOT NULL THEN
        -- الوحدات للفصل الأول
        INSERT INTO public.units (subject_id, grade_id, semester_id, name_ar, sort_order) VALUES
            (v_subject_id, v_grade_id, 1, 'الوحدة الأولى: المعادلات والمتراجحات', 1),
            (v_subject_id, v_grade_id, 1, 'الوحدة الثانية: الدوال والرسم البياني', 2),
            (v_subject_id, v_grade_id, 1, 'الوحدة الثالثة: المثلثات وحل المثلث', 3),
            (v_subject_id, v_grade_id, 2, 'الوحدة الرابعة: حساب التفاضل', 4),
            (v_subject_id, v_grade_id, 2, 'الوحدة الخامسة: حساب التكامل', 5),
            (v_subject_id, v_grade_id, 2, 'الوحدة السادسة: الإحصاء والاحتمالات', 6)
        RETURNING id INTO v_unit_id;
        
        -- الدروس للوحدة الأولى
        SELECT id INTO v_unit_id FROM public.units 
        WHERE subject_id = v_subject_id AND grade_id = v_grade_id AND name_ar LIKE '%الأولى%';
        
        INSERT INTO public.lessons (unit_id, name_ar, sort_order) VALUES
            (v_unit_id, 'الدرس الأول: المعادلات التربيعية', 1),
            (v_unit_id, 'الدرس الثاني: المعادلات الجذرية', 2),
            (v_unit_id, 'الدرس الثالث: المتراجحات الخطية', 3),
            (v_unit_id, 'الدرس الرابع: المتراجحات التربيعية', 4);
    END IF;
END $$;

-- نماذج من الوحدات (الصف الثالث الثانوي - فيزياء)
DO $$
DECLARE
    v_grade_id INTEGER;
    v_subject_id INTEGER;
BEGIN
    SELECT id INTO v_grade_id FROM public.grades WHERE grade_number = 12;
    SELECT id INTO v_subject_id FROM public.subjects WHERE name_ar = 'الفيزياء';
    
    IF v_grade_id IS NOT NULL AND v_subject_id IS NOT NULL THEN
        INSERT INTO public.units (subject_id, grade_id, semester_id, name_ar, sort_order) VALUES
            (v_subject_id, v_grade_id, 1, 'الوحدة الأولى: الإلكترونيات', 1),
            (v_subject_id, v_grade_id, 1, 'الوحدة الثانية: الضوء والبصريات', 2),
            (v_subject_id, v_grade_id, 2, 'الوحدة الثالثة: الذرة والنواة', 3),
            (v_subject_id, v_grade_id, 2, 'الوحدة الرابعة: الفيزياء الحديثة', 4);
    END IF;
END $$;
