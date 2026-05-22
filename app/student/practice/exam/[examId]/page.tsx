// app/student/practice/exam/[examId]/page.tsx
// التدريب على أسئلة اختبار محدد سابق

import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PracticeSessionClient } from '@/components/student/PracticeSessionClient'
import { History } from 'lucide-react'

interface Props {
  params: { examId: string }
}

export default async function PracticeExamPage({ params }: Props) {
  const profile = await requireStudent()
  const supabase = await createClient()

  // جلب بيانات الاختبار
  const { data: exam } = await supabase
    .from('exams')
    .select('id, title, total_points, subjects(id, name_ar, icon)')
    .eq('id', params.examId)
    .single()

  if (!exam) notFound()

  // التحقق أن الطالب أنهى هذا الاختبار
  const { data: attempt } = await supabase
    .from('exam_attempts')
    .select('id, score, percentage')
    .eq('student_id', profile.id)
    .eq('exam_id', params.examId)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(1)
    .single()

  if (!attempt) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 animate-fade-in">
        <div className="text-6xl mb-6">🔒</div>
        <h1 className="text-2xl font-bold mb-2">لم تُكمل هذا الاختبار بعد</h1>
        <p className="text-muted-foreground mb-8">يجب إكمال الاختبار أولاً لتتمكن من التدرب على أسئلته</p>
        <Link href="/student/exams" className="bg-primary text-white px-6 py-3 rounded-xl font-medium">
          الذهاب للاختبارات
        </Link>
      </div>
    )
  }

  // جلب أسئلة الاختبار بالإجابات الصحيحة (للتدريب)
  const { data: examQuestions } = await supabase
    .from('exam_questions')
    .select(`
      question_order,
      questions(id, question_type, question_text, options, correct_answer, explanation, points, difficulty_level)
    `)
    .eq('exam_id', params.examId)
    .order('question_order')

  if (!examQuestions || examQuestions.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <h1 className="text-2xl font-bold mb-2">لا توجد أسئلة</h1>
        <Link href="/student/practice" className="text-primary hover:underline">العودة للتدريب</Link>
      </div>
    )
  }

  const questions = examQuestions
    .filter((eq: any) => eq.questions !== null)
    .sort((a: any, b: any) => a.question_order - b.question_order)
    .map((eq: any) => ({
      id: eq.questions.id,
      question_type: eq.questions.question_type,
      question_text: eq.questions.question_text,
      options: eq.questions.options,
      correct_answer: eq.questions.correct_answer,
      explanation: eq.questions.explanation,
      points: eq.questions.points,
      difficulty_level: eq.questions.difficulty_level,
    }))

  // خلط الأسئلة عشوائياً للتدريب
  const shuffled = [...questions].sort(() => Math.random() - 0.5)

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/student/practice" className="hover:text-primary transition-colors">مركز التدريب</Link>
        <span>/</span>
        <span className="text-foreground font-bold">{(exam as any).title}</span>
      </div>

      {/* Header */}
      <div className="card-premium p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center text-4xl shrink-0">
            {(exam.subjects as any)?.icon || '📝'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <History className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-bold text-purple-600">تدريب من اختبار سابق</span>
            </div>
            <h1 className="text-2xl font-bold">{(exam as any).title}</h1>
            <p className="text-muted-foreground text-sm">
              {(exam.subjects as any)?.name_ar} • {shuffled.length} سؤال • شرح فوري لكل إجابة
            </p>
          </div>
          <div className="text-left shrink-0">
            <div className={`text-2xl font-bold ${Math.round(attempt.percentage || 0) >= 60 ? 'text-green-600' : 'text-red-500'}`}>
              {Math.round(attempt.percentage || 0)}%
            </div>
            <div className="text-xs text-muted-foreground">درجتك السابقة</div>
          </div>
        </div>
      </div>

      {/* Practice Interface */}
      <PracticeSessionClient
        questions={shuffled}
        subject={exam.subjects as any}
        studentId={profile.id}
      />
    </div>
  )
}
