'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { joinGroupAction } from './actions'
import { ArrowRight, Loader2, Users, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function JoinGroupPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMsg('')

    const formData = new FormData(e.currentTarget)

    try {
      const res = await joinGroupAction(formData)
      setSuccessMsg(`تم الانضمام بنجاح لمجموعة: ${res.groupName}! 🎉`)
      setTimeout(() => {
        router.push('/student/dashboard')
      }, 2000)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl animate-fade-in space-y-6 pt-8">
      <div className="flex items-center gap-4">
        <Link
          href="/student/dashboard"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
        >
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-800">
            الانضمام لمجموعة معلم
          </h1>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-white p-6 text-center shadow-sm md:p-10">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50">
          <Users className="h-10 w-10 text-indigo-600" />
        </div>

        <h2 className="mb-2 text-xl font-bold">لديك كود دعوة؟</h2>
        <p className="mb-8 text-sm text-slate-500">
          أدخل الكود الذي أعطاك إياه معلمك للانضمام لمجموعته ورؤية الواجبات
          والاختبارات المخصصة لك.
        </p>

        {successMsg ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-700">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
            <span className="font-bold">{successMsg}</span>
            <span className="text-xs">جاري توجيهك...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-6">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
                {error}
              </div>
            )}

            <div>
              <input
                type="text"
                name="code"
                required
                maxLength={6}
                placeholder="مثال: X7M9K"
                className="w-full rounded-2xl border-2 border-slate-200 px-6 py-4 text-center text-2xl font-black uppercase tracking-[0.3em] outline-none transition-all placeholder:text-base placeholder:font-medium placeholder:tracking-normal placeholder:text-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-8 py-4 font-black text-white shadow-xl shadow-indigo-200 transition-all hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                'انضمام الآن'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
