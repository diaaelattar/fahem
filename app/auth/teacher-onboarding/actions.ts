'use server'

import { createClient } from '@supabase/supabase-js'

export async function saveTeacherSubjectAction(userId: string, subjectId: number) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const {
    data: { user },
  } = await supabaseAdmin.auth.admin.getUserById(userId)

  if (!user) throw new Error('User not found')

  // Ensure profile
  await supabaseAdmin.from('profiles').upsert({
    id: userId,
    email: user.email || '',
    full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'معلم جديد',
    role: 'teacher'
  }, { onConflict: 'id' })

  // Update teacher
  const { error } = await supabaseAdmin.from('teachers').upsert({
    id: userId,
    subject_id: subjectId,
    subscription_status: 'trial'
  }, { onConflict: 'id' })

  if (error) throw new Error(error.message)
}
