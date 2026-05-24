-- Migration: إضافة جدول رصد أحداث الغش والمراقبة
CREATE TABLE IF NOT EXISTS public.exam_proctoring_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'tab_switch', 'blur', 'copy_attempt', 'right_click'
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- RLS policies
ALTER TABLE public.exam_proctoring_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can insert their own proctoring events" ON public.exam_proctoring_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exam_attempts
      WHERE id = attempt_id AND student_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view proctoring events for their exams" ON public.exam_proctoring_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.exam_attempts a
      JOIN public.exams e ON a.exam_id = e.id
      WHERE a.id = attempt_id AND e.teacher_id = auth.uid()
    )
  );
