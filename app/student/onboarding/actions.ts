'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function saveStudentGradeAction(
  userId: string,
  gradeId: number,
  educationType: string = 'public',
  systemType: string = 'traditional',
  trackId: string | null = null
) {
  // ── أمان: التحقق من هوية المستخدم من الجلسة السيرفرية ──────────────
  // لا نثق بـ userId القادم من المتصفح — نجلب المستخدم من الكوكي المشفر
  const supabase = await createClient()
  const {
    data: { user: sessionUser },
    error: sessionError,
  } = await supabase.auth.getUser()

  if (sessionError || !sessionUser) {
    throw new Error('غير مصرح. يرجى تسجيل الدخول أولاً.')
  }

  // التأكد أن المستخدم المطلوب هو نفس المستخدم المسجل في الجلسة
  if (sessionUser.id !== userId) {
    throw new Error('عملية غير مصرح بها.')
  }

  // التحقق أن دور المستخدم هو student أو null (مستخدم جديد في الـ onboarding)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', sessionUser.id)
    .maybeSingle()

  if (profile && profile.role !== 'student') {
    throw new Error('هذه العملية متاحة للطلاب فقط.')
  }

  // ── استخدام Admin Client للكتابة بصلاحيات موثوقة ───────────────────
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Ensure profile is up-to-date
  const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
    {
      id: userId,
      email: sessionUser.email || '',
      full_name:
        sessionUser.user_metadata?.full_name ||
        sessionUser.email?.split('@')[0] ||
        'طالب جديد',
      role: 'student',
    },
    { onConflict: 'id' }
  )

  if (profileError) throw new Error(profileError.message)

  // 2. Ensure student row exists and update grade + education_type + track_id
  const { error: studentError } = await supabaseAdmin.from('students').upsert(
    {
      id: userId,
      grade_id: gradeId,
      education_type: educationType,
      track_id: trackId,
    },
    { onConflict: 'id' }
  )

  if (studentError) throw new Error(studentError.message)

  // 3. Award first-login XP
  try {
    await supabaseAdmin.rpc('award_xp', {
      p_student_id: userId,
      p_amount: 10,
      p_reason: 'أول تسجيل دخول 🎉',
      p_reference: null,
    })
  } catch {
    // Ignore XP error — non-critical
  }
}
