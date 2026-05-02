'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Brain, Loader2, Swords, Trophy, Zap } from 'lucide-react'

export default function LoginPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleLogin = async () => {
    setLoading(true)
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
      setLoading(false)
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
            <h1 className="text-2xl font-display font-bold text-center mb-1">سجّل الدخول</h1>
            <p className="text-muted-foreground text-center text-sm mb-8">
              مجاناً تماماً — لا تحتاج بطاقة ائتمان
            </p>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-5">
                <span className="text-red-500">⚠️</span>
                {error}
              </div>
            )}

            {/* Google Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-primary/40 hover:bg-blue-50/50 text-gray-700 font-bold py-4 rounded-2xl transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md text-base group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              ) : (
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {loading ? 'جاري التسجيل...' : 'الدخول بحساب Google'}
            </button>

            <div className="mt-5 text-center">
              <p className="text-xs text-muted-foreground leading-relaxed">
                بالدخول، أنت توافق على{' '}
                <span className="text-primary font-medium cursor-pointer hover:underline">شروط الاستخدام</span>
                {' '}و{' '}
                <span className="text-primary font-medium cursor-pointer hover:underline">سياسة الخصوصية</span>
              </p>
            </div>

            {/* Admin link */}
            <div className="mt-6 pt-5 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                مسؤول النظام؟{' '}
                <Link href="/auth/admin-login" className="text-primary font-bold hover:underline">
                  دخول الإدارة
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

