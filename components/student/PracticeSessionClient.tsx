'use client'

import { useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  CheckCircle, XCircle, ChevronLeft, Trophy, RotateCcw,
  BookOpen, Zap, Target, Mic, Square, Loader2
} from 'lucide-react'
import { MathRenderer } from '@/components/ui/MathRenderer'
import { MathKeyboard } from '@/components/ui/MathKeyboard'
import { AIExplainButton } from '@/components/student/AIExplainButton'

interface Question {
  id: string
  question_type: 'mcq' | 'true_false' | 'fill_blank' | 'essay' | 'correction'
  question_text: string
  options: string[] | null
  correct_answer: string
  explanation: string | null
  points: number
  difficulty_level: string | null
  context_passage?: string | null
}

interface Props {
  questions: Question[]
  subject: { id: string; name_ar: string; icon: string }
  studentId: string
}

export function PracticeSessionClient({ questions, subject, studentId }: Props) {
  const supabase = createClient() as any
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [fillInput, setFillInput] = useState('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [score, setScore] = useState({ correct: 0, wrong: 0 })
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [feedbacks, setFeedbacks] = useState<Record<string, any>>({})
  const [isGrading, setIsGrading] = useState(false)
  const [finished, setFinished] = useState(false)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)

  // ─── Arabic Normalization ───
  const normalizeArabic = (text: string) => {
    if (!text) return ''
    return text.trim().toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[\u064B-\u065F]/g, '') // Remove diacritics
  }

  // ─── Audio Recording ───
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const MAX_RECORDING_SECONDS = 120

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = async () => {
        if (timerRef.current) clearInterval(timerRef.current)
        setRecordingSeconds(0)
        if (chunks.length === 0) return
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setIsTranscribing(true)
        const formData = new FormData()
        formData.append('audio', blob)
        try {
          const res = await fetch('/api/ai/transcribe', { method: 'POST', body: formData })
          const data = await res.json()
          if (data.text) {
            setFillInput(prev => prev ? prev + ' ' + data.text : data.text)
          } else if (data.error) {
            alert('خطأ في تحويل الصوت: ' + data.error)
          }
        } catch (err) {
          alert('حدث خطأ أثناء تفريغ الصوت')
        } finally {
          setIsTranscribing(false)
        }
      }

      recorder.start()
      setIsRecording(true)
      setRecordingSeconds(0)
      mediaRecorderRef.current = recorder

      // مؤقت لعد الثواني
      timerRef.current = setInterval(() => {
        setRecordingSeconds(s => {
          if (s + 1 >= MAX_RECORDING_SECONDS) {
            stopRecording()
            return 0
          }
          return s + 1
        })
      }, 1000)

    } catch (err) {
      alert('الرجاء السماح بصلاحية الميكروفون')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop())
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const current = questions[currentIdx]
  const progress = ((currentIdx + 1) / questions.length) * 100

  const handleAnswer = useCallback(async (answer: string) => {
    if (showAnswer || !current || isGrading) return
    setSelected(answer)
    setAnswers(prev => ({ ...prev, [current.id]: answer }))

    // ─── AI Grading للمقالي والتصويب ───
    if (current.question_type === 'essay' || current.question_type === 'correction') {
      setIsGrading(true)
      try {
        const res = await fetch('/api/ai/grade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionText: current.question_text,
            idealAnswer: current.correct_answer,
            studentAnswer: answer,
            maxScore: current.points
          })
        })
        if (res.ok) {
          const gradingResult = await res.json()
          setFeedbacks(prev => ({ ...prev, [current.id]: gradingResult }))
          
          if (gradingResult.is_correct) {
            setScore(s => ({ ...s, correct: s.correct + 1 }))
            setStreak(s => s + 1)
            setMaxStreak(m => Math.max(m, streak + 1))
          } else {
            setScore(s => ({ ...s, wrong: s.wrong + 1 }))
            setStreak(0)
          }
        }
      } catch (err) {
        console.error("Failed to grade:", err)
      } finally {
        setIsGrading(false)
        setShowAnswer(true)
      }
      return
    }

    // ─── التصحيح العادي ───
    setShowAnswer(true)
    const isCorrect = normalizeArabic(answer) === normalizeArabic(current.correct_answer)

    if (isCorrect) {
      const newStreak = streak + 1
      setStreak(newStreak)
      setMaxStreak(m => Math.max(m, newStreak))
      setScore(s => ({ ...s, correct: s.correct + 1 }))

      try {
        await supabase.rpc('mark_wrong_answer_practiced', {
          p_student_id: studentId,
          p_question_id: current.id,
          p_correct: true
        })
      } catch { /* ignored */ }
    } else {
      setStreak(0)
      setScore(s => ({ ...s, wrong: s.wrong + 1 }))

      try {
        await supabase.rpc('add_to_wrong_answers', {
          p_student_id: studentId,
          p_question_id: current.id,
          p_attempt_id: null
        })
      } catch { /* ignored */ }
    }
  }, [current, showAnswer, streak, studentId, supabase, isGrading])

  const handleFillSubmit = () => {
    if (!fillInput.trim()) return
    handleAnswer(fillInput.trim())
  }

  const handleMathInsert = (symbol: string) => {
    setFillInput(prev => prev + symbol)
  }

  const handleNext = useCallback(async () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1)
      setSelected(null)
      setFillInput('')
      setShowAnswer(false)
    } else {
      // حفظ الجلسة (اختياري — يفشل بهدوء إذا الجدول غير موجود)
      try {
        await supabase.from('practice_sessions').insert({
          student_id: studentId,
          subject_id: subject?.id ?? null,
          session_type: 'free',
          answers,
          score: score.correct,
          total: questions.length,
          completed_at: new Date().toISOString()
        })
        
        // Award XP
        const earnedXP = score.correct * 1 + 5 // 1 XP per correct + 5 XP bonus
        await fetch('/api/xp/award', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: earnedXP, reason: 'إكمال جلسة تدريب 🎯' })
        })
      } catch { /* الجدول غير موجود بعد */ }
      setFinished(true)
    }
  }, [currentIdx, questions.length, score, answers, studentId, subject, supabase])


  // ────────────────────────────────────────
  // Finished Screen
  // ────────────────────────────────────────
  if (finished) {
    const pct = Math.round((score.correct / questions.length) * 100)
    return (
      <div className="max-w-lg mx-auto card-premium p-10 text-center">
        <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl
          ${pct >= 80 ? 'bg-green-100' : pct >= 60 ? 'bg-yellow-100' : 'bg-red-100'}`}>
          <Trophy className={`w-14 h-14 ${pct >= 80 ? 'text-green-500' : pct >= 60 ? 'text-yellow-500' : 'text-red-500'}`} />
        </div>
        <h2 className="text-3xl font-bold mb-2">
          {pct >= 80 ? '🎉 أداء رائع!' : pct >= 60 ? '👍 جيد، استمر!' : '💪 تحتاج مزيداً من التدريب'}
        </h2>
        <p className="text-muted-foreground mb-8">انتهت جلسة التدريب على {subject.name_ar}</p>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-green-50 rounded-2xl p-4">
            <div className="text-3xl font-bold text-green-600">{score.correct}</div>
            <div className="text-xs text-muted-foreground">إجابة صحيحة</div>
          </div>
          <div className="bg-red-50 rounded-2xl p-4">
            <div className="text-3xl font-bold text-red-500">{score.wrong}</div>
            <div className="text-xs text-muted-foreground">إجابة خاطئة</div>
          </div>
          <div className="bg-primary/5 rounded-2xl p-4">
            <div className="text-3xl font-bold text-primary">{pct}%</div>
            <div className="text-xs text-muted-foreground">النسبة</div>
          </div>
        </div>

        {maxStreak >= 3 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-sm font-bold text-amber-700">
            🔥 أطول سلسلة إجابات صحيحة: {maxStreak} متتالية!
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => {
            setCurrentIdx(0); setSelected(null); setFillInput('');
            setShowAnswer(false); setScore({ correct: 0, wrong: 0 });
            setAnswers({}); setFinished(false); setStreak(0); setMaxStreak(0)
          }}
            className="flex-1 flex items-center justify-center gap-2 border border-border py-3 rounded-xl font-medium hover:bg-muted transition-colors">
            <RotateCcw className="w-4 h-4" /> أعد الجلسة
          </button>
          <a href="/student/practice"
            className="flex-1 bg-primary text-white py-3 rounded-xl font-medium text-center hover:bg-primary/90 transition-colors">
            العودة للتدريب
          </a>
        </div>

        {score.wrong > 0 && (
          <a href="/student/practice/wrong-answers"
            className="block mt-3 text-sm text-rose-600 font-bold hover:underline">
            راجع الأسئلة الخاطئة الآن ←
          </a>
        )}
      </div>
    )
  }

  // ────────────────────────────────────────
  // Question Card
  // ────────────────────────────────────────
  const isCorrectAnswer = (opt: string) =>
    normalizeArabic(opt) === normalizeArabic(current.correct_answer)

  return (
    <div className="space-y-6">
      {/* Progress Bar + Stats */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold text-muted-foreground whitespace-nowrap">
          {currentIdx + 1} / {questions.length}
        </span>
        <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-400 to-violet-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-3 text-xs font-bold">
          <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> {score.correct}</span>
          <span className="text-red-500 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> {score.wrong}</span>
          {streak >= 2 && <span className="text-amber-500">🔥 {streak}</span>}
        </div>
      </div>

      {/* Question Card */}
      <div className={`card-premium p-8 transition-all ${showAnswer && isCorrectAnswer(selected || '') ? 'border-emerald-300' : showAnswer ? 'border-rose-300' : ''}`}>
        {/* Difficulty Badge */}
        <div className="flex items-center gap-2 mb-6">
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
            current.difficulty_level === 'easy' ? 'bg-green-100 text-green-700' :
            current.difficulty_level === 'hard' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {current.difficulty_level === 'easy' ? '🟢 سهل' : current.difficulty_level === 'hard' ? '🔴 صعب' : '🟡 متوسط'}
          </span>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full font-medium">
            {current.points} {current.points === 1 ? 'درجة' : 'درجات'}
          </span>
        </div>

        {/* Context Passage */}
        {current.context_passage && (
          <div className="mb-6 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 text-indigo-950 leading-relaxed italic relative">
            <div className="absolute top-0 right-6 -translate-y-1/2 bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm">اقرأ القطعة التالية:</div>
            <MathRenderer text={current.context_passage} className="text-lg" />
          </div>
        )}

        {/* Question Text */}
        <MathRenderer text={current.question_text} className="text-xl font-bold mb-8 leading-relaxed" />

        {/* MCQ */}
        {current.question_type === 'mcq' && current.options && (
          <div className="space-y-3">
            {current.options.map((opt, i) => {
              const isSelected = selected === opt
              const correct = isCorrectAnswer(opt)
              let cls = 'w-full text-right flex items-center gap-4 p-4 rounded-2xl border-2 transition-all font-medium'
              if (!showAnswer) {
                cls += isSelected ? ' border-primary bg-primary/5 cursor-default' : ' border-border hover:border-primary/40 hover:bg-muted/50 cursor-pointer'
              } else if (correct) {
                cls += ' border-emerald-500 bg-emerald-50 text-emerald-800 cursor-default'
              } else if (isSelected) {
                cls += ' border-rose-400 bg-rose-50 text-rose-800 cursor-default'
              } else {
                cls += ' border-border opacity-40 cursor-default'
              }
              return (
                <button key={i} className={cls} onClick={() => !showAnswer && handleAnswer(opt)} disabled={showAnswer}>
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0
                    ${showAnswer && correct ? 'bg-emerald-500 text-white' : showAnswer && isSelected && !correct ? 'bg-rose-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                    {['أ', 'ب', 'ج', 'د'][i]}
                  </span>
                  <MathRenderer text={opt} className="flex-1 text-base" />
                  {showAnswer && correct && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />}
                  {showAnswer && isSelected && !correct && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                </button>
              )
            })}
          </div>
        )}

        {/* True/False */}
        {current.question_type === 'true_false' && (
          <div className="grid grid-cols-2 gap-4">
            {['صح', 'خطأ'].map(opt => {
              const isSelected = selected === opt
              const correct = opt === current.correct_answer
              let cls = 'flex flex-col items-center p-6 rounded-3xl border-2 transition-all'
              if (!showAnswer) {
                cls += isSelected ? ' border-primary bg-primary/5 cursor-default' : ' border-border hover:border-primary/30 cursor-pointer'
              } else if (correct) {
                cls += ' border-emerald-500 bg-emerald-50 cursor-default'
              } else if (isSelected) {
                cls += ' border-rose-400 bg-rose-50 cursor-default'
              } else {
                cls += ' border-border opacity-40 cursor-default'
              }
              return (
                <button key={opt} className={cls} onClick={() => !showAnswer && handleAnswer(opt)} disabled={showAnswer}>
                  <span className="text-4xl mb-2">{opt === 'صح' ? '✅' : '❌'}</span>
                  <span className="font-bold text-lg">{opt}</span>
                  {showAnswer && correct && <span className="text-[10px] text-emerald-600 font-bold mt-1">الإجابة الصحيحة</span>}
                  {showAnswer && isSelected && !correct && <span className="text-[10px] text-rose-500 font-bold mt-1">إجابتك</span>}
                </button>
              )
            })}
          </div>
        )}

        {/* Fill Blank / Essay / Correction */}
        {(current.question_type === 'fill_blank' || current.question_type === 'essay' || current.question_type === 'correction') && !showAnswer && (
          <div className="flex flex-col gap-3">
            <MathKeyboard onInsert={handleMathInsert} className="mb-1" />
            {current.question_type === 'fill_blank' ? (
              <input
                type="text"
                value={fillInput}
                onChange={e => setFillInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleFillSubmit()}
                placeholder="اكتب إجابتك هنا (يمكنك استخدام الرموز الرياضية بالأعلى)..."
                className="w-full px-4 py-3 border-2 border-border rounded-xl text-base focus:outline-none focus:border-primary transition-colors font-mono dir-ltr text-left"
                autoFocus
                disabled={isGrading}
              />
            ) : (
              <div className="relative">
                <textarea
                  value={fillInput}
                  onChange={e => setFillInput(e.target.value)}
                  placeholder="اكتب إجابتك هنا بوضوح..."
                  className="w-full px-4 py-3 border-2 border-border rounded-xl text-base focus:outline-none focus:border-primary transition-colors resize-none h-32 font-mono dir-ltr text-left"
                  autoFocus
                  disabled={isGrading || isTranscribing}
                />
                
                {/* Audio Recording Button */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  {isTranscribing ? (
                    <div className="flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-bold animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      جاري تحويل الصوت لنص...
                    </div>
                  ) : isRecording ? (
                    <>
                      <button 
                        onClick={stopRecording}
                        className="flex items-center gap-2 bg-rose-500 text-white hover:bg-rose-600 px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
                      >
                        <Square className="w-3 h-3 fill-white" />
                        إيقاف و تحويل
                      </button>
                      <span className="flex items-center gap-1.5 text-xs text-rose-600 font-bold">
                        <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping inline-block" />
                        {Math.floor(recordingSeconds / 60).toString().padStart(2,'0')}:{(recordingSeconds % 60).toString().padStart(2,'0')}
                      </span>
                    </>
                  ) : (
                    <button 
                      onClick={startRecording}
                      disabled={isGrading}
                      className="flex items-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
                      title="إجابة صوتية (يتم تحويلها لنص تلقائياً)"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      إجابة صوتية
                    </button>
                  )}
                </div>
              </div>
            )}
            <button onClick={handleFillSubmit} disabled={isGrading}
              className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
              {isGrading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> المدرس الذكي يقيّم الإجابة...</> : 'تحقق من الإجابة'}
            </button>
          </div>
        )}

        {current.question_type === 'fill_blank' && showAnswer && (
          <div className="space-y-3">
            <div className={`px-4 py-3 rounded-xl border-2 font-bold flex items-center gap-2 ${isCorrectAnswer(selected || '') ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-rose-400 bg-rose-50 text-rose-700'}`}>
              <span className="shrink-0">إجابتك:</span> 
              <MathRenderer text={selected || ''} />
            </div>
            {!isCorrectAnswer(selected || '') && (
              <div className="px-4 py-3 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-emerald-700 font-bold flex items-center gap-2">
                <span className="shrink-0">الإجابة الصحيحة:</span> 
                <MathRenderer text={current.correct_answer} />
              </div>
            )}
          </div>
        )}

        {(current.question_type === 'essay' || current.question_type === 'correction') && showAnswer && feedbacks[current.id] && (
          <div className="space-y-4">
            <div className={`px-5 py-4 rounded-xl border-2 ${feedbacks[current.id].is_correct ? 'border-emerald-500 bg-emerald-50' : 'border-rose-400 bg-rose-50'}`}>
              <div className="flex items-center gap-2 mb-2 font-bold">
                {feedbacks[current.id].is_correct ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-rose-500" />}
                <span className={feedbacks[current.id].is_correct ? 'text-emerald-800' : 'text-rose-800'}>
                  الدرجة: {feedbacks[current.id].earned_score} / {current.points}
                </span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed font-medium bg-white/50 p-3 rounded-lg border border-border/50">
                {feedbacks[current.id].feedback}
              </p>
            </div>
            
            <div className="px-5 py-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/50">
              <span className="font-bold text-indigo-800 block mb-2">الإجابة النموذجية:</span>
              <MathRenderer text={current.correct_answer} className="text-sm text-indigo-900 leading-relaxed" />
            </div>
          </div>
        )}

        {/* Explanation */}
        {showAnswer && current.explanation && (
          <div className="mt-6 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-2xl p-5">
            <h4 className="font-bold text-sky-800 text-sm mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" /> شرح الإجابة
            </h4>
            <MathRenderer text={current.explanation} className="text-sm text-sky-900 leading-relaxed" />
          </div>
        )}
      </div>

      {/* Next Button */}
      {showAnswer && (
        <div className="flex justify-center">
          <button onClick={handleNext}
            className="flex items-center gap-2 bg-primary text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-primary/90 hover:scale-105 transition-all shadow-lg shadow-primary/20">
            {currentIdx < questions.length - 1 ? (
              <><ChevronLeft className="w-5 h-5" /> السؤال التالي</>
            ) : (
              <><Trophy className="w-5 h-5" /> انهِ الجلسة</>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
