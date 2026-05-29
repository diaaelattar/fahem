'use client'
// components/teacher/GuestExamInterface.tsx
// واجهة حل الاختبار للضيف:
// مؤقت تنازلي + حفظ تلقائي 30ث + شبكة أسئلة + Confirm Dialog + تسليم

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Clock,
  ChevronRight,
  ChevronLeft,
  Send,
  AlertTriangle,
  CheckCircle2,
  Circle,
  X,
  Loader2,
  LayoutGrid,
  Save,
} from 'lucide-react'

interface Question {
  id: string
  question_type: 'mcq' | 'true_false' | 'fill_blank'
  question_text: string
  context_passage?: string
  options?: string[]
  points: number
  question_image_url?: string
  question_order: number
}

interface Props {
  attemptId: string
  examTitle: string
  durationMinutes: number
  questions: Question[]
  guestName: string
  onSubmit: (answers: Record<string, string>) => void
  isSubmitting: boolean
}

export function GuestExamInterface({
  attemptId,
  examTitle,
  durationMinutes,
  questions,
  guestName,
  onSubmit,
  isSubmitting,
}: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentIdx, setCurrentIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const answersRef = useRef(answers)
  answersRef.current = answers

  const currentQuestion = questions[currentIdx]
  const answeredCount = Object.keys(answers).filter((k) => answers[k] !== '').length
  const skippedCount = questions.length - answeredCount

  // ── المؤقت التنازلي ───────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft <= 0) {
      handleForceSubmit()
      return
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft])

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const isWarning = timeLeft <= 300 // أقل من 5 دقائق
  const isDanger = timeLeft <= 60   // أقل من دقيقة

  // ── الحفظ التلقائي كل 30 ثانية ───────────────────────────────────────
  const autoSave = useCallback(async () => {
    if (!attemptId) return
    setIsSaving(true)
    try {
      await fetch('/api/exam/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'autosave',
          attemptId,
          answers: answersRef.current,
        }),
      })
      setLastSaved(new Date())
    } catch {
      // تجاهل أخطاء الحفظ التلقائي
    } finally {
      setIsSaving(false)
    }
  }, [attemptId])

  useEffect(() => {
    const interval = setInterval(autoSave, 30_000)
    return () => clearInterval(interval)
  }, [autoSave])

  // ── التسليم القسري (انتهاء الوقت) ────────────────────────────────────
  const handleForceSubmit = useCallback(() => {
    onSubmit(answersRef.current)
  }, [onSubmit])

  // ── التسليم الإرادي ───────────────────────────────────────────────────
  const handleSubmit = () => {
    setShowConfirm(false)
    onSubmit(answers)
  }

  // ── تسجيل إجابة ──────────────────────────────────────────────────────
  const setAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  // ── التنقل بين الأسئلة ───────────────────────────────────────────────
  const goTo = (idx: number) => {
    if (idx >= 0 && idx < questions.length) {
      setCurrentIdx(idx)
      setShowGrid(false)
    }
  }

  const getQuestionStatus = (q: Question) => {
    const ans = answers[q.id]
    if (ans && ans !== '') return 'answered'
    return 'unanswered'
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50" dir="rtl">
      {/* ── شريط العنوان والمؤقت ─────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3">
          {/* اسم الضيف */}
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs text-slate-500">
              الطالب: <span className="font-bold text-slate-700">{guestName}</span>
            </p>
            <p className="truncate text-sm font-bold text-slate-800">{examTitle}</p>
          </div>

          {/* حالة الحفظ */}
          <div className="hidden items-center gap-1 text-xs text-slate-400 sm:flex">
            {isSaving ? (
              <>
                <Save className="h-3 w-3 animate-pulse" />
                <span>جاري الحفظ...</span>
              </>
            ) : lastSaved ? (
              <>
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                <span>تم الحفظ</span>
              </>
            ) : null}
          </div>

          {/* المؤقت */}
          <div
            className={`flex items-center gap-2 rounded-2xl px-4 py-2 font-mono text-lg font-black transition-colors ${
              isDanger
                ? 'bg-rose-100 text-rose-600 animate-pulse'
                : isWarning
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>

          {/* زر الشبكة */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-100"
            title="شبكة الأسئلة"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>

        {/* شريط التقدم */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </header>

      {/* ── شبكة الأسئلة (Drawer) ────────────────────────────────────── */}
      {showGrid && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">شبكة الأسئلة</h3>
              <button
                onClick={() => setShowGrid(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-4 flex gap-4 text-xs">
              <span className="flex items-center gap-1">
                <span className="h-4 w-4 rounded-md bg-emerald-500 inline-block" />
                أُجيب ({answeredCount})
              </span>
              <span className="flex items-center gap-1">
                <span className="h-4 w-4 rounded-md border border-slate-300 bg-white inline-block" />
                لم يُجب ({skippedCount})
              </span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => goTo(idx)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-all ${
                    idx === currentIdx
                      ? 'bg-indigo-600 text-white scale-110 shadow-md'
                      : getQuestionStatus(q) === 'answered'
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowGrid(false)}
              className="mt-5 w-full rounded-2xl bg-slate-100 py-3 font-bold text-slate-600 transition-colors hover:bg-slate-200"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* ── محتوى السؤال ─────────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {/* معلومات السؤال */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-sm font-black text-white">
              {currentIdx + 1}
            </span>
            <span className="text-sm text-slate-500">من {questions.length}</span>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
            {currentQuestion?.points}{' '}
            {currentQuestion?.points === 1 ? 'درجة' : 'درجات'}
          </span>
        </div>

        {/* بطاقة السؤال */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* صورة السؤال */}
          {currentQuestion?.question_image_url && (
            <img
              src={currentQuestion.question_image_url}
              alt="صورة السؤال"
              className="mb-5 max-h-64 w-full rounded-2xl object-contain border border-slate-100"
            />
          )}

          {/* النص السياقي */}
          {currentQuestion?.context_passage && (
            <div className="relative mb-5 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 text-indigo-950">
              <div className="absolute right-5 top-0 -translate-y-1/2 rounded-full bg-indigo-100 px-3 py-0.5 text-[10px] font-bold text-indigo-800">
                القطعة المرجعية
              </div>
              <p className="text-base leading-loose">{currentQuestion.context_passage}</p>
            </div>
          )}

          {/* نص السؤال */}
          <p className="mb-6 text-lg font-bold leading-relaxed text-slate-800">
            {currentQuestion?.question_text}
          </p>

          {/* ── خيارات MCQ ────────────────────────────────────────────── */}
          {currentQuestion?.question_type === 'mcq' && currentQuestion.options && (
            <div className="grid gap-3 sm:grid-cols-2">
              {currentQuestion.options.map((opt, i) => {
                const isSelected = answers[currentQuestion.id] === opt
                return (
                  <button
                    key={i}
                    onClick={() => setAnswer(currentQuestion.id, opt)}
                    className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-right transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                        isSelected
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {['أ', 'ب', 'ج', 'د'][i]}
                    </div>
                    <span className={`flex-1 text-sm font-medium ${isSelected ? 'text-emerald-800' : 'text-slate-700'}`}>
                      {opt}
                    </span>
                    {isSelected ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                    ) : (
                      <Circle className="h-5 w-5 shrink-0 text-slate-300" />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* ── خيارات صح/خطأ ─────────────────────────────────────────── */}
          {currentQuestion?.question_type === 'true_false' && (
            <div className="grid grid-cols-2 gap-4">
              {['صح', 'خطأ'].map((opt) => {
                const isSelected = answers[currentQuestion.id] === opt
                return (
                  <button
                    key={opt}
                    onClick={() => setAnswer(currentQuestion.id, opt)}
                    className={`flex flex-col items-center gap-3 rounded-3xl border-2 p-6 transition-all ${
                      isSelected
                        ? opt === 'صح'
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-rose-500 bg-rose-50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-4xl">{opt === 'صح' ? '✅' : '❌'}</span>
                    <span className={`font-bold ${isSelected ? (opt === 'صح' ? 'text-emerald-700' : 'text-rose-700') : 'text-slate-700'}`}>
                      {opt}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* ── إملاء الفراغ ──────────────────────────────────────────── */}
          {currentQuestion?.question_type === 'fill_blank' && (
            <input
              type="text"
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
              placeholder="اكتب إجابتك هنا..."
              className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-5 py-4 text-right font-bold text-slate-800 outline-none transition-all focus:border-emerald-400 focus:bg-white"
            />
          )}
        </div>

        {/* ── التنقل ───────────────────────────────────────────────────── */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={() => goTo(currentIdx - 1)}
            disabled={currentIdx === 0}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
            السابق
          </button>

          {/* ملخص الإجابة */}
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-bold text-emerald-600">{answeredCount}</span>
            <span>/</span>
            <span>{questions.length}</span>
          </div>

          {currentIdx < questions.length - 1 ? (
            <button
              onClick={() => goTo(currentIdx + 1)}
              className="flex items-center gap-2 rounded-2xl bg-slate-800 px-5 py-3 font-bold text-white shadow-sm transition-all hover:bg-slate-700"
            >
              التالي
              <ChevronLeft className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700"
            >
              <Send className="h-4 w-4" />
              تسليم الاختبار
            </button>
          )}
        </div>

        {/* زر التسليم الثابت */}
        {currentIdx < questions.length - 1 && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setShowConfirm(true)}
              className="text-sm font-bold text-slate-400 underline underline-offset-2 hover:text-emerald-600 transition-colors"
            >
              تسليم الاختبار الآن
            </button>
          </div>
        )}
      </main>

      {/* ── Confirm Dialog ───────────────────────────────────────────── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="mb-2 text-xl font-black text-slate-800">
              هل أنت متأكد من التسليم؟
            </h3>
            <p className="mb-2 text-sm text-slate-500">
              أجبت على{' '}
              <span className="font-bold text-emerald-600">{answeredCount}</span>{' '}
              من{' '}
              <span className="font-bold">{questions.length}</span> سؤال
            </p>
            {skippedCount > 0 && (
              <p className="mb-6 text-sm font-bold text-amber-600">
                ⚠️ تركت {skippedCount} سؤال بدون إجابة
              </p>
            )}
            {skippedCount === 0 && (
              <p className="mb-6 text-sm font-bold text-emerald-600">
                ✅ أجبت على جميع الأسئلة
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-2xl border border-slate-200 py-3 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                العودة للمراجعة
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 font-bold text-white shadow-md hover:bg-emerald-700 transition-colors disabled:opacity-70"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                تأكيد التسليم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
