'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

interface ApproveButtonProps {
  questionId: string
  currentStatus: string
}

export function QuestionApprovalButtons({
  questionId,
  currentStatus,
}: ApproveButtonProps) {
  const supabase = createClient()
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)

  const updateStatus = async (newStatus: string) => {
    setLoading(true)
    const { error } = await (supabase.from('questions') as any)
      .update({
        status: newStatus,
        is_approved: newStatus === 'approved',
      })
      .eq('id', questionId)

    if (!error) {
      setStatus(newStatus)
    }
    setLoading(false)
  }

  if (status === 'approved') {
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-600">
          <CheckCircle className="h-3.5 w-3.5" /> معتمد
        </span>
        <button
          onClick={() => updateStatus('draft')}
          disabled={loading}
          className="rounded-lg px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500"
        >
          إلغاء الاعتماد
        </button>
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600">
          <XCircle className="h-3.5 w-3.5" /> مرفوض
        </span>
        <button
          onClick={() => updateStatus('review')}
          disabled={loading}
          className="rounded-lg px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-primary/5 hover:text-primary"
        >
          إعادة للمراجعة
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-medium text-yellow-600">
        <Clock className="h-3.5 w-3.5" />{' '}
        {status === 'review' ? 'قيد المراجعة' : 'مسودة'}
      </span>
      <button
        onClick={() => updateStatus('approved')}
        disabled={loading}
        className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-50"
      >
        {loading ? '...' : '✓ اعتماد'}
      </button>
      <button
        onClick={() => updateStatus('rejected')}
        disabled={loading}
        className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
      >
        {loading ? '...' : '✗ رفض'}
      </button>
    </div>
  )
}
