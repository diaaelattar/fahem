'use server'

import { createClient } from '@supabase/supabase-js'

export async function saveStudentGradeAction(userId: string, gradeId: number) {
  // Use Service Role key to bypass RLS and guarantee the update/insert works
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // MUST have this in .env.local
  )

  // Ensure student row exists and update grade
  const { error } = await supabaseAdmin.from('students').upsert({
    id: userId,
    grade_id: gradeId,
    xp_points: 0,
    level: 1,
    streak_days: 0,
  }, { onConflict: 'id' }) // Only update grade_id if row exists, else insert

  if (error) {
    throw new Error(error.message)
  }

  // Award first-login XP
  await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/xp/award`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 10, reason: 'أول تسجيل دخول 🎉' })
  }).catch(() => {}) // Fire and forget
}
