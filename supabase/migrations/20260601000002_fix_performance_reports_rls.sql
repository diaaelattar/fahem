-- ===================================================
-- Migration: 20260601000002_fix_performance_reports_rls.sql
-- Description: تفعيل RLS على جدول performance_reports
-- ملاحظة: الجدول خاص بالإدارة فقط (لا يحتوي على student_id) وهو لتقارير الأداء الإجمالية
-- ===================================================

-- تفعيل حماية RLS على جدول تقارير الأداء
ALTER TABLE public.performance_reports ENABLE ROW LEVEL SECURITY;

-- سياسة: الأدمن يملك صلاحيات كاملة على تقارير الأداء الإجمالية
DROP POLICY IF EXISTS "Admins manage all performance reports" ON public.performance_reports;
CREATE POLICY "Admins manage all performance reports" ON public.performance_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
  );

-- سياسة: النظام (Service Role) يستطيع الكتابة والقراءة لتوليد التقارير تلقائياً
DROP POLICY IF EXISTS "Service role full access performance reports" ON public.performance_reports;
CREATE POLICY "Service role full access performance reports" ON public.performance_reports
  FOR ALL USING (auth.role() = 'service_role');
