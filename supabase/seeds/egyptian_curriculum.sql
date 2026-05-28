-- =====================================================
-- Seed: egyptian_curriculum.sql
-- Description: بيانات المناهج المصرية المحدثة 2025-2026
-- تشمل نظام البكالوريا الجديد والعلوم المتكاملة والرياضيات والعلوم باللغة الإنجليزية لمدارس اللغات
-- =====================================================

-- حذف البيانات الحالية تجنباً للتكرار
TRUNCATE public.subject_tracks CASCADE;
TRUNCATE public.curriculum_tracks CASCADE;
TRUNCATE public.lessons CASCADE;
TRUNCATE public.units CASCADE;
TRUNCATE public.subjects CASCADE;
TRUNCATE public.semesters CASCADE;
TRUNCATE public.grades CASCADE;
TRUNCATE public.educational_stages CASCADE;

-- =====================================================
-- 1. المراحل الدراسية
-- =====================================================
INSERT INTO public.educational_stages (id, name_ar, name_en, sort_order) VALUES
    (1, 'المرحلة الابتدائية', 'Primary', 1),
    (2, 'المرحلة الإعدادية', 'Preparatory', 2),
    (3, 'المرحلة الثانوية', 'Secondary', 3);

-- =====================================================
-- 2. الصفوف الدراسية
-- =====================================================
INSERT INTO public.grades (id, stage_id, name_ar, name_en, grade_number, sort_order, has_tracks) VALUES
    (1, 1, 'الصف الأول الابتدائي', 'Grade 1', 1, 1, false),
    (2, 1, 'الصف الثاني الابتدائي', 'Grade 2', 2, 2, false),
    (3, 1, 'الصف الثالث الابتدائي', 'Grade 3', 3, 3, false),
    (4, 1, 'الصف الرابع الابتدائي', 'Grade 4', 4, 4, false),
    (5, 1, 'الصف الخامس الابتدائي', 'Grade 5', 5, 5, false),
    (6, 1, 'الصف السادس الابتدائي', 'Grade 6', 6, 6, false),
    (7, 2, 'الصف الأول الإعدادي', 'Grade 7', 7, 7, false),
    (8, 2, 'الصف الثاني الإعدادي', 'Grade 8', 8, 8, false),
    (9, 2, 'الصف الثالث الإعدادي', 'Grade 9', 9, 9, false),
    (10, 3, 'الصف الأول الثانوي', 'Grade 10', 10, 10, false),
    (11, 3, 'الصف الثاني الثانوي', 'Grade 11', 11, 11, true),
    (12, 3, 'الصف الثالث الثانوي', 'Grade 12', 12, 12, true);

-- =====================================================
-- 3. الفصول الدراسية
-- =====================================================
INSERT INTO public.semesters (id, name_ar, name_en, sort_order) VALUES
    (1, 'الفصل الدراسي الأول', 'First Semester', 1),
    (2, 'الفصل الدراسي الثاني', 'Second Semester', 2);

