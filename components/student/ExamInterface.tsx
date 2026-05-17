'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Clock, ChevronRight, ChevronLeft, CheckCircle, XCircle, Send, AlertTriangle, Camera, Keyboard, Loader2, Eye } from 'lucide-react'
import { MathRenderer } from '@/components/ui/MathRenderer'
import { useExamStore } from '@/lib/store/exam-store'
import { AIExplainButton } from '@/components/student/AIExplainButton'
import { MathLiveInput } from '@/components/ui/MathLiveInput'
import { Calculator } from 'lucide-react'
import { HandwritingUploader } from '@/components/shared/HandwritingUploader'

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

/**
 * Strip LaTeX blocks, math expressions, numbers, and operators from text
 * so that only meaningful language characters remain for direction detection.
 */
const stripMathContent = (text: string): string => {
  return text
    // Remove LaTeX inline: \( ... \) and \[ ... \]
    .replace(/\\[\[\(][\s\S]*?\\[\]\)]/g, ' ')
    // Remove dollar-sign math: $...$ and $$...$$
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$]*?\$/g, ' ')
    // Remove common LaTeX commands
    .replace(/\\[a-zA-Z]+\{[^}]*\}/g, ' ')
    .replace(/\\[a-zA-Z]+/g, ' ')
    // Remove digits, math operators, parentheses
    .replace(/[0-9+\-*/=<>()\[\]{}^_.,%;:]/g, ' ')
    .trim()
}

/** Check if text contains any Arabic character — used for short strings like subject names */
const hasArabic = (text: string): boolean => /[\u0600-\u06FF]/.test(text)

/**
 * Detect RTL from question text using ratio approach (for mixed-language math content).
 * Strips math function names (sin, cos, log…) before counting characters.
 * Returns true if Arabic chars ≥ 20% of remaining letter characters.
 */
