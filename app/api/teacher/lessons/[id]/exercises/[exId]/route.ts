import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * DELETE /api/teacher/lessons/[id]/exercises/[exId]
 * حذف تدريب محدد
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; exId: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  await supabase
    .from('lesson_exercises')
    .delete()
    .eq('id', params.exId)
    .eq('teacher_id', user.id)

  return NextResponse.json({ success: true })
}

/**
 * PATCH /api/teacher/lessons/[id]/exercises/[exId]
 * تعديل تدريب محدد (تفعيل/تعطيل أو تعديل البيانات)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; exId: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const body = await req.json()

  const { error } = await supabase
    .from('lesson_exercises')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', params.exId)
    .eq('teacher_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
