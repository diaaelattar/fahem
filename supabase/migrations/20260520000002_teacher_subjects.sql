-- Migration: Add subject_id to teachers table

-- Add subject_id column
ALTER TABLE public.teachers 
ADD COLUMN subject_id bigint REFERENCES public.subjects(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_teachers_subject_id ON public.teachers(subject_id);

-- Update RLS policies for teachers to allow them to update their own subject_id
-- (Since we already have a policy that allows them to UPDATE their own row based on id)
-- Just ensuring the column is mutable.
