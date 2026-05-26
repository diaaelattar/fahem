// app/api/admin/create-teacher/route.ts
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 })
    }

    const { email, fullName, password, subjectId } = await req.json()

    if (!email || !fullName || !password) {
      return NextResponse.json(
        { error: 'البيانات المطلوبة: البريد الإلكتروني، الاسم، كلمة المرور' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    const { data: authData, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: 'teacher',
        },
      })

    if (createError) {
      if (createError.message.includes('already been registered')) {
        return NextResponse.json(
          { error: 'هذا البريد الإلكتروني مسجل مسبقاً' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    const newUserId = authData.user.id

    // Create the teacher record (profile is auto-created via trigger)
    const { error: teacherError } = await adminClient.from('teachers').insert({
      id: newUserId,
      subject_id: subjectId ? Number(subjectId) : null,
      is_verified: true,
      is_active: true,
    })

    if (teacherError) {
      // Cleanup if failed
      await adminClient.from('profiles').delete().eq('id', newUserId)
      await adminClient.auth.admin.deleteUser(newUserId)
      return NextResponse.json(
        { error: `خطأ في إنشاء سجل المعلم: ${teacherError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        teacher: { id: newUserId, email, full_name: fullName },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[API /admin/create-teacher POST]', error)
    return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 })
  }
}
