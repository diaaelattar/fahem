import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ExamInterface } from '@/components/student/ExamInterface'

export const dynamic = 'force-dynamic'

export default async function AdminExamPreviewPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  // جلب بيانات الاختبار
  const { data: exam } = await supabase
    .from('exams')
    .select(`
      id, 
      title, 
      duration_minutes, 
      total_points, 
      passing_score, 
      show_results_immediately, 
      instructions,
      subjects (name_ar)
    `)
    .eq('id', params.id)
    .single()

  if (!exam) notFound()

  // جلب أسئلة الاختبار
  // في وضع المعاينة، نجلب الإجابات الصحيحة والتفسير حتى لو كان اختباراً حقيقياً لكي تعمل دالة التقييم الوهمية
  const questionsSelect = 'question_order, points_override, questions(id, question_type, context_passage, question_text, options, points, question_image_url, correct_answer, explanation)'

  const { data: examQuestions } = await supabase
    .from('exam_questions')
    .select(questionsSelect)
    .eq('exam_id', params.id)
    .order('question_order')

  if (!examQuestions || examQuestions.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <h2 className="text-xl font-bold mb-2">الاختبار لا يحتوي على أسئلة للمعاينة</h2>
      </div>
    )
  }

  // بناء قائمة الأسئلة
  const questions = examQuestions
    .filter((eq: any) => eq.questions !== null)
    .sort((a: any, b: any) => a.question_order - b.question_order)
    .map((eq: any) => ({
      id: eq.questions.id,
      question_type: eq.questions.question_type,
      context_passage: eq.questions.context_passage,
      question_text: eq.questions.question_text,
      options: eq.questions.options,
      points: eq.points_override || Math.max(1, eq.questions.points || 1),
      question_image_url: eq.questions.question_image_url,
      correct_answer: eq.questions.correct_answer,
      explanation: eq.questions.explanation,
    }))

  return (
    <ExamInterface
      exam={exam as any}
      questions={questions}
      attemptId={`preview-${params.id}`}
      isPreview={true}
    />
  )
}
