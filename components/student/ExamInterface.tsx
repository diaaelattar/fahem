'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Clock,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Send,
  AlertTriangle,
  Camera,
  Keyboard,
  Loader2,
  Eye,
} from 'lucide-react'
import { MathRenderer } from '@/components/ui/MathRenderer'
import { useExamStore } from '@/lib/store/exam-store'
import { AIExplainButton } from '@/components/student/AIExplainButton'
import { MathLiveInput } from '@/components/ui/MathLiveInput'
import { Calculator } from 'lucide-react'
import { HandwritingUploader } from '@/components/shared/HandwritingUploader'
import { ExamProctoring } from '@/components/student/ExamProctoring'
import {
  getSubjectDirection,
  getSubjectTextAlignClass,
} from '@/lib/utils/subject-formatting'
import { submitExamSafely } from '@/lib/utils/exam-submit'

interface Question {
  id: string
  question_type: 'mcq' | 'true_false' | 'fill_blank' | 'essay' | 'correction'
  question_text: string
  question_image_url?: string | null
  image_position?: 'top' | 'bottom' | 'right' | 'left' | null
  options: string[] | null
  correct_answer?: string
  explanation?: string
  points: number
  context_passage?: string | null
}

interface ExamData {
  id: string
  title: string
  duration_minutes: number
  total_points: number
  passing_score: number | null
  show_results_immediately: boolean
  instructions: string | null
  subjects?: { name_ar: string } | null
}

