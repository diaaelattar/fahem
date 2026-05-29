'use client'
// app/exam/[token]/result/[attemptId]/page.tsx
// صفحة نتيجة الضيف مع مراجعة كاملة سؤال بسؤال
// تقرأ البيانات من sessionStorage

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  CheckCircle,
  XCircle,
  Clock,
  Award,
  BookOpen,
  Home,
  RotateCcw,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface QuestionReview {
  id: string
  question_type: string
  question_text: string
  context_passage?: string
  options?: string[]
  points: number
  question_image_url?: string
  correct_answer: string
  explanation?: string
  student_answer: string
  is_correct: boolean
  points_awarded: number
}

interface Result {
  score: number
  total_points: number
  percentage: number
  is_passed: boolean
  time_spent_seconds: number
  exam_title: string
  subject?: string
  grade?: string
}

interface SessionResult {
  result: Result
  questionsReview: QuestionReview[]
  guestName: string
}

const TYPE_LABELS: Record<string, string> = {
  mcq: 'اختيار من متعدد',
  true_false: 'صح / خطأ',
  fill_blank: 'ملء فراغ',
}

export default function GuestResultPage() {
  const params = useParams()
  const token = params.token as string
  const attemptId = params.attemptId as string

  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())

  useEffect(() => {
    const stored = sessionStorage.getItem(`guest_result_${attemptId}`)
    if (stored) {
      setSessionResult(JSON.parse(stored))
    }
    setLoading(false)
  }, [attemptId])

  const toggleQuestion = (id: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const expandAll = () => {
    if (!sessionResult) return
    setExpandedQuestions(new Set(sessionResult.questionsReview.map((q) => q.id)))
  }

  const formatTime = (sec: number) => {
    if (!sec) return '—'
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}د ${s}ث`
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (!sessionResult) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-lg">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-rose-400" />
          <h2 className="mb-2 text-xl font-bold">لم يتم العثور على النتيجة</h2>
          <p className="mb-6 text-sm text-slate-500">
            ربما انتهت الجلسة. جرب إعادة الاختبار.
          </p>
          <a
            href={`/exam/${token}`}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 font-bold text-white"
          >
            <RotateCcw className="h-4 w-4" />
            إعادة الاختبار
          </a>
        </div>
      </div>
    )
  }

  const { result, questionsReview, guestName } = sessionResult
  const correctCount = questionsReview.filter((q) => q.is_correct).length
  const wrongCount = questionsReview.filter((q) => !q.is_correct && q.student_answer).length
  const skippedCount = questionsReview.filter((q) => !q.student_answer).length

  const getGradeBg = (pct: number) => {
    if (pct >= 90) return 'from-green-500 to-emerald-600'
    if (pct >= 75) return 'from-blue-500 to-indigo-600'
    if (pct >= 60) return 'from-yellow-500 to-amber-600'
    return 'from-red-500 to-rose-600'
  }

  const getGrade = (pct: number) => {
    if (pct >= 90) return 'ممتاز 🌟'
    if (pct >= 80) return 'جيد جداً ⭐'
    if (pct >= 70) return 'جيد 👍'
    if (pct >= 60) return 'مقبول'
    return 'راسب'
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20" dir="rtl">
      {/* Hero Card */}
      <div className={`bg-gradient-to-br ${getGradeBg(result.percentage)} px-4 pt-10 pb-20 text-white`}>
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-1 text-sm font-bold text-white/70">{guestName}</p>
          <h1 className="mb-2 text-3xl font-black">
            {result.is_passed ? '🎉 تهانينا، لقد نجحت!' : '💪 حاول مرة أخرى'}
          </h1>
          <p className="mb-8 text-white/80">{result.exam_title}</p>

          {/* الدرجة */}
          <div className="mx-auto mb-6 inline-block rounded-3xl bg-white/20 px-10 py-6 backdrop-blur-sm">
            <div className="text-7xl font-black tabular-nums">
              {Math.round(result.percentage)}
              <span className="text-3xl">%</span>
            </div>
            <p className="mt-1 text-sm font-bold text-white/70">
              {result.score} / {result.total_points} درجة
            </p>
            <div className="mt-3 inline-block rounded-full bg-white/20 px-4 py-1 text-sm font-bold">
              {getGrade(result.percentage)}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mx-auto -mt-10 max-w-2xl px-4">
        <div className="grid grid-cols-4 gap-3 rounded-3xl bg-white p-4 shadow-xl border border-slate-100">
          {[
            { label: 'وقت الحل', value: formatTime(result.time_spent_seconds), icon: Clock, color: 'text-blue-600 bg-blue-50' },
            { label: 'صحيح', value: correctCount, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'خطأ', value: wrongCount, icon: XCircle, color: 'text-rose-500 bg-rose-50' },
            { label: 'متروك', value: skippedCount, icon: BookOpen, color: 'text-amber-600 bg-amber-50' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div className="text-xl font-black text-slate-800">{s.value}</div>
              <div className="text-[10px] font-bold text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>

        {/* مراجعة الأسئلة */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-800">مراجعة الإجابات</h2>
            <button
              onClick={expandAll}
              className="text-sm font-bold text-emerald-600 hover:text-emerald-700"
            >
              عرض الكل
            </button>
          </div>

          {questionsReview.map((q, idx) => {
            const isExpanded = expandedQuestions.has(q.id)
            return (
              <div
                key={q.id}
                className={`overflow-hidden rounded-2xl border-2 bg-white shadow-sm transition-all ${
                  !q.student_answer
                    ? 'border-slate-200'
                    : q.is_correct
                      ? 'border-emerald-200'
                      : 'border-rose-200'
                }`}
              >
                {/* رأس السؤال */}
                <button
                  onClick={() => toggleQuestion(q.id)}
                  className="flex w-full items-center gap-3 p-4 text-right transition-colors hover:bg-slate-50"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-black text-slate-600">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {q.question_text}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className={`text-xs font-bold ${q.is_correct ? 'text-emerald-600' : !q.student_answer ? 'text-slate-400' : 'text-rose-500'}`}>
                        {!q.student_answer ? 'لم تُجب' : q.is_correct ? '✓ صحيح' : '✗ خطأ'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {q.points_awarded}/{q.points} درجة
                      </span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                  )}
                </button>

                {/* تفاصيل السؤال */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 space-y-4">
                    {/* نص السؤال */}
                    <p className="font-bold text-slate-800">{q.question_text}</p>

                    {/* خيارات MCQ */}
                    {q.question_type === 'mcq' && q.options && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {q.options.map((opt, i) => {
                          const isStudent = q.student_answer === opt
                          const isCorrect = q.correct_answer === opt
                          return (
                            <div
                              key={i}
                              className={`flex items-center gap-3 rounded-xl border-2 p-3 text-sm ${
                                isCorrect
                                  ? 'border-emerald-400 bg-emerald-50'
                                  : isStudent
                                    ? 'border-rose-400 bg-rose-50'
                                    : 'border-slate-200'
                              }`}
                            >
                              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-black ${isCorrect ? 'bg-emerald-500 text-white' : isStudent ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                {['أ', 'ب', 'ج', 'د'][i]}
                              </span>
                              <span className="flex-1 font-medium">{opt}</span>
                              {isCorrect && <CheckCircle className="h-4 w-4 text-emerald-600" />}
                              {isStudent && !isCorrect && <XCircle className="h-4 w-4 text-rose-500" />}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* ملء الفراغ */}
                    {q.question_type === 'fill_blank' && (
                      <div className="space-y-2">
                        <div className={`rounded-xl border-2 p-3 text-sm font-bold ${q.is_correct ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-rose-400 bg-rose-50 text-rose-700'}`}>
                          إجابتك: {q.student_answer || 'لم تُجب'}
                        </div>
                        {!q.is_correct && (
                          <div className="rounded-xl border-2 border-emerald-400 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
                            الصحيح: {q.correct_answer}
                          </div>
                        )}
                      </div>
                    )}

                    {/* صح/خطأ */}
                    {q.question_type === 'true_false' && (
                      <div className="grid grid-cols-2 gap-3">
                        {['صح', 'خطأ'].map((opt) => {
                          const isStudent = q.student_answer === opt
                          const isCorrect = q.correct_answer === opt
                          return (
                            <div key={opt} className={`rounded-2xl border-2 p-4 text-center ${isCorrect ? 'border-emerald-400 bg-emerald-50' : isStudent ? 'border-rose-400 bg-rose-50' : 'border-slate-200'}`}>
                              <span className="text-2xl">{opt === 'صح' ? '✅' : '❌'}</span>
                              <p className="mt-1 font-bold text-sm">{opt}</p>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* الشرح */}
                    {q.explanation && (
                      <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm text-sky-900">
                        <p className="mb-1 text-xs font-bold uppercase text-sky-600">الشرح</p>
                        <p className="leading-relaxed">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* أزرار الإجراء */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={`/exam/${token}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" />
            إعادة الاختبار
          </a>
          <a
            href="/"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-800 py-3.5 font-bold text-white transition-colors hover:bg-slate-700"
          >
            <Home className="h-4 w-4" />
            الصفحة الرئيسية
          </a>
        </div>
      </div>
    </div>
  )
}
