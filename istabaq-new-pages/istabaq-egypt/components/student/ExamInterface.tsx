'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Clock, ChevronRight, ChevronLeft, CheckCircle, XCircle, Send, AlertTriangle } from 'lucide-react'

interface Question {
  id: string
  question_type: 'mcq' | 'true_false' | 'fill_blank'
  question_text: string
  options: string[] | null
  correct_answer?: string
  explanation?: string
  points: number
}

interface ExamData {
  id: string
  title: string
  duration_minutes: number
  total_points: number
  passing_score: number | null
  show_results_immediately: boolean
  instructions: string | null
}

export function ExamInterface({
  exam,
  questions,
  attemptId,
  savedAnswers = {},
}: {
  exam: ExamData
  questions: Question[]
  attemptId: string
  savedAnswers?: Record<string, string>
}) {
  const router = useRouter()
  const supabase = createClient()
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>(savedAnswers)
  const [timeLeft, setTimeLeft] = useState(exam.duration_minutes * 60)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [immediateFeeback, setImmediateFeedback] = useState<Record<string, boolean>>({})

  const handleSubmit = useCallback(async () => {
    if (submitting || submitted) return
    setSubmitting(true)
    try {
      // حفظ الإجابات
      await supabase.from('exam_attempts').update({ answers }).eq('id', attemptId)

      // تصحيح الإجابات
      const { data, error } = await supabase.rpc('grade_exam_attempt', { p_attempt_id: attemptId })
      if (error) throw error
      setResult(data)
      setSubmitted(true)
    } catch (err: any) {
      alert('حدث خطأ أثناء تسليم الاختبار: ' + err.message)
      setSubmitting(false)
    }
  }, [answers, attemptId, submitting, submitted, supabase])

  // Countdown timer
  useEffect(() => {
    if (submitted) return
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [submitted, handleSubmit])

  // Auto-save every 30 seconds
  useEffect(() => {
    if (submitted || Object.keys(answers).length === 0) return
    const interval = setInterval(() => {
      supabase.from('exam_attempts').update({ answers }).eq('id', attemptId)
    }, 30000)
    return () => clearInterval(interval)
  }, [answers, attemptId, submitted, supabase])

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
  const progress = ((currentIdx + 1) / questions.length) * 100
  const answeredCount = Object.keys(answers).length
  const currentQ = questions[currentIdx]

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [currentQ.id]: value }
    setAnswers(newAnswers)
    // Move to next after a short delay for MCQ/TF
    if (currentQ.question_type !== 'fill_blank') {
      setTimeout(() => {
        if (currentIdx < questions.length - 1) setCurrentIdx(currentIdx + 1)
      }, 600)
    }
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
    <div className="max-w-3xl mx-auto">
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
                disabled={submitting}
                className="flex-1 bg-primary text-white py-3 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60">
                {submitting ? 'جاري التسليم...' : 'تسليم الاختبار'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl border border-border p-5 mb-5 sticky top-4 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold line-clamp-1">{exam.title}</h1>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold ${
            timeLeft < 300 ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-muted text-foreground'
          }`}>
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
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
          <span className="text-sm text-muted-foreground">{currentQ.points} {currentQ.points === 1 ? 'درجة' : 'درجات'}</span>
        </div>

        <p className="text-xl font-medium leading-relaxed mb-6">{currentQ.question_text}</p>

        {/* MCQ Options */}
        {currentQ.question_type === 'mcq' && currentQ.options && (
          <div className="space-y-3">
            {currentQ.options.map((opt, i) => (
              <button key={i} onClick={() => handleAnswer(opt)}
                className={`answer-option w-full text-right ${answers[currentQ.id] === opt ? 'selected' : ''}`}>
                <span className="w-8 h-8 rounded-lg border-2 border-current flex items-center justify-center text-sm font-bold shrink-0">
                  {['أ', 'ب', 'ج', 'د'][i]}
                </span>
                <span className="text-base">{opt}</span>
              </button>
            ))}
          </div>
        )}

        {/* True/False */}
        {currentQ.question_type === 'true_false' && (
          <div className="grid grid-cols-2 gap-4">
            {['صح', 'خطأ'].map(opt => (
              <button key={opt} onClick={() => handleAnswer(opt)}
                className={`answer-option justify-center text-xl font-bold py-6 ${answers[currentQ.id] === opt ? 'selected' : ''} ${opt === 'صح' ? 'hover:border-green-400' : 'hover:border-red-400'}`}>
                {opt === 'صح' ? '✅ صح' : '❌ خطأ'}
              </button>
            ))}
          </div>
        )}

        {/* Fill blank */}
        {currentQ.question_type === 'fill_blank' && (
          <input
            type="text"
            value={answers[currentQ.id] || ''}
            onChange={e => handleAnswer(e.target.value)}
            placeholder="اكتب إجابتك هنا..."
            className="w-full px-4 py-3 border-2 border-border rounded-xl text-base focus:outline-none focus:border-primary transition-colors"
            autoFocus
          />
        )}
      </div>

      {/* Navigation */}
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
