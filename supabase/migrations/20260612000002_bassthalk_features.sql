-- =====================================================
-- Migration: 20260612000002_bassthalk_features.sql
-- Description: إضافة ميزات الأجهزة والتحقق ولي الأمر والمحفظة وأكواد السناتر والقيود
-- =====================================================

-- 1. جدول جلسات أجهزة الطلاب النشطة لمنع مشاركة الحسابات
CREATE TABLE IF NOT EXISTS public.student_device_sessions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  device_name  VARCHAR     NOT NULL, -- مثلاً: Chrome on Windows
  device_type  VARCHAR     NOT NULL, -- Desktop, Mobile, Tablet
  ip_address   VARCHAR     NOT NULL,
  user_agent   TEXT        NOT NULL,
  last_active_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sds_student ON public.student_device_sessions(student_id);

ALTER TABLE public.student_device_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_manage_own_sessions"
  ON public.student_device_sessions FOR ALL
  USING (student_id = auth.uid());

CREATE POLICY "admin_manages_all_sessions"
  ON public.student_device_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- 2. إضافة أعمدة المحفظة وتليجرام لجدول الطلاب (students)
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
  ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR UNIQUE,
  ADD COLUMN IF NOT EXISTS telegram_verification_code VARCHAR(8);


-- 3. إضافة أعمدة قيود فتح الدروس لجدول الدروس (lessons)
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS min_watch_percentage INTEGER DEFAULT 80,
  ADD COLUMN IF NOT EXISTS require_exam_pass BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS exam_passing_score INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS max_exam_attempts INTEGER DEFAULT 3;


-- 4. جدول كروت شحن السناتر التعليمية والمكتبات
CREATE TABLE IF NOT EXISTS public.center_scratch_cards (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code               VARCHAR(16) UNIQUE NOT NULL, -- كود عشوائي فريد مطبوع
  amount             NUMERIC(10, 2) NOT NULL, -- القيمة المالية للكارت
  is_used            BOOLEAN     DEFAULT FALSE NOT NULL,
  used_by_student_id UUID        REFERENCES public.students(id) ON DELETE SET NULL,
  used_at            TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at         TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_csc_code ON public.center_scratch_cards(code);

ALTER TABLE public.center_scratch_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manages_scratch_cards"
  ON public.center_scratch_cards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "students_view_unised_cards_for_verification"
  ON public.center_scratch_cards FOR SELECT
  USING (is_used = FALSE);


-- 5. جدول سجل الحركات المالية للمحفظة
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount           NUMERIC(10, 2) NOT NULL,
  transaction_type VARCHAR     NOT NULL CHECK (transaction_type IN ('charge_card', 'charge_online', 'buy_course', 'refund')),
  reference_id     UUID,
  comment          TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wt_student ON public.wallet_transactions(student_id);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_view_own_transactions"
  ON public.wallet_transactions FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "admin_manages_all_transactions"
  ON public.wallet_transactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- 6. وظيفة شحن المحفظة الآمنة (Security Definer Function)
CREATE OR REPLACE FUNCTION public.charge_wallet_with_scratch_card(card_code VARCHAR)
RETURNS JSONB AS $$
DECLARE
  v_student_id UUID;
  v_card_id UUID;
  v_amount NUMERIC(10, 2);
  v_is_used BOOLEAN;
  v_expires_at TIMESTAMPTZ;
  v_res JSONB;
BEGIN
  v_student_id := auth.uid();
  IF v_student_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'غير مصرح لك بالعملية');
  END IF;

  -- التحقق من الكود
  SELECT id, amount, is_used, expires_at 
  INTO v_card_id, v_amount, v_is_used, v_expires_at
  FROM public.center_scratch_cards
  WHERE code = card_code;

  IF v_card_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'كود الكارت غير صحيح');
  END IF;

  IF v_is_used THEN
    RETURN jsonb_build_object('success', false, 'message', 'عذراً، هذا الكود تم استخدامه مسبقاً');
  END IF;

  IF v_expires_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'message', 'عذراً، هذا الكارت منتهي الصلاحية');
  END IF;

  -- تحديث كود الكارت
  UPDATE public.center_scratch_cards
  SET is_used = TRUE,
      used_by_student_id = v_student_id,
      used_at = NOW()
  WHERE id = v_card_id;

  -- تحديث رصيد الطالب
  UPDATE public.students
  SET wallet_balance = wallet_balance + v_amount
  WHERE id = v_student_id;

  -- تسجيل الحركة المالية
  INSERT INTO public.wallet_transactions (student_id, amount, transaction_type, reference_id, comment)
  VALUES (v_student_id, v_amount, 'charge_card', v_card_id, 'شحن رصيد عبر كود سنتر');

  RETURN jsonb_build_object('success', true, 'message', 'تم شحن المحفظة بنجاح بقيمة ' || v_amount || ' جنيه مصرى', 'amount', v_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
