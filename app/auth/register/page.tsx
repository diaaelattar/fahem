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

  const [role, setRole] = useState<'student' | 'teacher'>('student')

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?role=${role}`,
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
            role: role // Save role in user metadata
          }
        }
      })
      
      if (authError) {
        if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
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

      // 2. Create Profile and corresponding record
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        email: email,
        full_name: fullName,
        role: role,
      })

      if (role === 'student') {
        await supabase.from('students').upsert({
          id: authData.user.id,
          xp_points: 0,
          level: 1,
          streak_days: 0,
        })
        router.push('/student/onboarding')
      } else if (role === 'teacher') {
        await supabase.from('teachers').upsert({
          id: authData.user.id,
          subscription_status: 'premium' // Free/Premium for now
        })
        router.push('/teacher/dashboard')
      }

    } catch (err: any) {
      setError('حدث خطأ غير متوقع: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-hero-pattern flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2 text-white group">
            <img src="/logo.png" alt="استباق مصر فاهم" className="w-24 h-24 object-contain group-hover:scale-105 transition-transform drop-shadow-2xl" />
            <div className="text-2xl font-display font-bold">استباق مصر</div>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8">
            <h1 className="text-2xl font-display font-bold text-center mb-1">إنشاء حساب جديد</h1>
            <p className="text-muted-foreground text-center text-sm mb-6">
              انضم لآلاف الطلاب وابدأ رحلتك التعليمية الممتعة!
            </p>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-5">
                <span className="text-red-500">⚠️</span>
                {error}
              </div>
            )}

            {/* Google Registration Button */}
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
                <span className="px-3 bg-white text-muted-foreground font-medium text-xs uppercase tracking-wider">أو بالتسجيل اليدوي</span>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-4 mb-2">
              
              {/* Role Selection Toggle */}
              <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    role === 'student'
                      ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <User className="w-4 h-4" /> أنا طالب
                </button>
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    role === 'teacher'
                      ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Brain className="w-4 h-4" /> أنا معلم
                </button>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">الاسم الكامل</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full pl-3 pr-10 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                    placeholder="محمد أحمد"
                  />
                </div>
              </div>

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
                    className="block w-full pl-3 pr-10 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-sm"
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
                    className="block w-full pl-3 pr-10 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">تأكيد كلمة المرور</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    dir="ltr"
                    className="block w-full pl-3 pr-10 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-60 shadow-sm mt-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'إنشاء الحساب 🚀'}
              </button>
            </form>
          </div>
          
          <div className="bg-slate-50 border-t border-border p-6 text-center">
            <p className="text-sm text-slate-600 font-medium">
              لديك حساب بالفعل؟ {' '}
              <Link href="/auth/login" className="text-primary font-bold hover:underline flex items-center justify-center gap-1 mt-1">
                تسجيل الدخول <ArrowRight className="w-4 h-4 rotate-180" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
