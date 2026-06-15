'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Brain, Loader2, Mail, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('يرجى إدخال البريد الإلكتروني')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      )

      if (resetError) {
        setError('حدث خطأ: ' + resetError.message)
        return
      }

      setSuccess(true)
    } catch {
      setError('حدث خطأ غير متوقع.')
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
          <Link
            href="/"
            className="group inline-flex flex-col items-center gap-2 text-white"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/30 bg-white/15 shadow-xl backdrop-blur-sm transition-transform group-hover:scale-105">
              <Brain className="h-8 w-8 text-yellow-300" />
            </div>
            <div className="font-display text-2xl font-bold">استبق - مصر ( فاهم )</div>
          </Link>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-3xl bg-white p-8 shadow-2xl">
          <h1 className="mb-2 text-center font-display text-2xl font-bold">
            استعادة كلمة المرور
          </h1>

          {success ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mb-2 text-lg font-bold text-slate-800">
                تم إرسال رابط الاستعادة!
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-slate-600">
                يرجى التحقق من صندوق الوارد في بريدك الإلكتروني ({email}). ستجد
                رابطاً لتعيين كلمة مرور جديدة.
              </p>
              <Link
                href="/auth/login"
                className="flex items-center justify-center gap-1 font-bold text-primary hover:underline"
              >
                العودة لتسجيل الدخول{' '}
                <ArrowRight className="h-4 w-4 rotate-180" />
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-6 text-center text-sm text-muted-foreground">
                أدخل بريدك الإلكتروني المسجل لدينا وسنرسل لك رابطاً لإنشاء كلمة
                مرور جديدة.
              </p>

              {error && (
                <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <span className="text-red-500">⚠️</span>
                  {error}
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      dir="ltr"
                      className="block w-full rounded-xl border border-border bg-slate-50 py-3 pl-3 pr-10 text-sm transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary"
                      placeholder="student@example.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'إرسال رابط الاستعادة'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
                >
                  تذكرت كلمة المرور؟ العودة لتسجيل الدخول
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
