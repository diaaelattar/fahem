import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { logSchoolAudit, getClientIP } from '@/lib/audit/school-audit'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    // 1. التحقق من المصادقة وصلاحيات مدير المدرسة
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id, role')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || (profile.role !== 'school_admin' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'صلاحيات غير كافية.' }, { status: 403 })
    }

    const schoolId = profile.school_id
    if (!schoolId) {
      return NextResponse.json({ error: 'حسابك غير مرتبط بمدرسة.' }, { status: 400 })
    }

    // 2. قراءة بيانات الطلب
    const { email, role } = await req.json()
    if (!email || !role || !['teacher', 'student'].includes(role)) {
      return NextResponse.json({ error: 'بيانات غير مكتملة أو غير صالحة.' }, { status: 400 })
    }

    // 3. توليد رمز الدعوة الفريد (Token)
    const token = crypto.randomBytes(16).toString('hex')

    // 4. إدراج الدعوة في قاعدة البيانات
    const { error: insertError } = await supabase
      .from('school_invitations')
      .insert({
        school_id: schoolId,
        email: email.toLowerCase().trim(),
        role,
        token,
        created_by: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // بعد 7 أيام
      })

    if (insertError) {
      return NextResponse.json({ error: 'فشل إنشاء الدعوة: ' + insertError.message }, { status: 500 })
    }

    // 5. توليد رابط الدعوة الكامل ديناميكياً بناءً على النطاق المستضيف للطلب
    const host = req.headers.get('host') || 'localhost:3000'
    const protocol = req.headers.get('x-forwarded-proto') || 'http'
    const appUrl = `${protocol}://${host}`
    const inviteLink = `${appUrl}/auth/invite/${token}`

    // 6. تسجيل حدث الدعوة في سجل التدقيق (ISO 27001 A.12.4)
    await logSchoolAudit({
      schoolId,
      actorId:    user.id,
      actorEmail: user.email ?? undefined,
      actorRole:  profile.role,
      action:     'INVITE',
      entityType: role === 'teacher' ? 'teacher' : 'student',
      entityName: email.toLowerCase().trim(),
      metadata:   { role, token, expiresIn: '7 days' },
      ipAddress:  getClientIP(new Headers(Object.fromEntries(req.headers))),
      userAgent:  req.headers.get('user-agent') ?? undefined,
    })

    return NextResponse.json({ success: true, inviteLink })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'حدث خطأ غير متوقع.' }, { status: 500 })
  }
}
