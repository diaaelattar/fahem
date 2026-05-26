import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin')
      return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 })

    const questionId = params.id

    // Delete from exam_questions first (foreign key)
    await supabase.from('exam_questions').delete().eq('question_id', questionId)

    // Delete from student_answers (foreign key)
    await supabase
      .from('student_answers')
      .delete()
      .eq('question_id', questionId)

    // Delete the question
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete question error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
