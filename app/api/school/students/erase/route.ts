/**
 * API Route: حق الحذف (Right to Erasure)
 * GDPR Article 17 / القانون المصري 151 لسنة 2020
 * 
 * DELETE /api/school/students/erase
 * يحذف جميع بيانات طالب محدد بشكل دائم ونهائي
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { logSchoolAudit, getClientIP } from '@/lib/audit/school-audit'

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()

    // 1. التحقق من هوية المدير
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id, role, full_name')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || (profile.role !== 'school_admin' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'صلاحيات غير كافية.' }, { status: 403 })
    }

    // 2. قراءة بيانات الطلب
    const { studentId, confirmPhrase } = await req.json()

    // يجب أن يكتب المدير "تأكيد الحذف" كإجراء أمان إضافي
    if (confirmPhrase !== 'تأكيد الحذف') {
      return NextResponse.json(
        { error: 'يجب كتابة "تأكيد الحذف" للمتابعة.' },
        { status: 400 }
      )
    }

    if (!studentId) {
      return NextResponse.json({ error: 'معرف الطالب مفقود.' }, { status: 400 })
    }

    // 3. التحقق أن الطالب تابع لمدرسة هذا المدير (RLS)
    const { data: studentProfile } = await supabase
      .from('profiles')
      .select('id, full_name, email, school_id')
      .eq('id', studentId)
      .eq('school_id', profile.school_id)
      .eq('role', 'student')
      .maybeSingle()

    if (!studentProfile) {
      return NextResponse.json(
        { error: 'الطالب غير موجود أو لا يتبع مدرستك.' },
        { status: 404 }
      )
    }

    // 4. تسجيل الحدث قبل الحذف (نُسجّل أولاً لأن البيانات ستُحذف)
    await logSchoolAudit({
      schoolId: profile.school_id!,
      actorId: user.id,
      actorEmail: user.email ?? undefined,
      actorRole: profile.role,
      action: 'DELETE',
      entityType: 'student',
      entityId: studentId,
      entityName: studentProfile.full_name ?? studentProfile.email,
      metadata: {
        reason: 'GDPR Art. 17 — Right to Erasure / القانون 151/2020',
        deletedBy: profile.full_name,
        studentEmail: studentProfile.email,
      },
      ipAddress: getClientIP(new Headers(Object.fromEntries(req.headers))),
      userAgent: req.headers.get('user-agent') ?? undefined,
    })

    // 5. الحذف التسلسلي باستخدام Service Role (يتجاوز RLS)
    const adminClient = createAdminClient()

    // أ. حذف محاولات الامتحانات
    await adminClient.from('exam_attempts').delete().eq('student_id', studentId)

    // ب. حذف علاقات الفصول الدراسية
    await adminClient.from('class_students').delete().eq('student_id', studentId)

    // ج. حذف ملف الطالب الأكاديمي
    await adminClient.from('students').delete().eq('id', studentId)

    // د. حذف الملف الشخصي (Anonymize بدلاً من الحذف الكامل للحفاظ على سلامة البيانات الأخرى)
    await adminClient.from('profiles').update({
      full_name: '[محذوف]',
      email: `deleted_${studentId}@erased.local`,
      avatar_url: null,
      school_id: null,
    }).eq('id', studentId)

    // هـ. حذف حساب Auth (الأمر الأخير)
    await adminClient.auth.admin.deleteUser(studentId)

    return NextResponse.json({
      success: true,
      message: 'تم حذف جميع بيانات الطالب نهائياً وفقاً لحق المحو (GDPR Art. 17).',
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'حدث خطأ غير متوقع.' },
      { status: 500 }
    )
  }
}
