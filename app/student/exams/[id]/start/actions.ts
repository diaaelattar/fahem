'use server'

import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'

export async function startExamAction(formData: FormData) {
  const examId = formData.get('examId') as string
  if (!examId) throw new Error('Exam ID is required')

  const profile = await requireStudent()
  const supabase = await createClient()

  // 1. التحقق من إمكانية بدء الاختبار مرة أخرى (أمان)
  const { data: canAttempt } = await (supabase.rpc as any)('can_attempt_exam', {
    p_exam_id: examId,
  })

  if (!canAttempt?.can_attempt) {
    throw new Error(canAttempt?.reason || 'لا يمكن بدء الاختبار')
  }

  // إذا كانت هناك محاولة جارية بالفعل، قم بتحويله إليها
  if (canAttempt?.has_ongoing && canAttempt?.attempt_id) {
    redirect(`/student/exams/${examId}/take?attemptId=${canAttempt.attempt_id}`)
  }

  // 2. إنشاء المحاولة الجديدة
  const prevAttempts = canAttempt?.attempts_used || 0
  const { data: newAttempt, error } = await (
    supabase.from('exam_attempts') as any
  )
    .insert({
      exam_id: examId,
      student_id: profile.id,
      attempt_number: prevAttempts + 1,
      answers: {},
    })
    .select('id')
    .single()

  if (error || !newAttempt) {
    throw new Error(error?.message || 'فشل في بدء الاختبار')
  }

  // 3. التوجيه لصفحة الحل
  redirect(`/student/exams/${examId}/take?attemptId=${(newAttempt as any).id}`)
}
