'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/shared/Logo'
import { Hash, Loader2, ArrowRight, CheckCircle } from 'lucide-react'

export default function StudentCodeLoginPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      setError('يرجى إدخال كود الطالب')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/student-code-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentCode: code.trim() }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || 'حدث خطأ. حاول مجدداً.')
        return
      }

      if (data.loginUrl) {
        // توجيه مباشر عبر magic link
        setSuccess(true)
        setTimeout(() => {
          window.location.href = data.loginUrl
        }, 800)
      }
    } catch {
      setError('حدث خطأ في الاتصال. تحقق من الإنترنت.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-hero-pattern flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block group">
            <Logo variant="vertical" size="lg" light />
            <div className="text-blue-200 text-sm mt-3 font-medium">تسجيل دخول الطلاب المضافين</div>
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Header strip */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-border px-6 py-4">
            <div className="flex items-center gap-3 text-slate-700">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Hash className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-bold text-sm">تسجيل الدخول بكود الطالب</p>
                <p className="text-xs text-slate-500">للطلاب المضافين من قِبل معلمهم</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <h1 className="text-2xl font-display font-bold text-center mb-2">أدخل كودك</h1>
            <p className="text-muted-foreground text-center text-sm mb-8">
              الكود يبدأ بـ <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">STU-</span> ويمكنك الحصول عليه من معلمك
            </p>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-5">
                <span>⚠️</span> {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm mb-5">
                <CheckCircle className="w-5 h-5 shrink-0" />
                تم التحقق! جاري تسجيل الدخول…
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  كود الطالب
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    dir="ltr"
                    placeholder="STU-2025-XXXXX"
                    className="block w-full pl-3 pr-10 py-4 border border-border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-lg font-mono font-bold bg-slate-50 focus:bg-white transition-colors tracking-widest uppercase"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || success}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-60 shadow-sm text-base"
              >
                {loading
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : success
                  ? <CheckCircle className="w-5 h-5" />
                  : 'دخول بالكود'}
              </button>
            </form>

            {/* Info box */}
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <p className="font-bold mb-1">📋 أين أجد الكود؟</p>
              <p className="leading-relaxed">
                اطلب من معلمك أن يُرسل لك كود الطالب الخاص بك.<br />
                يبدو مثل: <span className="font-mono font-bold">STU-2025-12345</span>
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border-t border-border p-5 text-center">
            <p className="text-sm text-slate-600 font-medium">
              لديك حساب عادي؟{' '}
              <Link href="/auth/login" className="text-primary font-bold hover:underline inline-flex items-center gap-1">
                تسجيل الدخول بالبريد <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
