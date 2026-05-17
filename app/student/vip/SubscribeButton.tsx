'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface Props {
  planId: string
  isPrimary?: boolean
  disabled?: boolean
}

export function SubscribeButton({ planId, isPrimary, disabled }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubscribe = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/checkout/paymob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ في بدء عملية الدفع')
      }

      if (data.url) {
        // Redirect to PayMob iframe
        window.location.href = data.url
      } else {
        throw new Error('لم يتم إرجاع رابط الدفع')
      }

    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <div className="text-red-500 text-sm mb-3 font-medium text-center">
          {error}
        </div>
      )}
      <button
        onClick={handleSubscribe}
        disabled={loading || disabled}
        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          isPrimary
            ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
        }`}
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : disabled ? 'مشترك بالفعل' : 'اشترك الآن'}
      </button>
    </div>
  )
}
