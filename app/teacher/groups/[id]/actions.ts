'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/permissions'
import { revalidatePath } from 'next/cache'

export async function addStudentToGroupAction(groupId: string, searchVal: string) {
  const profile = await getCurrentProfile()
  const supabase = createClient()

  if (!searchVal || searchVal.trim() === '') {
    throw new Error('يرجى إدخال البريد الإلكتروني أو كود الطالب')
  }

  // Verify group ownership
  const { data: group } = await supabase
    .from('student_groups')
    .select('id')
    .eq('id', groupId)
    .eq('teacher_id', profile.id)
    .single()

  if (!group) throw new Error('مجموعة غير صالحة أو لا تملك صلاحية')

  // Search for the student by email or student_code
  // Since email is in profiles and student_code is in students, we can do a join query
  // Wait, email is in profiles. Let's find profile by email first
  let studentId = null

  if (searchVal.includes('@')) {
    // Search by email
    const { data: p } = await supabase.from('profiles').select('id, role').eq('email', searchVal.trim().toLowerCase()).single()
    if (p && p.role === 'student') studentId = p.id
  } else {
    // Search by student_code
    const { data: s } = await supabase.from('students').select('id').eq('student_code', searchVal.trim().toUpperCase()).single()
    if (s) studentId = s.id
  }

  if (!studentId) {
    throw new Error('لم يتم العثور على طالب بهذا البريد أو الكود')
  }

  // Check if already in group
  const { data: existing } = await supabase
    .from('group_students')
    .select('id')
    .eq('group_id', groupId)
    .eq('student_id', studentId)
    .single()

  if (existing) {
    throw new Error('هذا الطالب منضم بالفعل لهذه المجموعة')
  }

  // Add to group
  const { error: insertError } = await supabase
    .from('group_students')
    .insert({
      group_id: groupId,
      student_id: studentId,
      status: 'active'
    })

  if (insertError) {
    throw new Error('حدث خطأ أثناء إضافة الطالب')
  }

  revalidatePath(`/teacher/groups/${groupId}`)
  return { success: true }
}
