import { createClient as createSuperClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// دالة إنشاء عميل Supabase بصلاحيات الـ Service Role لإدارة المستخدمين
function getAdminClient() {
  return createSuperClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

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

    // 2. قراءة وقبول البيانات المرسلة
    const { studentsList, classId, gradeId } = await req.json()
    if (!studentsList || !Array.isArray(studentsList) || studentsList.length === 0) {
      return NextResponse.json({ error: 'قائمة الطلاب فارغة.' }, { status: 400 })
    }

    // الحد الأقصى للاستيراد في الطلب الواحد لتجنب التايم أوت
    if (studentsList.length > 100) {
      return NextResponse.json({ error: 'الحد الأقصى للاستيراد في المرة الواحدة هو 100 طالب.' }, { status: 400 })
    }

    const adminClient = getAdminClient()
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    // 3. معالجة الطلاب المستوردين
    for (const student of studentsList) {
      const email = student.email?.toLowerCase().trim()
      const fullName = student.fullName?.trim()

      if (!email || !fullName) {
        results.failed++
        results.errors.push(`بيانات ناقصة للسطر: ${JSON.stringify(student)}`)
        continue
      }

      try {
        // توليد كلمة مرور عشوائية للبدء (مثال: Fahem@1234)
        const password = 'Fahem@' + Math.random().toString(36).substring(2, 10)

        // أ) إنشاء حساب المستخدم في auth.users وتأكيد بريده فورياً
        const { data: authData, error: createUserError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            role: 'student'
          }
        })

        if (createUserError || !authData.user) {
          results.failed++
          results.errors.push(`فشل إنشاء حساب ${email}: ${createUserError?.message || 'خطأ غير معروف'}`)
          continue
        }

        const studentId = authData.user.id

        // ب) تحديث ملف المستخدم profiles بربطه بالمدرسة
        // التريجر handle_new_user سيقوم بإنشاء السطر أولاً، لذا نقوم بالتحديث
        const { error: updateProfileError } = await adminClient
          .from('profiles')
          .update({
            school_id: schoolId,
            role: 'student',
            full_name: fullName
          })
          .eq('id', studentId)

        if (updateProfileError) {
          results.failed++
          results.errors.push(`فشل تحديث ملف ${email}: ${updateProfileError.message}`)
          continue
        }

        // ج) إنشاء سجل الطالب في جدول students
        // توليد كود طالب فريد
        const studentCode = 'ST' + Math.floor(100000 + Math.random() * 900000)
        const { error: insertStudentError } = await adminClient
          .from('students')
          .insert({
            id: studentId,
            grade_id: gradeId ? parseInt(gradeId) : null,
            student_code: studentCode,
            enrollment_date: new Date().toISOString().split('T')[0]
          })

        if (insertStudentError) {
          results.failed++
          results.errors.push(`فشل تسجيل الطالب ${email} في جدول الطلاب: ${insertStudentError.message}`)
          continue
        }

        // د) ربط الطالب بالفصل الدراسي المختار إذا وجد
        if (classId) {
          const { error: linkClassError } = await adminClient
            .from('class_students')
            .insert({
              class_id: classId,
              student_id: studentId
            })
          
          if (linkClassError) {
            results.errors.push(`تنبيه: تم إنشاء حساب ${email} بنجاح ولكن فشل ربطه بالفصل: ${linkClassError.message}`)
          }
        }

        results.success++
      } catch (err: any) {
        results.failed++
        results.errors.push(`خطأ أثناء معالجة ${email}: ${err.message || 'حدث خطأ داخلي'}`)
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'حدث خطأ غير متوقع أثناء استيراد الطلاب.' }, { status: 500 })
  }
}
