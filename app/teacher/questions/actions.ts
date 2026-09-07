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
    .maybeSingle() as any)

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
    .maybeSingle() as any)

  if (fetchError || !question) return { error: 'السؤال غير موجود' }
  if (question.teacher_id !== profile.id)
    return { error: 'لا يمكنك حذف هذا السؤال' }

  const { error } = await supabase.from('questions').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/teacher/questions')
  return { success: true }
}

// إضافة مجموعة أسئلة مولدة بالذكاء الاصطناعي إلى بنك المعلم
export async function bulkInsertTeacherQuestionsAction(
  questions: Array<{
    question_text: string
    question_type: string
    options?: string[] | null
    correct_answer: string
    explanation?: string
    difficulty_level?: string
    bloom_level?: string
    points?: number
    context_passage?: string | null
    grade_id?: number | string | null
    subject_id?: number | string | null
  }>
) {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'teacher') {
    return { error: 'غير مصرح لك' }
  }

  if (!questions || questions.length === 0) {
    return { error: 'قائمة الأسئلة فارغة' }
  }

  const supabase = await createClient()

  // جلب مادة المعلم كـ fallback
  const { data: teacher } = await supabase
    .from('teachers')
    .select('subject_id')
    .eq('id', profile.id)
    .maybeSingle()

  const defaultSubjectId = teacher?.subject_id

  const rows = questions.map((q) => ({
    question_text: q.question_text,
    question_type: q.question_type || 'mcq',
    options: q.question_type === 'mcq' ? q.options : null,
    correct_answer: q.correct_answer,
    explanation: q.explanation || null,
    difficulty_level: q.difficulty_level || 'medium',
    bloom_level: q.bloom_level || 'understand',
    points: q.points || 1,
    context_passage: q.context_passage || null,
    grade_id: q.grade_id ? Number(q.grade_id) : null,
    subject_id: q.subject_id ? Number(q.subject_id) : defaultSubjectId,
    teacher_id: profile.id,
    status: 'approved',
    created_by: profile.id,
  }))

  const { error } = await supabase.from('questions').insert(rows)

  if (error) {
    console.error('[Bulk Insert Questions] Error:', error)
    return { error: error.message }
  }

  revalidatePath('/teacher/questions')
  return { success: true, count: rows.length }
}

