'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/permissions'
import { revalidatePath } from 'next/cache'

// تعديل سؤال — يتحقق أن teacher_id = auth.uid()
export async function updateTeacherQuestionAction(
  id: string,
  data: {
    question_text: string
    correct_answer: string
    explanation?: string
    difficulty_level: string
    points: number
    options?: string[]
    question_type: string
    subject_id?: string
    grade_id?: string
    image_position?: string
  }
) {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'teacher') {
    return { error: 'غير مصرح لك' }
  }

  const supabase = await createClient()

  // التحقق من ملكية السؤال
  const { data: question, error: fetchError } = await (supabase
    .from('questions')
    .select('teacher_id')
    .eq('id', id)
    .single() as any)

  if (fetchError || !question) return { error: 'السؤال غير موجود' }
  if (question.teacher_id !== profile.id)
    return { error: 'لا يمكنك تعديل هذا السؤال' }

  const { error } = await (supabase
    .from('questions')
    .update({
      ...data,
      options: data.question_type === 'mcq' ? data.options : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id) as any)

  if (error) return { error: error.message }

  revalidatePath('/teacher/questions')
  return { success: true }
}

// حذف سؤال — يتحقق أن teacher_id = auth.uid()
export async function deleteTeacherQuestionAction(id: string) {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'teacher') {
    return { error: 'غير مصرح لك' }
  }

  const supabase = await createClient()

  // التحقق من ملكية السؤال
  const { data: question, error: fetchError } = await (supabase
    .from('questions')
    .select('teacher_id')
    .eq('id', id)
    .single() as any)

  if (fetchError || !question) return { error: 'السؤال غير موجود' }
  if (question.teacher_id !== profile.id)
    return { error: 'لا يمكنك حذف هذا السؤال' }

  const { error } = await supabase.from('questions').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/teacher/questions')
  return { success: true }
}
