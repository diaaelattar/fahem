-- Add AI Audit Results column to questions table
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS ai_audit_results JSONB DEFAULT NULL;

COMMENT ON COLUMN public.questions.ai_audit_results IS 'Stores AI-generated audit suggestions, including corrected text, bloom level suggestions, and metadata tags.';
