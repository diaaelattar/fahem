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
  grade
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
          grade
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setExplanation(data.explanation)
      setExpanded(true)
    } catch (e: any) {
      setError(e.message || 'فشل في جلب الشرح، حاول مرة أخرى')
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
        className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg shadow-purple-200 disabled:opacity-60 w-full justify-center"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> جاري الشرح بالذكاء الاصطناعي...</>
        ) : explanation ? (
          <>{expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />} {expanded ? 'إخفاء الشرح' : 'عرض الشرح'}</>
        ) : (
          <><Sparkles className="w-4 h-4" /> اشرح لي أكثر 🤖</>
        )}
      </button>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {explanation && expanded && (
        <div className="mt-3 bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-purple-200 rounded-2xl p-5 text-sm leading-relaxed text-slate-700">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-purple-200">
            <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-purple-800 text-base">شرح مساعد الذكاء الاصطناعي</span>
          </div>
          <div className="prose prose-sm prose-purple max-w-none whitespace-pre-wrap">
            <MathRenderer text={explanation.replace(/\*\*(.*?)\*\*/g, '$1')} />
          </div>
        </div>
      )}
    </div>
  )
}
