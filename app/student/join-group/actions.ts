'use server'

import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import { revalidatePath } from 'next/cache'

export async function joinGroupAction(formData: FormData) {
  const profile = await requireStudent()
  const code = formData.get('code') as string

  if (!code || code.trim() === '') {
    throw new Error('يرجى إدخال كود الدعوة')
  }

  const supabase = await createClient()

  // 1. Find the group by invite code
  const { data: group, error: groupError } = await supabase
    .from('student_groups')
    .select('id, name_ar, is_active')
    .eq('invite_code', code.trim().toUpperCase())
    .single()

  if (groupError || !group) {
    throw new Error('كود الدعوة غير صحيح أو المجموعة غير موجودة')
  }

  if (!group.is_active) {
    throw new Error('هذه المجموعة غير نشطة حالياً')
  }

  // 2. Add student to the group
  const { error: joinError } = await supabase
    .from('group_students')
    .insert({
      group_id: group.id,
      student_id: profile.id,
      status: 'active'
    })

  if (joinError) {
    if (joinError.code === '23505') { // Unique violation
      throw new Error('أنت منضم بالفعل لهذه المجموعة!')
    }
    throw new Error('حدث خطأ أثناء الانضمام للمجموعة')
  }

  revalidatePath('/student/dashboard')
  
  return { success: true, groupName: group.name_ar }
}
