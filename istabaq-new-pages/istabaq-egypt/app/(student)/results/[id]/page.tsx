'use server'

import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import { notFound, redirect } from 'next/navigation'
import {
  CheckCircle, XCircle, Clock, Award, TrendingUp, BookOpen,
  ChevronDown, ChevronUp, RotateCcw, Home, Share2, Printer
} from 'lucide-react'

interface Props {
  params: { id: string }
}

export default async function ResultDetailPage({ params }: Props) {
  const profile = await requireStudent()
  const supabase = createClient()

  // جلب تفاصيل المحاولة
  const { data: attempt } = await supabase
    .from('exam_attempts')
    .select(`
      id, score, percentage, is_passed, completed_at, started_at,
      time_spent_seconds, attempt_number, answers, feedback,
      exams(
        id, title, total_points, passing_score, show_results_immediately,
        allowed_attempts, subjects(name_ar, icon, color),
        grades(name_ar)
      )
    `)
    .eq('id', params.id)
    .eq('student_id', profile.id)
    .single()

  if (!attempt) notFound()

  // إذا لم تكتمل المحاولة بعد، عد للاختبار
  if (!attempt.completed_at) {
    redirect(`/student/exams/${(attempt as any).exams?.id}/take?attemptId=${params.id}`)
  }

  const exam = (attempt as any).exams
  const answers = (attempt.answers as Record<string, string>) || {}
  const feedback = (attempt.feedback as any) || {}

  // جلب أسئلة الاختبار مع الإجابات الصحيحة (بعد الانتهاء)
  let questionsWithAnswers: any[] = []
  if (exam?.show_results_immediately) {
    const { data: examQuestions } = await supabase
      .from('exam_questions')
      .select(`
        question_order,
        questions(id, question_type, question_text, options, correct_answer, explanation, points, question_image_url)
      `)
      .eq('exam_id', exam.id)
      .order('question_order')

    questionsWithAnswers = (examQuestions || [])
      .sort((a: any, b: any) => a.question_order - b.question_order)
      .map((eq: any) => {
        const q = eq.questions
        const studentAnswer = answers[q.id]
        const isCorrect = studentAnswer?.trim().toLowerCase() === q.correct_answer?.trim().toLowerCase()
        return {
          ...q,
          studentAnswer,
          isCorrect,
          isAnswered: studentAnswer !== undefined && studentAnswer !== '',
        }
      })
  }

  // إحصائيات
  const correctCount = questionsWithAnswers.filter(q => q.isCorrect).length
  const wrongCount = questionsWithAnswers.filter(q => q.isAnswered && !q.isCorrect).length
  const skippedCount = questionsWithAnswers.filter(q => !q.isAnswered).length

  const formatTime = (seconds: number) => {
    if (!seconds) return '—'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}س ${m}د`
    if (m > 0) return `${m}د ${s}ث`
    return `${s}ث`
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('ar-EG', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })

  const percentage = attempt.percentage || 0
  const isPassed = attempt.is_passed

  // حساب لون الدرجة
  const getScoreColor = (pct: number) => {
    if (pct >= 90) return 'text-green-600'
    if (pct >= 75) return 'text-blue-600'
    if (pct >= 60) return 'text-yellow-600'
    return 'text-red-500'
  }

  const getScoreBg = (pct: number) => {
    if (pct >= 90) return 'from-green-50 to-emerald-50 border-green-200'
    if (pct >= 75) return 'from-blue-50 to-sky-50 border-blue-200'
    if (pct >= 60) return 'from-yellow-50 to-amber-50 border-yellow-200'
    return 'from-red-50 to-rose-50 border-red-200'
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10" dir="rtl">

      {/* بطاقة النتيجة الرئيسية */}
      <div className={`bg-gradient-to-br ${getScoreBg(percentage)} rounded-3xl border-2 overflow-hidden`}>
        <div className="p-8 text-center">
          {/* الأيقونة */}
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5 ${isPassed ? 'bg-green-100' : 'bg-red-100'}`}>
            {isPassed
              ? <CheckCircle className="w-14 h-14 text-green-600" />
              : <XCircle className="w-14 h-14 text-red-500" />
            }
          </div>

          {/* الحكم */}
          <h1 className="text-3xl font-display font-bold mb-2">
            {isPassed ? '🎉 تهانينا! نجحت في الاختبار' : '💪 لم تحقق درجة النجاح'}
          </h1>
          <p className="text-muted-foreground mb-1">{exam?.title}</p>
          <p className="text-sm text-muted-foreground">
            {exam?.subjects?.name_ar} {exam?.grades?.name_ar && `• ${exam.grades.name_ar}`}
          </p>

          {/* الدرجة الكبيرة */}
          <div className="mt-6 mb-4">
            <div className={`text-7xl font-bold ${getScoreColor(percentage)}`}>
              {percentage.toFixed(0)}
              <span className="text-4xl">٪</span>
            </div>
            <p className="text-lg text-muted-foreground mt-1">
              {attempt.score} من {exam?.total_points} درجة
            </p>
          </div>

          {/* شريط التقدم */}
          <div className="w-full max-w-sm mx-auto h-3 bg-white/70 rounded-full overflow-hidden mb-6">
            <div
              className={`h-full rounded-full transition-all ${isPassed ? 'bg-green-500' : 'bg-red-400'}`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {exam?.passing_score && (
            <p className="text-sm text-muted-foreground">
              درجة النجاح: {exam.passing_score} من {exam.total_points}
              {' '}({((exam.passing_score / exam.total_points) * 100).toFixed(0)}٪)
            </p>
          )}
        </div>
      </div>

      {/* إحصائيات تفصيلية */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'وقت الحل',
            value: formatTime(attempt.time_spent_seconds || 0),
            icon: Clock,
            color: 'text-blue-600 bg-blue-50'
          },
          ...(exam?.show_results_immediately && questionsWithAnswers.length > 0 ? [
            {
              label: 'إجابات صحيحة',
              value: `${correctCount}/${questionsWithAnswers.length}`,
              icon: CheckCircle,
              color: 'text-green-600 bg-green-50'
            },
            {
              label: 'إجابات خاطئة',
              value: wrongCount.toString(),
              icon: XCircle,
              color: 'text-red-600 bg-red-50'
            },
            {
              label: 'أسئلة متروكة',
              value: skippedCount.toString(),
              icon: BookOpen,
              color: 'text-yellow-600 bg-yellow-50'
            },
          ] : [
            {
              label: 'رقم المحاولة',
              value: `#${attempt.attempt_number}`,
              icon: RotateCcw,
              color: 'text-purple-600 bg-purple-50'
            },
            {
              label: 'النتيجة',
              value: isPassed ? 'ناجح' : 'راسب',
              icon: Award,
              color: isPassed ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
            },
            {
              label: 'الدرجة',
              value: `${attempt.score}/${exam?.total_points}`,
              icon: TrendingUp,
              color: 'text-primary bg-accent'
            },
          ])
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-border p-4 text-center">
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mx-auto mb-2`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="text-xl font-bold">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* معلومات الاختبار */}
      <div className="bg-white rounded-2xl border border-border p-5">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          تفاصيل الاختبار
        </h2>
        <div className="space-y-3 text-sm">
          {[
            { label: 'تاريخ الإنجاز', value: attempt.completed_at ? formatDate(attempt.completed_at) : '—' },
            { label: 'مدة الحل الفعلية', value: formatTime(attempt.time_spent_seconds || 0) },
            { label: 'رقم المحاولة', value: `المحاولة رقم ${attempt.attempt_number}` },
            ...(exam?.allowed_attempts > 1 ? [{ label: 'المحاولات المسموح بها', value: exam.allowed_attempts === 999 ? 'غير محدودة' : `${exam.allowed_attempts} محاولات` }] : []),
          ].map((row, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-medium">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* مراجعة الأسئلة (إذا كان الاختبار يسمح بعرض النتائج) */}
      {exam?.show_results_immediately && questionsWithAnswers.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display font-bold text-xl">مراجعة الإجابات</h2>

          {questionsWithAnswers.map((q, idx) => (
            <div
              key={q.id}
              className={`bg-white rounded-2xl border-2 overflow-hidden ${
                !q.isAnswered ? 'border-gray-200' :
                q.isCorrect ? 'border-green-200' : 'border-red-200'
              }`}
            >
              {/* رأس السؤال */}
              <div className={`px-5 py-3 flex items-center gap-3 ${
                !q.isAnswered ? 'bg-gray-50' :
                q.isCorrect ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                  !q.isAnswered ? 'bg-gray-200 text-gray-600' :
                  q.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {idx + 1}
                </div>
                <span className="text-sm font-medium">
                  {!q.isAnswered ? '⚫ لم تُجب' : q.isCorrect ? '✅ إجابة صحيحة' : '❌ إجابة خاطئة'}
                </span>
                <span className="mr-auto text-xs text-muted-foreground">{q.points} {q.points === 1 ? 'درجة' : 'درجات'}</span>
              </div>

              <div className="p-5">
                {/* نص السؤال */}
                {q.question_image_url && (
                  <img src={q.question_image_url} alt="صورة السؤال" className="rounded-xl mb-4 max-h-48 object-contain" />
                )}
                <p className="text-base font-medium leading-relaxed mb-4">{q.question_text}</p>

                {/* الإجابات */}
                {q.question_type === 'mcq' && q.options && (
                  <div className="space-y-2">
                    {q.options.map((opt: string, i: number) => {
                      const isStudentAnswer = q.studentAnswer === opt
                      const isCorrectAnswer = q.correct_answer === opt
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm ${
                            isCorrectAnswer ? 'border-green-400 bg-green-50' :
                            isStudentAnswer && !isCorrectAnswer ? 'border-red-300 bg-red-50' :
                            'border-border bg-muted/30'
                          }`}
                        >
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                            isCorrectAnswer ? 'bg-green-500 text-white' :
                            isStudentAnswer ? 'bg-red-500 text-white' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {['أ', 'ب', 'ج', 'د'][i]}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {isCorrectAnswer && <span className="text-green-600 text-xs font-bold">✓ الإجابة الصحيحة</span>}
                          {isStudentAnswer && !isCorrectAnswer && <span className="text-red-500 text-xs font-bold">✗ إجابتك</span>}
                        </div>
                      )
                    })}
                  </div>
                )}

                {q.question_type === 'true_false' && (
                  <div className="grid grid-cols-2 gap-3">
                    {['صح', 'خطأ'].map(opt => {
                      const isStudentAnswer = q.studentAnswer === opt
                      const isCorrectAnswer = q.correct_answer === opt
                      return (
                        <div
                          key={opt}
                          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-bold ${
                            isCorrectAnswer ? 'border-green-400 bg-green-50 text-green-700' :
                            isStudentAnswer ? 'border-red-300 bg-red-50 text-red-600' :
                            'border-border bg-muted/30 text-muted-foreground'
                          }`}
                        >
                          {opt === 'صح' ? '✅' : '❌'} {opt}
                          {isCorrectAnswer && <span className="text-xs">(صحيح)</span>}
                        </div>
                      )
                    })}
                  </div>
                )}

                {q.question_type === 'fill_blank' && (
                  <div className="space-y-2">
                    <div className={`px-4 py-3 rounded-xl border-2 text-sm ${q.isCorrect ? 'border-green-400 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                      <span className="text-muted-foreground text-xs">إجابتك: </span>
                      <span className="font-medium">{q.studentAnswer || <em className="text-muted-foreground">لم تُجب</em>}</span>
                    </div>
                    {!q.isCorrect && (
                      <div className="px-4 py-3 rounded-xl border-2 border-green-400 bg-green-50 text-sm">
                        <span className="text-muted-foreground text-xs">الإجابة الصحيحة: </span>
                        <span className="font-bold text-green-700">{q.correct_answer}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* الشرح */}
                {q.explanation && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
                    <span className="font-bold">💡 الشرح: </span>
                    {q.explanation}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* أزرار الإجراءات */}
      <div className="bg-white rounded-2xl border border-border p-5">
        <div className="flex flex-wrap gap-3 justify-center">
          <a
            href="/student/results"
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            كل نتائجي
          </a>

          {isPassed && (
            <a
              href="/student/certificates"
              className="flex items-center gap-2 bg-egypt-gold text-white px-6 py-3 rounded-xl font-medium text-sm hover:opacity-90 transition-colors"
              style={{ background: 'var(--egypt-gold)' }}
            >
              <Award className="w-4 h-4" />
              عرض شهادتي
            </a>
          )}

          {!isPassed && (exam?.allowed_attempts === 999 || attempt.attempt_number < exam?.allowed_attempts) && (
            <a
              href={`/student/exams/${exam?.id}/start`}
              className="flex items-center gap-2 border-2 border-primary text-primary px-6 py-3 rounded-xl font-medium text-sm hover:bg-primary hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              إعادة الاختبار
            </a>
          )}

          <a
            href="/student/dashboard"
            className="flex items-center gap-2 border border-border px-6 py-3 rounded-xl font-medium text-sm hover:bg-muted transition-colors"
          >
            <Home className="w-4 h-4" />
            الرئيسية
          </a>
        </div>
      </div>
    </div>
  )
}
