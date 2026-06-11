'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, AlertCircle, School, ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'

export default function SchoolLoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  // حالة TOTP: null = لا يوجد 2FA | 'verify' = يجب إدخال الكود
  const [mfaState, setMfaState] = useState<null | 'verify'>(null)
  const [totpCode, setTotpCode] = useState('')
  const [mfaLoading, setMfaLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data: signInData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (authError) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
        return
      }

      // فحص ما إذا كان الحساب يحتاج TOTP تحققاً مزدوجاً
      if (signInData.session?.user?.factors && signInData.session.user.factors.length > 0) {
        const unverifiedFactor = signInData.session.user.factors.find(
          (f: any) => f.factor_type === 'totp' && f.status === 'verified'
        )
        if (unverifiedFactor) {
          setMfaState('verify')
          return
        }
      }

      await verifyRoleAndRedirect()
    } catch {
      setError('حدث خطأ غير متوقع. حاول مجدداً')
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
          redirectTo: `${window.location.origin}/auth/callback?next=/school/dashboard`,
          queryParams: {
            hd: '*', // يسمح بجميع نطاقات Google Workspace
            prompt: 'select_account',
          },
        },
      })
      if (error) setError('فشل التسجيل عبر Google. حاول مجدداً.')
    } catch {
      setError('حدث خطأ غير متوقع.')
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setMfaLoading(true)
    setError('')
    try {
      const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({
        factorId: '', // يتم جلبه ديناميكياً
      })

      // جلب العوامل النشطة أولاً
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totpFactor = factors?.totp?.[0]

      if (!totpFactor) {
        setError('لا يوجد عامل TOTP مسجّل.')
        return
      }

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData?.id ?? '',
        code: totpCode.trim(),
      })

      if (verifyErr) {
        setError('كود التحقق المزدوج غير صحيح. حاول مجدداً.')
        return
      }

      await verifyRoleAndRedirect()
    } catch {
      setError('حدث خطأ أثناء التحقق. حاول مجدداً.')
    } finally {
      setMfaLoading(false)
    }
  }

  const verifyRoleAndRedirect = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profileRaw } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user!.id)
      .maybeSingle()
    const profile = profileRaw as any
    if (profile?.role !== 'school_admin' && profile?.role !== 'admin') {
      await supabase.auth.signOut()
      setError('هذا الحساب غير مسجّل كمدير مدرسة')
      return
    }
    window.location.href = '/school/dashboard'
  }

  // ── واجهة TOTP التحقق المزدوج ──────────────────────────────────────
  if (mfaState === 'verify') {
    return (
      <div className="bg-slate-950 text-slate-100 flex min-h-screen items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-sm">
          <div className="rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-8 shadow-2xl space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-cyan-950/40 border border-cyan-800/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="h-7 w-7 text-cyan-400" aria-hidden="true" />
              </div>
              <h1 className="text-xl font-bold text-white">التحقق المزدوج (2FA)</h1>
              <p className="text-xs text-slate-400 mt-1">أدخل الكود المؤلف من 6 أرقام من تطبيق المصادقة</p>
            </div>
            <form onSubmit={handleMfaVerify} className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                required
                autoFocus
                className="w-full text-center tracking-[0.5em] text-2xl font-bold bg-slate-950 text-white border border-slate-800 rounded-xl px-4 py-4 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                aria-label="كود التحقق المزدوج"
              />
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-900/30 bg-red-950/20 p-3 text-sm text-red-400" role="alert">
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={mfaLoading || totpCode.length !== 6}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 py-3.5 font-bold text-white disabled:opacity-60 transition-all"
              >
                {mfaLoading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-5 w-5" aria-hidden="true" />}
                {mfaLoading ? 'جاري التحقق...' : 'تأكيد الهوية'}
              </button>
              <button
                type="button"
                onClick={() => { setMfaState(null); setError('') }}
                className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors text-center"
              >
                ← العودة لتسجيل الدخول
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="bg-slate-950 text-slate-100 flex min-h-screen items-center justify-center p-4 relative overflow-hidden"
      dir="rtl"
    >
      {/* تأثيرات التدرج اللوني في الخلفية لمظهر بريميم */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-900/10 blur-[120px] pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" aria-hidden="true" />

      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          <Link href="/" className="group inline-block">
            <Logo variant="vertical" size="lg" light />
            <div className="mt-3 flex items-center justify-center gap-1.5 text-sm font-semibold text-cyan-400">
              <School className="h-4 w-4" aria-hidden="true" />
              بوابة الإدارة المدرسية الموحدة
            </div>
          </Link>
        </div>

        <div className="rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-8 shadow-2xl">
          <h1 className="mb-6 text-center font-display text-2xl font-bold tracking-tight text-white">
            تسجيل دخول المدارس
          </h1>

          {/* ── زر SSO بـ Google Workspace */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 py-3 font-bold text-sm text-white transition-all disabled:opacity-60 mb-5"
            aria-label="تسجيل الدخول بحساب Google"
          >
            {googleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-slate-300" aria-hidden="true" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {googleLoading ? 'جاري تسجيل الدخول...' : 'متابعة بحساب Google Workspace'}
          </button>

          {/* فاصل */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-600 font-semibold">أو بالبريد وكلمة المرور</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="school-email" className="mb-1.5 block text-xs font-bold text-slate-400 uppercase tracking-wider">
                البريد الإلكتروني للإدارة
              </label>
              <input
                id="school-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="school@fahem.com"
                className="w-full bg-slate-950/80 text-white placeholder-slate-600 border border-slate-800 rounded-xl px-4 py-3 text-sm transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                autoComplete="username"
              />
            </div>
            <div>
              <label htmlFor="school-password" className="mb-1.5 block text-xs font-bold text-slate-400 uppercase tracking-wider">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="school-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-950/80 text-white placeholder-slate-600 border border-slate-800 rounded-xl px-4 py-3 pl-12 pr-4 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-900/30 bg-red-950/20 p-3.5 text-sm text-red-400" role="alert">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 py-3.5 font-bold text-white hover:from-cyan-500 hover:to-indigo-500 transition-all shadow-lg shadow-cyan-500/10 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-cyan-200" aria-hidden="true" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                'دخول لوحة التحكم المدرسية'
              )}
            </button>
          </form>
          <div className="mt-6 text-center border-t border-slate-800/80 pt-5">
            <Link
              href="/auth/login"
              className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
            >
              ← دخول الطلاب والمعلمين
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
