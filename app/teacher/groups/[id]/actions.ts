'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile } from '@/lib/auth/permissions'
import { revalidatePath } from 'next/cache'

export async function addStudentToGroupAction(
  groupId: string,
  searchVal: string,
  registerDetails?: { fullName: string; email?: string; parentPhone?: string }
) {
  const profile = await getCurrentProfile()
  const supabase = createClient()

  // Verify group ownership
  const { data: group } = await supabase
    .from('student_groups')
    .select('id')
    .eq('id', groupId)
    .eq('teacher_id', profile.id)
    .single()

  if (!group) throw new Error('مجموعة غير صالحة أو لا تملك صلاحية')

  let studentId = null

  if (registerDetails) {
    // 1. تسجيل طالب جديد بالمنصة عبر العميل المسؤول (Admin)
    const adminClient = createAdminClient()
    const emailToUse = registerDetails.email?.trim().toLowerCase() || `student-${Date.now()}-${Math.floor(Math.random() * 1000)}@istabaq-temp.com`

    if (registerDetails.email) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', emailToUse)
        .single()

      if (existingProfile) {
        throw new Error('البريد الإلكتروني هذا مسجل بالفعل لطالب آخر على المنصة')
      }
    }

    // إنشاء مستخدم جديد في Supabase Auth
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: emailToUse,
      password: Math.random().toString(36).slice(-10), // كلمة مرور عشوائية غير مستخدمة مباشرة
      email_confirm: true,
      user_metadata: {
        full_name: registerDetails.fullName,
        role: 'student'
      }
    })

    if (authError) {
      throw new Error(`فشل إنشاء حساب الطالب: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('حدث خطأ غير متوقع أثناء إنشاء الحساب')
    }

    studentId = authData.user.id

    // إنشاء كود طالب فريد
    const studentCode = `STU-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`

    // إدراج السجل في جدول الطلاب يدويًا (بما أن التريجر يدرج فقط في profiles)
    const { error: studentError } = await adminClient
      .from('students')
      .insert({
        id: studentId,
        student_code: studentCode,
        parent_phone: registerDetails.parentPhone || null,
        xp_points: 0,
        level: 1,
        streak_days: 0
      })

    if (studentError) {
      console.error('Error inserting student details:', studentError)
      throw new Error(`فشل إنشاء تفاصيل الطالب: ${studentError.message}`)
    }
  } else {
    // 2. منطق البحث عن طالب مسجل بالفعل (المنطق القديم)
    if (!searchVal || searchVal.trim() === '') {
      throw new Error('يرجى إدخال البريد الإلكتروني أو كود الطالب')
    }

    if (searchVal.includes('@')) {
      const { data: p } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('email', searchVal.trim().toLowerCase())
        .single()
      if (p && p.role === 'student') studentId = p.id
    } else {
      const { data: s } = await supabase
        .from('students')
        .select('id')
        .eq('student_code', searchVal.trim().toUpperCase())
        .single()
      if (s) studentId = s.id
    }

    if (!studentId) {
      throw new Error('لم يتم العثور على طالب بهذا البريد أو الكود')
    }
  }

  // التحقق من عدم الانضمام للمجموعة مسبقًا
  const { data: existing } = await supabase
    .from('group_students')
    .select('id')
    .eq('group_id', groupId)
    .eq('student_id', studentId)
    .single()

  if (existing) {
    throw new Error('هذا الطالب منضم بالفعل لهذه المجموعة')
  }

  // إضافة الطالب للمجموعة
  const { error: insertError } = await supabase
    .from('group_students')
    .insert({
      group_id: groupId,
      student_id: studentId,
      status: 'active',
      source: 'teacher_added'
    })

  if (insertError) {
    throw new Error('حدث خطأ أثناء إضافة الطالب للمجموعة')
  }

  revalidatePath(`/teacher/groups/${groupId}`)
  return { success: true }
}

export async function createSessionAction(
  groupId: string,
  data: {
    title: string
    scheduledAt: string
    liveStreamUrl?: string
    mediaUrl?: string
    mediaTitle?: string
  }
) {
  const profile = await getCurrentProfile()
  const supabase = createClient()

  // التحقق من ملكية المعلم للمجموعة
  const { data: group } = await supabase
    .from('student_groups')
    .select('id')
    .eq('id', groupId)
    .eq('teacher_id', profile.id)
    .single()

  if (!group) throw new Error('مجموعة غير صالحة أو لا تملك صلاحية')

  if (!data.title.trim()) throw new Error('يرجى إدخال عنوان الحصة')
  if (!data.scheduledAt) throw new Error('يرجى تحديد موعد الحصة')

  const { error } = await supabase
    .from('group_sessions')
    .insert({
      group_id: groupId,
      title: data.title,
      scheduled_at: data.scheduledAt,
      live_stream_url: data.liveStreamUrl || null,
      media_url: data.mediaUrl || null,
      media_title: data.mediaTitle || null
    })

  if (error) {
    throw new Error(`فشل إنشاء الحصة: ${error.message}`)
  }

  revalidatePath(`/teacher/groups/${groupId}`)
  return { success: true }
}

export async function deleteSessionAction(sessionId: string, groupId: string) {
  const profile = await getCurrentProfile()
  const supabase = createClient()

  // التحقق من ملكية المعلم للحصة عبر المجموعة
  const { data: session } = await supabase
    .from('group_sessions')
    .select('id, group_id, student_groups(teacher_id)')
    .eq('id', sessionId)
    .single()

  if (!session) throw new Error('الحصة غير موجودة')

  const teacherId = (session.student_groups as any)?.teacher_id
  if (teacherId !== profile.id) throw new Error('غير مصرح لك بحذف هذه الحصة')

  const { error } = await supabase
    .from('group_sessions')
    .delete()
    .eq('id', sessionId)

  if (error) {
    throw new Error(`فشل حذف الحصة: ${error.message}`)
  }

  revalidatePath(`/teacher/groups/${groupId}`)
  return { success: true }
}

export async function saveAttendanceAction(
  sessionId: string,
  groupId: string,
  attendanceData: Array<{
    studentId: string
    status: 'present' | 'absent' | 'late'
    notes?: string
  }>
) {
  const profile = await getCurrentProfile()
  const supabase = createClient()

  // التحقق من ملكية المعلم عبر الحصة والمجموعة
  const { data: session } = await supabase
    .from('group_sessions')
    .select('id, group_id, student_groups(teacher_id)')
    .eq('id', sessionId)
    .single()

  if (!session) throw new Error('الحصة غير موجودة')

  const teacherId = (session.student_groups as any)?.teacher_id
  if (teacherId !== profile.id) throw new Error('غير مصرح لك بإدارة حضور هذه الحصة')

  // إعداد بيانات الإدراج والتحديث
  const upsertData = attendanceData.map(item => ({
    session_id: sessionId,
    student_id: item.studentId,
    status: item.status,
    notes: item.notes || null
  }))

  const { error } = await supabase
    .from('session_attendance')
    .upsert(upsertData, { onConflict: 'session_id,student_id' })

  if (error) {
    throw new Error(`فشل حفظ الحضور: ${error.message}`)
  }

  revalidatePath(`/teacher/groups/${groupId}`)
  return { success: true }
}
