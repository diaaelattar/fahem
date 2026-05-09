import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PrintExamClient } from '@/components/admin/PrintExamClient'

export const dynamic = 'force-dynamic'

export default async function PrintExamPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  // 1. Fetch exam details
  const { data: exam } = await supabase
    .from('exams')
    .select(`
      *,
      subjects (name_ar),
      grades (name_ar)
    `)
    .eq('id', params.id)
    .single()

  if (!exam) notFound()

  // 2. Fetch questions
  const { data: examQuestions } = await supabase
    .from('exam_questions')
    .select('question_order, points_override, questions(*)')
    .eq('exam_id', params.id)
    .order('question_order')

  const questions = examQuestions?.map(eq => ({
    ...eq.questions,
    points_override: eq.points_override,
    order: eq.question_order
  })) || []

  return <PrintExamClient exam={exam} questions={questions} />
}
