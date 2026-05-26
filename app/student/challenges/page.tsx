'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Swords,
  Loader2,
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  Shield,
} from 'lucide-react'
import { MathRenderer } from '@/components/ui/MathRenderer'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { playSound } from '@/lib/utils/audio'

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
  const [subjects, setSubjects] = useState<
    { id: number; name_ar: string; icon: string }[]
  >([])
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
  const searchTimeout = useRef<any>()
  const pollInterval = useRef<any>()
  const realtimeChannelRef = useRef<any>(null)

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) setUserId(user.id)

      const { data: subs } = await supabase
        .from('subjects')
        .select('id, name_ar, icon')
        .order('name_ar')
      setSubjects(subs || [])
    }
    init()
    return () => {
      clearTimeout(searchTimeout.current)
      clearInterval(pollInterval.current)
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current)
      }
    }
  }, [])

  // Play result sound on victory/defeat/draw
  useEffect(() => {
    if (phase === 'result' && result) {
      const isWinner = result.winner_id === userId
      const isDraw = result.winner_id === null
      if (isWinner) {
        playSound('victory')
      } else if (!isDraw) {
        playSound('defeat')
      }
    }
  }, [phase, result, userId])

  // Timer for each question
  useEffect(() => {
    if (phase !== 'playing') return
    setTimeLeft(15)
    const timer = setInterval(() => {
      setTimeLeft((t) => {
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
      body: JSON.stringify({ subjectId: selectedSubject }),
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

    // Challenger — subscribe to Realtime updates instead of polling
    const channel = supabase
      .channel(`challenge_match_${data.challenge.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'challenges',
          filter: `id=eq.${data.challenge.id}`,
        },
        (payload) => {
          const updated = payload.new as any
          if (updated?.status === 'active') {
            if (realtimeChannelRef.current) {
              supabase.removeChannel(realtimeChannelRef.current)
              realtimeChannelRef.current = null
            }
            clearTimeout(searchTimeout.current)
            setChallenge(updated)
            setQuestions(updated.questions || [])
            setPhase('playing')
          }
        }
      )
      .subscribe()

    realtimeChannelRef.current = channel

    // 60 seconds timeout
    searchTimeout.current = setTimeout(async () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current)
        realtimeChannelRef.current = null
      }
      // Cancel challenge and go to solo practice
      await supabase
        .from('challenges')
        .update({ status: 'cancelled' })
        .eq('id', data.challenge.id)
      setPhase('select')
      toast.info('لم يُوجد خصم الآن. حاول مجدداً لاحقاً!')
    }, 60000)
  }

  const handleAnswer = async (q: ChallengeQuestion, answer: string) => {
    if (answers[q.id] !== undefined) return
    const isCorrect =
      answer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()
    const pts = isCorrect ? q.points : 0

    // Play synthesized sound effect
    playSound(isCorrect ? 'correct' : 'incorrect')

    setAnswers((prev) => ({ ...prev, [q.id]: answer }))
    setScore((s) => s + pts)

    setTimeout(() => {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx((i) => i + 1)
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
      body: JSON.stringify({ answers, score: finalScore }),
    })
    const data = await res.json()

    if (data.challenge?.status === 'completed') {
      setResult(data.challenge)
      setPhase('result')
      return
    }

    // Subscribe to completion of the challenge
    const channel = supabase
      .channel(`challenge_finish_${challenge.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'challenges',
          filter: `id=eq.${challenge.id}`,
        },
        (payload) => {
          const updated = payload.new as any
          if (updated?.status === 'completed') {
            if (realtimeChannelRef.current) {
              supabase.removeChannel(realtimeChannelRef.current)
              realtimeChannelRef.current = null
            }
            clearTimeout(searchTimeout.current)
            setResult(updated)
            setPhase('result')
          }
        }
      )
      .subscribe()

    realtimeChannelRef.current = channel

    // 30 seconds timeout if opponent disconnects
    searchTimeout.current = setTimeout(() => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current)
        realtimeChannelRef.current = null
      }
      setResult({
        ...challenge,
        winner_id: userId,
        challenger_score: finalScore,
        opponent_score: 0,
      })
      setPhase('result')
    }, 30000)
  }

  const q = questions[currentIdx]
  const progress =
    questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0

  // ── SELECT SUBJECT ──────────────────────────────────────────────────────────
  if (phase === 'select') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        className="mx-auto max-w-lg space-y-6 pb-24"
        dir="rtl"
      >
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 text-white">
          <div className="mb-2 flex items-center gap-3">
            <Swords className="h-8 w-8 text-yellow-300" />
            <div>
              <h1 className="font-display text-2xl font-bold">
                التحديات المباشرة
              </h1>
              <p className="text-sm text-indigo-200">
                تحدّ طالباً عشوائياً الآن!
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { v: '10', l: 'أسئلة' },
              { v: '15ث', l: 'لكل سؤال' },
              { v: '+30', l: 'XP للفوز' },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-2xl bg-white/15 p-3 text-center"
              >
                <div className="text-xl font-black text-yellow-300">{s.v}</div>
                <div className="text-xs text-indigo-200">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-white p-5">
          <h2 className="mb-4 font-bold">اختر المادة</h2>
          <div className="grid grid-cols-2 gap-3">
            {subjects.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubject(sub.id)}
                className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-right font-bold transition-all ${
                  selectedSubject === sub.id
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-border hover:border-indigo-300 hover:bg-indigo-50/30'
                }`}
              >
                <span className="text-2xl">{sub.icon}</span>
                <span className="text-sm">{sub.name_ar}</span>
              </button>
            ))}
          </div>

          <button
            onClick={startSearch}
            disabled={!selectedSubject}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-4 text-lg font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:opacity-40"
          >
            <Swords className="h-5 w-5" />
            ابدأ التحدي!
          </button>
        </div>
      </motion.div>
    )
  }

  // ── SEARCHING ───────────────────────────────────────────────────────────────
  if (phase === 'searching') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center text-center"
        dir="rtl"
      >
        <div className="relative mb-6">
          <motion.div
            animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-indigo-200 bg-indigo-50"
          >
            <Swords className="h-16 w-16 text-indigo-400" />
          </motion.div>
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        </div>
        <h2 className="mb-2 font-display text-2xl font-bold">نبحث عن خصم...</h2>
        <p className="text-muted-foreground">
          جاري إيجاد طالب آخر في نفس المادة
        </p>
        <div className="mt-4 flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 animate-bounce rounded-full bg-indigo-400"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </motion.div>
    )
  }

  // ── PLAYING ─────────────────────────────────────────────────────────────────
  if (phase === 'playing' && q) {
    const answered = answers[q.id]
    const isCorrect = answered && answered === q.correct_answer
    return (
      <div className="mx-auto max-w-lg space-y-4 pb-24" dir="rtl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold">
              <Zap className="h-4 w-4 text-yellow-300" />
              <span>{score} نقطة</span>
            </div>
            <div
              className={`flex items-center gap-2 rounded-xl px-4 py-1 text-lg font-black ${timeLeft <= 5 ? 'animate-pulse bg-red-500' : 'bg-white/20'}`}
            >
              <Clock className="h-4 w-4" />
              {timeLeft}
            </div>
            <div className="text-sm">
              {currentIdx + 1} / {questions.length}
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-white/20">
            <div
              className="h-2 rounded-full bg-yellow-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </motion.div>

        {/* Question with AnimatePresence */}
        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.25 }}
            className={`rounded-3xl border-2 bg-white p-6 transition-all ${answered ? (isCorrect ? 'border-emerald-400' : 'border-rose-400') : 'border-border'}`}
          >
            <MathRenderer
              text={q.question_text}
              className="mb-6 text-xl font-bold leading-relaxed"
            />
            <div className="space-y-3">
              {q.options?.map((opt, i) => {
                const isSelected = answered === opt
                const correct = opt === q.correct_answer
                let cls =
                  'w-full text-right flex items-center gap-3 p-4 rounded-2xl border-2 font-medium transition-all'
                if (!answered) {
                  cls +=
                    ' border-border hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer'
                } else if (correct) {
                  cls +=
                    ' border-emerald-500 bg-emerald-50 text-emerald-800 cursor-default'
                } else if (isSelected) {
                  cls +=
                    ' border-rose-400 bg-rose-50 text-rose-800 cursor-default'
                } else {
                  cls += ' border-border opacity-40 cursor-default'
                }
                return (
                  <motion.button
                    key={i}
                    onClick={() => !answered && handleAnswer(q, opt)}
                    className={cls}
                    disabled={!!answered}
                    whileHover={!answered ? { scale: 1.02, x: -2 } : {}}
                    whileTap={!answered ? { scale: 0.98 } : {}}
                    animate={
                      answered && isSelected && !correct
                        ? { x: [-6, 6, -6, 6, 0] }
                        : answered && correct
                          ? { scale: [1, 1.03, 1] }
                          : {}
                    }
                    transition={{ duration: 0.3 }}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${answered && correct ? 'bg-emerald-500 text-white' : answered && isSelected ? 'bg-rose-500 text-white' : 'bg-muted text-muted-foreground'}`}
                    >
                      {['أ', 'ب', 'ج', 'د'][i]}
                    </span>
                    <MathRenderer text={opt} className="flex-1 text-base" />
                    {answered && correct && (
                      <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
                    )}
                    {answered && isSelected && !correct && (
                      <XCircle className="h-5 w-5 shrink-0 text-rose-500" />
                    )}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // ── RESULT ──────────────────────────────────────────────────────────────────
  if (phase === 'result' && result) {
    const isWinner = result.winner_id === userId
    const isDraw = result.winner_id === null
    const myScore =
      role === 'challenger' ? result.challenger_score : result.opponent_score
    const theirScore =
      role === 'challenger' ? result.opponent_score : result.challenger_score

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center space-y-6 pb-24 text-center"
        dir="rtl"
      >
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 10, stiffness: 120 }}
          className={`flex h-28 w-28 items-center justify-center rounded-3xl shadow-2xl ${isWinner ? 'bg-yellow-400' : isDraw ? 'bg-slate-200' : 'bg-rose-100'}`}
        >
          {isWinner ? (
            <Trophy className="h-16 w-16 text-yellow-800" />
          ) : isDraw ? (
            <Shield className="h-16 w-16 text-slate-500" />
          ) : (
            <XCircle className="h-16 w-16 text-rose-400" />
          )}
        </motion.div>

        <div>
          <h1 className="mb-2 font-display text-4xl font-black">
            {isWinner ? '🏆 فزت!' : isDraw ? '🤝 تعادل!' : '💪 خسرت هذه المرة'}
          </h1>
          <p className="text-muted-foreground">
            {isWinner
              ? `حصلت على +30 XP`
              : isDraw
                ? 'نتيجة متكافئة'
                : 'لا بأس، حاول مجدداً!'}
          </p>
        </div>

        <div className="flex gap-6">
          <div
            className={`rounded-2xl border-2 p-5 text-center ${isWinner ? 'border-yellow-400 bg-yellow-50' : 'border-border bg-muted/30'}`}
          >
            <div className="text-4xl font-black text-primary">{myScore}</div>
            <div className="mt-1 text-sm text-muted-foreground">نقاطك</div>
          </div>
          <div className="flex items-center text-2xl font-black text-muted-foreground">
            VS
          </div>
          <div
            className={`rounded-2xl border-2 p-5 text-center ${!isWinner && !isDraw ? 'border-rose-400 bg-rose-50' : 'border-border bg-muted/30'}`}
          >
            <div className="text-4xl font-black text-foreground">
              {theirScore}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">نقاط الخصم</div>
          </div>
        </div>

        <div className="flex w-full gap-3">
          <button
            onClick={() => {
              setPhase('select')
              setCurrentIdx(0)
              setAnswers({})
              setScore(0)
            }}
            className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-4 font-bold text-white transition-all hover:opacity-90"
          >
            تحدي جديد ⚔️
          </button>
          <a
            href="/student/dashboard"
            className="flex flex-1 items-center justify-center rounded-2xl border-2 border-border py-4 font-bold text-foreground transition-all hover:bg-muted"
          >
            الرئيسية
          </a>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  )
}
