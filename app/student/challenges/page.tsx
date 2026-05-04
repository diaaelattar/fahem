'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Swords, Loader2, Trophy, Clock, CheckCircle, XCircle, Zap, Shield } from 'lucide-react'
import { MathRenderer } from '@/components/ui/MathRenderer'
import { toast } from 'sonner'

type Phase = 'select' | 'searching' | 'playing' | 'result'

interface ChallengeQuestion {
  id: string
  question_text: string
  options: string[]
  correct_answer: string
  points: number
}

export default function ChallengesPage() {
  const supabase = createClient()
  const [phase, setPhase] = useState<Phase>('select')
  const [subjects, setSubjects] = useState<{ id: number; name_ar: string; icon: string }[]>([])
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null)
  const [challenge, setChallenge] = useState<any>(null)
  const [role, setRole] = useState<'challenger' | 'opponent'>('challenger')
  const [questions, setQuestions] = useState<ChallengeQuestion[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(15)
  const [result, setResult] = useState<any>(null)
  const [userId, setUserId] = useState('')
  const searchTimeout = useRef<NodeJS.Timeout>()
  const pollInterval = useRef<NodeJS.Timeout>()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)

      const { data: subs } = await supabase
        .from('subjects').select('id, name_ar, icon').order('name_ar')
      setSubjects(subs || [])
    }
    init()
    return () => {
      clearTimeout(searchTimeout.current)
      clearInterval(pollInterval.current)
    }
  }, [])

  // Timer for each question
  useEffect(() => {
    if (phase !== 'playing') return
    setTimeLeft(15)
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer)
          handleAutoNext()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [phase, currentIdx])

  const handleAutoNext = useCallback(() => {
    const q = questions[currentIdx]
    if (!q || answers[q.id]) return
    handleAnswer(q, '') // no answer = wrong
  }, [currentIdx, questions, answers])

  const startSearch = async () => {
    if (!selectedSubject) return
    setPhase('searching')

    const res = await fetch('/api/challenges/find', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjectId: selectedSubject })
    })
    const data = await res.json()
    setChallenge(data.challenge)
    setRole(data.role)

    if (data.role === 'opponent') {
      // Already matched — start playing
      setQuestions(data.challenge.questions || [])
      setPhase('playing')
      return
    }

    // Challenger — poll until matched or timeout
    let attempts = 0
    pollInterval.current = setInterval(async () => {
      attempts++
      const { data: updated } = await supabase
        .from('challenges').select('*').eq('id', data.challenge.id).single()

      if (updated?.status === 'active') {
        clearInterval(pollInterval.current)
        setChallenge(updated)
        setQuestions(updated.questions || [])
        setPhase('playing')
        return
      }

      if (attempts >= 20) { // 20 * 3s = 60s timeout
        clearInterval(pollInterval.current)
        // Cancel challenge and go to solo practice
        await supabase.from('challenges').update({ status: 'cancelled' }).eq('id', data.challenge.id)
        setPhase('select')
        toast.info('لم يُوجد خصم الآن. حاول مجدداً لاحقاً!')
      }
    }, 3000)
  }

  const handleAnswer = async (q: ChallengeQuestion, answer: string) => {
    if (answers[q.id] !== undefined) return
    const isCorrect = answer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()
    const pts = isCorrect ? q.points : 0

    setAnswers(prev => ({ ...prev, [q.id]: answer }))
    setScore(s => s + pts)

    setTimeout(() => {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(i => i + 1)
      } else {
        finishChallenge(score + pts)
      }
    }, 800)
  }

  const finishChallenge = async (finalScore: number) => {
    if (!challenge) return
    const res = await fetch(`/api/challenges/${challenge.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, score: finalScore })
    })
    const data = await res.json()

    // Poll for opponent to finish if they haven't
    let attempts = 0
    const waitInterval = setInterval(async () => {
      attempts++
      const { data: updated } = await supabase
        .from('challenges').select('*').eq('id', challenge.id).single()

      if (updated?.status === 'completed') {
        clearInterval(waitInterval)
        setResult(updated)
        setPhase('result')
        return
      }
      if (attempts >= 15) {
        clearInterval(waitInterval)
        setResult({ ...challenge, winner_id: userId, challenger_score: finalScore, opponent_score: 0 })
        setPhase('result')
      }
    }, 2000)
  }

  const q = questions[currentIdx]
  const progress = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0

  // ── SELECT SUBJECT ──────────────────────────────────────────────────────────
  if (phase === 'select') {
    return (
      <div className="max-w-lg mx-auto space-y-6 animate-fade-in pb-24" dir="rtl">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Swords className="w-8 h-8 text-yellow-300" />
            <div>
              <h1 className="text-2xl font-display font-bold">التحديات المباشرة</h1>
              <p className="text-indigo-200 text-sm">تحدّ طالباً عشوائياً الآن!</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[{ v: '10', l: 'أسئلة' }, { v: '15ث', l: 'لكل سؤال' }, { v: '+30', l: 'XP للفوز' }].map(s => (
              <div key={s.l} className="bg-white/15 rounded-2xl p-3 text-center">
                <div className="text-xl font-black text-yellow-300">{s.v}</div>
                <div className="text-indigo-200 text-xs">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-border p-5">
          <h2 className="font-bold mb-4">اختر المادة</h2>
          <div className="grid grid-cols-2 gap-3">
            {subjects.map(sub => (
              <button key={sub.id} onClick={() => setSelectedSubject(sub.id)}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all font-bold text-right
                  ${selectedSubject === sub.id
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-border hover:border-indigo-300 hover:bg-indigo-50/30'}`}>
                <span className="text-2xl">{sub.icon}</span>
                <span className="text-sm">{sub.name_ar}</span>
              </button>
            ))}
          </div>

          <button onClick={startSearch} disabled={!selectedSubject}
            className="w-full mt-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 disabled:opacity-40 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-lg shadow-lg">
            <Swords className="w-5 h-5" />
            ابدأ التحدي!
          </button>
        </div>
      </div>
    )
  }

  // ── SEARCHING ───────────────────────────────────────────────────────────────
  if (phase === 'searching') {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center" dir="rtl">
        <div className="relative mb-6">
          <div className="w-32 h-32 rounded-full border-4 border-indigo-200 flex items-center justify-center bg-indigo-50">
            <Swords className="w-16 h-16 text-indigo-400" />
          </div>
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
        </div>
        <h2 className="text-2xl font-display font-bold mb-2">نبحث عن خصم...</h2>
        <p className="text-muted-foreground">جاري إيجاد طالب آخر في نفس المادة</p>
        <div className="flex gap-2 mt-4">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    )
  }

  // ── PLAYING ─────────────────────────────────────────────────────────────────
  if (phase === 'playing' && q) {
    const answered = answers[q.id]
    const isCorrect = answered && answered === q.correct_answer
    return (
      <div className="max-w-lg mx-auto space-y-4 animate-fade-in pb-24" dir="rtl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-bold">
              <Zap className="w-4 h-4 text-yellow-300" />
              <span>{score} نقطة</span>
            </div>
            <div className={`flex items-center gap-2 font-black text-lg px-4 py-1 rounded-xl
              ${timeLeft <= 5 ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`}>
              <Clock className="w-4 h-4" />
              {timeLeft}
            </div>
            <div className="text-sm">{currentIdx + 1} / {questions.length}</div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div className="bg-yellow-400 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question */}
        <div className={`bg-white rounded-3xl border-2 p-6 transition-all ${answered ? (isCorrect ? 'border-emerald-400' : 'border-rose-400') : 'border-border'}`}>
          <MathRenderer text={q.question_text} className="text-xl font-bold mb-6 leading-relaxed" />
          <div className="space-y-3">
            {q.options?.map((opt, i) => {
              const isSelected = answered === opt
              const correct = opt === q.correct_answer
              let cls = 'w-full text-right flex items-center gap-3 p-4 rounded-2xl border-2 font-medium transition-all'
              if (!answered) {
                cls += ' border-border hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer'
              } else if (correct) {
                cls += ' border-emerald-500 bg-emerald-50 text-emerald-800 cursor-default'
              } else if (isSelected) {
                cls += ' border-rose-400 bg-rose-50 text-rose-800 cursor-default'
              } else {
                cls += ' border-border opacity-40 cursor-default'
              }
              return (
                <button key={i} onClick={() => !answered && handleAnswer(q, opt)} className={cls} disabled={!!answered}>
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0
                    ${answered && correct ? 'bg-emerald-500 text-white' : answered && isSelected ? 'bg-rose-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                    {['أ','ب','ج','د'][i]}
                  </span>
                  <MathRenderer text={opt} className="flex-1 text-base" />
                  {answered && correct && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />}
                  {answered && isSelected && !correct && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── RESULT ──────────────────────────────────────────────────────────────────
  if (phase === 'result' && result) {
    const isWinner = result.winner_id === userId
    const isDraw = result.winner_id === null
    const myScore = role === 'challenger' ? result.challenger_score : result.opponent_score
    const theirScore = role === 'challenger' ? result.opponent_score : result.challenger_score

    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6 pb-24" dir="rtl">
        <div className={`w-28 h-28 rounded-3xl flex items-center justify-center shadow-2xl
          ${isWinner ? 'bg-yellow-400' : isDraw ? 'bg-slate-200' : 'bg-rose-100'}`}>
          {isWinner ? <Trophy className="w-16 h-16 text-yellow-800" /> :
           isDraw ? <Shield className="w-16 h-16 text-slate-500" /> :
           <XCircle className="w-16 h-16 text-rose-400" />}
        </div>

        <div>
          <h1 className="text-4xl font-display font-black mb-2">
            {isWinner ? '🏆 فزت!' : isDraw ? '🤝 تعادل!' : '💪 خسرت هذه المرة'}
          </h1>
          <p className="text-muted-foreground">
            {isWinner ? `حصلت على +30 XP` : isDraw ? 'نتيجة متكافئة' : 'لا بأس، حاول مجدداً!'}
          </p>
        </div>

        <div className="flex gap-6">
          <div className={`text-center p-5 rounded-2xl border-2 ${isWinner ? 'border-yellow-400 bg-yellow-50' : 'border-border bg-muted/30'}`}>
            <div className="text-4xl font-black text-primary">{myScore}</div>
            <div className="text-sm text-muted-foreground mt-1">نقاطك</div>
          </div>
          <div className="flex items-center text-2xl font-black text-muted-foreground">VS</div>
          <div className={`text-center p-5 rounded-2xl border-2 ${!isWinner && !isDraw ? 'border-rose-400 bg-rose-50' : 'border-border bg-muted/30'}`}>
            <div className="text-4xl font-black text-foreground">{theirScore}</div>
            <div className="text-sm text-muted-foreground mt-1">نقاط الخصم</div>
          </div>
        </div>

        <div className="flex gap-3 w-full">
          <button onClick={() => { setPhase('select'); setCurrentIdx(0); setAnswers({}); setScore(0) }}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-all">
            تحدي جديد ⚔️
          </button>
          <a href="/student/dashboard"
            className="flex-1 border-2 border-border text-foreground font-bold py-4 rounded-2xl hover:bg-muted transition-all flex items-center justify-center">
            الرئيسية
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  )
}
