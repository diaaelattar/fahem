'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

interface ApproveButtonProps {
  questionId: string
  currentStatus: string
}

export function QuestionApprovalButtons({ questionId, currentStatus }: ApproveButtonProps) {
  const supabase = createClient()
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)

  const updateStatus = async (newStatus: string) => {
    setLoading(true)
    const { error } = await (supabase.from('questions') as any)
      .update({ 
        status: newStatus, 
        is_approved: newStatus === 'approved'
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
        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full font-medium">
          <CheckCircle className="w-3.5 h-3.5" /> معتمد
        </span>
        <button
          onClick={() => updateStatus('draft')}
          disabled={loading}
          className="text-xs text-gray-500 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
        >
          إلغاء الاعتماد
        </button>
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-full font-medium">
          <XCircle className="w-3.5 h-3.5" /> مرفوض
        </span>
        <button
          onClick={() => updateStatus('review')}
          disabled={loading}
          className="text-xs text-gray-500 hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary/5"
        >
          إعادة للمراجعة
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-full font-medium">
        <Clock className="w-3.5 h-3.5" /> {status === 'review' ? 'قيد المراجعة' : 'مسودة'}
      </span>
      <button
        onClick={() => updateStatus('approved')}
        disabled={loading}
        className="text-xs text-white bg-green-500 hover:bg-green-600 transition-colors px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
      >
        {loading ? '...' : '✓ اعتماد'}
      </button>
      <button
        onClick={() => updateStatus('rejected')}
        disabled={loading}
        className="text-xs text-white bg-red-500 hover:bg-red-600 transition-colors px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
      >
        {loading ? '...' : '✗ رفض'}
      </button>
    </div>
  )
}
