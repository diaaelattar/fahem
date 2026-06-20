// app/student/exams/[id]/take/page.tsx
// صفحة حل الاختبار الفعلية — Server Component
// تستقبل attemptId من query string وتمرر البيانات لـ ExamInterface

import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import { ExamInterface } from '@/components/student/ExamInterface'
import { ClientErrorBoundary } from '@/components/shared/ClientErrorBoundary'
import { notFound, redirect } from 'next/navigation'
import { AlertCircle } from 'lucide-react'

interface Props {
  params: { id: string }
  searchParams: { attemptId?: string }
}

interface ExamRow {
  id: string
  title: string
  duration_minutes: number
  total_points: number
  passing_score: number | null
  show_results_immediately: boolean
  instructions: string | null
  subjects: { name_ar: string } | null
}

interface ExamQuestionTakeRow {
  question_order: number
  points_override: number | null
  questions: {
    id: string
    question_type: 'mcq' | 'true_false' | 'fill_blank' | 'essay' | 'correction'
    context_passage: string | null
    question_text: string
    options: string[] | null
    points: number | null
    question_image_url: string | null
    correct_answer?: string | null
    explanation?: string | null
  } | null
}

export default async function TakeExamPage({ params, searchParams }: Props) {
  const profile = await requireStudent()
  const supabase = await createClient()
  const attemptId = searchParams.attemptId

  // إذا لم يكن هناك attemptId، أعد للشاشة الأولى
  if (!attemptId) {
    redirect(`/student/exams/${params.id}/start`)
  }

  // التحقق من أن المحاولة تخص هذا الطالب وهذا الاختبار
  const { data: attempt } = await supabase
    .from('exam_attempts')
    .select('id, exam_id, student_id, completed_at, answers, answer_images')
    .eq('id', attemptId)
    .eq('student_id', profile.id)
    .eq('exam_id', params.id)
    .maybeSingle()

  if (!attempt) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
        <h2 className="mb-2 text-xl font-bold">محاولة غير صالحة</h2>
        <p className="mb-6 text-muted-foreground">
          لم يتم العثور على هذه المحاولة أو انتهت صلاحيتها
        </p>
        <a
          href="/student/exams"
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
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
    .select(
      `
      id, 
      title, 
      duration_minutes, 
      total_points, 
      passing_score, 
      show_results_immediately, 
      instructions,
      subjects (name_ar)
    `
    )
    .eq('id', params.id)
    .single()

  if (!exam) notFound()
  const typedExam = exam as unknown as ExamRow

  const isPracticeMode = exam.show_results_immediately === true

  // جلب أسئلة الاختبار
  // في وضع الاختبار الحقيقي: لا نجلب correct_answer و explanation أبداً من قاعدة البيانات
  // في وضع التدريب فقط: نجلب الإجابات لعرض التغذية الراجعة الفورية
  const questionsSelect = isPracticeMode
    ? 'question_order, points_override, questions(id, question_type, context_passage, question_text, options, points, question_image_url, correct_answer, explanation)'
    : 'question_order, points_override, questions(id, question_type, context_passage, question_text, options, points, question_image_url)'

  const { data: examQuestions } = await supabase
    .from('exam_questions')
    .select(questionsSelect)
    .eq('exam_id', params.id)
    .order('question_order')

  if (!examQuestions || examQuestions.length === 0) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-yellow-400" />
        <h2 className="mb-2 text-xl font-bold">الاختبار لا يحتوي على أسئلة</h2>
        <p className="mb-6 text-muted-foreground">يرجى التواصل مع معلمك</p>
        <a
          href="/student/exams"
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white"
        >
          العودة
        </a>
      </div>
    )
  }

  // بناء قائمة الأسئلة — الإجابات موجودة فقط في وضع التدريب
  const questions = (examQuestions as unknown as ExamQuestionTakeRow[])
    .filter((eq) => eq.questions !== null)
    .sort((a, b) => a.question_order - b.question_order)
    .map((eq) => {
      const q = eq.questions!
      return {
        id: q.id,
        question_type: q.question_type,
        context_passage: q.context_passage,
        question_text: q.question_text,
        options: q.options as string[] | null,
        // استخدم points_override إذا حددها المدير، وإلا فالدرجة الافتراضية من السؤال (1 كحد أدنى)
        points: eq.points_override || Math.max(1, q.points || 1),
        question_image_url: q.question_image_url,
        // الإجابات الصحيحة فقط في وضع التدريب
        ...(isPracticeMode
          ? {
              correct_answer: q.correct_answer || undefined,
              explanation: q.explanation || undefined,
            }
          : {}),
      }
    })

  return (
    <ClientErrorBoundary sectionName="exam">
      <ExamInterface
        exam={typedExam}
        questions={questions}
        attemptId={attemptId}
        initialAnswers={(attempt?.answers as Record<string, string>) || {}}
        initialImages={(attempt?.answer_images as Record<string, string>) || {}}
      />
    </ClientErrorBoundary>
  )
}
