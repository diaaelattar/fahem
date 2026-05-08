-- ====================================================
-- Migration: Add summary to lessons
-- Date: 2026-05-08
-- ====================================================

-- 1. إضافة عمود الملخص إلى جدول الدروس
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS summary TEXT;
