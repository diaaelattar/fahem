'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Clock, ChevronRight, ChevronLeft, CheckCircle, XCircle, Send, AlertTriangle } from 'lucide-react'
import { MathRenderer } from '@/components/ui/MathRenderer'
import { useExamStore } from '@/lib/store/exam-store'
import { AIExplainButton } from '@/components/student/AIExplainButton'
import { MathLiveInput } from '@/components/ui/MathLiveInput'
import { Calculator } from 'lucide-react'

interface Question {
  id: string
  question_type: 'mcq' | 'true_false' | 'fill_blank' | 'essay' | 'correction'
  question_text: string
  question_image_url?: string | null
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

  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [immediateFeedback, setImmediateFeedback] = useState<Record<string, boolean>>({})
  const [showMath, setShowMath] = useState(false)

  // Reset math mode when changing questions
  useEffect(() => {
    setShowMath(false)
  }, [currentIdx])

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
      // 1. Save answers JSON for RPC grading
      await supabase.from('exam_attempts').update({ answers }).eq('id', attemptId)

      // 2. Grade Exam using AI Semantic Endpoint
      const res = await fetch('/api/exams/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId })
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
  }, [answers, attemptId, exam.id, exam.passing_score, storeSubmitting, submitted, supabase, submitExam, clearSession, isPreview, questions, checkAnswer])

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
  
  const progress = ((currentIdx + 1) / questions.length) * 100
  const answeredCount = Object.keys(answers).length
  const currentQ = questions[currentIdx] ?? questions[0]

  // Guard: should never happen but prevents blank-screen crashes
  if (!currentQ) return null

  const handleAnswer = (value: string) => {
    // If immediate feedback is on and already answered/checked, prevent changing answer
    if (exam.show_results_immediately && immediateFeedback[currentQ.id]) return;

    setAnswer(currentQ.id, value)
    
    // Auto-advance logic for MCQ and TF
    if (currentQ.question_type !== 'fill_blank' && currentQ.question_type !== 'essay' && currentQ.question_type !== 'correction') {
      if (exam.show_results_immediately) {
         setImmediateFeedback(prev => ({ ...prev, [currentQ.id]: true }))
      } else {
         setTimeout(() => {
           if (currentIdx < questions.length - 1) {
             setCurrentIdx(prev => prev + 1)
           }
         }, 500)
      }
    }
  }

  const submitTextAnswer = () => {
    if (exam.show_results_immediately && answers[currentQ.id]) {
      setImmediateFeedback(prev => ({ ...prev, [currentQ.id]: true }))
    }
  }

  const handleMathInsert = (symbol: string) => {
    const currentVal = answers[currentQ.id] || ''
    handleAnswer((currentVal as string) + symbol)
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
            {currentIdx + 1}/{questions.length}
          </span>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            ({answeredCount} مُجاب)
          </span>
        </div>
      </div>

      {/* Question Card */}
      <div className="question-card mb-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-primary text-white text-sm font-bold w-8 h-8 rounded-lg flex items-center justify-center">
            {currentIdx + 1}
          </span>
          <span className="text-sm text-muted-foreground">{(currentQ as any)?.points || 0} {(currentQ as any)?.points === 1 ? 'درجة' : 'درجات'}</span>
        </div>

        <div className="mb-6">
          {currentQ.context_passage && (
            <div className="mb-6 bg-indigo-50 border border-indigo-100 rounded-xl p-5 text-indigo-900 italic relative">
              <div className="absolute top-0 right-5 -translate-y-1/2 bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm">اقرأ القطعة التالية:</div>
              <MathRenderer text={currentQ.context_passage} className="text-base" dir={dir} />
            </div>
          )}
          <MathRenderer 
            text={(currentQ.question_text ?? '').replace(/^(\(?\d+[\)\.\-\s]\s*)/, '').trim()} 
            className={`text-xl font-medium leading-relaxed ${textAlign}`}
            dir={dir}
          />
          {currentQ.question_image_url && (
            <div className="mt-4 rounded-xl overflow-hidden border border-border bg-muted/30">
              <img
                src={currentQ.question_image_url}
                alt="صورة السؤال"
                className="w-full max-h-72 object-contain"
              />
            </div>
          )}
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
                <button key={i} onClick={() => handleAnswer(opt)} className={btnClass}>
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
                <button key={opt} onClick={() => handleAnswer(opt)} className={btnClass}>
                  <span className="text-3xl mb-2">{opt === 'صح' ? '✅' : '❌'}</span>
                  <span className="font-bold text-lg">{opt}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Fill Blank / Essay / Correction */}
        {(currentQ.question_type === 'fill_blank' || currentQ.question_type === 'essay' || currentQ.question_type === 'correction') && (
          <div className="mt-4 flex flex-col gap-3">
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
                value={answers[currentQ.id] || ''}
                onChange={val => handleAnswer(val)}
                className="w-full text-left font-mono"
              />
            ) : currentQ.question_type === 'fill_blank' ? (
              <input
                type="text"
                value={answers[currentQ.id] || ''}
                onChange={e => handleAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitTextAnswer()}
                disabled={exam.show_results_immediately && immediateFeedback[currentQ.id]}
                placeholder="اكتب إجابتك هنا..."
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:border-primary focus:outline-none transition-colors"
                dir="ltr"
              />
            ) : (
              <textarea
                value={answers[currentQ.id] || ''}
                onChange={e => handleAnswer(e.target.value)}
                disabled={exam.show_results_immediately && immediateFeedback[currentQ.id]}
                placeholder="اكتب إجابتك هنا بوضوح..."
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:border-primary focus:outline-none transition-colors h-32 resize-none"
                dir="auto"
              />
            )}
            {exam.show_results_immediately && !immediateFeedback[currentQ.id] && answers[currentQ.id] && (
               <button onClick={submitTextAnswer} className="mt-3 bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm w-full sm:w-auto hover:bg-primary/90 transition-colors">
                 تحقق من الإجابة
               </button>
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
            
            {currentIdx < questions.length - 1 && (
               <button 
                 onClick={() => setCurrentIdx(currentIdx + 1)} 
                 className="mt-4 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors w-full sm:w-auto"
               >
                 السؤال التالي <ChevronLeft className="w-4 h-4 inline" />
               </button>
            )}
          </div>
        )}

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
          {questions.map((q, i) => (
            <button key={q.id} onClick={() => setCurrentIdx(i)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                i === currentIdx ? 'ring-2 ring-primary ring-offset-1 bg-primary text-white' :
                answers[q.id] ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}>
              {i + 1}
            </button>
          ))}
        </div>

        {currentIdx < questions.length - 1 ? (
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
