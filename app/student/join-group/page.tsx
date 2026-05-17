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
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in pt-8">
      <div className="flex items-center gap-4">
        <Link href="/student/dashboard" className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-800">الانضمام لمجموعة معلم</h1>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-border p-6 md:p-10 shadow-sm text-center">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Users className="w-10 h-10 text-indigo-600" />
        </div>
        
        <h2 className="text-xl font-bold mb-2">لديك كود دعوة؟</h2>
        <p className="text-slate-500 text-sm mb-8">
          أدخل الكود الذي أعطاك إياه معلمك للانضمام لمجموعته ورؤية الواجبات والاختبارات المخصصة لك.
        </p>

        {successMsg ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-6 rounded-2xl flex flex-col items-center gap-3">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
            <span className="font-bold">{successMsg}</span>
            <span className="text-xs">جاري توجيهك...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 max-w-sm mx-auto">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm font-bold">
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
                className="w-full border-2 border-slate-200 rounded-2xl px-6 py-4 text-center text-2xl tracking-[0.3em] font-black uppercase focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-300 placeholder:font-medium placeholder:tracking-normal placeholder:text-base"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-200"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'انضمام الآن'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
