import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth/permissions'
import { PrintExamClient } from '@/components/admin/PrintExamClient'

export const dynamic = 'force-dynamic'

export default async function IsolatedExamPrintPage({
  params,
}: {
  params: { id: string }
}) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/auth/login')

  const supabase = await createClient()

  // 1. Fetch exam details
  const { data: exam } = await supabase
    .from('exams')
    .select(
      `
      *,
      subjects (name_ar),
      grades (name_ar)
    `
    )
    .eq('id', params.id)
    .single()

  if (!exam) notFound()

  // Verify access: teacher owns exam OR admin
  if (profile.role === 'teacher' && exam.teacher_id && exam.teacher_id !== profile.id) {
    redirect('/teacher/exams')
  }

  // 2. Fetch questions
  const { data: examQuestions } = await supabase
    .from('exam_questions')
    .select('question_order, points_override, questions(*)')
    .eq('exam_id', params.id)
    .order('question_order')

  const questions =
    examQuestions?.map((eq: any) => ({
      ...eq.questions,
      points_override: eq.points_override,
      order: eq.question_order,
    })) || []

  return <PrintExamClient exam={exam} questions={questions} isIsolated={true} />
}
