'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Brain, Loader2, Swords, Trophy, Zap, Mail, Lock, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
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

      router.push('/student/dashboard')
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
    { icon: Swords,  text: 'تحديات مباشرة مع زملائك' },
    { icon: Trophy,  text: 'لوحة الشرف الوطنية' },
    { icon: Zap,     text: 'أسئلة مكيّفة بالذكاء الاصطناعي' },
    { icon: Brain,   text: 'تتبع تقدمك ونقاط ضعفك' },
  ]

  return (
    <div className="min-h-screen bg-hero-pattern flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2 text-white group">
            <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform">
              <Brain className="w-11 h-11 text-yellow-300" />
            </div>
            <div className="text-3xl font-display font-bold">استباق مصر</div>
            <div className="text-blue-200 text-sm">منصة التدريب والتحديات للمرحلة الإعدادية</div>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Features strip */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-border px-6 py-4">
            <div className="grid grid-cols-2 gap-2">
              {features.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8">
            <h1 className="text-2xl font-display font-bold text-center mb-1">تسجيل الدخول</h1>
            <p className="text-muted-foreground text-center text-sm mb-6">
              مرحباً بك مجدداً يا صديقي!
            </p>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-5">
                <span className="text-red-500">⚠️</span>
                {error}
              </div>
            )}

            </form>

            {/* Google Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:border-primary hover:bg-slate-50 text-slate-800 font-bold py-4 rounded-xl transition-all disabled:opacity-60 shadow-sm mb-6 text-lg"
            >
              {googleLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              ) : (
                <svg className="w-7 h-7" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              المتابعة باستخدام Google
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-muted-foreground font-medium text-xs uppercase tracking-wider">أو باستخدام البريد</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">البريد الإلكتروني</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    dir="ltr"
                    className="block w-full pl-3 pr-10 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-sm bg-slate-50 focus:bg-white transition-colors"
                    placeholder="student@example.com"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">كلمة المرور</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    dir="ltr"
                    className="block w-full pl-3 pr-10 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-sm bg-slate-50 focus:bg-white transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-60 shadow-sm mt-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تسجيل الدخول'}
              </button>
            </form>
          
          <div className="bg-slate-50 border-t border-border p-6 text-center">
            <p className="text-sm text-slate-600 font-medium">
              طالب جديد؟ {' '}
              <Link href="/auth/register" className="text-primary font-bold hover:underline flex items-center justify-center gap-1 mt-1">
                إنشاء حساب مجاني <ArrowRight className="w-4 h-4 rotate-180" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
