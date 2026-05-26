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
        body: JSON.stringify({ planId }),
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
        <div className="mb-3 text-center text-sm font-medium text-red-500">
          {error}
        </div>
      )}
      <button
        onClick={handleSubscribe}
        disabled={loading || disabled}
        className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
          isPrimary
            ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90'
            : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
        }`}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : disabled ? (
          'مشترك بالفعل'
        ) : (
          'اشترك الآن'
        )}
      </button>
    </div>
  )
}
