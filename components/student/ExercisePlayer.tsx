'use client'

import { useState, useCallback } from 'react'
import {
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react'

interface Exercise {
  id: string
  question_type: 'mcq' | 'true_false' | 'fill_blank' | 'essay'
  question_text: string
  options: string[] | null
  correct_answer: string
  explanation: string | null
  difficulty_level: 'easy' | 'medium' | 'hard'
}

interface Props {
  exercises: Exercise[]
  lessonId: number
}

type AnswerState = {
  answer: string
  is_correct: boolean
  submitted: boolean
}

export function ExercisePlayer({ exercises, lessonId }: Props) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({})
  const [selected, setSelected] = useState<string>('')
  const [fillInput, setFillInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [finished, setFinished] = useState(false)

  const ex = exercises[current]
  const totalAnswered = Object.keys(answers).length
  const correct = Object.values(answers).filter((a) => a.is_correct).length
  const score = exercises.length > 0 ? Math.round((correct / exercises.length) * 100) : 0

  // ─── تحقق من الإجابة ──────────────────────────────────────────────────────
  function checkAnswer(answer: string): boolean {
    const correct = ex.correct_answer.trim().toLowerCase()
    const given = answer.trim().toLowerCase()
    if (ex.question_type === 'fill_blank') {
      return correct.includes(given) || given.includes(correct)
    }
    return given === correct
  }

  // ─── تسجيل الإجابة ────────────────────────────────────────────────────────
  async function submitAnswer(answer: string) {
    if (answers[current]?.submitted || submitting) return
    setSubmitting(true)

    const is_correct = checkAnswer(answer)

    try {
      await fetch(`/api/student/lessons/${lessonId}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_id: ex.id,
          answer,
          is_correct,
          time_spent_seconds: null,
        }),
      })
    } catch (_) {
      // تسجيل صامت في حالة الفشل
    }

    setAnswers((prev) => ({
      ...prev,
      [current]: { answer, is_correct, submitted: true },
    }))
    setSubmitting(false)
  }

  // ─── التنقل ───────────────────────────────────────────────────────────────
  function goNext() {
    if (current < exercises.length - 1) {
      setCurrent((c) => c + 1)
      setSelected('')
      setFillInput('')
    } else {
      setFinished(true)
    }
  }

  function goPrev() {
    if (current > 0) {
      setCurrent((c) => c - 1)
      setSelected('')
      setFillInput('')
    }
  }

  function restart() {
    setCurrent(0)
    setAnswers({})
    setSelected('')
    setFillInput('')
    setFinished(false)
  }

  // ─── شاشة النهاية ─────────────────────────────────────────────────────────
  if (finished || (exercises.length > 0 && totalAnswered === exercises.length && current === exercises.length - 1 && answers[current]?.submitted)) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center space-y-4">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-4xl">
          {score >= 80 ? '🏆' : score >= 60 ? '🎉' : '💪'}
        </div>

        <div>
          <h3 className="text-xl font-bold text-gray-900">
            {score >= 80 ? 'أداء ممتاز!' : score >= 60 ? 'جيد جداً!' : 'استمر في التحسن!'}
          </h3>
          <p className="text-muted-foreground mt-1">أنهيت تدريبات الدرس</p>
        </div>

        <div className="flex items-center justify-center gap-8 py-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{score}%</div>
            <div className="text-xs text-muted-foreground mt-1">درجتك</div>
          </div>
          <div className="h-12 w-px bg-border" />
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600">{correct}</div>
            <div className="text-xs text-muted-foreground mt-1">إجابة صحيحة</div>
          </div>
          <div className="h-12 w-px bg-border" />
          <div className="text-center">
            <div className="text-3xl font-bold text-rose-500">{exercises.length - correct}</div>
            <div className="text-xs text-muted-foreground mt-1">إجابة خاطئة</div>
          </div>
        </div>

        {/* نقاط XP */}
        {correct > 0 && (
          <div className="flex items-center justify-center gap-2 rounded-full bg-amber-50 px-5 py-2.5 text-sm font-bold text-amber-600 w-fit mx-auto">
            <Sparkles className="h-4 w-4" />
            +{correct * 5} نقطة XP مكتسبة
          </div>
        )}

        <button
          onClick={restart}
          className="flex items-center gap-2 mx-auto rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-gray-50 transition"
        >
          <RotateCcw className="h-4 w-4" />
          إعادة التدريب
        </button>
      </div>
    )
  }

  if (!ex) return null

  const currentAnswer = answers[current]
  const isSubmitted = currentAnswer?.submitted

  return (
    <div className="space-y-4">
      {/* شريط التقدم */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${((current + 1) / exercises.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {current + 1} / {exercises.length}
        </span>
      </div>

      {/* نقاط التدريبات */}
      <div className="flex gap-1.5">
        {exercises.map((_, i) => (
          <button
            key={i}
            onClick={() => { setCurrent(i); setSelected(''); setFillInput('') }}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              i === current
                ? 'bg-primary'
                : answers[i]?.is_correct
                ? 'bg-emerald-400'
                : answers[i]?.submitted
                ? 'bg-rose-400'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* بطاقة السؤال */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        {/* نوع السؤال والصعوبة */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
              ex.difficulty_level === 'easy'
                ? 'bg-emerald-50 text-emerald-700'
                : ex.difficulty_level === 'hard'
                ? 'bg-rose-50 text-rose-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            {ex.difficulty_level === 'easy' ? 'سهل' : ex.difficulty_level === 'hard' ? 'صعب' : 'متوسط'}
          </span>
          <span className="text-xs text-muted-foreground">
            {ex.question_type === 'mcq'
              ? 'اختيار من متعدد'
              : ex.question_type === 'true_false'
              ? 'صح أو خطأ'
              : ex.question_type === 'fill_blank'
              ? 'أكمل الفراغ'
              : 'سؤال مقالي'}
          </span>
        </div>

        {/* نص السؤال */}
        <p className="text-base font-semibold text-gray-900 leading-relaxed mb-6">
          {ex.question_text}
        </p>

        {/* ─── MCQ ─────────────────────────────────────────────────────────── */}
        {ex.question_type === 'mcq' && ex.options && (
          <div className="space-y-2.5">
            {ex.options.map((opt, i) => {
              const isSelected = selected === opt || currentAnswer?.answer === opt
              const isCorrect = opt === ex.correct_answer
              let style = 'border-border bg-gray-50 text-gray-700 hover:border-primary hover:bg-primary/5'

              if (isSubmitted) {
                if (isCorrect) style = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                else if (isSelected && !isCorrect) style = 'border-rose-400 bg-rose-50 text-rose-700'
                else style = 'border-border bg-gray-50 text-gray-400 opacity-60'
              } else if (isSelected) {
                style = 'border-primary bg-primary/10 text-primary font-bold'
              }

              return (
                <button
                  key={i}
                  disabled={isSubmitted || submitting}
                  onClick={() => setSelected(opt)}
                  className={`w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm text-right transition-all ${style}`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                      isSubmitted && isCorrect
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : isSubmitted && isSelected && !isCorrect
                        ? 'border-rose-400 bg-rose-400 text-white'
                        : isSelected
                        ? 'border-primary bg-primary text-white'
                        : 'border-current'
                    }`}
                  >
                    {['أ', 'ب', 'ج', 'د'][i]}
                  </span>
                  {opt}
                  {isSubmitted && isCorrect && <CheckCircle2 className="mr-auto h-4 w-4 text-emerald-500" />}
                  {isSubmitted && isSelected && !isCorrect && <XCircle className="mr-auto h-4 w-4 text-rose-400" />}
                </button>
              )
            })}
          </div>
        )}

        {/* ─── صح / خطأ ─────────────────────────────────────────────────────── */}
        {ex.question_type === 'true_false' && (
          <div className="flex gap-3">
            {['صح', 'خطأ'].map((opt) => {
              const isSelected = selected === opt || currentAnswer?.answer === opt
              const isCorrect = opt === ex.correct_answer
              let style = 'border-border bg-gray-50 text-gray-700 hover:border-primary'

              if (isSubmitted) {
                if (isCorrect) style = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                else if (isSelected) style = 'border-rose-400 bg-rose-50 text-rose-700'
                else style = 'border-border opacity-50'
              } else if (isSelected) {
                style = 'border-primary bg-primary/10 text-primary font-bold'
              }

              return (
                <button
                  key={opt}
                  disabled={isSubmitted || submitting}
                  onClick={() => setSelected(opt)}
                  className={`flex-1 rounded-2xl border-2 py-4 text-lg font-bold transition-all ${style}`}
                >
                  {opt === 'صح' ? '✓ صح' : '✗ خطأ'}
                </button>
              )
            })}
          </div>
        )}

        {/* ─── أكمل الفراغ ──────────────────────────────────────────────────── */}
        {ex.question_type === 'fill_blank' && (
          <div className="space-y-3">
            <input
              type="text"
              dir="rtl"
              placeholder="اكتب إجابتك هنا..."
              value={fillInput}
              onChange={(e) => setFillInput(e.target.value)}
              disabled={isSubmitted}
              className={`w-full rounded-xl border-2 px-4 py-3 text-sm focus:outline-none transition-colors ${
                isSubmitted
                  ? currentAnswer.is_correct
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-rose-400 bg-rose-50'
                  : 'border-border focus:border-primary'
              }`}
            />
            {isSubmitted && !currentAnswer.is_correct && (
              <div className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                الإجابة الصحيحة: <strong>{ex.correct_answer}</strong>
              </div>
            )}
          </div>
        )}

        {/* ─── سؤال مقالي ───────────────────────────────────────────────────── */}
        {ex.question_type === 'essay' && (
          <div className="space-y-3">
            <textarea
              dir="rtl"
              placeholder="اكتب إجابتك هنا..."
              value={fillInput}
              onChange={(e) => setFillInput(e.target.value)}
              disabled={isSubmitted}
              rows={4}
              className="w-full rounded-xl border-2 border-border px-4 py-3 text-sm focus:border-primary focus:outline-none resize-none"
            />
            {isSubmitted && (
              <div className="text-xs text-indigo-700 bg-indigo-50 rounded-lg px-3 py-2">
                نموذج الإجابة: <strong>{ex.correct_answer}</strong>
              </div>
            )}
          </div>
        )}

        {/* شرح الإجابة */}
        {isSubmitted && ex.explanation && (
          <div className="mt-4 flex gap-2 rounded-xl bg-slate-50 border border-border px-4 py-3">
            <span className="text-lg shrink-0">💡</span>
            <p className="text-xs text-slate-600 leading-relaxed">{ex.explanation}</p>
          </div>
        )}

        {/* نتيجة الإجابة */}
        {isSubmitted && (
          <div
            className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-3 font-bold ${
              currentAnswer.is_correct
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-700'
            }`}
          >
            {currentAnswer.is_correct ? (
              <>
                <CheckCircle2 className="h-5 w-5" />
                إجابة صحيحة! +5 نقطة XP
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5" />
                إجابة خاطئة — حاول التحسن في المرة القادمة
              </>
            )}
          </div>
        )}
      </div>

      {/* أزرار التحكم */}
      <div className="flex items-center justify-between">
        <button
          onClick={goPrev}
          disabled={current === 0}
          className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm text-muted-foreground transition hover:bg-gray-50 disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
          السابق
        </button>

        {!isSubmitted ? (
          <button
            onClick={() => {
              const ans =
                ex.question_type === 'mcq' || ex.question_type === 'true_false'
                  ? selected
                  : fillInput
              if (!ans.trim()) return
              submitAnswer(ans)
            }}
            disabled={
              submitting ||
              (ex.question_type === 'mcq' || ex.question_type === 'true_false'
                ? !selected
                : !fillInput.trim())
            }
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white transition hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            تحقق من الإجابة
          </button>
        ) : (
          <button
            onClick={goNext}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white transition hover:bg-primary/90"
          >
            {current < exercises.length - 1 ? (
              <>
                التالي
                <ChevronLeft className="h-4 w-4" />
              </>
            ) : (
              <>
                <Trophy className="h-4 w-4" />
                عرض النتيجة
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