-- =====================================================
-- 4. المواد الدراسية (التعليم العام، اللغات، والقرارات الجديدة)
-- =====================================================
INSERT INTO public.subjects (id, name_ar, name_en, category, applicable_stages, icon, color, teaching_language, education_types, in_total, system_type, grade_group) VALUES
    -- مواد المرحلة الابتدائية
    (1, 'اللغة العربية', 'Arabic Language', 'لغات', ARRAY['primary','preparatory','secondary'], '📖', '#C5A028', 'arabic', '{public,language,azhar}', true, 'both', NULL),
    (2, 'اللغة الإنجليزية', 'English Language', 'لغات', ARRAY['primary','preparatory','secondary'], '🌍', '#1B4F72', 'arabic', '{public,language,azhar}', true, 'both', NULL),
    (3, 'التربية الدينية الإسلامية', 'Islamic Education', 'عام', ARRAY['primary','preparatory','secondary'], '🕌', '#145A32', 'arabic', '{public,language,azhar}', false, 'both', NULL),
    (4, 'متعدد التخصصات', 'Multidisciplinary', 'عام', ARRAY['primary'], '🎨', '#8E44AD', 'arabic', '{public,language,azhar}', true, 'both', '1-3'),
    
    -- مواد المدارس العربية (عام + أزهر)
    (5, 'الرياضيات', 'Mathematics', 'علوم', ARRAY['primary','preparatory','secondary'], '🔢', '#117A65', 'arabic', '{public,azhar}', true, 'both', NULL),
    (6, 'العلوم', 'Science', 'علوم', ARRAY['primary','preparatory'], '🔬', '#1A5276', 'arabic', '{public,azhar}', true, 'both', '4-6'),
    (7, 'الدراسات الاجتماعية', 'Social Studies', 'آداب', ARRAY['primary','preparatory'], '🗺️', '#784212', 'arabic', '{public,azhar}', true, 'both', '4-6'),
    
    -- مواد مدارس اللغات (Math / Science) بالإنجليزية
    (8, 'Math', 'Math', 'علوم', ARRAY['primary','preparatory','secondary'], '🔢', '#117A65', 'english', '{language}', true, 'both', NULL),
    (9, 'Science', 'Science', 'علوم', ARRAY['primary','preparatory'], '🔬', '#1A5276', 'english', '{language}', true, 'both', '4-6'),
    (10, 'Social Studies (L)', 'Social Studies', 'آداب', ARRAY['primary','preparatory'], '🗺️', '#784212', 'arabic', '{language}', true, 'both', '4-6'),

    -- مواد المرحلة الإعدادية
    (11, 'التاريخ والجغرافيا', 'History & Geography', 'آداب', ARRAY['preparatory'], '🌐', '#A04000', 'arabic', '{public,language,azhar}', true, 'both', NULL),

    -- صف 10 المحدث (العلوم المتكاملة، التاريخ المصري، الفلسفة)
    (12, 'العلوم المتكاملة', 'Integrated Science', 'علوم', ARRAY['secondary'], '🧬', '#27AE60', 'arabic', '{public,azhar}', true, 'both', NULL),
    (13, 'Integrated Sciences', 'Integrated Sciences', 'علوم', ARRAY['secondary'], '🧬', '#27AE60', 'english', '{language}', true, 'both', NULL),
    (14, 'التاريخ المصري', 'Egyptian History', 'آداب', ARRAY['secondary'], '🇪🇬', '#922B21', 'arabic', '{public,language,azhar}', true, 'both', NULL),
    (15, 'الفلسفة والمنطق', 'Philosophy & Logic', 'آداب', ARRAY['secondary'], '🤔', '#2C3E50', 'arabic', '{public,language,azhar}', true, 'both', NULL),
    (16, 'برمجة وحاسب', 'Programming & CS', 'علوم', ARRAY['secondary'], '💻', '#1A5276', 'arabic', '{public,language,azhar}', false, 'both', NULL),
    (17, 'لغة أجنبية ثانية', 'Second Foreign Language', 'لغات', ARRAY['secondary'], '🗣️', '#D35400', 'arabic', '{public,language,azhar}', false, 'both', NULL),

    -- البكالوريا والمواد المتقدمة لصف 11-12
    (18, 'أحياء متقدم', 'Advanced Biology', 'علوم', ARRAY['secondary'], '🧬', '#1D8348', 'arabic', '{public,azhar}', true, 'baccalaureate', NULL),
    (19, 'Advanced Biology', 'Advanced Biology', 'علوم', ARRAY['secondary'], '🧬', '#1D8348', 'english', '{language}', true, 'baccalaureate', NULL),
    (20, 'كيمياء متقدم', 'Advanced Chemistry', 'علوم', ARRAY['secondary'], '🧪', '#4A235A', 'arabic', '{public,azhar}', true, 'baccalaureate', NULL),
    (21, 'Advanced Chemistry', 'Advanced Chemistry', 'علوم', ARRAY['secondary'], '🧪', '#4A235A', 'english', '{language}', true, 'baccalaureate', NULL),
    (22, 'رياضيات متقدم', 'Advanced Math', 'علوم', ARRAY['secondary'], '📐', '#117A65', 'arabic', '{public,azhar}', true, 'baccalaureate', NULL),
    (23, 'Advanced Math', 'Advanced Math', 'علوم', ARRAY['secondary'], '📐', '#117A65', 'english', '{language}', true, 'baccalaureate', NULL),
    (24, 'فيزياء متقدم', 'Advanced Physics', 'علوم', ARRAY['secondary'], '⚡', '#1B2631', 'arabic', '{public,azhar}', true, 'baccalaureate', NULL),
    (25, 'Advanced Physics', 'Advanced Physics', 'علوم', ARRAY['secondary'], '⚡', '#1B2631', 'english', '{language}', true, 'baccalaureate', NULL),
    (26, 'اقتصاد', 'Economics', 'آداب', ARRAY['secondary'], '📊', '#7D6608', 'arabic', '{public,language,azhar}', true, 'baccalaureate', NULL),
    (27, 'رياضيات تطبيقية', 'Applied Math', 'علوم', ARRAY['secondary'], '📈', '#2471A3', 'arabic', '{public,language,azhar}', true, 'baccalaureate', NULL),
    (28, 'أدب متقدم', 'Advanced Literature', 'آداب', ARRAY['secondary'], '✍️', '#784212', 'arabic', '{public,language,azhar}', true, 'baccalaureate', NULL),
    (29, 'فلسفة متقدمة', 'Advanced Philosophy', 'آداب', ARRAY['secondary'], '🧠', '#6C3483', 'arabic', '{public,language,azhar}', true, 'baccalaureate', NULL);

