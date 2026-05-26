import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { amount, reason, referenceId } = await request.json()
    if (!amount || !reason)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // Check student exists
    const { data: student } = await supabase
      .from('students')
      .select('id, xp_points')
      .eq('id', user.id)
      .single()

    if (!student)
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    // Award XP via the DB function
    await supabase.rpc('award_xp', {
      p_student_id: user.id,
      p_amount: amount,
      p_reason: reason,
      p_reference: referenceId || null,
    })

    const newTotal = (student.xp_points || 0) + amount
    const newLevel = Math.max(1, Math.floor(newTotal / 100) + 1)

    return NextResponse.json({
      success: true,
      earned: amount,
      total: newTotal,
      level: newLevel,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
