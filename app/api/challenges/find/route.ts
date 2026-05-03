import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { subjectId } = await request.json()

    // Get student info
    const { data: studentRaw } = await supabase
      .from('students').select('id, grade_id').eq('id', user.id).single()
    if (!studentRaw) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    const student = studentRaw as any

    // Look for an open challenge waiting for an opponent (not self, same grade/subject)
    const { data: existing } = await (supabase.from('challenges') as any)
      .select('id')
      .eq('status', 'searching')
      .eq('subject_id', subjectId)
      .neq('challenger_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (existing) {
      // Join existing challenge
      // Pick 10 random approved questions
      const { data: qs } = await supabase
        .from('questions')
        .select('id, question_text, question_type, options, correct_answer, points, difficulty_level')
        .eq('subject_id', subjectId)
        .eq('grade_id', student.grade_id)
        .eq('is_approved', true)
        .eq('question_type', 'mcq')
        .limit(40)

      const shuffled = (qs || []).sort(() => Math.random() - 0.5).slice(0, 10)

      const { data: updated } = await (supabase.from('challenges') as any)
        .update({
          opponent_id: user.id,
          status: 'active',
          questions: shuffled,
          started_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      return NextResponse.json({ challenge: updated, role: 'opponent' })
    }

    // No open challenge — create one and wait
    const { data: newChallenge } = await (supabase.from('challenges') as any)
      .insert({
        challenger_id: user.id,
        subject_id: subjectId,
        grade_id: student.grade_id,
        status: 'searching',
        questions: [],
      })
      .select()
      .single()

    return NextResponse.json({ challenge: newChallenge, role: 'challenger' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