export function ExamInterface({
  exam,
  questions,
  attemptId,
  isPreview = false,
}: {
  exam: ExamData
  questions: Question[]
  attemptId: string
  isPreview?: boolean
}) {
  const router = useRouter()
  const supabase = createClient() as any
  const [currentIdx, setCurrentIdx] = useState(0)

  const [isHydrated, setIsHydrated] = useState(false)
  useEffect(() => {
    setIsHydrated(useExamStore.persist.hasHydrated())
    const unsub = useExamStore.persist.onFinishHydration(() => {
      setIsHydrated(true)
    })
    return () => unsub()
  }, [])

  const {
    answers,
    setAnswer,
    timeRemainingSeconds,
    tickTime,
    startExam,
    submitExam,
    isSubmitting: storeSubmitting,
    clearSession,
  } = useExamStore()

  // --- Determine text direction ---
  const subjectName = exam.subjects?.name_ar || ''
  const dir = getSubjectDirection(subjectName)
  const isRTL = dir === 'rtl'
  const textAlign = getSubjectTextAlignClass(subjectName)

  // Initialize store if empty
  useEffect(() => {
    if (!isHydrated) return
    if (useExamStore.getState().attemptId !== attemptId) {
      startExam(exam.id, attemptId, exam.duration_minutes * 60)
    }
  }, [exam.id, attemptId, exam.duration_minutes, startExam, isHydrated])

  // --- Grouping Logic ---
  const groups: {
    passage: string | null
    questions: Question[]
    originalIndexes: number[]
  }[] = []
  const passageToGroupIndex = new Map<string, number>()

  questions.forEach((q, idx) => {
    if (q.context_passage) {
      if (passageToGroupIndex.has(q.context_passage)) {
        const gIdx = passageToGroupIndex.get(q.context_passage)!
        groups[gIdx].questions.push(q)
        groups[gIdx].originalIndexes.push(idx)
      } else {
        passageToGroupIndex.set(q.context_passage, groups.length)
        groups.push({
          passage: q.context_passage,
          questions: [q],
          originalIndexes: [idx],
        })
      }
    } else {
      groups.push({ passage: null, questions: [q], originalIndexes: [idx] })
    }
  })

  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [immediateFeedback, setImmediateFeedback] = useState<
    Record<string, boolean>
  >({})
  const [showMath, setShowMath] = useState(false)

  // ── Image Answer State ──────────────────────────────
  // 'text' = كتابة نصية، 'image' = رفع صورة
  const [answerMode, setAnswerMode] = useState<
    Record<string, 'text' | 'image'>
  >({})
  // imageAnswers: questionId → uploaded image URL
  const [imageAnswers, setImageAnswers] = useState<Record<string, string>>({})
  // AI vision grading state
  const [visionGrading, setVisionGrading] = useState<
    Record<
      string,
      {
        loading: boolean
        result: {
          earned_score: number
          feedback: string
          extracted_text: string
          is_correct: boolean
        } | null
        error: string | null
      }
    >
  >({})

  // Reset math mode when changing questions
  useEffect(() => {
    setShowMath(false)
  }, [currentIdx])

  // Helper: get current answer mode for a question
  const getMode = (qId: string) => answerMode[qId] || 'text'

  // Handle image uploaded for a question
  const handleImageUploaded = useCallback(
    (qId: string, imageUrl: string, q: Question) => {
      setImageAnswers((prev) => ({ ...prev, [qId]: imageUrl }))
      // Store a marker in answers so the question is counted as "answered"
      setAnswer(qId, `[image:${imageUrl}]`)

      // If practice mode: immediately run AI vision grading
      if (exam.show_results_immediately && q.correct_answer) {
        setVisionGrading((prev) => ({
          ...prev,
          [qId]: { loading: true, result: null, error: null },
        }))
        fetch('/api/ai/grade-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionText: q.question_text,
            idealAnswer: q.correct_answer,
            imageUrl,
            maxScore: q.points,
            attemptId,
            questionId: qId,
          }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.success) {
              setVisionGrading((prev) => ({
                ...prev,
                [qId]: { loading: false, result: data, error: null },
              }))
              setImmediateFeedback((prev) => ({ ...prev, [qId]: true }))
            } else {
              setVisionGrading((prev) => ({
                ...prev,
                [qId]: {
                  loading: false,
                  result: null,
                  error: data.error || 'فشل التقييم',
                },
              }))
            }
          })
          .catch((err) => {
            setVisionGrading((prev) => ({
              ...prev,
              [qId]: { loading: false, result: null, error: err.message },
            }))
          })
      }
    },
    [exam.show_results_immediately, setAnswer, attemptId]
  )

  // Handle image removed
  const handleImageRemoved = useCallback(
    (qId: string) => {
      setImageAnswers((prev) => {
        const n = { ...prev }
        delete n[qId]
        return n
      })
      setAnswer(qId, '')
      setVisionGrading((prev) => {
        const n = { ...prev }
        delete n[qId]
        return n
      })
      setImmediateFeedback((prev) => {
        const n = { ...prev }
        delete n[qId]
        return n
      })
    },
    [setAnswer]
  )

  // Strip LaTeX, commas inside numbers (thousands only), extra spaces
  const normalizeMath = (text: string): string => {
    if (!text) return ''
    return text
      .replace(/\$+/g, '') // remove $ delimiters
      .replace(/\\text\{([^}]*)\}/g, '$1') // \text{x} → x
      .replace(/\\[a-zA-Z]+\s*/g, '') // remove LaTeX commands
      .replace(/(\d),(\d{3})(?=[^\d]|$)/g, '$1$2') // thousands ONLY: 5,000 → 5000  (NOT 9,81)
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
  }

  // Extract all distinct numbers from a string (e.g. "side=9 cm area=81" → [9, 81])
  const extractNumbers = (text: string): number[] => {
    const clean = normalizeMath(text)
    const matches = clean.match(/\d+(\.\d+)?/g) || []
    return Array.from(new Set(matches.map(Number)))
  }

  // Extract the final result of an equation (the part after last '=')
  const extractEquationResult = (text: string): string | null => {
    const clean = normalizeMath(text)
    const parts = clean.split('=')
    if (parts.length >= 2) return parts[parts.length - 1].trim()
    return null
  }

  const normalizeArabic = (text: string) => {
    if (!text) return ''
    return text
      .trim()
      .toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[\u064B-\u065F]/g, '')
      .replace(/[،\-_/\\.:؛"']/g, ' ')
      .replace(/\s+/g, ' ')
  }

  const checkAnswer = (
    studentAns: string,
    correctAns: string,
    type: string
  ): boolean => {
    if (!studentAns || !correctAns) return false

    // True/False comparison
    if (type === 'true_false') {
      const isSTrue =
        studentAns === '\u0635\u062d' || studentAns.toLowerCase() === 'true'
      const isCTrue =
        correctAns === '\u0635\u062d' || correctAns.toLowerCase() === 'true'
      const isSFalse =
        studentAns === '\u062e\u0637\u0623' ||
        studentAns.toLowerCase() === 'false'
      const isCFalse =
        correctAns === '\u062e\u0637\u0623' ||
        correctAns.toLowerCase() === 'false'
      return (isSTrue && isCTrue) || (isSFalse && isCFalse)
    }

    // ── Math-aware comparison ──
    const ms = normalizeMath(studentAns)
    const mc = normalizeMath(correctAns)

    // Exact match after normalization
    if (ms === mc) return true
    // Ignore all spaces: "7+60+400" == "7 + 60 + 400"
    if (ms.replace(/\s/g, '') === mc.replace(/\s/g, '')) return true

    // Equation result: student writes "\frac{35}{5}=7", correct is "7"
    const studentResult = extractEquationResult(studentAns)
    if (studentResult && studentResult === mc) return true
    const srNum = Number(studentResult)
    const crNum = Number(mc.replace(/[^\d.]/g, ''))
    if (
      studentResult &&
      !isNaN(srNum) &&
      !isNaN(crNum) &&
      srNum > 0 &&
      Math.abs(srNum - crNum) < 1e-9
    )
      return true

    // Key-numbers set: "9,81" vs "$9$ cm area=$81$" → both have {9,81}
    const correctNums = extractNumbers(correctAns)
    if (correctNums.length >= 2) {
      const studentNums = extractNumbers(studentAns)
      if (correctNums.every((n) => studentNums.includes(n))) return true
    }

    // Numeric-core: "10" matches "10 trees"
    const numCoreS = ms.match(/^[\d./+\-\s\u00d7\u00f7*]+/)?.[0]?.trim()
    const numCoreC = mc.match(/^[\d./+\-\s\u00d7\u00f7*]+/)?.[0]?.trim()
    if (
      numCoreS &&
      numCoreC &&
      numCoreS.replace(/\s/g, '') === numCoreC.replace(/\s/g, '')
    )
      return true

    // Numeric equivalence: 1/2 == 0.5
    const numS = Number(ms.replace(/[^\d.]/g, ''))
    const numC = Number(mc.replace(/[^\d.]/g, ''))
    if (
      !isNaN(numS) &&
      !isNaN(numC) &&
      numS > 0 &&
      Math.abs(numS - numC) < 1e-9
    )
      return true

    // Arabic text comparison
    const normStudent = normalizeArabic(studentAns)
    const normCorrect = normalizeArabic(correctAns)

    if (type === 'mcq') return normStudent === normCorrect

    if (normStudent === normCorrect) return true
    if (normStudent.length >= 3 && normCorrect.includes(normStudent))
      return true
    if (normCorrect.length >= 3 && normStudent.includes(normCorrect))
      return true

    const sw = normStudent.split(/\s+/).filter((w) => w.length >= 2)
    const cw = normCorrect.split(/\s+/).filter((w) => w.length >= 2)
    if (sw.length > 0 && cw.length > 0) {
      const common = cw.filter((w) => sw.includes(w))
      if (sw.length <= 2 && common.length === sw.length) return true
      if (common.length / cw.length >= 0.4 || common.length / sw.length >= 0.5)
        return true
    }

    return false
  }

  const getDisplayCorrectAnswer = (correctAns: string, type: string) => {
    if (!correctAns) return ''
    if (type === 'true_false') {
      if (correctAns.toLowerCase() === 'true' || correctAns === 'صح')
        return 'صح'
      if (correctAns.toLowerCase() === 'false' || correctAns === 'خطأ')
        return 'خطأ'
    }
    return correctAns
  }

  const handleSubmit = useCallback(async () => {
    if (storeSubmitting || submitted) return
    submitExam() // sets isSubmitting to true in store

    if (isPreview) {
      // Mock grading for preview mode
      let correct = 0
      Object.entries(answers).forEach(([qId, ans]) => {
        const q = questions.find((q) => q.id === qId)
        if (q && q.correct_answer) {
          if (checkAnswer(ans as string, q.correct_answer, q.question_type))
            correct += q.points
        }
      })
      setResult({
        is_passed: correct >= (exam.passing_score || 0),
        score: correct,
        total: exam.total_points,
        percentage:
          exam.total_points > 0
            ? Math.round((correct / exam.total_points) * 100)
            : 0,
      })
      setSubmitted(true)
      clearSession()
      return
    }

    try {
      const gradingResult = await submitExamSafely({
        attemptId,
        answers: answers as Record<string, string>,
        imageAnswers,
      })

      if (!gradingResult.success) {
        throw new Error(gradingResult.error || 'فشل التقييم')
      }

      setResult(gradingResult)
      setSubmitted(true)
      clearSession() // clear local storage
    } catch (err: any) {
      alert('حدث خطأ أثناء تسليم الاختبار: ' + err.message)
    }
  }, [
    answers,
    imageAnswers,
    attemptId,
    exam.id,
    exam.passing_score,
    storeSubmitting,
    submitted,
    supabase,
    submitExam,
    clearSession,
    isPreview,
    questions,
    checkAnswer,
  ])

  // Countdown timer
  useEffect(() => {
    if (submitted) return
    const interval = setInterval(() => {
      tickTime()
      if (useExamStore.getState().timeRemainingSeconds === 0) {
        clearInterval(interval)
        handleSubmit()
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [submitted, handleSubmit, tickTime])

  // Auto-save every 30 seconds
  useEffect(() => {
    if (submitted || Object.keys(answers).length === 0 || isPreview) return
    const interval = setInterval(() => {
      supabase.from('exam_attempts').update({ answers }).eq('id', attemptId)
    }, 30000)
    return () => clearInterval(interval)
  }, [answers, attemptId, submitted, supabase, isPreview])

  const formatTime = (secs: number | null) => {
    if (secs === null || secs < 0) return '--:--'
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const answeredCount = Object.keys(answers).length
  const progress = (answeredCount / questions.length) * 100

  if (questions.length === 0) {
    return (
      <div className="mx-auto mt-10 max-w-2xl rounded-3xl border border-border bg-white py-20 text-center">
        <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-yellow-500" />
        <h2 className="mb-2 text-2xl font-bold">عفواً، لا توجد أسئلة معتمدة</h2>
        <p className="mb-8 text-muted-foreground">
          هذا الاختبار لا يحتوي على أسئلة معتمدة من قبل المعلم حالياً.
        </p>
        <a
          href="/student/exams"
          className="rounded-xl bg-primary px-8 py-3 font-medium text-white"
        >
          العودة للاختبارات
        </a>
      </div>
    )
  }

  const currentGroup = groups[currentIdx] ?? groups[0]

  // Guard: should never happen but prevents blank-screen crashes
  if (!currentGroup) return null

  const handleAnswer = (qId: string, value: string, qType: string) => {
    // If immediate feedback is on and already answered/checked, prevent changing answer
    if (exam.show_results_immediately && immediateFeedback[qId]) return

    setAnswer(qId, value)

    // Auto-advance logic for MCQ and TF - only if it's a single question group
    if (
      currentGroup.questions.length === 1 &&
      qType !== 'fill_blank' &&
      qType !== 'essay' &&
      qType !== 'correction'
    ) {
      if (exam.show_results_immediately) {
        setImmediateFeedback((prev) => ({ ...prev, [qId]: true }))
      } else {
        setTimeout(() => {
          if (currentIdx < groups.length - 1) {
            setCurrentIdx((prev) => prev + 1)
          }
        }, 500)
      }
    }
  }

  const submitTextAnswer = (qId: string) => {
    if (exam.show_results_immediately && answers[qId]) {
      setImmediateFeedback((prev) => ({ ...prev, [qId]: true }))
    }
  }

  const handleMathInsert = (qId: string, symbol: string) => {
    const currentVal = answers[qId] || ''
    handleAnswer(qId, (currentVal as string) + symbol, '')
  }

  if (submitted && result) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <div
          className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full ${result.is_passed ? 'bg-green-100' : 'bg-red-100'}`}
        >
          {result.is_passed ? (
            <CheckCircle className="h-14 w-14 text-green-600" />
          ) : (
            <XCircle className="h-14 w-14 text-red-500" />
          )}
        </div>
        <h2 className="mb-2 font-display text-3xl font-bold">
          {result.is_passed
            ? '🎉 تهانينا! نجحت في الاختبار'
            : '💪 حاول مرة أخرى'}
        </h2>
        <p className="mb-8 text-muted-foreground">
          {result.is_passed
            ? 'أحسنت! لقد اجتزت الاختبار بنجاح'
            : 'لم تحقق درجة النجاح هذه المرة، لكن يمكنك المحاولة مجدداً'}
        </p>

        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border bg-white p-5">
            <div className="mb-1 text-4xl font-bold text-primary">
              {result.percentage?.toFixed(0)}٪
            </div>
            <div className="text-sm text-muted-foreground">النسبة المئوية</div>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5">
            <div className="mb-1 text-4xl font-bold text-foreground">
              {result.score}/{result.total}
            </div>
            <div className="text-sm text-muted-foreground">الدرجة المحققة</div>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5">
            <div
              className={`mb-1 text-4xl font-bold ${result.is_passed ? 'text-green-600' : 'text-red-500'}`}
            >
              {result.is_passed ? 'ناجح' : 'راسب'}
            </div>
            <div className="text-sm text-muted-foreground">النتيجة</div>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <a
            href={`/student/results/${attemptId}`}
            className="rounded-xl bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary/90"
          >
            عرض التفاصيل الكاملة
          </a>
          <a
            href="/student/dashboard"
            className="rounded-xl border border-border px-6 py-3 font-medium transition-colors hover:bg-muted"
          >
            العودة للرئيسية
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl" dir={dir}>
      {!isPreview && <ExamProctoring attemptId={attemptId} />}
      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
            <h3 className="mb-2 text-center text-xl font-bold">
              إنهاء الاختبار؟
            </h3>
            <p className="mb-2 text-center text-sm text-muted-foreground">
              أجبت على <strong>{answeredCount}</strong> من{' '}
              <strong>{questions.length}</strong> سؤال
            </p>
            {answeredCount < questions.length && (
              <p className="mb-6 text-center text-sm text-yellow-600">
                ⚠️ لديك {questions.length - answeredCount} سؤال لم تجب عليه
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-xl border border-border py-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                العودة للاختبار
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false)
                  handleSubmit()
                }}
                disabled={storeSubmitting}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {storeSubmitting ? 'جاري التسليم...' : 'تسليم الاختبار'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-4 z-10 mb-5 rounded-2xl border border-border bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="line-clamp-1 text-lg font-bold">{exam.title}</h1>
          <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 font-mono font-bold text-slate-700">
            <Clock className="h-5 w-5 text-slate-400" />
            {formatTime(timeRemainingSeconds)}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            مجموعة {currentIdx + 1}/{groups.length}
          </span>
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            ({answeredCount} من {questions.length} مُجاب)
          </span>
        </div>
      </div>

      {/* Group Content */}
      <div className="mb-5 space-y-6">
        {currentGroup.passage && (
          <div className="relative mb-8 rounded-xl border border-indigo-100 bg-indigo-50 p-5 italic text-indigo-900">
            <div className="absolute right-5 top-0 -translate-y-1/2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800 shadow-sm">
              اقرأ القطعة التالية، ثم أجب عن الأسئلة المرتبطة بها:
            </div>
            <MathRenderer
              text={currentGroup.passage}
              className="text-base"
              dir={dir}
            />
          </div>
        )}

        {currentGroup.questions.map((currentQ, qIndexWithinGroup) => {
          const globalQIndex = currentGroup.originalIndexes[qIndexWithinGroup]
          return (
            <div key={currentQ.id} className="question-card">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
                  {globalQIndex + 1}
                </span>
                <span className="text-sm text-muted-foreground">
                  {(currentQ as any)?.points || 0}{' '}
                  {(currentQ as any)?.points === 1 ? 'درجة' : 'درجات'}
                </span>
              </div>

              <div className="mb-6">
                <div
                  className={`flex ${
                    currentQ.image_position === 'top'
                      ? 'flex-col-reverse'
                      : currentQ.image_position === 'right'
                        ? 'flex-row-reverse items-center gap-6'
                        : currentQ.image_position === 'left'
                          ? 'flex-row items-center gap-6'
                          : 'flex-col' // bottom (default)
                  }`}
                >
                  <div className="flex-1">
                    <MathRenderer
                      text={(currentQ.question_text ?? '')
                        .replace(/^(\(?\d+[\)\.\-\s]\s*)/, '')
                        .trim()}
                      className={`text-xl font-medium leading-relaxed`}
                      dir={dir}
                    />
                  </div>

                  {currentQ.question_image_url && (
                    <div
                      className={`shrink-0 overflow-hidden rounded-xl border border-border bg-muted/30 ${
                        currentQ.image_position === 'right' ||
                        currentQ.image_position === 'left'
                          ? 'w-1/3'
                          : 'mt-4 w-full'
                      }`}
                    >
                      <img
                        src={currentQ.question_image_url}
                        alt="صورة السؤال"
                        className="max-h-72 w-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* MCQ Options */}
              {currentQ.question_type === 'mcq' && currentQ.options && (
                <div className="space-y-3">
                  {currentQ.options.map((opt, i) => {
                    const isSelected = answers[currentQ.id] === opt
                    const isCorrectOpt = checkAnswer(
                      opt,
                      currentQ.correct_answer || '',
                      'mcq'
                    )
                    const showFeedback =
                      exam.show_results_immediately &&
                      immediateFeedback[currentQ.id]

                    let btnClass = `answer-option w-full ${textAlign} ${isSelected ? 'selected' : ''}`
                    if (showFeedback) {
                      if (isCorrectOpt)
                        btnClass +=
                          ' !bg-green-100 !border-green-500 !text-green-800'
                      else if (isSelected)
                        btnClass += ' !bg-red-100 !border-red-500 !text-red-800'
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => handleAnswer(currentQ.id, opt, 'mcq')}
                        className={btnClass}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-current text-sm font-bold">
                          {['أ', 'ب', 'ج', 'د'][i]}
                        </span>
                        <MathRenderer
                          text={opt}
                          className="text-base"
                          dir={dir}
                        />
                      </button>
                    )
                  })}
                </div>
              )}

              {/* True/False Options */}
              {currentQ.question_type === 'true_false' && (
                <div className="grid grid-cols-2 gap-4">
                  {['صح', 'خطأ'].map((opt) => {
                    const isSelected = answers[currentQ.id] === opt
                    const isCorrectOpt = checkAnswer(
                      opt,
                      currentQ.correct_answer || '',
                      'true_false'
                    )
                    const showFeedback =
                      exam.show_results_immediately &&
                      immediateFeedback[currentQ.id]

                    let btnClass = `answer-option flex-col justify-center py-8 ${isSelected ? 'selected' : ''}`
                    if (showFeedback) {
                      if (isCorrectOpt)
                        btnClass +=
                          ' !bg-green-100 !border-green-500 !text-green-800'
                      else if (isSelected)
                        btnClass += ' !bg-red-100 !border-red-500 !text-red-800'
                    }

                    return (
                      <button
                        key={opt}
                        onClick={() =>
                          handleAnswer(currentQ.id, opt, 'true_false')
                        }
                        className={btnClass}
                      >
                        <span className="mb-2 text-3xl">
                          {opt === 'صح' ? '✅' : '❌'}
                        </span>
                        <span className="text-lg font-bold">{opt}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Fill Blank */}
              {currentQ.question_type === 'fill_blank' && (
                <div className="mt-4">
                  <input
                    type="text"
                    value={answers[currentQ.id] || ''}
                    onChange={(e) =>
                      handleAnswer(currentQ.id, e.target.value, 'fill_blank')
                    }
                    onKeyDown={(e) =>
                      e.key === 'Enter' && submitTextAnswer(currentQ.id)
                    }
                    disabled={
                      exam.show_results_immediately &&
                      immediateFeedback[currentQ.id]
                    }
                    placeholder="اكتب إجابتك هنا..."
                    className="w-full rounded-xl border-2 border-border px-4 py-3 transition-colors focus:border-primary focus:outline-none"
                    dir={dir}
                  />
                  {exam.show_results_immediately &&
                    !immediateFeedback[currentQ.id] &&
                    answers[currentQ.id] && (
                      <button
                        onClick={() => submitTextAnswer(currentQ.id)}
                        className="mt-3 w-full rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90 sm:w-auto"
                      >
                        تحقق من الإجابة
                      </button>
                    )}
                </div>
              )}

              {/* Essay / Correction — with handwriting image upload option */}
              {(currentQ.question_type === 'essay' ||
                currentQ.question_type === 'correction') && (
                <div className="mt-4 flex flex-col gap-3">
                  {/* Mode toggle: نص / صورة */}
                  <div className="flex w-fit items-center gap-2 rounded-xl bg-slate-100 p-1">
                    <button
                      onClick={() =>
                        setAnswerMode((prev) => ({
                          ...prev,
                          [currentQ.id]: 'text',
                        }))
                      }
                      disabled={
                        exam.show_results_immediately &&
                        immediateFeedback[currentQ.id]
                      }
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                        getMode(currentQ.id) === 'text'
                          ? 'bg-white text-primary shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Keyboard className="h-3.5 w-3.5" />
                      كتابة نصية
                    </button>
                    <button
                      onClick={() =>
                        setAnswerMode((prev) => ({
                          ...prev,
                          [currentQ.id]: 'image',
                        }))
                      }
                      disabled={
                        exam.show_results_immediately &&
                        immediateFeedback[currentQ.id]
                      }
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                        getMode(currentQ.id) === 'image'
                          ? 'bg-white text-primary shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Camera className="h-3.5 w-3.5" />
                      صورة بخط اليد
                    </button>
                  </div>

                  {/* ─── Text mode ─── */}
                  {getMode(currentQ.id) === 'text' && (
                    <>
                      <div className="flex justify-end">
                        <button
                          onClick={() => setShowMath(!showMath)}
                          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                            showMath
                              ? 'border-primary bg-primary text-white'
                              : 'border-border bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <Calculator className="h-4 w-4" />
                          {showMath
                            ? 'إغلاق لوحة الرياضيات'
                            : 'كتابة رموز رياضية'}
                        </button>
                      </div>

                      {showMath ? (
                        <MathLiveInput
                          value={(answers[currentQ.id] as string) || ''}
                          onChange={(val) =>
                            handleAnswer(
                              currentQ.id,
                              val,
                              currentQ.question_type
                            )
                          }
                          className="w-full text-left font-mono"
                        />
                      ) : (
                        <textarea
                          value={
                            (answers[currentQ.id] as string)?.startsWith(
                              '[image:'
                            )
                              ? ''
                              : (answers[currentQ.id] as string) || ''
                          }
                          onChange={(e) =>
                            handleAnswer(
                              currentQ.id,
                              e.target.value,
                              currentQ.question_type
                            )
                          }
                          disabled={
                            exam.show_results_immediately &&
                            immediateFeedback[currentQ.id]
                          }
                          placeholder="اكتب إجابتك هنا بوضوح..."
                          className="h-36 w-full resize-none rounded-xl border-2 border-border px-4 py-3 transition-colors focus:border-primary focus:outline-none"
                          dir={dir}
                        />
                      )}

                      {exam.show_results_immediately &&
                        !immediateFeedback[currentQ.id] &&
                        answers[currentQ.id] && (
                          <button
                            onClick={() => submitTextAnswer(currentQ.id)}
                            className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90 sm:w-auto"
                          >
                            تحقق من الإجابة
                          </button>
                        )}
                    </>
                  )}

                  {/* ─── Image mode ─── */}
                  {getMode(currentQ.id) === 'image' && (
                    <>
                      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-muted-foreground">
                        <span className="mt-0.5 text-base leading-none text-amber-500">
                          💡
                        </span>
                        <span>
                          اكتب الإجابة على ورقة بيضاء بخط واضح، ثم صوّرها
                          بكاميرا هاتفك أو ارفعها من جهازك. سيقوم الذكاء
                          الاصطناعي بقراءتها وتقييمها.
                        </span>
                      </div>

                      <HandwritingUploader
                        questionId={currentQ.id}
                        attemptId={attemptId}
                        existingImageUrl={imageAnswers[currentQ.id] || null}
                        onImageUploaded={(url) =>
                          handleImageUploaded(currentQ.id, url, currentQ)
                        }
                        onImageRemoved={() => handleImageRemoved(currentQ.id)}
                        disabled={
                          exam.show_results_immediately &&
                          immediateFeedback[currentQ.id]
                        }
                      />

                      {/* Vision grading loading */}
                      {visionGrading[currentQ.id]?.loading && (
                        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
                          <div>
                            <p className="text-sm font-bold text-primary">
                              الذكاء الاصطناعي يقرأ إجابتك...
                            </p>
                            <p className="text-xs text-muted-foreground">
                              يتم تحليل خط يدك وتقييم الحل
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Vision grading error */}
                      {visionGrading[currentQ.id]?.error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                          ⚠️ {visionGrading[currentQ.id]?.error}
                        </div>
                      )}

                      {/* Vision grading result (practice mode) */}
                      {visionGrading[currentQ.id]?.result &&
                        exam.show_results_immediately && (
                          <div
                            className={`rounded-xl border-2 p-4 ${
                              visionGrading[currentQ.id]!.result!.is_correct
                                ? 'border-green-200 bg-green-50'
                                : 'border-orange-200 bg-orange-50'
                            }`}
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <h4
                                className={`flex items-center gap-2 font-bold ${
                                  visionGrading[currentQ.id]!.result!.is_correct
                                    ? 'text-green-700'
                                    : 'text-orange-700'
                                }`}
                              >
                                {visionGrading[currentQ.id]!.result!
                                  .is_correct ? (
                                  <>
                                    <CheckCircle className="h-5 w-5" /> ممتاز!
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-5 w-5" /> راجع إجابتك
                                  </>
                                )}
                              </h4>
                              <span
                                className={`text-lg font-black ${
                                  visionGrading[currentQ.id]!.result!.is_correct
                                    ? 'text-green-600'
                                    : 'text-orange-600'
                                }`}
                              >
                                {
                                  visionGrading[currentQ.id]!.result!
                                    .earned_score
                                }
                                /{currentQ.points}
                              </span>
                            </div>
                            {visionGrading[currentQ.id]!.result!
                              .extracted_text && (
                              <div className="mb-2 rounded-lg bg-white/60 px-3 py-2 text-xs text-slate-600">
                                <span className="mb-1 block font-bold">
                                  ما قرأه الذكاء الاصطناعي:
                                </span>
                                {
                                  visionGrading[currentQ.id]!.result!
                                    .extracted_text
                                }
                              </div>
                            )}
                            <p className="text-sm text-slate-700">
                              {visionGrading[currentQ.id]!.result!.feedback}
                            </p>
                          </div>
                        )}
                    </>
                  )}
                </div>
              )}

              {/* Immediate Feedback Box (Practice Mode) */}
              {exam.show_results_immediately &&
                immediateFeedback[currentQ.id] &&
                currentQ.correct_answer && (
                  <div
                    className={`mt-6 rounded-xl border-2 p-4 ${
                      checkAnswer(
                        answers[currentQ.id] as string,
                        currentQ.correct_answer,
                        currentQ.question_type
                      )
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <h4
                      className={`flex items-center gap-2 font-bold ${
                        checkAnswer(
                          answers[currentQ.id] as string,
                          currentQ.correct_answer,
                          currentQ.question_type
                        )
                          ? 'text-green-700'
                          : 'text-red-700'
                      }`}
                    >
                      {checkAnswer(
                        answers[currentQ.id] as string,
                        currentQ.correct_answer,
                        currentQ.question_type
                      ) ? (
                        <>
                          <CheckCircle className="h-5 w-5" /> إجابة صحيحة!
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5" /> إجابة خاطئة
                        </>
                      )}
                    </h4>

                    {!checkAnswer(
                      answers[currentQ.id] as string,
                      currentQ.correct_answer,
                      currentQ.question_type
                    ) && (
                      <div className="mt-2 text-sm">
                        <strong>الإجابة الصحيحة هي:</strong>{' '}
                        <span className="font-bold text-green-700">
                          {getDisplayCorrectAnswer(
                            currentQ.correct_answer,
                            currentQ.question_type
                          )}
                        </span>
                      </div>
                    )}

                    {currentQ.explanation && (
                      <div className="border-current/10 mt-3 border-t pt-3 text-sm">
                        <strong className="mb-1 block">التفسير:</strong>
                        <MathRenderer
                          text={currentQ.explanation}
                          className="leading-relaxed"
                          dir={dir}
                        />
                      </div>
                    )}

                    {/* AI Explain Button - only for wrong answers */}
                    {!checkAnswer(
                      answers[currentQ.id] as string,
                      currentQ.correct_answer,
                      currentQ.question_type
                    ) && (
                      <AIExplainButton
                        questionId={currentQ.id}
                        questionText={currentQ.question_text}
                        correctAnswer={getDisplayCorrectAnswer(
                          currentQ.correct_answer,
                          currentQ.question_type
                        )}
                        studentAnswer={answers[currentQ.id] as string}
                      />
                    )}
                  </div>
                )}
            </div>
          )
        })}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
          disabled={currentIdx === 0}
          className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
          السابق
        </button>

        {/* Question Grid */}
        <div className="flex max-w-sm flex-wrap justify-center gap-1.5">
          {groups.map((g, i) => (
            <button
              key={`nav-${i}`}
              onClick={() => setCurrentIdx(i)}
              className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                i === currentIdx
                  ? 'bg-primary text-white ring-2 ring-primary ring-offset-1'
                  : g.questions.every((q) => answers[q.id])
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {g.originalIndexes[0] + 1}
              {g.questions.length > 1 && (
                <span className="block text-[9px] leading-none">
                  +{g.questions.length - 1}
                </span>
              )}
            </button>
          ))}
        </div>

        {currentIdx < groups.length - 1 ? (
          <button
            onClick={() => setCurrentIdx(currentIdx + 1)}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            التالي
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            <Send className="h-4 w-4" />
            إنهاء الاختبار
          </button>
        )}
      </div>
    </div>
  )
}
