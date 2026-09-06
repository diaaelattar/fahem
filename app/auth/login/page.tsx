'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  GraduationCap,
  Brain,
  School,
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Hash,
  Loader2,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Building,
  Trophy,
} from 'lucide-react'
import { Logo } from '@/components/shared/Logo'

type PortalType = 'student' | 'teacher' | 'school' | 'admin'

function LoginHubContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Tab State: default to url param or 'student'
  const initialPortal = (searchParams.get('portal') || searchParams.get('role') || 'student') as PortalType
  const [activePortal, setActivePortal] = useState<PortalType>(
    ['student', 'teacher', 'school', 'admin'].includes(initialPortal) ? initialPortal : 'student'
  )

  // Student sub-mode: 'email' or 'code'
  const [studentMode, setStudentMode] = useState<'email' | 'code'>('email')

  // Form Fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [studentCode, setStudentCode] = useState('')

  // TOTP 2FA for school/admin
  const [mfaState, setMfaState] = useState<null | 'verify'>(null)
  const [totpCode, setTotpCode] = useState('')
  const [mfaLoading, setMfaLoading] = useState(false)

  // Process states
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Update active portal when URL changes
  useEffect(() => {
    const p = searchParams.get('portal') || searchParams.get('role')
    if (p && ['student', 'teacher', 'school', 'admin'].includes(p)) {
      setActivePortal(p as PortalType)
    }
  }, [searchParams])

  // Clear errors when switching portal
  const handleSwitchPortal = (portal: PortalType) => {
    setActivePortal(portal)
    setError('')
    setSuccessMsg('')
    setMfaState(null)
  }

  // Unified Intelligent Redirect Engine
  const routeUserToDashboard = async (userId: string, userMetaRole?: string) => {
    let resolvedRole = userMetaRole

    // Fallback: Query profiles table if role is absent in user_metadata
    if (!resolvedRole) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, grade_id, school_id')
        .eq('id', userId)
        .maybeSingle()
      if (profile?.role) {
        resolvedRole = profile.role
      }
    }

    if (!resolvedRole) {
      resolvedRole = 'student' // default platform role
    }

    // Role-specific routing with clear user-friendly notifications
    if (resolvedRole === 'admin') {
      setSuccessMsg('تم التحقق بنجاح! جاري التوجيه للوحة الإدارة العامة...')
      setTimeout(() => {
        window.location.href = '/admin/dashboard'
      }, 800)
    } else if (resolvedRole === 'school_admin') {
      setSuccessMsg('تم تسجيل دخول مدير المدرسة بنجاح! جاري التوجيه لبوابة الإدارة المدرسية...')
      setTimeout(() => {
        window.location.href = '/school/dashboard'
      }, 800)
    } else if (resolvedRole === 'teacher') {
      // Check if teacher onboarding completed
      const { data: teacherRow } = await supabase
        .from('teachers')
        .select('subject_id')
        .eq('id', userId)
        .maybeSingle()

      if (!teacherRow?.subject_id) {
        setSuccessMsg('مرحباً بك يا معلمنا! جاري توجيهك لاستكمال مادتك...')
        setTimeout(() => {
          window.location.href = '/auth/teacher-onboarding'
        }, 800)
      } else {
        setSuccessMsg('تم تسجيل دخول المعلم بنجاح! جاري فتح مساحة عملك...')
        setTimeout(() => {
          window.location.href = '/teacher/dashboard'
        }, 800)
      }
    } else {
      // Student
      const { data: studentRow } = await supabase
        .from('students')
        .select('grade_id')
        .eq('id', userId)
        .maybeSingle()

      if (!studentRow?.grade_id) {
        setSuccessMsg('مرحباً بك يا بطل! جاري توجيهك لاختيار صفك الدراسي...')
        setTimeout(() => {
          window.location.href = '/student/onboarding'
        }, 800)
      } else {
        setSuccessMsg('تم تسجيل الدخول بنجاح! انطلق لتحدياتك واختباراتك...')
        setTimeout(() => {
          window.location.href = '/student/dashboard'
        }, 800)
      }
    }
  }

  // Handle Email & Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور')
      return
    }

    setLoading(true)
    setError('')
    setSuccessMsg('')

    try {
      const { data: signInData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError) {
        if (authError.message === 'Invalid login credentials') {
          setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
        } else {
          setError('حدث خطأ أثناء الدخول: ' + authError.message)
        }
        return
      }

      if (!signInData.user) {
        setError('حدث خطأ غير متوقع.')
        return
      }

      // Check if user has TOTP 2FA enabled
      if (signInData.session?.user?.factors && signInData.session.user.factors.length > 0) {
        const unverifiedFactor = signInData.session.user.factors.find(
          (f: any) => f.factor_type === 'totp' && f.status === 'verified'
        )
        if (unverifiedFactor) {
          setMfaState('verify')
          return
        }
      }

      await routeUserToDashboard(signInData.user.id, signInData.user.user_metadata?.role)
    } catch {
      setError('حدث خطأ في الاتصال بالخادم. تحقق من اتصال الإنترنت.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Student Code Login
  const handleStudentCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentCode.trim()) {
      setError('يرجى كتابة كود الطالب المُعطى لك من معلمك')
      return
    }

    setLoading(true)
    setError('')
    setSuccessMsg('')

    try {
      const res = await fetch('/api/auth/student-code-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentCode: studentCode.trim().toUpperCase() }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || 'الكود غير صحيح أو لم يعد مفعّلاً. راجع معلمك.')
        return
      }

      if (data.loginUrl) {
        setSuccessMsg('تم التحقق من كودك بنجاح! جاري إدخالك للمنصة...')
        setTimeout(() => {
          window.location.href = data.loginUrl
        }, 800)
      }
    } catch {
      setError('حدث خطأ في الاتصال. يرجى المحاولة مجدداً.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Google OAuth
  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError('')

    const redirectPath =
      activePortal === 'teacher'
        ? '/teacher/dashboard'
        : activePortal === 'school'
        ? '/school/dashboard'
        : '/student/dashboard'

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${redirectPath}&role=${activePortal}`,
          queryParams: {
            prompt: 'select_account',
          },
        },
      })
      if (error) setError('حدث خطأ أثناء تسجيل الدخول عبر Google.')
    } catch {
      setError('تعذر الاتصال بـ Google.')
    } finally {
      setGoogleLoading(false)
    }
  }

  // Handle MFA Verification
  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!totpCode.trim()) return

    setMfaLoading(true)
    setError('')

    try {
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totpFactor = factors?.totp?.[0]

      if (!totpFactor) {
        setError('لا يوجد عامل تحقق مزدوج مسجل لهذا الحساب.')
        return
      }

      const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      })

      if (challengeErr) {
        setError('فشل في إنشاء تحدي التحقق: ' + challengeErr.message)
        return
      }

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData?.id ?? '',
        code: totpCode.trim(),
      })

      if (verifyErr) {
        setError('كود التحقق غير صحيح. حاول مجدداً.')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await routeUserToDashboard(user.id, user.user_metadata?.role)
      }
    } catch {
      setError('حدث خطأ أثناء معالجة التحقق المزدوج.')
    } finally {
      setMfaLoading(false)
    }
  }

  // Visual Theme mapping per portal
  const portalMeta = {
    student: {
      title: 'بوابة الطلاب',
      subtitle: 'تحديات ذكية، امتحانات تفاعلية، ولوحة الشرف القومية',
      icon: GraduationCap,
      color: 'indigo',
      accentBg: 'bg-indigo-600',
      tabBorder: 'border-indigo-600',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    teacher: {
      title: 'بوابة المعلمين',
      subtitle: 'تحضير في ٤٥ ثانية، بنك أسئلة وزاري، وإدارة متطورة للفصول',
      icon: Brain,
      color: 'amber',
      accentBg: 'bg-amber-600',
      tabBorder: 'border-amber-600',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    school: {
      title: 'بوابة الإدارة المدرسية',
      subtitle: 'لوحة قيادة المجمع المدرسي، تقارير الاستيعاب، والكنترول',
      icon: School,
      color: 'cyan',
      accentBg: 'bg-cyan-700',
      tabBorder: 'border-cyan-700',
      badge: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    },
    admin: {
      title: 'الإدارة العامة للمنصة',
      subtitle: 'لوحة تحكم المشرفين والكنترول المركزي للنظام',
      icon: ShieldCheck,
      color: 'slate',
      accentBg: 'bg-slate-900',
      tabBorder: 'border-slate-900',
      badge: 'bg-slate-100 text-slate-800 border-slate-300',
    },
  }

  const current = portalMeta[activePortal]

  // ── TOTP 2FA Interface View ──
  if (mfaState === 'verify') {
    return (
      <div className="bg-hero-pattern flex min-h-screen items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <Link href="/" className="inline-block">
              <Logo variant="vertical" size="md" light />
            </Link>
          </div>
          <div className="rounded-3xl bg-white p-8 shadow-2xl space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-cyan-50 border border-cyan-200 rounded-2xl flex items-center justify-center mx-auto mb-4 text-cyan-700">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">التحقق المزدوج (2FA)</h1>
              <p className="text-xs text-slate-500 mt-1">أدخل الكود المكون من 6 أرقام من تطبيق المصادقة</p>
            </div>
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
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
                className="w-full text-center tracking-[0.5em] text-2xl font-bold bg-slate-50 text-slate-900 border-2 border-slate-200 rounded-xl px-4 py-4 focus:border-cyan-600 focus:outline-none"
              />
              <button
                type="submit"
                disabled={mfaLoading || totpCode.length < 6}
                className="w-full rounded-xl bg-cyan-700 hover:bg-cyan-800 py-3.5 text-sm font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {mfaLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'تأكيد ودخول البوابة'}
              </button>
            </form>
            <button
              onClick={() => setMfaState(null)}
              className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              الرجوع للخلف
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-hero-pattern flex min-h-screen items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-xl">
        {/* Top Logo */}
        <div className="mb-6 text-center">
          <Link href="/" className="group inline-block">
            <Logo variant="vertical" size="lg" light />
            <div className="mt-2 text-xs font-semibold text-blue-200">
              المنظومة التعليمية المتكاملة لجمهورية مصر العربية 🇪🇬
            </div>
          </Link>
        </div>

        {/* Main Card */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100">
          {/* ══ Portal Switcher Bar ══ */}
          <div className="bg-slate-50 p-2 border-b border-border">
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'student', label: 'الطلاب', icon: GraduationCap },
                { id: 'teacher', label: 'المعلمون', icon: Brain },
                { id: 'school', label: 'المدارس', icon: School },
                { id: 'admin', label: 'الإدارة', icon: ShieldCheck },
              ].map((p) => {
                const Icon = p.icon
                const isActive = activePortal === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSwitchPortal(p.id as PortalType)}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                    <span>{p.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ══ Portal Header Banner ══ */}
          <div className="border-b border-border bg-gradient-to-r from-slate-50 via-white to-slate-50 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${current.badge} border`}>
                <current.icon className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-black text-slate-900">{current.title}</h1>
                <p className="text-[11px] text-slate-500 font-medium">{current.subtitle}</p>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${current.badge}`}>
              تسجيل الدخول
            </span>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Status Messages */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-bold text-red-700 animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                {error}
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800 animate-fade-in">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                {successMsg}
              </div>
            )}

            {/* ══ STUDENT PORTAL SPECIAL SUB-TABS ══ */}
            {activePortal === 'student' && (
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => setStudentMode('email')}
                  className={`flex-1 rounded-lg py-2 transition-all ${
                    studentMode === 'email'
                      ? 'bg-white text-indigo-700 shadow-sm font-black'
                      : 'hover:text-slate-900'
                  }`}
                >
                  الدخول بالبريد / Google
                </button>
                <button
                  type="button"
                  onClick={() => setStudentMode('code')}
                  className={`flex-1 rounded-lg py-2 transition-all flex items-center justify-center gap-1.5 ${
                    studentMode === 'code'
                      ? 'bg-indigo-600 text-white shadow-sm font-black'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <Hash className="h-3.5 w-3.5" />
                  دخول سريع بكود الطالب (STU-)
                </button>
              </div>
            )}

            {/* ── Google OAuth Button (For student email, teacher, and school) ── */}
            {!(activePortal === 'student' && studentMode === 'code') && activePortal !== 'admin' && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading || googleLoading}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-800 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
                >
                  {googleLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
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
                  <span>
                    {activePortal === 'teacher'
                      ? 'المتابعة بحساب Google التعليمي'
                      : activePortal === 'school'
                      ? 'دخول مسؤولي المدارس عبر Google'
                      : 'المتابعة باستخدام Google'}
                  </span>
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 font-semibold text-slate-400">
                      أو باستخدام البريد وكلمة المرور
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* ── FORM 1: Student Code Login ── */}
            {activePortal === 'student' && studentMode === 'code' ? (
              <form onSubmit={handleStudentCodeLogin} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    كود الطالب المُعتمد
                  </label>
                  <div className="relative">
                    <Hash className="pointer-events-none absolute right-3.5 top-3.5 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      value={studentCode}
                      onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                      dir="ltr"
                      placeholder="STU-2025-XXXXX"
                      required
                      className="block w-full rounded-xl border-2 border-indigo-200 bg-indigo-50/30 py-3.5 pl-3 pr-11 text-center font-mono text-base font-black uppercase tracking-widest text-indigo-950 focus:border-indigo-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-black text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'دخول بالكود فوراً'}
                  <ArrowLeft className="h-4 w-4" />
                </button>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 leading-relaxed">
                  💡 <strong>أين تجد الكود؟</strong> يمكنك الحصول على الكود الخاص بك مباشرة من معلمك في الفصل أو المدرسة.
                </div>
              </form>
            ) : (
              /* ── FORM 2: Email & Password (Student email, Teacher, School, Admin) ── */
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    {activePortal === 'school'
                      ? 'البريد الإلكتروني المعتمد للمدرسة'
                      : activePortal === 'admin'
                      ? 'بريد المسؤول المعتمد'
                      : 'البريد الإلكتروني'}
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder={
                        activePortal === 'school'
                          ? 'principal@school.edu.eg'
                          : activePortal === 'teacher'
                          ? 'teacher@example.com'
                          : activePortal === 'admin'
                          ? 'admin@istabaq.eg'
                          : 'student@example.com'
                      }
                      className="w-full rounded-xl border border-border bg-slate-50/50 py-3 pl-3 pr-10 text-xs sm:text-sm font-medium text-slate-900 focus:border-primary focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-700">كلمة المرور</label>
                    <Link
                      href="/auth/forgot-password"
                      className="font-semibold text-primary hover:underline"
                    >
                      نسيت كلمة المرور؟
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-border bg-slate-50/50 py-3 pl-11 pr-10 text-xs sm:text-sm font-medium text-slate-900 focus:border-primary focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      className="absolute left-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black text-white shadow-md transition-all disabled:opacity-60 ${
                    activePortal === 'teacher'
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
                      : activePortal === 'school'
                      ? 'bg-cyan-700 hover:bg-cyan-800 shadow-cyan-200'
                      : activePortal === 'admin'
                      ? 'bg-slate-900 hover:bg-slate-800 shadow-slate-300'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                  }`}
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'تسجيل الدخول'}
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>

          {/* ══ Footer Registration Links ══ */}
          <div className="border-t border-border bg-slate-50 px-6 py-4 text-center">
            {activePortal === 'teacher' ? (
              <p className="text-xs font-semibold text-slate-600">
                معلم جديد في المنصة؟{' '}
                <Link
                  href="/auth/register?role=teacher"
                  className="font-bold text-amber-700 hover:underline inline-flex items-center gap-1"
                >
                  أنشئ حساب معلم مجاناً <ArrowLeft className="h-3 w-3" />
                </Link>
              </p>
            ) : activePortal === 'school' ? (
              <p className="text-xs font-semibold text-slate-600">
                ترغب في تسجيل مدرستك وحجز بوابتكم الخاصة؟{' '}
                <Link
                  href="/#schools"
                  className="font-bold text-cyan-800 hover:underline inline-flex items-center gap-1"
                >
                  سجل اهتمام المدرسة الآن <ArrowLeft className="h-3 w-3" />
                </Link>
              </p>
            ) : activePortal === 'admin' ? (
              <p className="text-xs font-semibold text-slate-500">
                بوابة الوصول المخصص لمسؤولي النظام فقط
              </p>
            ) : (
              <p className="text-xs font-semibold text-slate-600">
                ليس لديك حساب بعد؟{' '}
                <Link
                  href="/auth/register"
                  className="font-bold text-indigo-700 hover:underline inline-flex items-center gap-1"
                >
                  إنشاء حساب طالب مجاني <ArrowLeft className="h-3 w-3" />
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-hero-pattern flex items-center justify-center p-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      }
    >
      <LoginHubContent />
    </Suspense>
  )
}
