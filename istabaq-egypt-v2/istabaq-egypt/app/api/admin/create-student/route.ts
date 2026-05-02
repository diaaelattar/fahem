import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    // التحقق من صلاحية المدير
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'للمديرين فقط' }, { status: 403 })

    const { fullName, email, password, gradeId, classSection, parentPhone } = await req.json()

    if (!fullName || !email || !password || !gradeId) {
      return NextResponse.json({ error: 'البيانات المطلوبة ناقصة' }, { status: 400 })
    }

    // استخدام Admin Client لإنشاء المستخدم
    const adminClient = createAdminClient()

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'student',
      },
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return NextResponse.json({ error: 'هذا البريد الإلكتروني مسجل مسبقاً' }, { status: 400 })
      }
      throw authError
    }

    const newUserId = authData.user.id

    // إنشاء profile
    const { error: profileError } = await adminClient.from('profiles').insert({
      id: newUserId,
      email,
      full_name: fullName,
      role: 'student',
    })
    if (profileError) throw profileError

    // إنشاء student record
    const studentCode = 'STU-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 99999).toString().padStart(5, '0')
    const { error: studentError } = await adminClient.from('students').insert({
      id: newUserId,
      grade_id: gradeId,
      class_section: classSection || null,
      parent_phone: parentPhone || null,
      student_code: studentCode,
    })
    if (studentError) throw studentError

    return NextResponse.json({ success: true, student_id: newUserId, student_code: studentCode })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
