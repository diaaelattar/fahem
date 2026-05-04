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
          }
        }
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
    <div className="min-h-screen bg-hero-pattern flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2 text-white group">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform">
              <Brain className="w-8 h-8 text-yellow-300" />
            </div>
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

            <form onSubmit={handleRegister} className="space-y-4 mb-2">
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
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-60 shadow-md mt-6"
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
