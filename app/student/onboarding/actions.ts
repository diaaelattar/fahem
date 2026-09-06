'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function saveStudentGradeAction(
  userId: string,
  gradeId: number,
  educationType: string = 'public',
  systemType: string = 'traditional',
  trackId: string | null = null
): Promise<{ success: boolean; error?: string }> {
  try {
    // ── أمان: التحقق من هوية المستخدم من الجلسة السيرفرية ──────────────
    const supabase = await createClient()
    const {
      data: { user: sessionUser },
      error: sessionError,
    } = await supabase.auth.getUser()

    if (sessionError || !sessionUser) {
      return { success: false, error: 'غير مصرح. يرجى تسجيل الدخول أولاً.' }
    }

    if (sessionUser.id !== userId) {
      return { success: false, error: 'عملية غير مصرح بها.' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', sessionUser.id)
      .maybeSingle()

    if (profile && profile.role !== 'student') {
      return { success: false, error: 'هذه العملية متاحة للطلاب فقط.' }
    }

    // ── استخدام Admin Client إن وُجد المفتاح، مع التراجع التلقائي للـ Session Client ──
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const dbClient =
      serviceKey && process.env.NEXT_PUBLIC_SUPABASE_URL
        ? createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            serviceKey,
            { auth: { autoRefreshToken: false, persistSession: false } }
          )
        : supabase

    // 1. تحديث البروفايل
    const { error: profileError } = await dbClient.from('profiles').upsert(
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

    if (profileError) {
      console.warn('[Onboarding] Profile upsert warning:', profileError.message)
    }

    // 2. تحديث جدول الطلاب مع معالجة مرنة للأعمدة الاختيارية (track_id / education_type)
    const studentPayload: Record<string, any> = {
      id: userId,
      grade_id: gradeId,
      education_type: educationType,
    }

    // لا تُرسل track_id إلا إذا كان معرفاً حقيقياً غير فارغ
    if (trackId && trackId !== 'skip') {
      studentPayload.track_id = trackId
    }

    let { error: studentError } = await dbClient
      .from('students')
      .upsert(studentPayload, { onConflict: 'id' })

    // في حال عدم وجود عمود track_id في قاعدة البيانات، نعيد المحاولة بدونه فوراً
    if (studentError && studentPayload.track_id) {
      console.warn('[Onboarding] Re-trying without track_id column...')
      delete studentPayload.track_id
      const retry = await dbClient
        .from('students')
        .upsert(studentPayload, { onConflict: 'id' })
      studentError = retry.error
    }

    // في حال عدم وجود عمود education_type في قاعدة البيانات، نعيد المحاولة بدونه
    if (studentError && studentPayload.education_type) {
      console.warn('[Onboarding] Re-trying without education_type column...')
      delete studentPayload.education_type
      const retry = await dbClient
        .from('students')
        .upsert(studentPayload, { onConflict: 'id' })
      studentError = retry.error
    }

    if (studentError) {
      return { success: false, error: studentError.message }
    }

    // 3. مزامنة الصف في Auth Metadata وفي الكوكيز لتخطي الـ Middleware فورياً
    try {
      await supabase.auth.updateUser({
        data: { grade_id: gradeId, role: 'student' },
      })
    } catch {
      // non-critical
    }

    if (serviceKey && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        await (dbClient as any).auth.admin.updateUserById(userId, {
          user_metadata: { grade_id: gradeId, role: 'student' },
        })
      } catch {
        // non-critical
      }
    }

    try {
      const cookieStore = cookies()
      cookieStore.set('student_grade_id', String(gradeId), {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
        httpOnly: false,
      })
    } catch {
      // non-critical
    }

    // 4. منح نقاط الترحيب (XP) إن أمكن
    try {
      await dbClient.rpc('award_xp', {
        p_student_id: userId,
        p_amount: 10,
        p_reason: 'أول تسجيل دخول 🎉',
        p_reference: null,
      })
    } catch {
      // تجاهل أخطاء الـ XP الثانوية
    }

    return { success: true }
  } catch (err: any) {
    console.error('[Onboarding Action Error]:', err)
    return { success: false, error: err?.message || 'حدث خطأ أثناء حفظ الإعدادات' }
  }
}
