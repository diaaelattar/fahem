// app/student/exams/[id]/take/page.tsx
// صفحة حل الاختبار الفعلية — Server Component
// تستقبل attemptId من query string وتمرر البيانات لـ ExamInterface

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
  const attemptId = searchParams.attemptId

  // إذا لم يكن هناك attemptId، أعد للشاشة الأولى
  if (!attemptId) {
    redirect(`/student/exams/${params.id}/start`)
  }

  // التحقق من أن المحاولة تخص هذا الطالب وهذا الاختبار
  const { data: attempt } = await supabase
    .from('exam_attempts')
    .select('id, exam_id, student_id, completed_at, answers')
    .eq('id', attemptId)
    .eq('student_id', profile.id)
    .eq('exam_id', params.id)
    .single()

  if (!attempt) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">محاولة غير صالحة</h2>
        <p className="text-muted-foreground mb-6">
          لم يتم العثور على هذه المحاولة أو انتهت صلاحيتها
        </p>
        <a
          href="/student/exams"
          className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90"
        >
          العودة للاختبارات
        </a>
      </div>
    )
  }

  // إذا كانت المحاولة مكتملة، توجيه لصفحة النتيجة
  if (attempt.completed_at) {
    redirect(`/student/results/${attemptId}`)
  }

  // جلب بيانات الاختبار
  const { data: exam } = await supabase
    .from('exams')
    .select('id, title, duration_minutes, total_points, passing_score, show_results_immediately, instructions')
    .eq('id', params.id)
    .single()

  if (!exam) notFound()

  // جلب أسئلة الاختبار — بدون correct_answer (أمان)
  const { data: examQuestions } = await supabase
    .from('exam_questions')
    .select(`
      question_order,
      questions(id, question_type, question_text, options, points, question_image_url)
    `)
    .eq('exam_id', params.id)
    .order('question_order')

  if (!examQuestions || examQuestions.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">الاختبار لا يحتوي على أسئلة</h2>
        <p className="text-muted-foreground mb-6">يرجى التواصل مع معلمك</p>
        <a href="/student/exams" className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium text-sm">
          العودة
        </a>
      </div>
    )
  }

  // ترتيب الأسئلة وإزالة correct_answer
  const questions = examQuestions
    .filter((eq: any) => eq.questions !== null) // تصفية أي أسئلة مفقودة لتجنب الانهيار
    .sort((a: any, b: any) => a.question_order - b.question_order)
    .map((eq: any) => ({
      id: eq.questions.id,
      question_type: eq.questions.question_type,
      question_text: eq.questions.question_text,
      options: eq.questions.options,
      points: eq.questions.points,
      question_image_url: eq.questions.question_image_url,
      // ⚠️ لا نُرسل correct_answer للطالب أثناء الاختبار
    }))

  return (
    <ExamInterface
      exam={exam as any}
      questions={questions}
      attemptId={attemptId}
    />
  )
}
