-- Migration: إضافة إعدادات ترويسة الطباعة للمعلم
ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS print_directorate TEXT,  -- مديرية التربية والتعليم
  ADD COLUMN IF NOT EXISTS print_administration TEXT,  -- الإدارة التعليمية
  ADD COLUMN IF NOT EXISTS print_school_name TEXT,  -- اسم المدرسة
  ADD COLUMN IF NOT EXISTS print_academic_year TEXT DEFAULT '2025 / 2026';  -- العام الدراسي
