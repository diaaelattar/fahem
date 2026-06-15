'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  RotateCcw,
  Trophy,
} from 'lucide-react'
import { MathRenderer } from '@/components/ui/MathRenderer'
import { AIExplainButton } from '@/components/student/AIExplainButton'
import {
  getSubjectDirection,
  getSubjectTextAlignClass,
} from '@/lib/utils/subject-formatting'

interface WrongItem {
  id: string
  times_wrong: number
  times_correct_after: number
  is_mastered: boolean
  questions: {
    id: string
    question_type: string
    question_text: string
    options: string[] | null
    correct_answer: string
    explanation: string | null
    points: number
    difficulty_level: string | null
    context_passage?: string | null
    subjects: { id: string; name_ar: string; icon: string } | null
  }
}

interface Props {
  pendingQuestions: WrongItem[]
  masteredCount: number
  studentId: string
}

export function WrongAnswersClient({
  pendingQuestions,
  masteredCount,
  studentId,
}: Props) {
  const supabase = createClient() as any
  const [queue, setQueue] = useState(pendingQuestions)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [sessionScore, setSessionScore] = useState({ correct: 0, wrong: 0 })
  const [mastered, setMastered] = useState(masteredCount)
  const [finished, setFinished] = useState(false)
  const [fillInput, setFillInput] = useState('')
  const [isGrading, setIsGrading] = useState(false)
  const [feedbacks, setFeedbacks] = useState<Record<string, any>>({})

  const current = queue[currentIdx]

  const handleAnswer = async (answer: string) => {
    if (showAnswer || isGrading) return
    setSelected(answer)

    if (q?.question_type === 'essay' || q?.question_type === 'correction') {
      setIsGrading(true)
      try {
        const res = await fetch('/api/ai/grade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionText: q.question_text,
            idealAnswer: q.correct_answer,
            studentAnswer: answer,
            maxScore: q.points,
          }),
        })
        if (res.ok) {
          const gradingResult = await res.json()
          setFeedbacks((prev) => ({ ...prev, [q.id]: gradingResult }))

          await supabase.rpc('mark_wrong_answer_practiced', {
            p_student_id: studentId,
            p_question_id: q.id,
            p_correct: gradingResult.is_correct,
          })

          if (gradingResult.is_correct) {
            setSessionScore((s) => ({ ...s, correct: s.correct + 1 }))
            if (current.times_correct_after + 1 >= 2) {
              setMastered((m) => m + 1)
              setQueue((qu) =>
                qu.map((item, i) =>
                  i === currentIdx ? { ...item, is_mastered: true } : item
                )
              )
            }
          } else {
            setSessionScore((s) => ({ ...s, wrong: s.wrong + 1 }))
          }
        }
      } finally {
        setIsGrading(false)
        setShowAnswer(true)
      }
      return
    }

    setShowAnswer(true)
    const isCorrect =
      answer.trim().toLowerCase() ===
      current.questions.correct_answer.trim().toLowerCase()

    await supabase.rpc('mark_wrong_answer_practiced', {
      p_student_id: studentId,
      p_question_id: current.questions.id,
      p_correct: isCorrect,
    })

    if (isCorrect) {
      setSessionScore((s) => ({ ...s, correct: s.correct + 1 }))
      if (current.times_correct_after + 1 >= 2) {
        setMastered((m) => m + 1)
        setQueue((qu) =>
          qu.map((item, i) =>
            i === currentIdx ? { ...item, is_mastered: true } : item
          )
        )
      }
    } else {
      setSessionScore((s) => ({ ...s, wrong: s.wrong + 1 }))
    }
  }

  const handleFillSubmit = () => {
    if (!fillInput.trim()) return
    handleAnswer(fillInput.trim())
  }

  const handleNext = () => {
    if (currentIdx < queue.length - 1) {
      setCurrentIdx((i) => i + 1)
    } else {
      setFinished(true)
    }
    setSelected(null)
    setFillInput('')
    setShowAnswer(false)
  }

  const handleRestart = () => {
    setCurrentIdx(0)
    setSelected(null)
    setShowAnswer(false)
    setSessionScore({ correct: 0, wrong: 0 })
    setFinished(false)
  }

  // Finished Screen
  if (finished || queue.length === 0) {
    return (
      <div className="card-premium p-12 text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-amber-100">
          <Trophy className="h-14 w-14 text-amber-500" />
        </div>
        <h2 className="mb-2 text-2xl font-bold">انتهت جلسة المراجعة!</h2>
        <p className="mb-8 text-muted-foreground">
          أجبت صح على{' '}
          <strong className="text-green-600">{sessionScore.correct}</strong>{' '}
          سؤال وأخطأت في{' '}
          <strong className="text-red-500">{sessionScore.wrong}</strong> سؤال
        </p>
        <div className="mx-auto mb-8 grid max-w-sm grid-cols-2 gap-4">
          <div className="rounded-2xl bg-green-50 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{mastered}</div>
            <div className="text-xs text-muted-foreground">
              أسئلة أتقنتها الآن
            </div>
          </div>
          <div className="rounded-2xl bg-rose-50 p-4 text-center">
            <div className="text-2xl font-bold text-rose-500">
              {queue.filter((q) => !q.is_mastered).length}
            </div>
            <div className="text-xs text-muted-foreground">
              تحتاج تدريباً إضافياً
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-3">
          <button
            onClick={handleRestart}
            className="flex items-center gap-2 rounded-xl border border-border px-6 py-3 font-medium transition-colors hover:bg-muted"
          >
            <RotateCcw className="h-4 w-4" /> أعد المراجعة
          </button>
          <a
            href="/student/practice"
            className="rounded-xl bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary/90"
          >
            العودة للتدريب
          </a>
        </div>
      </div>
    )
  }

  const q = current?.questions
  const dir = getSubjectDirection(q?.subjects?.name_ar)
  const textAlign = getSubjectTextAlignClass(q?.subjects?.name_ar)

  return (
    <div className="space-y-6" dir={dir}>
      {/* Session Stats */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          السؤال {currentIdx + 1} من {queue.length}
        </span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-500 transition-all"
            style={{ width: `${((currentIdx + 1) / queue.length) * 100}%` }}
          />
        </div>
        <div className="flex gap-3 text-xs font-bold">
          <span className="text-green-600">✓ {sessionScore.correct}</span>
          <span className="text-red-500">✗ {sessionScore.wrong}</span>
        </div>
      </div>

      {/* Question Card */}
      <div className="card-premium p-8">
        {/* Meta */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {q?.subjects && (
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-bold text-indigo-700">
              {q.subjects.icon} {q.subjects.name_ar}
            </span>
          )}
          <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-bold text-rose-600">
            أخطأت {current.times_wrong}{' '}
            {current.times_wrong === 1 ? 'مرة' : 'مرات'}
          </span>
          {current.times_correct_after > 0 && (
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-600">
              ✓ صحّحتها {current.times_correct_after}{' '}
              {current.times_correct_after === 1 ? 'مرة' : 'مرات'}
            </span>
          )}
        </div>

        {/* Context Passage */}
        {q?.context_passage && (
          <div className="relative mb-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6 italic leading-relaxed text-indigo-950">
            <div className="absolute right-6 top-0 -translate-y-1/2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800 shadow-sm">
              القطعة المرجعية:
            </div>
            <MathRenderer
              text={q.context_passage}
              className={`text-lg ${textAlign}`}
              dir={dir}
            />
          </div>
        )}

        {/* Question Text */}
        <MathRenderer
          text={q?.question_text || ''}
          className={`mb-8 text-xl font-bold leading-relaxed ${textAlign}`}
          dir={dir}
        />

        {/* MCQ Options */}
        {q?.question_type === 'mcq' && q?.options && (
          <div className="space-y-3">
            {q.options.map((opt: string, i: number) => {
              const isSelected = selected === opt
              const isCorrect =
                opt.trim().toLowerCase() ===
                q.correct_answer?.trim().toLowerCase()
              let cls = `w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all font-medium cursor-pointer ${textAlign}`
              if (!showAnswer) {
                cls += isSelected
                  ? ' border-primary bg-primary/5'
                  : ' border-border hover:border-primary/40 hover:bg-muted/50'
              } else if (isCorrect) {
                cls += ' border-emerald-500 bg-emerald-50 text-emerald-800'
              } else if (isSelected && !isCorrect) {
                cls += ' border-rose-400 bg-rose-50 text-rose-800'
              } else {
                cls += ' border-border opacity-50'
              }
              return (
                <button
                  key={i}
                  className={cls}
                  onClick={() => handleAnswer(opt)}
                  disabled={showAnswer}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${showAnswer && isCorrect ? 'bg-emerald-500 text-white' : showAnswer && isSelected && !isCorrect ? 'bg-rose-500 text-white' : 'bg-muted text-muted-foreground'}`}
                  >
                    {['أ', 'ب', 'ج', 'د'][i]}
                  </span>
                  <MathRenderer
                    text={opt}
                    className={`flex-1 text-base ${textAlign}`}
                    dir={dir}
                  />
                  {showAnswer && isCorrect && (
                    <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
                  )}
                  {showAnswer && isSelected && !isCorrect && (
                    <XCircle className="h-5 w-5 shrink-0 text-rose-500" />
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* True/False */}
        {q?.question_type === 'true_false' && (
          <div className="grid grid-cols-2 gap-4">
            {['صح', 'خطأ'].map((opt) => {
              const isSelected = selected === opt
              const isCorrect = opt === q.correct_answer
              let cls =
                'flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all cursor-pointer'
              if (!showAnswer)
                cls += isSelected
                  ? ' border-primary bg-primary/5'
                  : ' border-border hover:border-primary/40'
              else if (isCorrect) cls += ' border-emerald-500 bg-emerald-50'
              else if (isSelected) cls += ' border-rose-400 bg-rose-50'
              else cls += ' border-border opacity-50'
              return (
                <button
                  key={opt}
                  className={cls}
                  onClick={() => handleAnswer(opt)}
                  disabled={showAnswer}
                >
                  <span className="mb-2 text-4xl">
                    {opt === 'صح' ? '✅' : '❌'}
                  </span>
                  <span className="font-bold">{opt}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Fill Blank / Essay / Correction */}
        {(q?.question_type === 'fill_blank' ||
          q?.question_type === 'essay' ||
          q?.question_type === 'correction') &&
          !showAnswer && (
            <div className="flex flex-col gap-3">
              {q?.question_type === 'fill_blank' ? (
                <input
                  type="text"
                  value={fillInput}
                  onChange={(e) => setFillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFillSubmit()}
                  placeholder="اكتب إجابتك هنا..."
                  className="w-full rounded-xl border-2 border-border px-4 py-3 text-base transition-colors focus:border-primary focus:outline-none"
                  autoFocus
                  disabled={isGrading}
                  dir={dir}
                />
              ) : (
                <textarea
                  value={fillInput}
                  onChange={(e) => setFillInput(e.target.value)}
                  placeholder="اكتب إجابتك هنا بوضوح..."
                  className="h-32 w-full resize-none rounded-xl border-2 border-border px-4 py-3 text-base transition-colors focus:border-primary focus:outline-none"
                  autoFocus
                  disabled={isGrading}
                  dir={dir}
                />
              )}
              <button
                onClick={handleFillSubmit}
                disabled={isGrading}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {isGrading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />{' '}
                    جاري التقييم...
                  </>
                ) : (
                  'تحقق من الإجابة'
                )}
              </button>
            </div>
          )}

        {q?.question_type === 'fill_blank' && showAnswer && (
          <div className="space-y-3">
            <div
              className={`flex items-center gap-2 rounded-xl border-2 px-4 py-3 font-bold ${selected === q.correct_answer ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-rose-400 bg-rose-50 text-rose-700'}`}
            >
              <span className="shrink-0">إجابتك:</span>{' '}
              <MathRenderer text={selected || ''} dir={dir} />
            </div>
            {selected !== q.correct_answer && (
              <div className="flex items-center gap-2 rounded-xl border-2 border-emerald-500 bg-emerald-50 px-4 py-3 font-bold text-emerald-700">
                <span className="shrink-0">الإجابة الصحيحة:</span>{' '}
                <MathRenderer text={q.correct_answer} dir={dir} />
              </div>
            )}
          </div>
        )}

        {(q?.question_type === 'essay' || q?.question_type === 'correction') &&
          showAnswer &&
          feedbacks[q.id] && (
            <div className="space-y-4">
              <div
                className={`rounded-xl border-2 px-5 py-4 ${feedbacks[q.id].is_correct ? 'border-emerald-500 bg-emerald-50' : 'border-rose-400 bg-rose-50'}`}
              >
                <div className="mb-2 flex items-center gap-2 font-bold">
                  {feedbacks[q.id].is_correct ? (
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-rose-500" />
                  )}
                  <span
                    className={
                      feedbacks[q.id].is_correct
                        ? 'text-emerald-800'
                        : 'text-rose-800'
                    }
                  >
                    الدرجة: {feedbacks[q.id].earned_score} / {q.points}
                  </span>
                </div>
                <p className="rounded-lg border border-border/50 bg-white/50 p-3 text-sm font-medium leading-relaxed text-foreground/80">
                  {feedbacks[q.id].feedback}
                </p>
              </div>

              <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/50 px-5 py-4">
                <span className="mb-2 block font-bold text-indigo-800">
                  الإجابة النموذجية:
                </span>
                <MathRenderer
                  text={q.correct_answer}
                  className={`text-sm leading-relaxed text-indigo-900 ${textAlign}`}
                  dir={dir}
                />
              </div>
            </div>
          )}

        {/* Explanation */}
        {showAnswer && q?.explanation && (
          <div className="mt-6 rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 to-indigo-50 p-5">
            <h4 className="mb-2 text-sm font-bold text-sky-800">
              💡 الشرح والتحليل
            </h4>
            <MathRenderer
              text={q.explanation}
              className={`text-sm leading-relaxed text-sky-900 ${textAlign}`}
              dir={dir}
            />
          </div>
        )}
        {/* AI Explain Helper */}
        {showAnswer && (
          <AIExplainButton
            questionId={q.id}
            questionText={q.question_text}
            correctAnswer={q.correct_answer}
            studentAnswer={selected || fillInput || undefined}
            subject={q.subjects?.name_ar || undefined}
          />
        )}
      </div>

      {/* Next Button */}
      {showAnswer && (
        <div className="flex justify-center">
          <button
            onClick={handleNext}
            className="flex items-center gap-2 rounded-2xl bg-primary px-8 py-3 text-lg font-bold text-white transition-all hover:scale-105 hover:bg-primary/90"
          >
            {currentIdx < queue.length - 1 ? (
              <>
                <ChevronLeft className="h-5 w-5" /> السؤال التالي
              </>
            ) : (
              <>
                <Trophy className="h-5 w-5" /> انهِ الجلسة
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
