// app/student/results/[id]/page.tsx
// تقرير نتيجة تفصيلي — [id] هو attemptId
// يعرض: الدرجة، مراجعة سؤال بسؤال، إجابة الطالب vs الصحيحة، أزرار إجراءات

import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import { notFound, redirect } from 'next/navigation'
import {
  CheckCircle,
  XCircle,
  Clock,
  Award,
  TrendingUp,
  BookOpen,
  RotateCcw,
  Home,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { MathRenderer } from '@/components/ui/MathRenderer'
import { AddToPracticeButton } from '@/components/student/AddToPracticeButton'
import { AIExplainButton } from '@/components/student/AIExplainButton'

interface Props {
  params: { id: string }
}

export default async function ResultDetailPage({ params }: Props) {
  const profile = await requireStudent()
  const supabase = await createClient()

  // Get auth user ID directly for reliable comparison
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  const userId = authUser?.id || (profile as any).id

  let attempt = (await supabase
    .from('exam_attempts')
    .select(
      `
      id, score, percentage, is_passed, completed_at, started_at,
      time_spent_seconds, attempt_number, answers, feedback,
      student_answers(question_id, is_correct, teacher_feedback, score_awarded, answer_image_url, student_answer),
      exams(
        id, title, total_points, passing_score, show_results_immediately,
        allowed_attempts, subjects(name_ar, icon),
        grades(name_ar)
      )
    `
    )
    .eq('id', params.id)
    .single()) as any

  // If not found by attempt id, try as exam_id (fallback)
  if (!attempt.data) {
    const { data: fallbackAttempt } = await (
      supabase.from('exam_attempts') as any
    )
      .select('id')
      .eq('exam_id', params.id)
      .eq('student_id', userId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single()

    if (fallbackAttempt) {
      redirect(`/student/results/${(fallbackAttempt as any).id}`)
    }
    notFound()
  }

  attempt = attempt.data

  // Security: ensure the attempt belongs to this student
  const attemptStudentId = (attempt as any).student_id
  if (attemptStudentId && attemptStudentId !== userId) {
    notFound()
  }

  // إذا لم تكتمل المحاولة، عد للاختبار
  if (!(attempt as any).completed_at) {
    redirect(
      `/student/exams/${(attempt as any).exams?.id}/take?attemptId=${params.id}`
    )
  }

  const exam = (attempt as any).exams
  const answers = (attempt.answers as Record<string, string>) || {}
  const feedback = (attempt.feedback as Record<string, any>) || {}

  // 🟢 تسجيل الاطلاع على الإجابات (Server-side)
  // بمجرد وصول الطالب لهذه الصفحة، نعلم أنه شاهد الإجابات النموذجية
  if (!feedback?.is_reviewed) {
    const updatedFeedback = {
      ...feedback,
      is_reviewed: true,
      reviewed_at: new Date().toISOString(),
    }

    // استخدام أي (any) لتجاوز قيود الأنواع الصارمة في التحديث
    await (supabase.from('exam_attempts') as any)
      .update({ feedback: updatedFeedback })
      .eq('id', params.id)
  }

  const studentAnswersRecords = (attempt.student_answers as any[]) || []
  const answerDetailsMap = new Map(
    studentAnswersRecords.map((a) => [a.question_id, a])
  )

  const normalizeArabic = (text: string) => {
    if (!text) return ''
    return text
      .trim()
      .toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[\u064B-\u065F]/g, '')
      .replace(/[,،\-_/\\.:؛"']/g, ' ')
      .replace(/\s+/g, ' ')
  }

  const checkAnswer = (
    studentAns: string,
    correctAns: string,
    type: string
  ): boolean => {
    if (!studentAns || !correctAns) return false
    if (type === 'true_false') {
      const isStudentTrue =
        studentAns === 'صح' || studentAns.toLowerCase() === 'true'
      const isCorrectTrue =
        correctAns === 'صح' || correctAns.toLowerCase() === 'true'
      const isStudentFalse =
        studentAns === 'خطأ' || studentAns.toLowerCase() === 'false'
      const isCorrectFalse =
        correctAns === 'خطأ' || correctAns.toLowerCase() === 'false'
      return (
        (isStudentTrue && isCorrectTrue) || (isStudentFalse && isCorrectFalse)
      )
    }
    const ns = normalizeArabic(studentAns)
    const nc = normalizeArabic(correctAns)
    if (type === 'mcq') return ns === nc
    if (ns === nc) return true
    if (nc.length >= 3 && ns.includes(nc)) return true
    if (ns.length >= 3 && nc.includes(ns)) return true
    const sw = ns.split(/\s+/).filter((w) => w.length >= 2)
    const cw = nc.split(/\s+/).filter((w) => w.length >= 2)
    if (sw.length > 0 && cw.length > 0) {
      const common = cw.filter((w) => sw.includes(w))
      if (sw.length <= 2 && common.length === sw.length) return true
      if (common.length / cw.length >= 0.4 || common.length / sw.length >= 0.5)
        return true
    }
    return false
  }

  let questionsWithAnswers: any[] = []
  // Always load questions for the results detail page
  {
    const { data: examQuestions } = await supabase
      .from('exam_questions')
      .select(
        `
        question_order,
        points_override,
        questions(id, question_type, context_passage, question_text, options, correct_answer, explanation, points, question_image_url, difficulty_level)
      `
      )
      .eq('exam_id', exam.id)
      .order('question_order')

    questionsWithAnswers = (examQuestions || [])
      .sort((a: any, b: any) => a.question_order - b.question_order)
      .map((eq: any) => {
        const q = eq.questions
        const sa = answerDetailsMap.get(q.id)
        const studentAnswer = sa?.student_answer || answers[q.id]
        const answerImageUrl =
          sa?.answer_image_url ||
          (studentAnswer && studentAnswer.startsWith('[image:')
            ? studentAnswer.slice(7, -1)
            : null)

        let isCorrect = false
        if (sa && sa.is_correct !== undefined) {
          isCorrect = sa.is_correct
        } else {
          isCorrect = checkAnswer(
            studentAnswer,
            q.correct_answer,
            q.question_type
          )
        }
        return {
          ...q,
          points: eq.points_override || q.points || 1,
          studentAnswer,
          answerImageUrl,
          isCorrect,
          explanation: sa?.teacher_feedback || q.explanation,
          isAnswered:
            (studentAnswer !== undefined && studentAnswer !== '') ||
            !!answerImageUrl,
        }
      })
  }

  const correctCount = questionsWithAnswers.filter((q) => q.isCorrect).length
  const wrongCount = questionsWithAnswers.filter(
    (q) => q.isAnswered && !q.isCorrect
  ).length
  const skippedCount = questionsWithAnswers.filter((q) => !q.isAnswered).length
  const wrongQuestionIds = questionsWithAnswers
    .filter((q) => !q.isCorrect)
    .map((q) => q.id)

  // Bloom's Taxonomy Analysis based on questions in this exam
  const bloomLabels: Record<string, string> = {
    remember: 'تذكر',
    understand: 'فهم',
    apply: 'تطبيق',
    analyze: 'تحليل',
    evaluate: 'تقييم',
    create: 'إبداع',
  }
  const bloomOrder = [
    'remember',
    'understand',
    'apply',
    'analyze',
    'evaluate',
    'create',
  ]
  const bloomStats: Record<string, { total: number; correct: number }> = {}
  questionsWithAnswers.forEach((q) => {
    const level = q.bloom_level || 'understand'
    if (!bloomStats[level]) bloomStats[level] = { total: 0, correct: 0 }
    bloomStats[level].total += 1
    if (q.isCorrect) bloomStats[level].correct += 1
  })
  const hasBloomData = Object.keys(bloomStats).length > 0

  const TYPE_LABELS: Record<string, string> = {
    mcq: 'اختيار من متعدد',
    true_false: 'صح / خطأ',
    fill_blank: 'ملء فراغ',
  }
  const DIFF_LABELS: Record<string, string> = {
    easy: 'سهل',
    medium: 'متوسط',
    hard: 'صعب',
  }

  const formatTime = (seconds: number) => {
    if (!seconds) return '—'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}د ${s}ث`
  }

  const percentage = (attempt as any).percentage || 0
  const isPassed = (attempt as any).is_passed

  // الدرجة الكلية الفعلية بناءً على الأسئلة أو النسبة المحتسبة لتجنب خطأ التناقض
  const actualTotalPoints =
    attempt.score > 0 && percentage > 0
      ? Math.round((attempt.score / percentage) * 100)
      : questionsWithAnswers.length > 0
        ? questionsWithAnswers.reduce((sum, q) => sum + q.points, 0)
        : exam?.total_points

  const getScoreColor = (pct: number) => {
    if (pct >= 90) return 'text-egypt-green'
    if (pct >= 75) return 'text-primary'
    if (pct >= 60) return 'text-amber-600'
    return 'text-egypt-red'
  }

  const getGradeBg = (pct: number) => {
    if (pct >= 90) return 'from-green-50 to-emerald-50 border-green-200'
    if (pct >= 75) return 'from-blue-50 to-sky-50 border-blue-200'
    if (pct >= 60) return 'from-yellow-50 to-amber-50 border-yellow-200'
    return 'from-red-50 to-rose-50 border-red-200'
  }

  const getGrade = (pct: number) => {
    if (pct >= 90) return 'ممتاز'
    if (pct >= 80) return 'جيد جداً'
    if (pct >= 70) return 'جيد'
    if (pct >= 60) return 'مقبول'
    return 'راسب'
  }

  return (
    <div className="mx-auto max-w-4xl animate-fade-in space-y-8 pb-20">
      {/* Hero Result Card */}
      <div
        className={`bg-gradient-to-br ${getGradeBg(percentage)} overflow-hidden rounded-[2.5rem] border-2 shadow-2xl shadow-black/5`}
      >
        <div className="relative p-10 text-center">
          <div className="pointer-events-none absolute right-4 top-4 select-none text-[100px] font-bold opacity-5">
            {getGrade(percentage)}
          </div>

          <div
            className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl shadow-xl ${isPassed ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
          >
            {isPassed ? (
              <CheckCircle className="h-14 w-14" />
            ) : (
              <XCircle className="h-14 w-14" />
            )}
          </div>

          <h1 className="mb-2 text-4xl font-bold tracking-tight">
            {isPassed
              ? '🎉 أداء رائع، لقد نجحت!'
              : '💪 محاولة جيدة، يمكنك التحسن'}
          </h1>
          <p className="mb-8 font-medium text-muted-foreground">
            {exam?.title} • {exam?.subjects?.name_ar}
          </p>

          <div className="mb-10 flex flex-col items-center justify-center gap-12 md:flex-row">
            <div className="relative">
              <div
                className={`text-8xl font-black ${getScoreColor(percentage)} tabular-nums`}
              >
                {Math.round(percentage)}
                <span className="ml-1 text-4xl">%</span>
              </div>
              <p className="mt-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                النسبة النهائية
              </p>
            </div>

            <div className="hidden h-20 w-px bg-border/50 md:block" />

            <div className="text-right">
              <div className="text-3xl font-bold text-foreground">
                {(attempt as any).score}{' '}
                <span className="text-xl text-muted-foreground">
                  / {actualTotalPoints}
                </span>
              </div>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                الدرجات المحصلة
              </p>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-2 w-32 overflow-hidden rounded-full border border-border/50 bg-white">
                  <div
                    className={`h-full ${isPassed ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground">
                  {isPassed ? 'ناجح' : 'راسب'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          {
            label: 'وقت الحل',
            value: formatTime((attempt as any).time_spent_seconds || 0),
            icon: Clock,
            color: 'text-blue-600 bg-blue-50',
          },
          {
            label: 'إجابات صحيحة',
            value: `${correctCount}/${questionsWithAnswers.length}`,
            icon: CheckCircle,
            color: 'text-green-600 bg-green-50',
          },
          {
            label: 'إجابات خاطئة',
            value: String(wrongCount),
            icon: XCircle,
            color: 'text-red-500 bg-red-50',
          },
          {
            label: 'أسئلة متروكة',
            value: String(skippedCount),
            icon: BookOpen,
            color: 'text-amber-600 bg-amber-50',
          },
        ].map((stat, i) => (
          <div key={i} className="card-premium p-5 text-center">
            <div
              className={`h-10 w-10 rounded-xl ${stat.color} mx-auto mb-3 flex items-center justify-center shadow-inner`}
            >
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-black">{stat.value}</div>
            <div className="mt-1 text-[10px] font-bold uppercase text-muted-foreground">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Bloom's Taxonomy Analysis */}
      {hasBloomData && (
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-xl font-bold">
            تحليل أدائك حسب مستويات بلوم 🧠
          </h2>
          <p className="mb-5 text-sm text-muted-foreground">
            رسم بياني لنقاط قوتك وضعفك في المستويات المعرفية المختلفة
          </p>
          <div className="space-y-3">
            {bloomOrder
              .filter((l) => bloomStats[l])
              .map((level) => {
                const { total, correct } = bloomStats[level]
                const pct = total > 0 ? Math.round((correct / total) * 100) : 0
                return (
                  <div key={level} className="flex items-center gap-4">
                    <div className="w-16 shrink-0 text-right text-sm font-bold">
                      {bloomLabels[level]}
                    </div>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          pct >= 70
                            ? 'bg-green-500'
                            : pct >= 50
                              ? 'bg-yellow-400'
                              : 'bg-red-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-16 shrink-0 text-left">
                      <span
                        className={`text-sm font-bold ${
                          pct >= 70
                            ? 'text-green-600'
                            : pct >= 50
                              ? 'text-yellow-600'
                              : 'text-red-500'
                        }`}
                      >
                        {pct}٪
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {' '}
                        ({correct}/{total})
                      </span>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Question Review Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            مراجعة الإجابات والتحليل الذكي ✨
          </h2>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              تم تحليل الإجابات بناءً على معايير المادة
            </div>
            {wrongQuestionIds.length > 0 && (
              <AddToPracticeButton
                questionIds={wrongQuestionIds}
                attemptId={params.id}
                studentId={profile.id}
              />
            )}
          </div>
        </div>

        <div className="space-y-6">
          {questionsWithAnswers.map((q, idx) => (
            <div
              key={q.id}
              className={`card-premium overflow-hidden border-l-8 ${
                !q.isAnswered
                  ? 'border-l-slate-300'
                  : q.isCorrect
                    ? 'border-l-emerald-500'
                    : 'border-l-rose-500'
              }`}
            >
              {/* Question Meta Header */}
              <div className="flex flex-wrap items-center gap-3 border-b border-border bg-muted/30 px-6 py-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-xs font-black text-background">
                  {idx + 1}
                </span>
                <span
                  className={`badge-${q.question_type} rounded-md px-2 py-0.5 text-[10px]`}
                >
                  {TYPE_LABELS[q.question_type]}
                </span>
                <span
                  className={`badge-${q.difficulty_level || 'medium'} rounded-md px-2 py-0.5 text-[10px]`}
                >
                  {DIFF_LABELS[q.difficulty_level || 'medium']}
                </span>
                <span className="rounded-full border border-border bg-white px-2 py-0.5 text-[10px] font-bold">
                  {q.points} {q.points === 1 ? 'درجة' : 'درجات'}
                </span>

                <div className="mr-auto flex items-center gap-1.5">
                  {!q.isAnswered ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                      <div className="h-2 w-2 rounded-full bg-slate-300" /> لم
                      تُجب
                    </span>
                  ) : q.isCorrect ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                      <CheckCircle className="h-3.5 w-3.5" /> إجابة صحيحة
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500">
                      <XCircle className="h-3.5 w-3.5" /> إجابة خاطئة
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6">
                {q.question_image_url && (
                  <img
                    src={q.question_image_url}
                    alt="سؤال مصور"
                    className="mb-6 max-h-64 rounded-2xl border border-border object-contain shadow-sm"
                  />
                )}
                {q.context_passage && (
                  <div className="relative mb-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6 italic leading-relaxed text-indigo-950">
                    <div className="absolute right-6 top-0 -translate-y-1/2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800 shadow-sm">
                      القطعة المرجعية:
                    </div>
                    <MathRenderer
                      text={q.context_passage}
                      className="text-lg"
                    />
                  </div>
                )}
                <MathRenderer
                  text={q.question_text}
                  className="mb-6 text-lg font-bold"
                />

                {/* MCQ Options Grid */}
                {q.question_type === 'mcq' && q.options && (
                  <div className="mb-6 grid gap-3 sm:grid-cols-2">
                    {q.options.map((opt: string, i: number) => {
                      const isStudentAnswer = q.studentAnswer === opt
                      const isCorrectAnswer = q.correct_answer === opt
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-4 rounded-2xl border-2 p-4 transition-all ${
                            isCorrectAnswer
                              ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                              : isStudentAnswer
                                ? 'border-rose-400 bg-rose-50'
                                : 'border-border hover:bg-muted/50'
                          }`}
                        >
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                              isCorrectAnswer
                                ? 'bg-emerald-500 text-white'
                                : isStudentAnswer
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {['أ', 'ب', 'ج', 'د'][i]}
                          </div>
                          <MathRenderer
                            text={opt}
                            className="flex-1 text-sm font-medium"
                          />
                          {isCorrectAnswer && (
                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                          )}
                          {isStudentAnswer && !isCorrectAnswer && (
                            <XCircle className="h-5 w-5 text-rose-500" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* True/False Buttons */}
                {q.question_type === 'true_false' && (
                  <div className="mb-6 grid grid-cols-2 gap-4">
                    {['صح', 'خطأ'].map((opt) => {
                      const isStudentAnswer = q.studentAnswer === opt
                      const isCorrectAnswer = q.correct_answer === opt
                      return (
                        <div
                          key={opt}
                          className={`flex flex-col items-center justify-center rounded-3xl border-2 p-6 transition-all ${
                            isCorrectAnswer
                              ? 'border-emerald-500 bg-emerald-50'
                              : isStudentAnswer
                                ? 'border-rose-400 bg-rose-50'
                                : 'border-border'
                          }`}
                        >
                          <span className="mb-2 text-4xl">
                            {opt === 'صح' ? '✅' : '❌'}
                          </span>
                          <span className="font-bold">{opt}</span>
                          {isCorrectAnswer && (
                            <span className="mt-2 text-[10px] font-black uppercase text-emerald-600">
                              الإجابة الصحيحة
                            </span>
                          )}
                          {isStudentAnswer && !isCorrectAnswer && (
                            <span className="mt-2 text-[10px] font-black uppercase text-rose-500">
                              إجابتك
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Fill Blank Display */}
                {q.question_type === 'fill_blank' && (
                  <div className="mb-6 rounded-3xl border border-border bg-muted/30 p-6">
                    <div className="space-y-4">
                      <div>
                        <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">
                          إجابتك المسجلة
                        </p>
                        <div
                          className={`rounded-xl border-2 px-4 py-3 font-bold ${q.isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-rose-400 bg-rose-50 text-rose-700'}`}
                        >
                          {q.studentAnswer || 'لا توجد إجابة'}
                        </div>
                      </div>
                      {!q.isCorrect && (
                        <div>
                          <p className="mb-1 text-[10px] font-bold uppercase text-emerald-600 text-muted-foreground">
                            الإجابة الصحيحة
                          </p>
                          <div className="rounded-xl border-2 border-emerald-500 bg-emerald-50 px-4 py-3 font-bold text-emerald-700">
                            {q.correct_answer}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Essay or Correction Display */}
                {(q.question_type === 'essay' ||
                  q.question_type === 'correction') && (
                  <div className="mb-6 rounded-3xl border border-border bg-muted/30 p-6">
                    <div className="space-y-4">
                      <div>
                        <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">
                          إجابتك المسجلة
                        </p>
                        {q.answerImageUrl ? (
                          <div className="space-y-2">
                            <div className="relative max-w-md overflow-hidden rounded-2xl border border-border bg-white p-2">
                              <img
                                src={q.answerImageUrl}
                                alt="إجابتك المكتوبة بخط اليد"
                                className="max-h-64 w-full rounded-xl object-contain"
                              />
                            </div>
                            {q.studentAnswer &&
                              !q.studentAnswer.startsWith('[image:') && (
                                <p className="mt-2 text-sm font-semibold italic text-muted-foreground">
                                  النص المستخرج من الصورة:{' '}
                                  <span className="not-italic text-foreground">
                                    {q.studentAnswer}
                                  </span>
                                </p>
                              )}
                          </div>
                        ) : (
                          <div
                            className={`rounded-xl border-2 px-4 py-3 font-bold ${q.isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-rose-400 bg-rose-50 text-rose-700'}`}
                          >
                            {q.studentAnswer || 'لا توجد إجابة'}
                          </div>
                        )}
                      </div>
                      {!q.isCorrect && (
                        <div>
                          <p className="mb-1 text-[10px] font-bold uppercase text-emerald-600 text-muted-foreground">
                            الإجابة النموذجية
                          </p>
                          <div className="rounded-xl border-2 border-emerald-500 bg-emerald-50 px-4 py-3 font-bold text-emerald-700">
                            <MathRenderer text={q.correct_answer} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Analysis/Explanation Block */}
                {q.explanation && (
                  <div className="group relative flex gap-4 overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 to-indigo-50 p-5 text-sky-900 shadow-sm">
                    <div className="absolute right-0 top-0 p-1 opacity-10 transition-opacity group-hover:opacity-20">
                      <Sparkles className="h-12 w-12" />
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-100 bg-white shadow-sm">
                      <Sparkles className="h-6 w-6 text-sky-500" />
                    </div>
                    <div>
                      <h4 className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-wider">
                        تحليل الإجابة الذكي
                        <span className="rounded-full bg-sky-500 px-1.5 py-0.5 text-[8px] text-white">
                          AI Analysis
                        </span>
                      </h4>
                      <MathRenderer
                        text={q.explanation}
                        className="text-sm font-medium italic leading-relaxed"
                      />
                    </div>
                  </div>
                )}

                {/* AI Explain Button — only for wrong/skipped answers */}
                {!q.isCorrect && exam?.show_results_immediately && (
                  <AIExplainButton
                    questionId={q.id}
                    questionText={q.question_text}
                    correctAnswer={q.correct_answer}
                    studentAnswer={q.studentAnswer}
                    subject={(exam as any)?.subjects?.name_ar}
                    grade={(exam as any)?.grades?.name_ar}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="card-premium bg-premium-gradient flex flex-col items-center justify-between gap-6 p-8 text-white md:flex-row">
        <div>
          <h3 className="text-xl font-bold">تهانينا على إتمام المراجعة! 🎓</h3>
          <p className="text-sm text-white/60">
            تم حفظ تقدمك، يمكنك العودة لمراجعة هذه النتائج في أي وقت من سجل
            النتائج.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/student/results"
            className="flex items-center gap-2 rounded-2xl bg-white px-8 py-3 text-sm font-bold text-primary transition-all hover:bg-white/90"
          >
            <TrendingUp className="h-4 w-4" /> سجل النتائج
          </Link>
          <Link
            href="/student/dashboard"
            className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-8 py-3 text-sm font-bold text-white transition-all hover:bg-white/20"
          >
            <Home className="h-4 w-4" /> العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  )
}
