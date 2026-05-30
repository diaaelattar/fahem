'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, AlertCircle, School } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'

export default function SchoolLoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (authError) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
        return
      }
      const {
        data: { user },
      } = await supabase.auth.getUser()
      
      const { data: profileRaw } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user!.id)
        .maybeSingle()
        
      const profile = profileRaw as any
      if (profile?.role !== 'school_admin' && profile?.role !== 'admin') {
        await supabase.auth.signOut()
        setError('هذا الحساب غير مسجل كمدير مدرسة')
        return
      }
      
      // توجيه المستخدم إلى لوحة تحكم المدارس مع تحديث كوكيز الجلسة
      window.location.href = '/school/dashboard'
    } catch {
      setError('حدث خطأ غير متوقع. حاول مجدداً')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="bg-slate-950 text-slate-100 flex min-h-screen items-center justify-center p-4 relative overflow-hidden"
      dir="rtl"
    >
      {/* تأثيرات التدرج اللوني في الخلفية لمظهر بريميوم */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          <Link href="/" className="group inline-block">
            <Logo variant="vertical" size="lg" light />
            <div className="mt-3 flex items-center justify-center gap-1.5 text-sm font-semibold text-cyan-400">
              <School className="h-4 w-4" />
              بوابة الإدارة المدرسية الموحدة
            </div>
          </Link>
        </div>

        <div className="rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-8 shadow-2xl">
          <h1 className="mb-6 text-center font-display text-2xl font-bold tracking-tight text-white">
            تسجيل دخول المدارس
          </h1>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase tracking-wider">
                البريد الإلكتروني للإدارة
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="school@fahem.com"
                className="w-full bg-slate-950/80 text-white placeholder-slate-600 border border-slate-800 rounded-xl px-4 py-3 text-sm transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-400 uppercase tracking-wider">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-950/80 text-white placeholder-slate-600 border border-slate-800 rounded-xl px-4 py-3 pl-12 pr-4 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-900/30 bg-red-950/20 p-3.5 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
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
                  <Loader2 className="h-5 w-5 animate-spin text-cyan-200" />
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