-- =====================================================
-- 5. مسارات البكالوريا المصرية (Grade 11-12)
-- =====================================================
INSERT INTO public.curriculum_tracks (id, name_ar, name_en, stage_id, description) VALUES
    ('11111111-1111-1111-1111-111111111111', 'الطب وعلوم الحياة', 'Medicine & Life Sciences', 3, 'يؤهل لكليات الطب، الصيدلة، العلوم وطب الأسنان. يركز على الأحياء والكيمياء المتقدمة.'),
    ('22222222-2222-2222-2222-222222222222', 'الهندسة وعلوم الحاسب', 'Engineering & Computer Science', 3, 'يؤهل لكليات الهندسة، الحاسبات والمعلومات، والتكنولوجيا. يركز على الرياضيات المتقدمة والفيزياء المتقدمة.'),
    ('33333333-3333-3333-3333-333333333333', 'الأعمال والاقتصاد', 'Business & Economics', 3, 'يؤهل لكليات التجارة، إدارة الأعمال، والاقتصاد والعلوم السياسية. يركز على الاقتصاد والرياضيات التطبيقية.'),
    ('44444444-4444-4444-4444-444444444444', 'الآداب والفنون', 'Arts & Humanities', 3, 'يؤهل لكليات الآداب، الإعلام، الألسن، والفنون الجميلة. يركز على الأدب المتقدم والفلسفة المتقدمة.');

-- =====================================================
-- 6. ربط المواد الدراسية بمسارات البكالوريا
-- =====================================================
INSERT INTO public.subject_tracks (subject_id, track_id) VALUES
    -- مسار الطب وعلوم الحياة
    (18, '11111111-1111-1111-1111-111111111111'), -- أحياء متقدم (عربي)
    (19, '11111111-1111-1111-1111-111111111111'), -- Advanced Biology (لغات)
    (20, '11111111-1111-1111-1111-111111111111'), -- كيمياء متقدم (عربي)
    (21, '11111111-1111-1111-1111-111111111111'), -- Advanced Chemistry (لغات)
    
    -- مسار الهندسة وعلوم الحاسب
    (22, '22222222-2222-2222-2222-222222222222'), -- رياضيات متقدم (عربي)
    (23, '22222222-2222-2222-2222-222222222222'), -- Advanced Math (لغات)
    (24, '22222222-2222-2222-2222-222222222222'), -- فيزياء متقدم (عربي)
    (25, '22222222-2222-2222-2222-222222222222'), -- Advanced Physics (لغات)
    
    -- مسار الأعمال والاقتصاد
    (26, '33333333-3333-3333-3333-333333333333'), -- اقتصاد
    (27, '33333333-3333-3333-3333-333333333333'), -- رياضيات تطبيقية
    
    -- مسار الآداب والفنون
    (28, '44444444-4444-4444-4444-444444444444'), -- أدب متقدم
    (29, '44444444-4444-4444-4444-444444444444'); -- فلسفة متقدمة
