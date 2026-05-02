// app/api/students/route.ts
// API Route لإنشاء طلاب جدد — يتطلب صلاحية admin
// يستخدم createAdminClient لإنشاء auth user ثم profile + student

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // 1. التحقق أن المنفذ مدير
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات غير كافية — فقط المديرون يمكنهم إضافة طلاب' }, { status: 403 })
    }

    // 2. استلام البيانات
    const { email, full_name, password, grade_id, class_section, parent_phone } = await req.json()

    if (!email || !full_name || !password || !grade_id) {
      return NextResponse.json({ error: 'البيانات المطلوبة: البريد الإلكتروني، الاسم، كلمة المرور، الصف' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // 3. إنشاء المستخدم في Supabase Auth
    const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role: 'student',
      },
    })

    if (createError) {
      if (createError.message.includes('already been registered')) {
        return NextResponse.json({ error: 'هذا البريد الإلكتروني مسجل مسبقاً' }, { status: 409 })
      }
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    const newUserId = authData.user.id

    // 4. تحديث الملف الشخصي الذي تم إنشاؤه تلقائياً بواسطة الـ Trigger (إن وجد تفاصيل إضافية)
    // لا حاجة لعمل insert، لأن الـ trigger in Supabase database ينشئ الـ profile تلقائياً

    // 5. إنشاء كود الطالب الفريد
    const student_code = `STU-${Date.now().toString(36).toUpperCase().slice(-6)}`

    // 6. إنشاء سجل الطالب في students
    const { error: studentError } = await adminClient
      .from('students')
      .insert({
        id: newUserId,
        grade_id: Number(grade_id),
        class_section: class_section || null,
        parent_phone: parent_phone || null,
        student_code,
        enrollment_date: new Date().toISOString().split('T')[0],
      })

    if (studentError) {
      // تنظيف
      await adminClient.from('profiles').delete().eq('id', newUserId)
      await adminClient.auth.admin.deleteUser(newUserId)
      return NextResponse.json({ error: `خطأ في إنشاء سجل الطالب: ${studentError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      student: {
        id: newUserId,
        email,
        full_name,
        student_code,
      },
    }, { status: 201 })

  } catch (error: any) {
    console.error('[API /students POST]', error)
    return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 })
  }
}

// PUT — تعديل بيانات طالب
export async function PUT(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user?.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const { student_id, full_name, grade_id, class_section, parent_phone, is_active } = await req.json()

    if (!student_id) {
      return NextResponse.json({ error: 'student_id مطلوب' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // تحديث الملف الشخصي
    if (full_name || is_active !== undefined) {
      await adminClient
        .from('profiles')
        .update({
          ...(full_name && { full_name }),
          ...(is_active !== undefined && { is_active }),
        })
        .eq('id', student_id)
    }

    // تحديث بيانات الطالب
    await adminClient
      .from('students')
      .update({
        ...(grade_id && { grade_id: Number(grade_id) }),
        ...(class_section !== undefined && { class_section }),
        ...(parent_phone !== undefined && { parent_phone }),
      })
      .eq('id', student_id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
