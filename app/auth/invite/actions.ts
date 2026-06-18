'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

/**
 * Server Action آمنة لقبول دعوة مدرسة
 * تستخدم service_role لتجاوز trigger منع تعديل الأدوار
 * وللتأكد من أن التعديل يتم على السيرفر فقط (لا من المتصفح)
 */
export async function acceptSchoolInvitationAction(
  token: string
): Promise<{ success: true; role: string; schoolName: string } | { success: false; error: string }> {
  try {
    // 1. التحقق من هوية المستخدم على السيرفر
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'يرجى تسجيل الدخول أولاً' }
    }

    // 2. إنشاء admin client للعمليات ذات الصلاحيات العالية
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 3. جلب بيانات الدعوة والتحقق من صلاحيتها على السيرفر
    const { data: invite, error: inviteErr } = await supabaseAdmin
      .from('school_invitations')
      .select('*, schools(name)')
      .eq('token', token)
      .maybeSingle()

    if (inviteErr || !invite) {
      return { success: false, error: 'رابط الدعوة هذا غير صالح أو قد تم إتلافه.' }
    }

    // التحقق من تاريخ الصلاحية
    if (new Date(invite.expires_at) < new Date()) {
      return { success: false, error: 'انتهت صلاحية هذا الرابط. يرجى طلب دعوة جديدة من إدارة المدرسة.' }
    }

    // التحقق من عدم استخدام الدعوة مسبقاً
    if (invite.used_at) {
      return { success: false, error: 'تم استخدام رابط الدعوة هذا مسبقاً.' }
    }

    const inviteRole = invite.role as string
    const schoolId = invite.school_id as string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schoolName = (invite.schools as any)?.name || 'المدرسة'

    // 4. تحديث بروفايل المستخدم بالدور والمدرسة (عبر service_role)
    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .update({
        school_id: schoolId,
        role: inviteRole,
      })
      .eq('id', user.id)

    if (profileErr) {
      return { success: false, error: 'حدث خطأ أثناء تحديث بيانات حسابك: ' + profileErr.message }
    }

    // 5. إذا كان المدعو معلماً — تحديث/إنشاء سجله في جدول teachers
    if (inviteRole === 'teacher') {
      const { data: teacherExists } = await supabaseAdmin
        .from('teachers')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (teacherExists) {
        await supabaseAdmin
          .from('teachers')
          .update({ school_id: schoolId })
          .eq('id', user.id)
      } else {
        await supabaseAdmin
          .from('teachers')
          .insert({ id: user.id, school_id: schoolId, subscription_status: 'trial' })
      }
    }

    // 6. تعليم الدعوة كـ "مستخدمة"
    await supabaseAdmin
      .from('school_invitations')
      .update({ used_at: new Date().toISOString() })
      .eq('id', invite.id)

    return { success: true, role: inviteRole, schoolName }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'حدث خطأ غير متوقع'
    return { success: false, error: message }
  }
}
