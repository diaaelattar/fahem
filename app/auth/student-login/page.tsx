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
    <div
      className="bg-hero-pattern flex min-h-screen items-center justify-center p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="group inline-block">
            <Logo variant="vertical" size="lg" light />
            <div className="mt-3 text-sm font-medium text-blue-200">
              تسجيل دخول الطلاب المضافين
            </div>
          </Link>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
          {/* Header strip */}
          <div className="border-b border-border bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4">
            <div className="flex items-center gap-3 text-slate-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                <Hash className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-bold">تسجيل الدخول بكود الطالب</p>
                <p className="text-xs text-slate-500">
                  للطلاب المضافين من قِبل معلمهم
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <h1 className="mb-2 text-center font-display text-2xl font-bold">
              أدخل كودك
            </h1>
            <p className="mb-8 text-center text-sm text-muted-foreground">
              الكود يبدأ بـ{' '}
              <span className="rounded bg-indigo-50 px-2 py-0.5 font-mono font-bold text-indigo-600">
                STU-
              </span>{' '}
              ويمكنك الحصول عليه من معلمك
            </p>

            {error && (
              <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <span>⚠️</span> {error}
              </div>
            )}

            {success && (
              <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                <CheckCircle className="h-5 w-5 shrink-0" />
                تم التحقق! جاري تسجيل الدخول…
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">
                  كود الطالب
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <Hash className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    dir="ltr"
                    placeholder="STU-2025-XXXXX"
                    className="block w-full rounded-xl border border-border bg-slate-50 py-4 pl-3 pr-10 text-center font-mono text-lg font-bold uppercase tracking-widest transition-colors focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || success}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 text-base font-bold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : success ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  'دخول بالكود'
                )}
              </button>
            </form>

            {/* Info box */}
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="mb-1 font-bold">📋 أين أجد الكود؟</p>
              <p className="leading-relaxed">
                اطلب من معلمك أن يُرسل لك كود الطالب الخاص بك.
                <br />
                يبدو مثل:{' '}
                <span className="font-mono font-bold">STU-2025-12345</span>
              </p>
            </div>
          </div>

          <div className="border-t border-border bg-slate-50 p-5 text-center">
            <p className="text-sm font-medium text-slate-600">
              لديك حساب عادي؟{' '}
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
              >
                تسجيل الدخول بالبريد{' '}
                <ArrowRight className="h-3.5 w-3.5 rotate-180" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
