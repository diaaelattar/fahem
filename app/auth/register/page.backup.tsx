'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Brain, Loader2, Mail, Lock, User, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName || !email || !password || !confirmPassword) {
      setError('يرجى ملء جميع الحقول')
      return
    }

    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }

    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 1. Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.')
        } else {
          setError('حدث خطأ أثناء إنشاء الحساب: ' + authError.message)
        }
        return
      }

      if (!authData.user) {
        setError('حدث خطأ غير متوقع.')
        return
      }

      // 2. Create Profile and Student records
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        email: email,
        full_name: fullName,
        role: 'student',
      })

      await supabase.from('students').upsert({
        id: authData.user.id,
        xp_points: 0,
        level: 1,
        streak_days: 0,
      })

      // 3. Redirect to onboarding
      router.push('/student/onboarding')
    } catch (err: any) {
      setError('حدث خطأ غير متوقع: ' + err.message)
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
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/30 bg-white/15 shadow-2xl backdrop-blur-sm transition-transform group-hover:scale-105">
              <Brain className="h-8 w-8 text-yellow-300" />
            </div>
            <div className="font-display text-2xl font-bold">استباق مصر</div>
          </Link>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="p-8">
            <h1 className="mb-1 text-center font-display text-2xl font-bold">
              إنشاء حساب جديد
            </h1>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              انضم لآلاف الطلاب وابدأ رحلتك التعليمية الممتعة!
            </p>

            {error && (
              <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <span className="text-red-500">⚠️</span>
                {error}
              </div>
            )}

            {/* Google Registration Button */}
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
                  أو بالتسجيل اليدوي
                </span>
              </div>
            </div>

            <form onSubmit={handleRegister} className="mb-2 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">
                  الاسم الكامل
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full rounded-xl border border-border py-3 pl-3 pr-10 text-sm focus:border-primary focus:ring-2 focus:ring-primary"
                    placeholder="محمد أحمد"
                  />
                </div>
              </div>

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
                    className="block w-full rounded-xl border border-border py-3 pl-3 pr-10 text-sm focus:border-primary focus:ring-2 focus:ring-primary"
                    placeholder="student@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">
                  كلمة المرور
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    dir="ltr"
                    className="block w-full rounded-xl border border-border py-3 pl-3 pr-10 text-sm focus:border-primary focus:ring-2 focus:ring-primary"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">
                  تأكيد كلمة المرور
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    dir="ltr"
                    className="block w-full rounded-xl border border-border py-3 pl-3 pr-10 text-sm focus:border-primary focus:ring-2 focus:ring-primary"
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
                  'إنشاء الحساب 🚀'
                )}
              </button>
            </form>
          </div>

          <div className="border-t border-border bg-slate-50 p-6 text-center">
            <p className="text-sm font-medium text-slate-600">
              لديك حساب بالفعل؟{' '}
              <Link
                href="/auth/login"
                className="mt-1 flex items-center justify-center gap-1 font-bold text-primary hover:underline"
              >
                تسجيل الدخول <ArrowRight className="h-4 w-4 rotate-180" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
