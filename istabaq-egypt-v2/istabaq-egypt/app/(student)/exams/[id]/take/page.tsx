import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import { ExamInterface } from '@/components/student/ExamInterface'
import { notFound, redirect } from 'next/navigation'
import { AlertCircle } from 'lucide-react'

interface Props {
  params: { id: string }
  searchParams: { attemptId?: string }
}

export default async function TakeExamPage({ params, searchParams }: Props) {
  const profile = await requireStudent()
  const supabase = createClient()

  // التحقق من وجود attemptId
  if (!searchParams.attemptId) {
    redirect(`/student/exams/${params.id}/start`)
  }

  // التحقق من أن المحاولة تخص هذا الطالب
  const { data: attempt } = await supabase
    .from('exam_attempts')
    .select('id, student_id, completed_at, answers, exam_id')
    .eq('id', searchParams.attemptId)
    .single()

  if (!attempt || attempt.student_id !== profile.id) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">محاولة غير صالحة</h2>
        <a href="/student/exams" className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium text-sm">
          العودة للاختبارات
        </a>
      </div>
    )
  }

  // إذا كانت المحاولة مكتملة، توجيه للنتيجة
  if (attempt.completed_at) {
    redirect(`/student/results/${params.id}?attemptId=${attempt.id}`)
  }

  // جلب بيانات الاختبار
  const { data: exam } = await supabase
    .from('exams')
    .select('id, title, duration_minutes, total_points, passing_score, show_results_immediately, instructions')
    .eq('id', params.id)
    .single()

  if (!exam) notFound()

  // جلب الأسئلة بدون الإجابات الصحيحة
  const { data: examQuestions } = await supabase
    .from('exam_questions')
    .select(`
      question_order, points_override,
      questions(id, question_type, question_text, options, points, question_image_url)
    `)
    .eq('exam_id', params.id)
    .order('question_order')

  if (!examQuestions || examQuestions.length === 0) notFound()

  const questions = examQuestions
    .sort((a: any, b: any) => a.question_order - b.question_order)
    .map((eq: any) => ({
      id: eq.questions.id,
      question_type: eq.questions.question_type,
      question_text: eq.questions.question_text,
      options: eq.questions.options,
      points: eq.points_override || eq.questions.points,
      question_image_url: eq.questions.question_image_url,
    }))

  // إذا كان الاختبار يخلط الأسئلة، نخلطها
  const { data: examSettings } = await supabase
    .from('exams')
    .select('shuffle_questions, shuffle_options')
    .eq('id', params.id)
    .single()

  const finalQuestions = examSettings?.shuffle_questions
    ? [...questions].sort(() => Math.random() - 0.5)
    : questions

  return (
    <ExamInterface
      exam={exam as any}
      questions={finalQuestions}
      attemptId={attempt.id}
      savedAnswers={(attempt.answers as Record<string, string>) || {}}
    />
  )
}
