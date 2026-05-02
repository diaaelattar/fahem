import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import { ExamInterface } from '@/components/student/ExamInterface'
import { notFound, redirect } from 'next/navigation'
import { Clock, BookOpen, AlertCircle, CheckCircle } from 'lucide-react'

interface Props {
  params: { id: string }
}

export default async function StartExamPage({ params }: Props) {
  const profile = await requireStudent()
  const supabase = createClient()

  // التحقق من إمكانية بدء الاختبار
  const { data: canAttempt } = await supabase.rpc('can_attempt_exam', { p_exam_id: params.id })

  if (!canAttempt?.can_attempt) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">لا يمكن بدء الاختبار</h2>
        <p className="text-muted-foreground mb-6">{canAttempt?.reason || 'الاختبار غير متاح'}</p>
        <a href="/student/exams" className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90">
          العودة للاختبارات
        </a>
      </div>
    )
  }

  // جلب بيانات الاختبار
  const { data: exam } = await supabase
    .from('exams')
    .select('id, title, duration_minutes, total_points, passing_score, show_results_immediately, instructions, questions_count, subjects(name_ar, icon), grades(name_ar)')
    .eq('id', params.id)
    .single()

  if (!exam) notFound()

  // إذا كانت هناك محاولة جارية، استمر فيها
  let attemptId = canAttempt?.attempt_id as string | undefined

  // إنشاء محاولة جديدة
  if (!attemptId) {
    const prevAttempts = canAttempt?.attempts_used || 0
    const { data: newAttempt, error } = await supabase
      .from('exam_attempts')
      .insert({
        exam_id: params.id,
        student_id: profile.id,
        attempt_number: prevAttempts + 1,
        answers: {},
      })
      .select('id')
      .single()

    if (error || !newAttempt) {
      return (
        <div className="max-w-lg mx-auto text-center py-16">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">خطأ في بدء الاختبار</h2>
          <p className="text-muted-foreground">{error?.message}</p>
        </div>
      )
    }
    attemptId = newAttempt.id
  }

  // جلب أسئلة الاختبار (بدون الإجابات الصحيحة للطالب)
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
        <a href="/student/exams" className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90">
          العودة
        </a>
      </div>
    )
  }

  // ترتيب الأسئلة وإزالة الإجابات الصحيحة من جانب العميل
  const questions = examQuestions
    .sort((a: any, b: any) => a.question_order - b.question_order)
    .map((eq: any) => ({
      id: eq.questions.id,
      question_type: eq.questions.question_type,
      question_text: eq.questions.question_text,
      options: eq.questions.options,
      points: eq.questions.points,
      question_image_url: eq.questions.question_image_url,
      // ⚠️ لا نُرسل correct_answer للطالب قبل التسليم
    }))

  // إذا لم تبدأ المحاولة بعد، اعرض صفحة التعليمات
  if (!canAttempt?.has_ongoing) {
    return <ExamStartScreen exam={exam as any} questions={questions} attemptId={attemptId!} />
  }

  return <ExamInterface exam={exam as any} questions={questions} attemptId={attemptId!} />
}

function ExamStartScreen({ exam, questions, attemptId }: { exam: any; questions: any[]; attemptId: string }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-primary p-8 text-white">
          <div className="text-4xl mb-3">{exam.subjects?.icon || '📚'}</div>
          <h1 className="text-2xl font-display font-bold mb-1">{exam.title}</h1>
          <p className="text-blue-100">{exam.subjects?.name_ar} • {exam.grades?.name_ar}</p>
        </div>

        {/* Info */}
        <div className="p-8">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center bg-slate-50 rounded-2xl p-4">
              <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-xl font-bold">{exam.duration_minutes}</div>
              <div className="text-xs text-muted-foreground">دقيقة</div>
            </div>
            <div className="text-center bg-slate-50 rounded-2xl p-4">
              <BookOpen className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-xl font-bold">{questions.length}</div>
              <div className="text-xs text-muted-foreground">سؤال</div>
            </div>
            <div className="text-center bg-slate-50 rounded-2xl p-4">
              <CheckCircle className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-xl font-bold">{exam.total_points}</div>
              <div className="text-xs text-muted-foreground">درجة كاملة</div>
            </div>
          </div>

          {exam.instructions && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-yellow-800 mb-2">📋 تعليمات الاختبار</h3>
              <p className="text-sm text-yellow-700 leading-relaxed">{exam.instructions}</p>
            </div>
          )}

          <div className="space-y-2 text-sm text-muted-foreground mb-8">
            <p className="flex items-center gap-2"><span className="text-primary">✓</span> يمكنك التنقل بين الأسئلة بحرية</p>
            <p className="flex items-center gap-2"><span className="text-primary">✓</span> سيتم التسليم التلقائي عند انتهاء الوقت</p>
            <p className="flex items-center gap-2"><span className="text-primary">✓</span> يتم حفظ إجاباتك تلقائياً كل 30 ثانية</p>
            {exam.passing_score && (
              <p className="flex items-center gap-2"><span className="text-primary">✓</span> درجة النجاح: {exam.passing_score} من {exam.total_points}</p>
            )}
          </div>

          {/* This uses a form to redirect to the actual exam interface */}
          <form action={`/student/exams/${exam.id}/take`} method="GET">
            <input type="hidden" name="attemptId" value={attemptId} />
            <button type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl text-lg transition-all hover:scale-[1.01]">
              🚀 ابدأ الاختبار الآن
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
