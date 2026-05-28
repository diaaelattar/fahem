-- =====================================================
-- Migration: 20260605000001_updated_curriculum_system.sql
-- Description: تحديث هيكل المناهج ومسارات البكالوريا ونوع التعليم (عربي/لغات) لعام 2025-2026
-- =====================================================

-- 1. إنشاء نوع البيانات المخصص لـ system_type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'curriculum_system_type') THEN
        CREATE TYPE public.curriculum_system_type AS ENUM ('both', 'traditional', 'baccalaureate');
    END IF;
END $$;

-- 2. تحديث جدول public.subjects
ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS in_total BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS system_type public.curriculum_system_type DEFAULT 'both',
  ADD COLUMN IF NOT EXISTS grade_group TEXT;

-- 3. إنشاء جدول مسارات البكالوريا public.curriculum_tracks
CREATE TABLE IF NOT EXISTS public.curriculum_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar TEXT NOT NULL UNIQUE,
    name_en TEXT,
    stage_id INTEGER REFERENCES public.educational_stages(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. إنشاء جدول الوسيط لربط المواد بالمسارات public.subject_tracks
CREATE TABLE IF NOT EXISTS public.subject_tracks (
    subject_id INTEGER REFERENCES public.subjects(id) ON DELETE CASCADE,
    track_id UUID REFERENCES public.curriculum_tracks(id) ON DELETE CASCADE,
    PRIMARY KEY (subject_id, track_id)
);

-- 5. تحديث جدول public.grades
ALTER TABLE public.grades
  ADD COLUMN IF NOT EXISTS has_tracks BOOLEAN DEFAULT false;

-- 6. تحديث جدول public.questions
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS track_id UUID REFERENCES public.curriculum_tracks(id) ON DELETE SET NULL;

-- 7. تحديث جدول public.units
ALTER TABLE public.units
  ADD COLUMN IF NOT EXISTS applies_to_system public.curriculum_system_type DEFAULT 'both';

-- 8. تفعيل سياسات الحماية RLS للجداول الجديدة
ALTER TABLE public.curriculum_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_tracks ENABLE ROW LEVEL SECURITY;

-- 9. إنشاء السياسات الأمنية (RLS Policies)
DO $$
BEGIN
    DROP POLICY IF EXISTS "الكل يمكنه قراءة المسارات" ON public.curriculum_tracks;
    CREATE POLICY "الكل يمكنه قراءة المسارات" ON public.curriculum_tracks
        FOR SELECT USING (true);

    DROP POLICY IF EXISTS "المديرون يمكنهم تعديل المسارات" ON public.curriculum_tracks;
    CREATE POLICY "المديرون يمكنهم تعديل المسارات" ON public.curriculum_tracks
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
            )
        );

    DROP POLICY IF EXISTS "الكل يمكنه قراءة ربط المواد بالمسارات" ON public.subject_tracks;
    CREATE POLICY "الكل يمكنه قراءة ربط المواد بالمسارات" ON public.subject_tracks
        FOR SELECT USING (true);

    DROP POLICY IF EXISTS "المديرون يمكنهم تعديل ربط المواد بالمسارات" ON public.subject_tracks;
    CREATE POLICY "المديرون يمكنهم تعديل ربط المواد بالمسارات" ON public.subject_tracks
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
            )
        );
END $$;

-- 10. إدراج وتحديث أعمدة جدول الطلاب students لدعم مسارات البكالوريا
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS track_id UUID REFERENCES public.curriculum_tracks(id) ON DELETE SET NULL;
