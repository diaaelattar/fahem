// app/api/admin/create-school/route.ts
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // 1. التحقق من صلاحية الأدمن العام
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

    // 2. قراءة البيانات المرسلة
    const {
      name,
      slug,
      governorate,
      district,
      type,
      stage,
      adminName,
      adminEmail,
      adminPassword,
    } = await req.json()

    if (!name || !slug || !governorate) {
      return NextResponse.json(
        { error: 'البيانات المطلوبة: اسم المدرسة، الرابط اللاتيني، المحافظة' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // 3. إنشاء المدرسة أولاً في قاعدة البيانات
    const { data: schoolData, error: schoolError } = await adminClient
      .from('schools')
      .insert({
        name,
        slug: slug.toLowerCase().trim(),
        governorate,
        district,
        type: type || 'private',
        stage: stage || 'all',
        subscription_plan: 'free', // الباقة الافتراضية
      })
      .select()
      .single()

    if (schoolError) {
      if (schoolError.message.includes('unique constraint') || schoolError.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'المعرف اللاتيني (Slug) مسجل مسبقاً لمدرسة أخرى' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: `خطأ أثناء إنشاء المدرسة: ${schoolError.message}` }, { status: 400 })
    }

    const createdSchool = schoolData

    // 4. إنشاء حساب مدير المدرسة تلقائياً (اختياري في حال تم إدخال بيانات الحساب)
    let createdAdmin = null
    if (adminEmail && adminPassword && adminName) {
      const { data: authData, error: createError } =
        await adminClient.auth.admin.createUser({
          email: adminEmail,
          password: adminPassword,
          email_confirm: true,
          user_metadata: {
            full_name: adminName,
            role: 'school_admin',
          },
        })

      if (createError) {
        // تنظيف وحذف المدرسة المنشأة للرجوع للوضع الأصلي في حال فشل إنشاء الحساب
        await adminClient.from('schools').delete().eq('id', createdSchool.id)
        
        if (createError.message.includes('already been registered')) {
          return NextResponse.json(
            { error: 'البريد الإلكتروني لمدير المدرسة مسجل مسبقاً بحساب آخر' },
            { status: 409 }
          )
        }
        return NextResponse.json({ error: `خطأ أثناء إنشاء حساب المدير: ${createError.message}` }, { status: 400 })
      }

      const newUserId = authData.user.id
      createdAdmin = { id: newUserId, email: adminEmail, full_name: adminName }

      // تحديث ملف البروفايل لربطه بالمدرسة وتعيين الدور (يُنشأ البروفايل تلقائياً عن طريق trigger عند إنشاء الـ user)
      const { error: profileError } = await adminClient
        .from('profiles')
        .update({
          role: 'school_admin',
          school_id: createdSchool.id,
          full_name: adminName,
        })
        .eq('id', newUserId)

      if (profileError) {
        // تنظيف في حال الفشل
        await adminClient.auth.admin.deleteUser(newUserId)
        await adminClient.from('schools').delete().eq('id', createdSchool.id)
        return NextResponse.json(
          { error: `خطأ في إعداد بروفايل مدير المدرسة: ${profileError.message}` },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      {
        success: true,
        school: createdSchool,
        admin: createdAdmin,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[API /api/admin/create-school POST]', error)
    return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 })
  }
}
