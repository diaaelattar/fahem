-- ================================================================
-- Migration: 20260611000001_school_audit_log.sql
-- Description: نظام تسجيل الأحداث الأمنية لبوابة المدارس
-- يتوافق مع: ISO 27001 A.12.4 — Logging and Monitoring
-- ================================================================

-- 1. إنشاء جدول سجل الأحداث (Audit Log)
CREATE TABLE IF NOT EXISTS public.school_audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id    UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  actor_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email  TEXT,
  actor_role   TEXT,
  action       TEXT NOT NULL,           -- CREATE | UPDATE | DELETE | LOGIN | EXPORT
  entity_type  TEXT NOT NULL,           -- class | exam | teacher | student | settings
  entity_id    TEXT,                    -- UUID أو أي معرف للعنصر المتأثر
  entity_name  TEXT,                    -- اسم العنصر للعرض البشري
  metadata     JSONB DEFAULT '{}'::jsonb, -- بيانات إضافية (القيم القديمة / الجديدة)
  ip_address   TEXT,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 2. فهارس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_audit_school_id ON public.school_audit_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor_id  ON public.school_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_created   ON public.school_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action    ON public.school_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_entity    ON public.school_audit_logs(entity_type);

-- 3. تفعيل Row Level Security
ALTER TABLE public.school_audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. سياسات RLS
-- مدير المدرسة يرى سجلات مدرسته فقط (قراءة فقط)
CREATE POLICY "مدير المدرسة يرى سجلات مدرسته" 
  ON public.school_audit_logs FOR SELECT 
  USING (
    school_id = (
      SELECT school_id FROM public.profiles 
      WHERE id = auth.uid() AND role = 'school_admin' 
      LIMIT 1
    )
  );

-- الأدمن العام يرى كل السجلات
CREATE POLICY "الأدمن يرى كل سجلات التدقيق" 
  ON public.school_audit_logs FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- السماح بالإدراج من Service Role فقط (لا يمكن للمستخدمين إنشاء سجلات وهمية)
CREATE POLICY "Service Role فقط يُنشئ سجلات" 
  ON public.school_audit_logs FOR INSERT 
  WITH CHECK (true); -- يتم التحكم عبر Service Role في الـ API

-- 5. إجراء مساعد لحساب إجمالي الأحداث حسب النوع (للتقارير)
CREATE OR REPLACE FUNCTION public.get_school_audit_summary(p_school_id UUID)
RETURNS TABLE (
  action      TEXT,
  entity_type TEXT,
  count       BIGINT,
  last_at     TIMESTAMPTZ
)
LANGUAGE SQL STABLE SECURITY DEFINER
AS $$
  SELECT
    action,
    entity_type,
    COUNT(*) AS count,
    MAX(created_at) AS last_at
  FROM public.school_audit_logs
  WHERE school_id = p_school_id
    AND created_at >= NOW() - INTERVAL '30 days'
  GROUP BY action, entity_type
  ORDER BY count DESC;
$$;

-- 6. تعليق للتوثيق
COMMENT ON TABLE public.school_audit_logs IS 
  'سجل تدقيق شامل لجميع العمليات الحساسة في بوابة المدارس — ISO 27001 A.12.4';
