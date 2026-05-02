import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import { notFound } from 'next/navigation'
import { CheckCircle, XCircle, Clock, Award, ArrowRight, Download } from 'lucide-react'

interface Props {
  params: { id: string }
  searchParams: { attemptId?: string }
}

export default async function ExamResultDetailPage({ params, searchParams }: Props) {
  const profile = await requireStudent()
  const supabase = createClient()

  // جلب المحاولة
  let attemptQuery = supabase
    .from('exam_attempts')
    .select('*')
    .eq('student_id', profile.id)
    .eq('exam_id', params.id)
    .not('completed_at', 'is', null)
    .order('attempt_number', { ascending: false })

  if (searchParams.attemptId) {
    attemptQuery = supabase
      .from('exam_attempts')
      .select('*')
      .eq('id', searchParams.attemptId)
      .eq('student_id', profile.id)
  }

  const { data: attempts } = await attemptQuery.limit(1)
  const attempt = attempts?.[0]

  if (!attempt) notFound()

  // جلب بيانات الاختبار والأسئلة
  const [{ data: exam }, { data: examQuestions }] = await Promise.all([
    supabase.from('exams')
      .select('*, subjects(name_ar, icon), grades(name_ar)')
      .eq('id', params.id)
      .single(),
    supabase.from('exam_questions')
      .select('question_order, points_override, questions(id, question_type, question_text, correct_answer, explanation, options, points)')
      .eq('exam_id', params.id)
      .order('question_order'),
  ])

  if (!exam) notFound()

  const pct = attempt.percentage ?? 0
  const passed = attempt.is_passed
  const feedback = (attempt.feedback as Record<string, any>) || {}
  const answers = (attempt.answers as Record<string, string>) || {}

  const formatTime = (sec: number) => {
    if (!sec) return '—'
    const m = Math.floor(sec / 60); const s = sec % 60
    return `${m} دقيقة ${s > 0 ? `و ${s} ثانية` : ''}`
  }

  const gradeLabel =
    pct >= 90 ? 'ممتاز'     : pct >= 80 ? 'جيد جداً' :
    pct >= 70 ? 'جيد'       : pct >= 60 ? 'مقبول'    :
    pct >= 50 ? 'ضعيف'     : 'راسب'

  const correctCount = Object.values(feedback).filter((f: any) => f.is_correct).length
  const wrongCount   = Object.values(feedback).filter((f: any) => !f.is_correct && f.student_answer).length
  const skippedCount = Object.values(feedback).filter((f: any) => !f.student_answer).length

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <a href="/student/results" className="hover:text-primary transition-colors">نتائجي</a>
        <ArrowRight className="w-3 h-3" />
        <span className="text-foreground font-medium">{exam.title}</span>
      </div>

      {/* Score Hero */}
      <div className={`rounded-3xl overflow-hidden ${passed ? 'bg-gradient-to-br from-green-500 to-emerald-700' : 'bg-gradient-to-br from-orange-500 to-red-600'}`}>
        <div className="p-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-5xl font-display font-bold">{pct.toFixed(0)}٪</div>
              <div className="text-white/80 mt-1">{attempt.score} من {exam.total_points} درجة</div>
              <div className="mt-3">
                <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm font-medium">
                  {passed ? '✅' : '❌'} {gradeLabel} • المحاولة {attempt.attempt_number}
                </span>
              </div>
            </div>
            <div className="text-6xl">{(exam.subjects as any)?.icon || '📚'}</div>
          </div>

          {/* Bar */}
          <div className="mt-6 h-3 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white/80 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 divide-x divide-white/20 rtl:divide-x-reverse bg-black/10">
          {[
            { label: 'صحيح', value: correctCount, icon: '✅' },
            { label: 'خاطئ', value: wrongCount, icon: '❌' },
            { label: 'متروك', value: skippedCount, icon: '⬜' },
            { label: 'الوقت', value: formatTime(attempt.time_spent_seconds || 0), icon: '⏱️' },
          ].map(s => (
            <div key={s.label} className="text-center p-4 text-white">
              <div className="text-lg">{s.icon}</div>
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-xs text-white/70">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Exam info */}
      <div className="bg-white rounded-2xl border border-border p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          {[
            { label: 'الاختبار', value: exam.title },
            { label: 'المادة', value: (exam.subjects as any)?.name_ar },
            { label: 'الصف', value: (exam.grades as any)?.name_ar },
            { label: 'تاريخ الحل', value: attempt.completed_at ? new Date(attempt.completed_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
          ].map(item => (
            <div key={item.label}>
              <p className="text-xs text-muted-foreground mb-0.5">{item.label}</p>
              <p className="font-medium">{item.value || '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Question-by-question breakdown */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-lg">تفاصيل الإجابات</h2>
          <span className="text-sm text-muted-foreground">{examQuestions?.length || 0} سؤال</span>
        </div>

        <div className="divide-y divide-border">
          {examQuestions?.map((eq: any, i: number) => {
            const q = eq.questions
            const fb = feedback[q.id]
            const studentAnswer = answers[q.id]
            const isCorrect = fb?.is_correct
            const isSkipped = !studentAnswer

            return (
              <div key={q.id} className={`p-5 ${!isCorrect && !isSkipped ? 'bg-red-50/40' : isSkipped ? 'bg-yellow-50/40' : ''}`}>
                <div className="flex items-start gap-3">
                  {/* Status icon */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isSkipped ? 'bg-yellow-100' : isCorrect ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {isSkipped
                      ? <span className="text-yellow-600 text-xs font-bold">!</span>
                      : isCorrect
                        ? <CheckCircle className="w-4 h-4 text-green-600" />
                        : <XCircle className="w-4 h-4 text-red-500" />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Question number + type */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-muted-foreground">السؤال {i + 1}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        q.question_type === 'mcq' ? 'bg-blue-50 text-blue-700' :
                        q.question_type === 'true_false' ? 'bg-purple-50 text-purple-700' :
                        'bg-orange-50 text-orange-700'
                      }`}>
                        {q.question_type === 'mcq' ? 'اختيار متعدد' : q.question_type === 'true_false' ? 'صح/خطأ' : 'ملء فراغ'}
                      </span>
                    </div>

                    {/* Question text */}
                    <p className="text-sm font-medium leading-relaxed mb-3">{q.question_text}</p>

                    {/* MCQ options with highlights */}
                    {q.question_type === 'mcq' && q.options && (
                      <div className="grid sm:grid-cols-2 gap-1.5 mb-3">
                        {(q.options as string[]).map((opt: string, oi: number) => {
                          const isRight = opt === q.correct_answer
                          const isStudentAnswer = opt === studentAnswer
                          return (
                            <div key={oi} className={`text-xs px-3 py-2 rounded-lg border flex items-center gap-2 ${
                              isRight ? 'bg-green-50 border-green-300 text-green-800' :
                              isStudentAnswer && !isRight ? 'bg-red-50 border-red-300 text-red-800' :
                              'border-border text-muted-foreground'
                            }`}>
                              <span className="font-bold">{['أ', 'ب', 'ج', 'د'][oi]}.</span>
                              <span className="flex-1">{opt}</span>
                              {isRight && <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />}
                              {isStudentAnswer && !isRight && <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Answer summary for TF / fill_blank */}
                    {(q.question_type === 'true_false' || q.question_type === 'fill_blank') && (
                      <div className="flex flex-wrap gap-3 mb-3 text-xs">
                        <div className={`px-3 py-1.5 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
                          إجابتك: <strong>{studentAnswer || '(متروك)'}</strong>
                        </div>
                        {!isCorrect && (
                          <div className="px-3 py-1.5 rounded-lg border bg-green-50 border-green-300 text-green-800">
                            الصحيحة: <strong>{q.correct_answer}</strong>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="text-xs text-muted-foreground bg-blue-50/60 border border-blue-100 rounded-lg px-3 py-2 leading-relaxed">
                        <span className="font-semibold text-blue-800">💡 الشرح: </span>{q.explanation}
                      </div>
                    )}
                  </div>

                  {/* Points */}
                  <div className="text-left shrink-0">
                    <div className={`text-base font-bold ${isCorrect ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {fb?.points_earned ?? 0}
                    </div>
                    <div className="text-xs text-muted-foreground">/{fb?.points_possible ?? q.points}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pb-6">
        <a href="/student/exams"
          className="flex-1 text-center bg-primary text-white py-3 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors">
          الاختبارات المتاحة
        </a>
        <a href="/student/results"
          className="flex-1 text-center border border-border py-3 rounded-xl font-medium text-sm hover:bg-muted transition-colors">
          كل نتائجي
        </a>
        <a href="/student/certificates"
          className="flex items-center justify-center gap-2 border border-border py-3 px-5 rounded-xl font-medium text-sm hover:bg-muted transition-colors">
          <Award className="w-4 h-4" />
          الشهادات
        </a>
      </div>
    </div>
  )
}
