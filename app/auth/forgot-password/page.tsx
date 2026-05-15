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
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      
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
    <div className="min-h-screen bg-hero-pattern flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2 text-white group">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform">
              <Brain className="w-8 h-8 text-yellow-300" />
            </div>
            <div className="text-2xl font-display font-bold">استباق مصر</div>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden p-8">
          <h1 className="text-2xl font-display font-bold text-center mb-2">استعادة كلمة المرور</h1>
          
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-2">تم إرسال رابط الاستعادة!</h2>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                يرجى التحقق من صندوق الوارد في بريدك الإلكتروني ({email}). ستجد رابطاً لتعيين كلمة مرور جديدة.
              </p>
              <Link href="/auth/login" className="text-primary font-bold hover:underline flex items-center justify-center gap-1">
                العودة لتسجيل الدخول <ArrowRight className="w-4 h-4 rotate-180" />
              </Link>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground text-center text-sm mb-6">
                أدخل بريدك الإلكتروني المسجل لدينا وسنرسل لك رابطاً لإنشاء كلمة مرور جديدة.
              </p>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-5">
                  <span className="text-red-500">⚠️</span>
                  {error}
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-5">
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
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl transition-all disabled:opacity-60 shadow-md"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'إرسال رابط الاستعادة'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/auth/login" className="text-sm text-slate-500 font-medium hover:text-slate-800 transition-colors">
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