const detectRTLFromQuestionText = (text: string): boolean | null => {
  let cleaned = stripMathContent(text)
  // Also strip common math English words that are NOT language indicators
  cleaned = cleaned.replace(/\b(sin|cos|tan|log|ln|lim|max|min|mod|det|sec|csc|cot|exp|sqrt|deg|var|let|if|in|at|of|to|cm|mm|km|kg|mg)\b/gi, ' ')
  const arabicChars = (cleaned.match(/[\u0600-\u06FF]/g) || []).length
  const latinChars = (cleaned.match(/[a-zA-Z]/g) || []).length
  const total = arabicChars + latinChars
  if (total < 5) return null // not enough meaningful data
  return arabicChars / total >= 0.20
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
  
  const { 
    answers, 
    setAnswer, 
    timeRemainingSeconds, 
    tickTime, 
    startExam, 
    submitExam, 
    isSubmitting: storeSubmitting,
    clearSession 
  } = useExamStore()

  // --- Determine text direction ---
  const subjectName = exam.subjects?.name_ar || ''
  const examTitle = exam.title || ''
  let isRTL: boolean | null = null

  if (hasArabic(subjectName)) {
    isRTL = true   
  } else if (subjectName.length > 1) {
    isRTL = false  
  }

  if (isRTL === null) {
    if (hasArabic(examTitle)) {
      isRTL = true
    } else if (examTitle.length > 1) {
      isRTL = false
    }
  }

  if (isRTL === null && questions.length > 0) {
    const sampleText = questions.slice(0, 5).map((q: any) => q.question_text || '').join(' ')
    isRTL = detectRTLFromQuestionText(sampleText)
  }

  if (isRTL === null) isRTL = true
  const dir = isRTL ? 'rtl' : 'ltr'
  const textAlign = isRTL ? 'text-right' : 'text-left'

  // Initialize store if empty
  useEffect(() => {
    if (useExamStore.getState().attemptId !== attemptId) {
      startExam(exam.id, attemptId, exam.duration_minutes * 60)
    }
  }, [exam.id, attemptId, exam.duration_minutes, startExam])

  // --- Grouping Logic ---
  const groups: { passage: string | null; questions: Question[]; originalIndexes: number[] }[] = []
  const passageToGroupIndex = new Map<string, number>()

  questions.forEach((q, idx) => {
    if (q.context_passage) {
      if (passageToGroupIndex.has(q.context_passage)) {
        const gIdx = passageToGroupIndex.get(q.context_passage)!
        groups[gIdx].questions.push(q)
        groups[gIdx].originalIndexes.push(idx)
      } else {
        passageToGroupIndex.set(q.context_passage, groups.length)
        groups.push({ passage: q.context_passage, questions: [q], originalIndexes: [idx] })
      }
    } else {
      groups.push({ passage: null, questions: [q], originalIndexes: [idx] })
    }
  })

  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [immediateFeedback, setImmediateFeedback] = useState<Record<string, boolean>>({})
  const [showMath, setShowMath] = useState(false)

  // ── Image Answer State ──────────────────────────────
  // 'text' = كتابة نصية، 'image' = رفع صورة
  const [answerMode, setAnswerMode] = useState<Record<string, 'text' | 'image'>>({})
  // imageAnswers: questionId → uploaded image URL
  const [imageAnswers, setImageAnswers] = useState<Record<string, string>>({})
  // AI vision grading state
  const [visionGrading, setVisionGrading] = useState<Record<string, {
    loading: boolean
    result: { earned_score: number; feedback: string; extracted_text: string; is_correct: boolean } | null
    error: string | null
  }>>({})

  // Reset math mode when changing questions
  useEffect(() => {
    setShowMath(false)
  }, [currentIdx])

  // Helper: get current answer mode for a question
  const getMode = (qId: string) => answerMode[qId] || 'text'

  // Handle image uploaded for a question
  const handleImageUploaded = useCallback((qId: string, imageUrl: string, q: Question) => {
    setImageAnswers(prev => ({ ...prev, [qId]: imageUrl }))
    // Store a marker in answers so the question is counted as "answered"
    setAnswer(qId, `[image:${imageUrl}]`)

    // If practice mode: immediately run AI vision grading
    if (exam.show_results_immediately && q.correct_answer) {
      setVisionGrading(prev => ({ ...prev, [qId]: { loading: true, result: null, error: null } }))
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
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            setVisionGrading(prev => ({ ...prev, [qId]: { loading: false, result: data, error: null } }))
            setImmediateFeedback(prev => ({ ...prev, [qId]: true }))
          } else {
            setVisionGrading(prev => ({ ...prev, [qId]: { loading: false, result: null, error: data.error || 'فشل التقييم' } }))
          }
        })
        .catch(err => {
          setVisionGrading(prev => ({ ...prev, [qId]: { loading: false, result: null, error: err.message } }))
        })
    }
  }, [exam.show_results_immediately, setAnswer, attemptId])

  // Handle image removed
  const handleImageRemoved = useCallback((qId: string) => {
    setImageAnswers(prev => { const n = { ...prev }; delete n[qId]; return n })
    setAnswer(qId, '')
    setVisionGrading(prev => { const n = { ...prev }; delete n[qId]; return n })
    setImmediateFeedback(prev => { const n = { ...prev }; delete n[qId]; return n })
  }, [setAnswer])

  // Strip LaTeX, commas inside numbers (thousands only), extra spaces
  const normalizeMath = (text: string): string => {
    if (!text) return ''
    return text
      .replace(/\$+/g, '')                        // remove $ delimiters
      .replace(/\\text\{([^}]*)\}/g, '$1')        // \text{x} → x
      .replace(/\\[a-zA-Z]+\s*/g, '')             // remove LaTeX commands
      .replace(/(\d),(\d{3})(?=[^\d]|$)/g, '$1$2') // thousands ONLY: 5,000 → 5000  (NOT 9,81)
      .replace(/\s+/g, ' ').trim().toLowerCase()
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
    return text.trim().toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[\u064B-\u065F]/g, '')
      .replace(/[،\-_/\\.:؛"']/g, ' ')
      .replace(/\s+/g, ' ')
  }

  const checkAnswer = (studentAns: string, correctAns: string, type: string): boolean => {
    if (!studentAns || !correctAns) return false

    // True/False comparison
    if (type === 'true_false') {
      const isSTrue  = studentAns === '\u0635\u062d'  || studentAns.toLowerCase() === 'true'
      const isCTrue  = correctAns  === '\u0635\u062d'  || correctAns.toLowerCase()  === 'true'
      const isSFalse = studentAns === '\u062e\u0637\u0623' || studentAns.toLowerCase() === 'false'
      const isCFalse = correctAns  === '\u062e\u0637\u0623' || correctAns.toLowerCase()  === 'false'
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
    if (studentResult && !isNaN(srNum) && !isNaN(crNum) && srNum > 0 && Math.abs(srNum - crNum) < 1e-9) return true

    // Key-numbers set: "9,81" vs "$9$ cm area=$81$" → both have {9,81}
    const correctNums = extractNumbers(correctAns)
    if (correctNums.length >= 2) {
      const studentNums = extractNumbers(studentAns)
      if (correctNums.every(n => studentNums.includes(n))) return true
    }

    // Numeric-core: "10" matches "10 trees"
    const numCoreS = ms.match(/^[\d./+\-\s\u00d7\u00f7*]+/)?.[0]?.trim()
    const numCoreC = mc.match(/^[\d./+\-\s\u00d7\u00f7*]+/)?.[0]?.trim()
    if (numCoreS && numCoreC && numCoreS.replace(/\s/g,'') === numCoreC.replace(/\s/g,'')) return true

    // Numeric equivalence: 1/2 == 0.5
    const numS = Number(ms.replace(/[^\d.]/g, ''))
    const numC = Number(mc.replace(/[^\d.]/g, ''))
    if (!isNaN(numS) && !isNaN(numC) && numS > 0 && Math.abs(numS - numC) < 1e-9) return true

    // Arabic text comparison
    const normStudent = normalizeArabic(studentAns)
    const normCorrect = normalizeArabic(correctAns)

    if (type === 'mcq') return normStudent === normCorrect

    if (normStudent === normCorrect) return true
    if (normStudent.length >= 3 && normCorrect.includes(normStudent)) return true
    if (normCorrect.length >= 3 && normStudent.includes(normCorrect)) return true

    const sw = normStudent.split(/\s+/).filter(w => w.length >= 2)
    const cw = normCorrect.split(/\s+/).filter(w => w.length >= 2)
    if (sw.length > 0 && cw.length > 0) {
      const common = cw.filter(w => sw.includes(w))
      if (sw.length <= 2 && common.length === sw.length) return true
      if (common.length / cw.length >= 0.4 || common.length / sw.length >= 0.5) return true
    }

    return false
  }

  const getDisplayCorrectAnswer = (correctAns: string, type: string) => {
    if (!correctAns) return '';
    if (type === 'true_false') {
      if (correctAns.toLowerCase() === 'true' || correctAns === 'صح') return 'صح';
      if (correctAns.toLowerCase() === 'false' || correctAns === 'خطأ') return 'خطأ';
    }
    return correctAns;
  }

  const handleSubmit = useCallback(async () => {
    if (storeSubmitting || submitted) return
    submitExam() // sets isSubmitting to true in store

    if (isPreview) {
      // Mock grading for preview mode
      let correct = 0;
      Object.entries(answers).forEach(([qId, ans]) => {
        const q = questions.find(q => q.id === qId);
        if (q && q.correct_answer) {
          if (checkAnswer(ans as string, q.correct_answer, q.question_type)) correct += q.points;
        }
      });
      setResult({ 
        is_passed: correct >= (exam.passing_score || 0), 
        score: correct, 
        total: exam.total_points, 
        percentage: exam.total_points > 0 ? Math.round((correct/exam.total_points)*100) : 0 
      })
      setSubmitted(true)
      clearSession()
      return
    }

    try {
      // 1. Save answers + image answer URLs together
      const answersWithImages = { ...answers }
      // Also save image URLs as a separate metadata key
      const answersPayload = {
        answers: answersWithImages,
        answer_images: imageAnswers, // { questionId: imageUrl }
      }
      await supabase.from('exam_attempts').update(answersPayload).eq('id', attemptId)

      // 2. Grade Exam using AI Semantic Endpoint
      const res = await fetch('/api/exams/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, imageAnswers })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل التقييم')

      setResult(data)
      setSubmitted(true)
      clearSession() // clear local storage
    } catch (err: any) {
      alert('حدث خطأ أثناء تسليم الاختبار: ' + err.message)
      // We can't revert storeSubmitting easily without a custom action, but page refresh will reset if needed
    }
  }, [answers, imageAnswers, attemptId, exam.id, exam.passing_score, storeSubmitting, submitted, supabase, submitExam, clearSession, isPreview, questions, checkAnswer])

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
  
  const progress = (answeredCount / questions.length) * 100

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 bg-white rounded-3xl border border-border mt-10">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">عفواً، لا توجد أسئلة معتمدة</h2>
        <p className="text-muted-foreground mb-8">هذا الاختبار لا يحتوي على أسئلة معتمدة من قبل المعلم حالياً.</p>
        <a href="/student/exams" className="bg-primary text-white px-8 py-3 rounded-xl font-medium">العودة للاختبارات</a>
      </div>
    )
  }

  const currentGroup = groups[currentIdx] ?? groups[0]

  // Guard: should never happen but prevents blank-screen crashes
  if (!currentGroup) return null

  const handleAnswer = (qId: string, value: string, qType: string) => {
    // If immediate feedback is on and already answered/checked, prevent changing answer
    if (exam.show_results_immediately && immediateFeedback[qId]) return;

    setAnswer(qId, value)
    
    // Auto-advance logic for MCQ and TF - only if it's a single question group
    if (currentGroup.questions.length === 1 && qType !== 'fill_blank' && qType !== 'essay' && qType !== 'correction') {
      if (exam.show_results_immediately) {
         setImmediateFeedback(prev => ({ ...prev, [qId]: true }))
      } else {
         setTimeout(() => {
           if (currentIdx < groups.length - 1) {
             setCurrentIdx(prev => prev + 1)
           }
         }, 500)
      }
    }
  }

  const submitTextAnswer = (qId: string) => {
    if (exam.show_results_immediately && answers[qId]) {
      setImmediateFeedback(prev => ({ ...prev, [qId]: true }))
    }
  }

  const handleMathInsert = (qId: string, symbol: string) => {
    const currentVal = answers[qId] || ''
    handleAnswer(qId, (currentVal as string) + symbol, '')
  }

  if (submitted && result) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${result.is_passed ? 'bg-green-100' : 'bg-red-100'}`}>
          {result.is_passed
            ? <CheckCircle className="w-14 h-14 text-green-600" />
            : <XCircle className="w-14 h-14 text-red-500" />
          }
        </div>
        <h2 className="text-3xl font-display font-bold mb-2">
          {result.is_passed ? '🎉 تهانينا! نجحت في الاختبار' : '💪 حاول مرة أخرى'}
        </h2>
        <p className="text-muted-foreground mb-8">
          {result.is_passed ? 'أحسنت! لقد اجتزت الاختبار بنجاح' : 'لم تحقق درجة النجاح هذه المرة، لكن يمكنك المحاولة مجدداً'}
        </p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="text-4xl font-bold text-primary mb-1">{result.percentage?.toFixed(0)}٪</div>
            <div className="text-sm text-muted-foreground">النسبة المئوية</div>
          </div>
          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="text-4xl font-bold text-foreground mb-1">{result.score}/{result.total}</div>
            <div className="text-sm text-muted-foreground">الدرجة المحققة</div>
          </div>
          <div className="bg-white rounded-2xl border border-border p-5">
            <div className={`text-4xl font-bold mb-1 ${result.is_passed ? 'text-green-600' : 'text-red-500'}`}>
              {result.is_passed ? 'ناجح' : 'راسب'}
            </div>
            <div className="text-sm text-muted-foreground">النتيجة</div>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <a href={`/student/results/${attemptId}`} className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors">
            عرض التفاصيل الكاملة
          </a>
          <a href="/student/dashboard" className="border border-border px-6 py-3 rounded-xl font-medium hover:bg-muted transition-colors">
            العودة للرئيسية
          </a>
        </div>
      </div>
    )
  }



  return (
    <div className="max-w-3xl mx-auto" dir={dir}>
      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-center mb-2">إنهاء الاختبار؟</h3>
            <p className="text-muted-foreground text-center text-sm mb-2">
              أجبت على <strong>{answeredCount}</strong> من <strong>{questions.length}</strong> سؤال
            </p>
            {answeredCount < questions.length && (
              <p className="text-yellow-600 text-center text-sm mb-6">
                ⚠️ لديك {questions.length - answeredCount} سؤال لم تجب عليه
              </p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 border border-border py-3 rounded-xl font-medium text-sm hover:bg-muted transition-colors">
                العودة للاختبار
              </button>
              <button onClick={() => { setShowConfirm(false); handleSubmit() }}
                disabled={storeSubmitting}
                className="flex-1 bg-primary text-white py-3 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60">
                {storeSubmitting ? 'جاري التسليم...' : 'تسليم الاختبار'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl border border-border p-5 mb-5 sticky top-4 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold line-clamp-1">{exam.title}</h1>
          <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl text-slate-700 font-bold font-mono">
            <Clock className="w-5 h-5 text-slate-400" />
            {formatTime(timeRemainingSeconds)}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            مجموعة {currentIdx + 1}/{groups.length}
          </span>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            ({answeredCount} من {questions.length} مُجاب)
          </span>
        </div>
      </div>

      {/* Group Content */}
      <div className="mb-5 space-y-6">
        {currentGroup.passage && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 text-indigo-900 italic relative mb-8">
            <div className="absolute top-0 right-5 -translate-y-1/2 bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm">اقرأ القطعة التالية، ثم أجب عن الأسئلة المرتبطة بها:</div>
            <MathRenderer text={currentGroup.passage} className="text-base" dir={dir} />
          </div>
        )}

        {currentGroup.questions.map((currentQ, qIndexWithinGroup) => {
          const globalQIndex = currentGroup.originalIndexes[qIndexWithinGroup]
          return (
            <div key={currentQ.id} className="question-card">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-primary text-white text-sm font-bold w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                  {globalQIndex + 1}
                </span>
                <span className="text-sm text-muted-foreground">{(currentQ as any)?.points || 0} {(currentQ as any)?.points === 1 ? 'درجة' : 'درجات'}</span>
              </div>

              <div className="mb-6">
                <div className={`flex ${
                  currentQ.image_position === 'top' ? 'flex-col-reverse' :
                  currentQ.image_position === 'right' ? 'flex-row-reverse gap-6 items-center' :
                  currentQ.image_position === 'left' ? 'flex-row gap-6 items-center' :
                  'flex-col' // bottom (default)
                }`}>
                  <div className="flex-1">
                    <MathRenderer 
                      text={(currentQ.question_text ?? '').replace(/^(\(?\d+[\)\.\-\s]\s*)/, '').trim()} 
                      className={`text-xl font-medium leading-relaxed`}
                      dir={dir}
                    />
                  </div>
                  
                  {currentQ.question_image_url && (
                    <div className={`rounded-xl overflow-hidden border border-border bg-muted/30 shrink-0 ${
                      currentQ.image_position === 'right' || currentQ.image_position === 'left' ? 'w-1/3' : 'mt-4 w-full'
                    }`}>
                      <img
                        src={currentQ.question_image_url}
                        alt="صورة السؤال"
                        className="w-full max-h-72 object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* MCQ Options */}
              {currentQ.question_type === 'mcq' && currentQ.options && (
                <div className="space-y-3">
                  {currentQ.options.map((opt, i) => {
                    const isSelected = answers[currentQ.id] === opt;
                    const isCorrectOpt = checkAnswer(opt, currentQ.correct_answer || '', 'mcq');
                    const showFeedback = exam.show_results_immediately && immediateFeedback[currentQ.id];
                    
                    let btnClass = `answer-option w-full text-right ${isSelected ? 'selected' : ''}`;
                    if (showFeedback) {
                      if (isCorrectOpt) btnClass += ' !bg-green-100 !border-green-500 !text-green-800';
                      else if (isSelected) btnClass += ' !bg-red-100 !border-red-500 !text-red-800';
                    }

                    return (
                      <button key={i} onClick={() => handleAnswer(currentQ.id, opt, 'mcq')} className={btnClass}>
                        <span className="w-8 h-8 rounded-lg border-2 border-current flex items-center justify-center text-sm font-bold shrink-0">
                          {['أ', 'ب', 'ج', 'د'][i]}
                        </span>
                          <MathRenderer text={opt} className="text-base" dir={dir} />
                      </button>
                    )
                  })}
                </div>
              )}

              {/* True/False Options */}
              {currentQ.question_type === 'true_false' && (
                <div className="grid grid-cols-2 gap-4">
                  {['صح', 'خطأ'].map(opt => {
                    const isSelected = answers[currentQ.id] === opt;
                    const isCorrectOpt = checkAnswer(opt, currentQ.correct_answer || '', 'true_false');
                    const showFeedback = exam.show_results_immediately && immediateFeedback[currentQ.id];
                    
                    let btnClass = `answer-option flex-col justify-center py-8 ${isSelected ? 'selected' : ''}`;
                    if (showFeedback) {
                      if (isCorrectOpt) btnClass += ' !bg-green-100 !border-green-500 !text-green-800';
                      else if (isSelected) btnClass += ' !bg-red-100 !border-red-500 !text-red-800';
                    }

                    return (
                      <button key={opt} onClick={() => handleAnswer(currentQ.id, opt, 'true_false')} className={btnClass}>
                        <span className="text-3xl mb-2">{opt === 'صح' ? '✅' : '❌'}</span>
                        <span className="font-bold text-lg">{opt}</span>
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
                    onChange={e => handleAnswer(currentQ.id, e.target.value, 'fill_blank')}
                    onKeyDown={e => e.key === 'Enter' && submitTextAnswer(currentQ.id)}
                    disabled={exam.show_results_immediately && immediateFeedback[currentQ.id]}
                    placeholder="اكتب إجابتك هنا..."
                    className="w-full px-4 py-3 border-2 border-border rounded-xl focus:border-primary focus:outline-none transition-colors"
                    dir="ltr"
                  />
                  {exam.show_results_immediately && !immediateFeedback[currentQ.id] && answers[currentQ.id] && (
                    <button onClick={() => submitTextAnswer(currentQ.id)} className="mt-3 bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm w-full sm:w-auto hover:bg-primary/90 transition-colors">
                      تحقق من الإجابة
                    </button>
                  )}
                </div>
              )}

              {/* Essay / Correction — with handwriting image upload option */}
              {(currentQ.question_type === 'essay' || currentQ.question_type === 'correction') && (
                <div className="mt-4 flex flex-col gap-3">

                  {/* Mode toggle: نص / صورة */}
                  <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                    <button
                      onClick={() => setAnswerMode(prev => ({ ...prev, [currentQ.id]: 'text' }))}
                      disabled={exam.show_results_immediately && immediateFeedback[currentQ.id]}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        getMode(currentQ.id) === 'text'
                          ? 'bg-white text-primary shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Keyboard className="w-3.5 h-3.5" />
                      كتابة نصية
                    </button>
                    <button
                      onClick={() => setAnswerMode(prev => ({ ...prev, [currentQ.id]: 'image' }))}
                      disabled={exam.show_results_immediately && immediateFeedback[currentQ.id]}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        getMode(currentQ.id) === 'image'
                          ? 'bg-white text-primary shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      صورة بخط اليد
                    </button>
                  </div>

                  {/* ─── Text mode ─── */}
                  {getMode(currentQ.id) === 'text' && (
                    <>
                      <div className="flex justify-end">
                        <button
                          onClick={() => setShowMath(!showMath)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${
                            showMath ? 'bg-primary text-white border-primary' : 'bg-slate-50 text-slate-600 border-border hover:bg-slate-100'
                          }`}
                        >
                          <Calculator className="w-4 h-4" />
                          {showMath ? 'إغلاق لوحة الرياضيات' : 'كتابة رموز رياضية'}
                        </button>
                      </div>

                      {showMath ? (
                        <MathLiveInput
                          value={(answers[currentQ.id] as string) || ''}
                          onChange={val => handleAnswer(currentQ.id, val, currentQ.question_type)}
                          className="w-full text-left font-mono"
                        />
                      ) : (
                        <textarea
                          value={(answers[currentQ.id] as string)?.startsWith('[image:') ? '' : ((answers[currentQ.id] as string) || '')}
                          onChange={e => handleAnswer(currentQ.id, e.target.value, currentQ.question_type)}
                          disabled={exam.show_results_immediately && immediateFeedback[currentQ.id]}
                          placeholder="اكتب إجابتك هنا بوضوح..."
                          className="w-full px-4 py-3 border-2 border-border rounded-xl focus:border-primary focus:outline-none transition-colors h-36 resize-none"
                          dir="auto"
                        />
                      )}

                      {exam.show_results_immediately && !immediateFeedback[currentQ.id] && answers[currentQ.id] && (
                        <button onClick={() => submitTextAnswer(currentQ.id)} className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm w-full sm:w-auto hover:bg-primary/90 transition-colors">
                          تحقق من الإجابة
                        </button>
                      )}
                    </>
                  )}

                  {/* ─── Image mode ─── */}
                  {getMode(currentQ.id) === 'image' && (
                    <>
                      <div className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
                        <span className="text-amber-500 text-base leading-none mt-0.5">💡</span>
                        <span>اكتب الإجابة على ورقة بيضاء بخط واضح، ثم صوّرها بكاميرا هاتفك أو ارفعها من جهازك. سيقوم الذكاء الاصطناعي بقراءتها وتقييمها.</span>
                      </div>

                      <HandwritingUploader
                        questionId={currentQ.id}
                        attemptId={attemptId}
                        existingImageUrl={imageAnswers[currentQ.id] || null}
                        onImageUploaded={(url) => handleImageUploaded(currentQ.id, url, currentQ)}
                        onImageRemoved={() => handleImageRemoved(currentQ.id)}
                        disabled={exam.show_results_immediately && immediateFeedback[currentQ.id]}
                      />

                      {/* Vision grading loading */}
                      {visionGrading[currentQ.id]?.loading && (
                        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                          <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-primary">الذكاء الاصطناعي يقرأ إجابتك...</p>
                            <p className="text-xs text-muted-foreground">يتم تحليل خط يدك وتقييم الحل</p>
                          </div>
                        </div>
                      )}

                      {/* Vision grading error */}
                      {visionGrading[currentQ.id]?.error && (
                        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                          ⚠️ {visionGrading[currentQ.id]?.error}
                        </div>
                      )}

                      {/* Vision grading result (practice mode) */}
                      {visionGrading[currentQ.id]?.result && exam.show_results_immediately && (
                        <div className={`p-4 rounded-xl border-2 ${
                          visionGrading[currentQ.id]!.result!.is_correct
                            ? 'bg-green-50 border-green-200'
                            : 'bg-orange-50 border-orange-200'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className={`font-bold flex items-center gap-2 ${
                              visionGrading[currentQ.id]!.result!.is_correct ? 'text-green-700' : 'text-orange-700'
                            }`}>
                              {visionGrading[currentQ.id]!.result!.is_correct
                                ? <><CheckCircle className="w-5 h-5" /> ممتاز!</>
                                : <><Eye className="w-5 h-5" /> راجع إجابتك</>
                              }
                            </h4>
                            <span className={`text-lg font-black ${
                              visionGrading[currentQ.id]!.result!.is_correct ? 'text-green-600' : 'text-orange-600'
                            }`}>
                              {visionGrading[currentQ.id]!.result!.earned_score}/{currentQ.points}
                            </span>
                          </div>
                          {visionGrading[currentQ.id]!.result!.extracted_text && (
                            <div className="text-xs text-slate-600 bg-white/60 rounded-lg px-3 py-2 mb-2">
                              <span className="font-bold block mb-1">ما قرأه الذكاء الاصطناعي:</span>
                              {visionGrading[currentQ.id]!.result!.extracted_text}
                            </div>
                          )}
                          <p className="text-sm text-slate-700">{visionGrading[currentQ.id]!.result!.feedback}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Immediate Feedback Box (Practice Mode) */}
              {exam.show_results_immediately && immediateFeedback[currentQ.id] && currentQ.correct_answer && (
                <div className={`mt-6 p-4 rounded-xl border-2 ${
                  checkAnswer(answers[currentQ.id] as string, currentQ.correct_answer, currentQ.question_type)
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <h4 className={`font-bold flex items-center gap-2 ${
                    checkAnswer(answers[currentQ.id] as string, currentQ.correct_answer, currentQ.question_type) ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {checkAnswer(answers[currentQ.id] as string, currentQ.correct_answer, currentQ.question_type) ? (
                      <><CheckCircle className="w-5 h-5" /> إجابة صحيحة!</>
                    ) : (
                      <><XCircle className="w-5 h-5" /> إجابة خاطئة</>
                    )}
                  </h4>
                  
                  {!checkAnswer(answers[currentQ.id] as string, currentQ.correct_answer, currentQ.question_type) && (
                    <div className="mt-2 text-sm">
                      <strong>الإجابة الصحيحة هي:</strong> <span className="text-green-700 font-bold">{getDisplayCorrectAnswer(currentQ.correct_answer, currentQ.question_type)}</span>
                    </div>
                  )}
                  
                  {currentQ.explanation && (
                    <div className="mt-3 pt-3 border-t border-current/10 text-sm">
                      <strong className="block mb-1">التفسير:</strong>
                      <MathRenderer text={currentQ.explanation} className="leading-relaxed" dir={dir} />
                    </div>
                  )}

                  {/* AI Explain Button - only for wrong answers */}
                  {!checkAnswer(answers[currentQ.id] as string, currentQ.correct_answer, currentQ.question_type) && (
                    <AIExplainButton
                      questionId={currentQ.id}
                      questionText={currentQ.question_text}
                      correctAnswer={getDisplayCorrectAnswer(currentQ.correct_answer, currentQ.question_type)}
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
        <button onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}
          className="flex items-center gap-2 px-5 py-2.5 border border-border rounded-xl font-medium text-sm hover:bg-muted transition-colors disabled:opacity-40">
          <ChevronRight className="w-4 h-4" />
          السابق
        </button>

        {/* Question Grid */}
        <div className="flex flex-wrap gap-1.5 max-w-sm justify-center">
          {groups.map((g, i) => (
            <button key={`nav-${i}`} onClick={() => setCurrentIdx(i)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                i === currentIdx ? 'ring-2 ring-primary ring-offset-1 bg-primary text-white' :
                g.questions.every(q => answers[q.id]) ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}>
              {g.originalIndexes[0] + 1}
              {g.questions.length > 1 && <span className="text-[9px] block leading-none">+{g.questions.length - 1}</span>}
            </button>
          ))}
        </div>

        {currentIdx < groups.length - 1 ? (
          <button onClick={() => setCurrentIdx(currentIdx + 1)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors">
            التالي
            <ChevronLeft className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 transition-colors">
            <Send className="w-4 h-4" />
            إنهاء الاختبار
          </button>
        )}
      </div>
    </div>
  )
}
