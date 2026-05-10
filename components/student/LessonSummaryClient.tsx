'use client'

import { useState } from 'react'
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { MathRenderer } from '@/components/ui/MathRenderer'

interface Props {
  summary: string
}

export function LessonSummaryClient({ summary }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  if (!summary) return null

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl overflow-hidden mb-6 transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-indigo-900 focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="text-right">
            <h3 className="font-bold text-lg">ملخص الدرس الذكي</h3>
            <p className="text-xs text-indigo-700/70">مراجعة سريعة لأهم قوانين ومفاهيم الدرس</p>
          </div>
        </div>
        <div className="w-8 h-8 bg-white/50 rounded-full flex items-center justify-center">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-6 pt-0 border-t border-indigo-100 mt-2">
          <div className="bg-white/60 rounded-xl p-5 text-sm leading-loose prose prose-sm prose-indigo rtl prose-p:my-2 prose-ul:my-2 max-w-none">
            <MathRenderer text={summary} />
          </div>
        </div>
      )}
    </div>
  )
}
