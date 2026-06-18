'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function saveTeacherSubjectAction(userId: string, subjectId: number) {
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

  // التحقق أن دور المستخدم في الـ profile هو teacher
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', sessionUser.id)
    .maybeSingle()

  if (profile?.role !== 'teacher') {
    throw new Error('هذه العملية متاحة للمعلمين فقط.')
  }

  // ── استخدام Admin Client للكتابة بصلاحيات موثوقة ───────────────────
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Ensure profile is up-to-date
  await supabaseAdmin.from('profiles').upsert({
    id: userId,
    email: sessionUser.email || '',
    full_name: sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'معلم جديد',
    role: 'teacher'
  }, { onConflict: 'id' })

  // Update teacher record with subject
  const { error } = await supabaseAdmin.from('teachers').upsert({
    id: userId,
    subject_id: subjectId,
    subscription_status: 'trial'
  }, { onConflict: 'id' })

  if (error) throw new Error(error.message)
}
