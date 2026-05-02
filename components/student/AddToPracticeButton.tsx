'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Check, Loader2 } from 'lucide-react'

interface Props {
  questionIds: string[]
  attemptId: string
  studentId: string
}

export function AddToPracticeButton({ questionIds, attemptId, studentId }: Props) {
  const supabase = createClient() as any
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleAdd = async () => {
    if (done || loading || questionIds.length === 0) return
    setLoading(true)

    try {
      // إضافة كل سؤال خاطئ لبنك التدريب
      for (const qId of questionIds) {
        await supabase.rpc('add_to_wrong_answers', {
          p_student_id: studentId,
          p_question_id: qId,
          p_attempt_id: attemptId
        })
      }
      setDone(true)
    } catch (err) {
      console.error('Failed to add to practice:', err)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-sm font-bold text-green-600 bg-green-50 border border-green-200 px-4 py-2 rounded-full">
        <Check className="w-4 h-4" />
        أُضيفت للتدريب!
      </div>
    )
  }

  return (
    <button
      onClick={handleAdd}
      disabled={loading}
      className="flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-full hover:bg-indigo-100 hover:border-indigo-400 transition-all disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <BookOpen className="w-4 h-4" />
      )}
      {loading ? 'جاري الإضافة...' : `أضف ${questionIds.length} خطأ للتدريب`}
    </button>
  )
}
