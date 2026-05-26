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
    <div className="mb-6 overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-5 text-indigo-900 focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="text-right">
            <h3 className="text-lg font-bold">ملخص الدرس الذكي</h3>
            <p className="text-xs text-indigo-700/70">
              مراجعة سريعة لأهم قوانين ومفاهيم الدرس
            </p>
          </div>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/50">
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="mt-2 border-t border-indigo-100 p-6 pt-0">
          <div className="prose prose-sm prose-indigo rtl prose-p:my-2 prose-ul:my-2 max-w-none rounded-xl bg-white/60 p-5 text-sm leading-loose">
            <MathRenderer text={summary} />
          </div>
        </div>
      )}
    </div>
  )
}
