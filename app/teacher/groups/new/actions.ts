'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/permissions'
import { revalidatePath } from 'next/cache'

export async function createGroupAction(formData: FormData) {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'teacher') {
    throw new Error('Unauthorized')
  }

  const name = formData.get('name') as string
  const gradeId = formData.get('grade_id') as string

  if (!name || name.trim() === '') {
    throw new Error('اسم المجموعة مطلوب')
  }

  // Generate a random 6-character uppercase invite code
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('student_groups')
    .insert({
      teacher_id: profile.id,
      name_ar: name,
      grade_id: gradeId ? parseInt(gradeId) : null,
      invite_code: inviteCode,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/teacher/dashboard')
  revalidatePath('/teacher/groups')

  return data
}
