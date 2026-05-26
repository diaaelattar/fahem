'use client'

import { useState } from 'react'
import { Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { MathRenderer } from '@/components/ui/MathRenderer'

interface AIExplainButtonProps {
  questionId: string
  questionText: string
  correctAnswer?: string
  studentAnswer?: string
  subject?: string
  grade?: string
}

export function AIExplainButton({
  questionId,
  questionText,
  correctAnswer,
  studentAnswer,
  subject,
  grade,
}: AIExplainButtonProps) {
  const [loading, setLoading] = useState(false)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleExplain = async () => {
    if (explanation) {
      setExpanded(!expanded)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/explain-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          questionText,
          correctAnswer,
          studentAnswer,
          subject,
          grade,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setExplanation(data.explanation)
      setExpanded(true)
    } catch (e: any) {
      setError(
        'تعذر عرض الشرح نظراً لانشغال المساعد الذكي. يرجى المحاولة لاحقاً.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Remove formatExplanation since MathRenderer handles it better
  // Just strip bold asterisks from math expressions safely or rely on Gemini's output

  return (
    <div className="mt-4">
      <button
        onClick={handleExplain}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-200 transition-all hover:from-violet-600 hover:to-purple-700 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> جاري الشرح بالذكاء
            الاصطناعي...
          </>
        ) : explanation ? (
          <>
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}{' '}
            {expanded ? 'إخفاء الشرح' : 'عرض الشرح'}
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" /> اشرح لي أكثر 🤖
          </>
        )}
      </button>

      {error && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {explanation && expanded && (
        <div className="mt-3 rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-violet-50 to-purple-50 p-5 text-sm leading-relaxed text-slate-700">
          <div className="mb-3 flex items-center gap-2 border-b border-purple-200 pb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-purple-800">
              شرح مساعد الذكاء الاصطناعي
            </span>
          </div>
          <div className="prose prose-sm prose-purple max-w-none whitespace-pre-wrap">
            <MathRenderer text={explanation.replace(/\*\*(.*?)\*\*/g, '$1')} />
          </div>
        </div>
      )}
    </div>
  )
}
