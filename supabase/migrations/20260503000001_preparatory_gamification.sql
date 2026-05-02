-- =====================================================
-- Migration: بيانات المرحلة الإعدادية + نظام التلعيب + التحديات
-- =====================================================

-- =====================================================
-- (تمت إزالة كود إدخال البيانات المبدئية للصفوف والمواد والوحدات بناءً على طلبك)
-- =====================================================
-- 2. تطوير جدول الطلاب بحقول التلعيب
-- =====================================================
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS xp_points     INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level         INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS streak_days   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_date DATE,
  ADD COLUMN IF NOT EXISTS total_battles_won  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_battles_lost INTEGER DEFAULT 0;

-- =====================================================
-- 3. جدول معاملات XP
-- =====================================================
CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL,
  reason      TEXT NOT NULL,
  reference_id TEXT,  -- معرّف الحدث (exam_id, challenge_id, ...)
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_xp_student ON public.xp_transactions(student_id);

-- =====================================================
-- 4. جدول الإنجازات (Badges)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.badges (
  id           SERIAL PRIMARY KEY,
  name_ar      TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  icon         TEXT NOT NULL DEFAULT '🏅',
  criteria_type TEXT NOT NULL CHECK (criteria_type IN (
    'streak', 'xp_total', 'battles_won', 'exams_passed',
    'questions_correct', 'perfect_exam', 'first_login'
  )),
  criteria_value INTEGER NOT NULL DEFAULT 1,
  xp_reward    INTEGER DEFAULT 0,
  color        TEXT DEFAULT '#FFD700'
);

-- الإنجازات الافتراضية
INSERT INTO public.badges (name_ar, description_ar, icon, criteria_type, criteria_value, xp_reward) VALUES
  ('أول خطوة',    'أكمل أول جلسة تدريب',          '🌱', 'questions_correct', 1,   5),
  ('متحدٍ',        'فز بأول تحدي مباشر',            '⚔️', 'battles_won',       1,   30),
  ('المثابر',      'سجّل ٧ أيام متتالية',            '🔥', 'streak',            7,   50),
  ('المحترف',      'اجتاز ١٠ اختبارات بنجاح',       '🎓', 'exams_passed',      10,  100),
  ('النجم',        'اجمع ٥٠٠ نقطة XP',             '⭐', 'xp_total',          500, 50),
  ('الأسطورة',     'اجمع ٢٠٠٠ نقطة XP',            '🏆', 'xp_total',          2000,200),
  ('امتحان مثالي', 'احصل على ١٠٠٪ في اختبار',      '💯', 'perfect_exam',      1,   75),
  ('المتحدي الكبير','فز بـ ٥٠ تحدياً مباشراً',       '👑', 'battles_won',       50,  500)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. جدول شارات الطلاب
-- =====================================================
CREATE TABLE IF NOT EXISTS public.student_badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  badge_id   INTEGER NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, badge_id)
);

-- =====================================================
-- 6. جدول التحديات المباشرة 1v1
-- =====================================================
CREATE TABLE IF NOT EXISTS public.challenges (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id       UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  opponent_id         UUID REFERENCES public.students(id) ON DELETE SET NULL,
  subject_id          INTEGER REFERENCES public.subjects(id),
  grade_id            INTEGER REFERENCES public.grades(id),
  questions           JSONB DEFAULT '[]'::jsonb,  -- مصفوفة معرّفات الأسئلة
  challenger_answers  JSONB DEFAULT '{}'::jsonb,
  opponent_answers    JSONB DEFAULT '{}'::jsonb,
  challenger_score    INTEGER DEFAULT 0,
  opponent_score      INTEGER DEFAULT 0,
  status              TEXT DEFAULT 'searching'
    CHECK (status IN ('searching','pending','active','completed','cancelled')),
  winner_id           UUID REFERENCES public.students(id) ON DELETE SET NULL,
  xp_reward           INTEGER DEFAULT 30,
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_challenges_challenger ON public.challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_challenges_opponent   ON public.challenges(opponent_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status     ON public.challenges(status);

-- =====================================================
-- 7. View لوحة الشرف (Leaderboard)
-- =====================================================
CREATE OR REPLACE VIEW public.leaderboard_weekly AS
SELECT
  s.id AS student_id,
  p.full_name,
  p.avatar_url,
  g.name_ar AS grade_name,
  g.grade_number,
  COALESCE(SUM(x.amount), 0) AS weekly_xp,
  s.xp_points AS total_xp,
  s.level,
  s.streak_days,
  s.total_battles_won,
  ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(x.amount), 0) DESC) AS rank
FROM public.students s
JOIN public.profiles p ON p.id = s.id
LEFT JOIN public.grades g ON g.id = s.grade_id
LEFT JOIN public.xp_transactions x ON x.student_id = s.id
  AND x.created_at >= (NOW() - INTERVAL '7 days')
GROUP BY s.id, p.full_name, p.avatar_url, g.name_ar, g.grade_number, s.xp_points, s.level, s.streak_days, s.total_battles_won;

-- =====================================================
-- 8. دالة منح XP وتحديث المستوى
-- =====================================================
CREATE OR REPLACE FUNCTION public.award_xp(
  p_student_id UUID,
  p_amount     INTEGER,
  p_reason     TEXT,
  p_reference  TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  new_total INTEGER;
  new_level  INTEGER;
BEGIN
  -- سجل المعاملة
  INSERT INTO public.xp_transactions (student_id, amount, reason, reference_id)
  VALUES (p_student_id, p_amount, p_reason, p_reference);

  -- تحديث إجمالي XP
  UPDATE public.students
  SET xp_points = xp_points + p_amount
  WHERE id = p_student_id
  RETURNING xp_points INTO new_total;

  -- تحديث المستوى (كل 100 XP = مستوى جديد)
  new_level := GREATEST(1, FLOOR(new_total / 100) + 1);
  UPDATE public.students SET level = new_level WHERE id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. RLS للجداول الجديدة
-- =====================================================
ALTER TABLE public.xp_transactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_badges     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges         ENABLE ROW LEVEL SECURITY;

-- XP: الطالب يرى معاملاته فقط
CREATE POLICY "student_own_xp" ON public.xp_transactions
  FOR SELECT USING (student_id = auth.uid());

-- Badges: الجميع يرى الشارات المكتسبة
CREATE POLICY "student_own_badges" ON public.student_badges
  FOR SELECT USING (true);

-- Challenges: يرى فقط من شارك فيه
CREATE POLICY "challenge_participants" ON public.challenges
  FOR SELECT USING (
    challenger_id = auth.uid() OR opponent_id = auth.uid()
  );
CREATE POLICY "challenge_insert" ON public.challenges
  FOR INSERT WITH CHECK (challenger_id = auth.uid());
CREATE POLICY "challenge_update" ON public.challenges
  FOR UPDATE USING (
    challenger_id = auth.uid() OR opponent_id = auth.uid()
  );
