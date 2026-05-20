-- =====================================================
-- Migration: 20260527000001_group_sessions_attendance.sql
-- Description: إضافة جداول مواعيد الحصص وروابط البث ورصد حضور الطلاب
-- =====================================================

-- 1. جدول الحصص/المواعيد (Group Sessions)
CREATE TABLE IF NOT EXISTS public.group_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.student_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  live_stream_url TEXT, -- رابط البث المباشر (Zoom, Teams, etc.)
  media_url TEXT, -- رابط وسائط/مذكرات
  media_title TEXT, -- اسم الرابط/الملف المرفق
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول رصد حضور الطلاب (Session Attendance)
CREATE TABLE IF NOT EXISTS public.session_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.group_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  joined_at TIMESTAMPTZ, -- تسجيل وقت الانضمام التلقائي إذا نقر على رابط البث
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

-- تفعيل RLS للجداول الجديدة
ALTER TABLE public.group_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_attendance ENABLE ROW LEVEL SECURITY;

-- سياسات الحصص (Group Sessions)
DROP POLICY IF EXISTS "المعلم يدير حصص مجموعاته" ON public.group_sessions;
CREATE POLICY "المعلم يدير حصص مجموعاته" ON public.group_sessions 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.student_groups WHERE id = group_id AND teacher_id = auth.uid())
  );

DROP POLICY IF EXISTS "الطلاب يرون حصص مجموعاتهم" ON public.group_sessions;
CREATE POLICY "الطلاب يرون حصص مجموعاتهم" ON public.group_sessions 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.group_students WHERE group_id = group_sessions.group_id AND student_id = auth.uid())
  );

-- سياسات الحضور (Session Attendance)
DROP POLICY IF EXISTS "المعلم يدير حضور مجموعاته" ON public.session_attendance;
CREATE POLICY "المعلم يدير حضور مجموعاته" ON public.session_attendance 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.group_sessions gs
      JOIN public.student_groups sg ON sg.id = gs.group_id
      WHERE gs.id = session_id AND sg.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "الطلاب يرون حضورهم الشخصي" ON public.session_attendance;
CREATE POLICY "الطلاب يرون حضورهم الشخصي" ON public.session_attendance 
  FOR SELECT USING (
    student_id = auth.uid()
  );
