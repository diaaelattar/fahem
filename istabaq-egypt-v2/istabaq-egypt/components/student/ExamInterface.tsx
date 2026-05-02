'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Clock, ChevronRight, ChevronLeft, CheckCircle, XCircle,
  Send, AlertTriangle, Flag
} from 'lucide-react'

interface Question {
  id: string
  question_type: 'mcq' | 'true_false' | 'fill_blank'
  question_text: string
  options: string[] | null
  points: number
  question_image_url?: string | null
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

interface Props {
  exam: ExamData
  questions: Question[]
  attemptId: string
  savedAnswers?: Record<string, string>
}

export function ExamInterface({ exam, questions, attemptId, savedAnswers = {} }: Props) {
  const supabase = createClient()
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>(savedAnswers)
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [timeLeft, setTimeLeft] = useState(exam.duration_minutes * 60)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const lastSaveRef = useRef<Record<string, string>>(savedAnswers)

  const currentQ = questions[currentIdx]
  const answeredCount = Object.keys(answers).length

  useEffect(() => {
    const interval = setInterval(async () => {
      if (submitted || JSON.stringify(answers) === JSON.stringify(lastSaveRef.current)) return
      setAutoSaving(true)
      await supabase.from('exam_attempts').update({ answers }).eq('id', attemptId)
      lastSaveRef.current = { ...answers }
      setAutoSaving(false)
    }, 20000)
    return () => clearInterval(interval)
  }, [answers, attemptId, submitted, supabase])

  const handleSubmit = useCallback(async () => {
    if (submitting || submitted) return
    setSubmitting(true)
    try {
      await supabase.from('exam_attempts').update({ answers }).eq('id', attemptId)
      const { data, error } = await supabase.rpc('grade_exam_attempt', { p_attempt_id: attemptId })
      if (error) throw error
      setResult(data)
      setSubmitted(true)
    } catch (err: any) {
      alert('خطأ أثناء تسليم الاختبار: ' + err.message)
      setSubmitting(false)
    }
  }, [answers, attemptId, submitting, submitted, supabase])

  useEffect(() => {
    if (submitted) return
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(interval); handleSubmit(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [submitted, handleSubmit])

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: value }))
    if (currentQ.question_type !== 'fill_blank' && currentIdx < questions.length - 1) {
      setTimeout(() => setCurrentIdx(i => i + 1), 450)
    }
  }

  // Results screen
  if (submitted && result) {
    const pct = result.percentage ?? 0
    const passed = result.is_passed
    const grade =
      pct >= 90 ? '🌟 ممتاز' : pct >= 80 ? '✨ جيد جداً' :
      pct >= 70 ? '👍 جيد'   : pct >= 60 ? '✅ مقبول'   :
      pct >= 50 ? '⚠️ ضعيف' : '❌ راسب'

    return (
      <div className="max-w-2xl mx-auto py-12 space-y-6 animate-fade-in">
        <div className={`rounded-3xl p-8 text-center text-white ${passed ? 'bg-gradient-to-br from-green-500 to-emerald-700' : 'bg-gradient-to-br from-red-500 to-rose-700'}`}>
          <div className="text-5xl mb-3">{passed ? '🎉' : '💪'}</div>
          <h2 className="text-3xl font-display font-bold mb-1">{passed ? 'تهانينا! نجحت' : 'حاول مرة أخرى'}</h2>
          <p className="text-white/80 mb-6">{grade}</p>
          <div className="text-7xl font-display font-bold mb-2">{pct.toFixed(0)}٪</div>
          <p className="text-white/70 text-sm">{result.score} من {result.total} درجة</p>
          <div className="mt-6 h-3 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white/80 rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {result.feedback && (
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border font-bold">تفاصيل الإجابات</div>
            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {questions.map((q, i) => {
                const fb = (result.feedback as any)[q.id]
                if (!fb) return null
                return (
                  <div key={q.id} className={`px-5 py-4 ${!fb.is_correct ? 'bg-red-50/50' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${fb.is_correct ? 'bg-green-100' : 'bg-red-100'}`}>
                        {fb.is_correct ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug mb-1">
                          <span className="text-muted-foreground ml-1">({i+1})</span> {q.question_text}
                        </p>
                        {!fb.is_correct && (
                          <div className="text-xs space-y-0.5">
                            <p className="text-red-600">إجابتك: <strong>{fb.student_answer || '(لا إجابة)'}</strong></p>
                            <p className="text-green-700">الصحيحة: <strong>{fb.correct_answer}</strong></p>
                          </div>
                        )}
                        {fb.explanation && <p className="text-xs text-muted-foreground mt-1 bg-muted/50 rounded px-2 py-1">💡 {fb.explanation}</p>}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{fb.points_earned}/{fb.points_possible}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <a href={`/student/results/${exam.id}?attemptId=${attemptId}`}
            className="flex-1 text-center bg-primary text-white py-3 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors">
            عرض النتيجة الكاملة
          </a>
          <a href="/student/dashboard"
            className="flex-1 text-center border border-border py-3 rounded-xl font-medium text-sm hover:bg-muted transition-colors">
            الرئيسية
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto" dir="rtl">
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-fade-in">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-center mb-2">تسليم الاختبار؟</h3>
            {questions.length - answeredCount > 0 && (
              <p className="text-sm text-center text-yellow-600 mb-1">⚠️ لم تجب على <strong>{questions.length - answeredCount}</strong> سؤال</p>
            )}
            <p className="text-sm text-center text-muted-foreground mb-6">أجبت على {answeredCount} من {questions.length}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 border border-border py-3 rounded-xl text-sm font-medium hover:bg-muted transition-colors">مراجعة</button>
              <button onClick={() => { setShowConfirm(false); handleSubmit() }} disabled={submitting}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-60">
                {submitting ? 'جاري...' : 'تسليم نهائي'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl border border-border p-4 mb-4 shadow-sm sticky top-2 z-10">
        <div className="flex items-center gap-3 mb-3">
          <h1 className="flex-1 text-base font-bold line-clamp-1">{exam.title}</h1>
          {autoSaving && <span className="text-xs text-muted-foreground animate-pulse">حفظ تلقائي...</span>}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-sm ${timeLeft < 300 ? 'bg-red-50 text-red-600 ring-1 ring-red-200' : 'bg-muted'}`}>
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{currentIdx + 1}/{questions.length} • {answeredCount} مُجاب</span>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl border border-border p-6 mb-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center text-sm font-bold">{currentIdx + 1}</span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{currentQ.points} درجة</span>
          </div>
          <button onClick={() => setFlagged(prev => { const n = new Set(prev); n.has(currentQ.id) ? n.delete(currentQ.id) : n.add(currentQ.id); return n })}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all ${flagged.has(currentQ.id) ? 'bg-yellow-50 border-yellow-300 text-yellow-700' : 'border-border text-muted-foreground'}`}>
            <Flag className="w-3.5 h-3.5" />
            {flagged.has(currentQ.id) ? 'مُعلَّم' : 'علّم'}
          </button>
        </div>

        {currentQ.question_image_url && (
          <img src={currentQ.question_image_url} alt="صورة السؤال" className="max-w-full rounded-xl mb-5 border border-border" />
        )}
        <p className="text-lg font-medium leading-relaxed mb-6">{currentQ.question_text}</p>

        {currentQ.question_type === 'mcq' && currentQ.options && (
          <div className="space-y-3">
            {currentQ.options.map((opt: string, i: number) => {
              const selected = answers[currentQ.id] === opt
              return (
                <button key={i} onClick={() => handleAnswer(opt)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-right transition-all ${selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/30'}`}>
                  <span className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${selected ? 'border-primary bg-primary text-white' : 'border-current text-muted-foreground'}`}>
                    {['أ', 'ب', 'ج', 'د'][i]}
                  </span>
                  <span className="text-base flex-1">{opt}</span>
                  {selected && <CheckCircle className="w-5 h-5 text-primary shrink-0" />}
                </button>
              )
            })}
          </div>
        )}

        {currentQ.question_type === 'true_false' && (
          <div className="grid grid-cols-2 gap-4">
            {[{ val: 'صح', emoji: '✅', sel: 'border-green-500 bg-green-50 text-green-800', hover: 'hover:border-green-400' },
              { val: 'خطأ', emoji: '❌', sel: 'border-red-500 bg-red-50 text-red-800', hover: 'hover:border-red-400' }
            ].map(({ val, emoji, sel, hover }) => (
              <button key={val} onClick={() => handleAnswer(val)}
                className={`py-8 rounded-2xl border-2 text-2xl font-bold transition-all ${answers[currentQ.id] === val ? sel : `border-border ${hover}`}`}>
                {emoji} {val}
              </button>
            ))}
          </div>
        )}

        {currentQ.question_type === 'fill_blank' && (
          <input type="text" value={answers[currentQ.id] || ''} onChange={e => handleAnswer(e.target.value)}
            placeholder="اكتب إجابتك هنا..." autoFocus
            className="w-full px-5 py-4 border-2 border-border rounded-xl text-lg focus:outline-none focus:border-primary transition-colors"
            onKeyDown={e => { if (e.key === 'Enter' && currentIdx < questions.length - 1) setCurrentIdx(i => i + 1) }}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}
          className="flex items-center gap-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted disabled:opacity-40 transition-colors">
          <ChevronRight className="w-4 h-4" /> السابق
        </button>
        <div className="flex-1 flex flex-wrap justify-center gap-1.5">
          {questions.map((q, i) => (
            <button key={q.id} onClick={() => setCurrentIdx(i)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all relative ${
                i === currentIdx ? 'ring-2 ring-primary ring-offset-1 bg-primary text-white' :
                answers[q.id] ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
              {i + 1}
              {flagged.has(q.id) && <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full border border-white" />}
            </button>
          ))}
        </div>
        {currentIdx < questions.length - 1 ? (
          <button onClick={() => setCurrentIdx(currentIdx + 1)}
            className="flex items-center gap-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            التالي <ChevronLeft className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={() => setShowConfirm(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors">
            <Send className="w-4 h-4" /> إنهاء
          </button>
        )}
      </div>
    </div>
  )
}
