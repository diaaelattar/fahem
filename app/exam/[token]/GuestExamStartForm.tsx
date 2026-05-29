'use client'
// app/exam/[token]/GuestExamStartForm.tsx
// نموذج إدخال الاسم وبدء الاختبار

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Loader2, Play } from 'lucide-react'

interface Props {
  token: string
  examId: string
}

export function GuestExamStartForm({ token }: Props) {
  const router = useRouter()
  const [guestName, setGuestName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!guestName.trim()) {
      setError('يرجى إدخال اسمك أولاً')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/exam/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          token,
          guestName: guestName.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ أثناء بدء الاختبار')
      }

      // حفظ بيانات الاختبار في sessionStorage
      sessionStorage.setItem(
        `guest_exam_${data.attemptId}`,
        JSON.stringify({
          guestName: guestName.trim(),
          exam: data.exam,
          questions: data.questions,
        })
      )

      // توجيه لصفحة الحل
      router.push(`/exam/${token}/take?attemptId=${data.attemptId}`)
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleStart} className="space-y-4">
      <div>
        <label
          htmlFor="guestName"
          className="mb-2 block text-sm font-bold text-slate-700"
        >
          اسمك الكامل
        </label>
        <div className="relative">
          <User className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="guestName"
            type="text"
            value={guestName}
            onChange={(e) => {
              setGuestName(e.target.value)
              setError(null)
            }}
            placeholder="مثال: أحمد محمد علي"
            maxLength={100}
            required
            className={`w-full rounded-2xl border-2 bg-slate-50 py-4 pr-11 pl-4 text-right font-bold text-slate-800 outline-none transition-all placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white ${
              error ? 'border-rose-400' : 'border-slate-200'
            }`}
          />
        </div>
        {error && (
          <p className="mt-2 text-sm font-medium text-rose-600">{error}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || !guestName.trim()}
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 py-4 text-base font-black text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700 hover:shadow-emerald-300 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            جاري التحضير...
          </>
        ) : (
          <>
            <Play className="h-5 w-5" />
            ابدأ الاختبار الآن
          </>
        )}
      </button>
    </form>
  )
}
