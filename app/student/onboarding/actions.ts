'use server'

import { createClient } from '@supabase/supabase-js'

export async function saveStudentGradeAction(
  userId: string,
  gradeId: number,
  educationType: string = 'public'
) {
  // Use Service Role key to bypass RLS and guarantee the update/insert works
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Get user email to ensure profile is complete
  const {
    data: { user },
  } = await supabaseAdmin.auth.admin.getUserById(userId)

  // 2. Ensure profile exists
  const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
    {
      id: userId,
      email: user?.email || '',
      full_name:
        user?.user_metadata?.full_name ||
        user?.email?.split('@')[0] ||
        'طالب جديد',
      role: 'student',
    },
    { onConflict: 'id' }
  )

  if (profileError) throw new Error(profileError.message)

  // 3. Ensure student row exists and update grade + education_type
  const { error: studentError } = await supabaseAdmin.from('students').upsert(
    {
      id: userId,
      grade_id: gradeId,
      education_type: educationType,
    },
    { onConflict: 'id' }
  )

  if (studentError) throw new Error(studentError.message)

  // 4. Award first-login XP (run database RPC directly to avoid fetch hanging/deadlock and unauthorized error)
  try {
    await supabaseAdmin.rpc('award_xp', {
      p_student_id: userId,
      p_amount: 10,
      p_reason: 'أول تسجيل دخول 🎉',
      p_reference: null,
    })
  } catch {
    // Ignore error
  }
}
