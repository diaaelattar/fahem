'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Clock, ChevronRight, ChevronLeft, CheckCircle, XCircle, Send, AlertTriangle } from 'lucide-react'
import { MathRenderer } from '@/components/ui/MathRenderer'
import { useExamStore } from '@/lib/store/exam-store'

interface Question {
  id: string
  question_type: 'mcq' | 'true_false' | 'fill_blank' | 'essay' | 'correction'
  question_text: string
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
}

export function ExamInterface({
  exam,
  questions,
  attemptId,
}: {
  exam: ExamData
  questions: Question[]
  attemptId: string
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

  // Initialize store if empty
  useEffect(() => {
    if (useExamStore.getState().attemptId !== attemptId) {
      startExam(exam.id, attemptId, exam.duration_minutes * 60)
    }
  }, [exam.id, attemptId, exam.duration_minutes, startExam])

  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [immediateFeeback, setImmediateFeedback] = useState<Record<string, boolean>>({})

  const handleSubmit = useCallback(async () => {
    if (storeSubmitting || submitted) return
    submitExam() // sets isSubmitting to true in store
    try {
      // 1. Save answers JSON for RPC grading
      await supabase.from('exam_attempts').update({ answers }).eq('id', attemptId)

      // 2. Grade Exam
      const { data, error } = await supabase.rpc('grade_exam_attempt', { p_attempt_id: attemptId })
      if (error) throw error
      
      const passingScore = exam?.passing_score || 50;
      const isPassedFixed = (data.percentage >= passingScore);
      if (data.is_passed !== isPassedFixed) {
         data.is_passed = isPassedFixed;
         await supabase.from('exam_attempts').update({ is_passed: isPassedFixed }).eq('id', attemptId);
      }

      // 3. Insert into student_answers for Analytics (Phase 3 requirement)
      const { data: userData } = await supabase.auth.getUser()
      const studentId = userData?.user?.id
      
      if (studentId) {
        const studentAnswersPayload = Object.entries(answers).map(([questionId, ans]) => ({
          attempt_id: attemptId,
          student_id: studentId,
          exam_id: exam.id,
          question_id: questionId,
          student_answer: typeof ans === 'string' ? ans : JSON.stringify(ans),
          // is_correct will be computed/updated later or handled by triggers if needed.
          // For MCQ/TF we can approximate it if we had correct_answer, but we don't send it to client.
          // We rely on the RPC 'grade_exam_attempt' to grade.
          // To make the dashboard work, we can just insert them here. 
          // Ideally the RPC should insert them, but inserting here is a quick fix.
        }))
        if (studentAnswersPayload.length > 0) {
          await supabase.from('student_answers').upsert(studentAnswersPayload, { onConflict: 'attempt_id,question_id' })
        }
      }

      setResult(data)
      setSubmitted(true)
      clearSession() // clear local storage
    } catch (err: any) {
      alert('حدث خطأ أثناء تسليم الاختبار: ' + err.message)
      // We can't revert storeSubmitting easily without a custom action, but page refresh will reset if needed
    }
  }, [answers, attemptId, exam.id, exam.passing_score, storeSubmitting, submitted, supabase, submitExam, clearSession])

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
    if (submitted || Object.keys(answers).length === 0) return
    const interval = setInterval(() => {
      supabase.from('exam_attempts').update({ answers }).eq('id', attemptId)
    }, 30000)
    return () => clearInterval(interval)
  }, [answers, attemptId, submitted, supabase])

  const formatTime = (secs: number | null) => {
    if (secs === null || secs < 0) return '--:--'
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  
  const progress = ((currentIdx + 1) / questions.length) * 100
  const answeredCount = Object.keys(answers).length
  const currentQ = questions[currentIdx]

  const handleAnswer = (value: string) => {
    // If immediate feedback is on and already answered, prevent changing answer (optional, but good for practice)
    if (exam.show_results_immediately && answers[currentQ.id]) return;

    setAnswer(currentQ.id, value)
    
    // Auto-advance logic
    if (currentQ.question_type !== 'fill_blank') {
      // If immediate feedback is off, advance quickly
      if (!exam.show_results_immediately) {
        setTimeout(() => {
          if (currentIdx < questions.length - 1) {
            setCurrentIdx(prev => prev + 1)
          }
        }, 500)
      }
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
              <MathRenderer text={currentQ.context_passage} className="text-base" />
            </div>
          )}
          <MathRenderer text={currentQ.question_text} className="text-xl font-medium leading-relaxed" />
        </div>

        {/* MCQ Options */}
        {currentQ.question_type === 'mcq' && currentQ.options && (
          <div className="space-y-3">
            {currentQ.options.map((opt, i) => {
              const isSelected = answers[currentQ.id] === opt;
              const isCorrectOpt = currentQ.correct_answer === opt;
              const showFeedback = exam.show_results_immediately && answers[currentQ.id];
              
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
                  <MathRenderer text={opt} className="text-base" />
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
              const isCorrectOpt = currentQ.correct_answer === opt;
              const showFeedback = exam.show_results_immediately && answers[currentQ.id];
              
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
          <div className="mt-4">
            {currentQ.question_type === 'fill_blank' ? (
              <input
                type="text"
                value={answers[currentQ.id] || ''}
                onChange={e => handleAnswer(e.target.value)}
                placeholder="اكتب إجابتك هنا..."
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:border-primary focus:outline-none transition-colors"
              />
            ) : (
              <textarea
                value={answers[currentQ.id] || ''}
                onChange={e => handleAnswer(e.target.value)}
                placeholder="اكتب إجابتك هنا بوضوح..."
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:border-primary focus:outline-none transition-colors h-32 resize-none"
              />
            )}
          </div>
        )}

        {/* Immediate Feedback Box (Practice Mode) */}
        {exam.show_results_immediately && answers[currentQ.id] && currentQ.correct_answer && (
          <div className={`mt-6 p-4 rounded-xl border-2 ${
            answers[currentQ.id] === currentQ.correct_answer 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <h4 className={`font-bold flex items-center gap-2 ${
              answers[currentQ.id] === currentQ.correct_answer ? 'text-green-700' : 'text-red-700'
            }`}>
              {answers[currentQ.id] === currentQ.correct_answer ? (
                <><CheckCircle className="w-5 h-5" /> إجابة صحيحة!</>
              ) : (
                <><XCircle className="w-5 h-5" /> إجابة خاطئة</>
              )}
            </h4>
            
            {answers[currentQ.id] !== currentQ.correct_answer && (
              <div className="mt-2 text-sm">
                <strong>الإجابة الصحيحة هي:</strong> <span className="text-green-700 font-bold">{currentQ.correct_answer}</span>
              </div>
            )}
            
            {currentQ.explanation && (
              <div className="mt-3 pt-3 border-t border-current/10 text-sm">
                <strong>التفسير:</strong> <div dangerouslySetInnerHTML={{ __html: currentQ.explanation }} />
              </div>
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
