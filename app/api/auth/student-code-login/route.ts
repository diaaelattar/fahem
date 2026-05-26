import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/auth/student-code-login
 * Body: { studentCode: string }
 *
 * يبحث عن الطالب عبر student_code ثم يُنشئ magic link ويُعيد الـ token
 * حتى يستطيع الطالب المضاف يدوياً تسجيل الدخول بدون كلمة مرور.
 */
export async function POST(req: NextRequest) {
  try {
    const { studentCode } = await req.json()

    if (!studentCode || typeof studentCode !== 'string') {
      return NextResponse.json({ error: 'يرجى إدخال كود الطالب' }, { status: 400 })
    }

    const normalizedCode = studentCode.trim().toUpperCase()

    // 1. إيجاد الطالب بالكود
    const supabase = await createClient()
    const { data: student } = await supabase
      .from('students')
      .select('id, student_code')
      .eq('student_code', normalizedCode)
      .single()

    if (!student) {
      return NextResponse.json({ error: 'كود الطالب غير موجود. تأكد من الكود مع معلمك.' }, { status: 404 })
    }

    // 2. إيجاد بريده الإلكتروني
    const { data: profileData } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', student.id)
      .single()

    if (!profileData?.email) {
      return NextResponse.json({ error: 'حساب الطالب غير مكتمل. تواصل مع معلمك.' }, { status: 400 })
    }

    // 3. إنشاء magic link عبر admin client
    const adminClient = createAdminClient()
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: profileData.email,
      options: {
        redirectTo: `${req.nextUrl.origin}/auth/callback?next=/student/dashboard`,
      },
    })

    if (linkError || !linkData) {
      console.error('Magic link error:', linkError)
      return NextResponse.json({ error: 'فشل إنشاء رابط الدخول. حاول مجدداً.' }, { status: 500 })
    }

    // نُرسل الـ action_link للعميل ليقوم بالتوجيه
    return NextResponse.json({
      success: true,
      loginUrl: linkData.properties?.action_link,
      studentName: null, // سيُجلب من الـ profile عند التوجيه
    })
  } catch (err) {
    console.error('Student code login error:', err)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع.' }, { status: 500 })
  }
}
