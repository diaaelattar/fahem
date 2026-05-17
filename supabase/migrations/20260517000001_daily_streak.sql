-- Migration: Add daily streak logic
-- 20260517000001_daily_streak.sql

CREATE OR REPLACE FUNCTION public.update_daily_streak(p_student_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_student public.students%ROWTYPE;
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_new_streak INTEGER;
  v_xp_awarded INTEGER := 0;
BEGIN
  -- جلب بيانات الطالب الحالية مع قفل الصف لمنع التزامن
  SELECT * INTO v_student 
  FROM public.students 
  WHERE id = p_student_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'الطالب غير موجود');
  END IF;

  -- إذا كان قد نشط اليوم، لا تفعل شيئاً
  IF v_student.last_activity_date = v_today THEN
    RETURN jsonb_build_object('success', true, 'updated', false, 'streak', v_student.streak_days);
  END IF;

  -- حساب الستريك الجديد
  IF v_student.last_activity_date = v_yesterday THEN
    -- متتالي
    v_new_streak := v_student.streak_days + 1;
    v_xp_awarded := 10; -- مكافأة يومية
  ELSE
    -- انقطع الستريك
    v_new_streak := 1;
    v_xp_awarded := 5; -- مكافأة البداية الجديدة
  END IF;

  -- تحديث بيانات الطالب
  UPDATE public.students 
  SET 
    streak_days = v_new_streak,
    last_activity_date = v_today,
    xp_points = xp_points + v_xp_awarded
  WHERE id = p_student_id;

  -- إضافة سجل XP
  IF v_xp_awarded > 0 THEN
    INSERT INTO public.xp_transactions (student_id, amount, reason)
    VALUES (p_student_id, v_xp_awarded, 'مكافأة تسجيل الدخول اليومي (الستريك)');
  END IF;

  RETURN jsonb_build_object(
    'success', true, 
    'updated', true, 
    'streak', v_new_streak, 
    'xp_awarded', v_xp_awarded,
    'old_streak', v_student.streak_days
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
