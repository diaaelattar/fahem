import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/student/lessons/[id]/attempt
 * تسجيل محاولة الطالب على تدريب من دروسه
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const lessonId = parseInt(params.id, 10)
  const body = await req.json()
  const { exercise_id, answer, is_correct, time_spent_seconds } = body

  if (!exercise_id || answer === undefined)
    return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })

  // حساب نقاط الـ XP: 5 نقاط للإجابة الصحيحة
  const xp_awarded = is_correct ? 5 : 0

  const { error } = await supabase.from('exercise_attempts').insert({
    lesson_id: lessonId,
    exercise_id,
    student_id: user.id,
    answer,
    is_correct,
    time_spent_seconds: time_spent_seconds ?? null,
    xp_awarded,
  })

  if (error) {
    console.error('[Exercise Attempt Error]', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // إضافة نقاط XP للطالب إذا كانت الإجابة صحيحة
  if (is_correct && xp_awarded > 0) {
    await supabase.rpc('increment_student_xp', {
      p_student_id: user.id,
      p_xp: xp_awarded,
    }).then(({ error: xpError }) => {
      if (xpError) console.warn('[XP Increment Error]', xpError.message)
    })
  }

  return NextResponse.json({ success: true, xp_awarded })
}
