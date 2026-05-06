-- Migration: 20260506000001_add_semester_to_questions.sql
-- Description: Add semester_id to questions and documents for better filtering

ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS semester_id INTEGER REFERENCES public.semesters(id);

ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS semester_id INTEGER REFERENCES public.semesters(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_questions_semester ON public.questions(semester_id);
CREATE INDEX IF NOT EXISTS idx_documents_semester ON public.documents(semester_id);
