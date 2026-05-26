import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { answers, score } = await request.json()
    const challengeId = params.id

    const { data: challengeData } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single()
    if (!challengeData)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const challenge = challengeData as any

    const isChallenger = challenge.challenger_id === user.id
    const updateData: any = {}

    if (isChallenger) {
      updateData.challenger_answers = answers
      updateData.challenger_score = score
    } else {
      updateData.opponent_answers = answers
      updateData.opponent_score = score
    }

    // Check if both have answered
    const challengerDone = isChallenger
      ? true
      : !!challenge.challenger_answers &&
        Object.keys(challenge.challenger_answers).length > 0
    const opponentDone = !isChallenger
      ? true
      : !!challenge.opponent_answers &&
        Object.keys(challenge.opponent_answers).length > 0

    if (challengerDone && opponentDone) {
      const cScore = isChallenger ? score : challenge.challenger_score
      const oScore = !isChallenger ? score : challenge.opponent_score
      const winnerId =
        cScore > oScore
          ? challenge.challenger_id
          : oScore > cScore
            ? challenge.opponent_id
            : null // draw

      updateData.status = 'completed'
      updateData.winner_id = winnerId
      updateData.completed_at = new Date().toISOString()

      // Award XP
      if (winnerId) {
        await (supabase.rpc as any)('award_xp', {
          p_student_id: winnerId,
          p_amount: 30,
          p_reason: 'فوز في تحدي مباشر ⚔️',
          p_reference: challengeId,
        })
        // Update battles won
        await (supabase.from('students') as any)
          .update({
            total_battles_won: (supabase.rpc as any)('total_battles_won'),
          })
          .eq('id', winnerId)
      }
      // Participation XP for both
      const loserId =
        winnerId === challenge.challenger_id
          ? challenge.opponent_id
          : challenge.challenger_id
      if (loserId) {
        await (supabase.rpc as any)('award_xp', {
          p_student_id: loserId,
          p_amount: 5,
          p_reason: 'مشاركة في تحدي',
          p_reference: challengeId,
        })
      }
    }

    await (supabase.from('challenges') as any)
      .update(updateData)
      .eq('id', challengeId)

    return NextResponse.json({
      success: true,
      completed: challengerDone && opponentDone,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
