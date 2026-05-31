'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Brain,
  Loader2,
  Swords,
  Trophy,
  Zap,
  Mail,
  Lock,
  ArrowRight,
} from 'lucide-react'
import { Logo } from '@/components/shared/Logo'

export default function LoginPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        if (authError.message === 'Invalid login credentials') {
          setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
        } else {
          setError('حدث خطأ أثناء تسجيل الدخول: ' + authError.message)
        }
        return
      }

      // ✅ Fetch user role and redirect to the correct dashboard
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError('حدث خطأ غير متوقع.')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      // ── استخدام window.location.href بدلاً من router.push لإجبار المتصفح ──
      // على تحديث كامل يضمن مزامنة كوكيز الجلسة مع الـ middleware
      if (profile?.role === 'admin') {
        window.location.href = '/admin/dashboard'
      } else if (profile?.role === 'teacher') {
        window.location.href = '/teacher/dashboard'
      } else if (profile?.role === 'student') {
        const { data: student } = await supabase
          .from('students')
          .select('grade_id')
          .eq('id', user.id)
          .maybeSingle()

        if (!student?.grade_id) {
          window.location.href = '/student/onboarding'
        } else {
          window.location.href = '/student/dashboard'
        }
      } else {
        setError('حسابك غير مكتمل أو غير مسجل كطالب/معلم.')
      }
    } catch {
      setError('حدث خطأ غير متوقع.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { prompt: 'select_account' },
        },
      })
      if (error) setError('حدث خطأ أثناء التسجيل. حاول مجدداً.')
    } catch {
      setError('حدث خطأ غير متوقع.')
    } finally {
      setGoogleLoading(false)
    }
  }

  const features = [
    { icon: Swords, text: 'تحديات مباشرة مع زملائك' },
    { icon: Trophy, text: 'لوحة الشرف الوطنية' },
    { icon: Zap, text: 'أسئلة مكيّفة بالذكاء الاصطناعي' },
    { icon: Brain, text: 'تتبع تقدمك ونقاط ضعفك' },
  ]

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
              منصة التدريب والتحديات للمرحلة الإعدادية
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
          {/* Features strip */}
          <div className="border-b border-border bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4">
            <div className="grid grid-cols-2 gap-2">
              {features.map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-2 text-xs font-medium text-slate-600"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8">
            <h1 className="mb-1 text-center font-display text-2xl font-bold">
              تسجيل الدخول
            </h1>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              مرحباً بك مجدداً يا صديقي!
            </p>

            {error && (
              <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <span className="text-red-500">⚠️</span>
                {error}
              </div>
            )}

            {/* Google Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
              className="mb-6 flex w-full items-center justify-center gap-3 rounded-xl border-2 border-slate-200 bg-white py-4 text-lg font-bold text-slate-800 shadow-sm transition-all hover:border-primary hover:bg-slate-50 disabled:opacity-60"
            >
              {googleLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <svg className="h-7 w-7" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              المتابعة باستخدام Google
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  أو باستخدام البريد
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
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
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-sm font-bold text-slate-700">
                    كلمة المرور
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    نسيت كلمة المرور؟
                  </Link>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    dir="ltr"
                    className="block w-full rounded-xl border border-border bg-slate-50 py-3 pl-3 pr-10 text-sm transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-3.5 font-bold text-white shadow-sm transition-all hover:bg-slate-700 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'تسجيل الدخول'
                )}
              </button>
            </form>
          </div>

          <div className="space-y-3 border-t border-border bg-slate-50 p-6 text-center">
            <p className="text-sm font-medium text-slate-600">
              مستخدم جديد؟{' '}
              <Link
                href="/auth/register"
                className="mt-1 flex items-center justify-center gap-1 font-bold text-primary hover:underline"
              >
                إنشاء حساب مجاني <ArrowRight className="h-4 w-4 rotate-180" />
              </Link>
            </p>
            <div className="border-t border-border pt-3 space-y-2">
              <Link
                href="/auth/student-login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
              >
                🎓 طالب مُضاف من معلمك؟ ادخل بالكود
              </Link>
              <Link
                href="/auth/school/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-bold text-cyan-700 transition-colors hover:bg-cyan-100"
              >
                🏫 بوابة الإدارة المدرسية والمنشآت
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
