'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Brain, Loader2, Lock, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    // Check if the user has an active session from the recovery link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('رابط الاستعادة غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.')
      }
    }
    checkSession()
  }, [supabase])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }
    
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })
      
      if (updateError) {
        setError('حدث خطأ أثناء تحديث كلمة المرور: ' + updateError.message)
        return
      }

      setSuccess(true)
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/student/dashboard')
      }, 3000)

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
          <h1 className="text-2xl font-display font-bold text-center mb-2">كلمة مرور جديدة</h1>
          
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">تم التحديث بنجاح!</h2>
              <p className="text-slate-600 text-sm mb-6">
                جاري توجيهك إلى لوحة التحكم الخاصة بك...
              </p>
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
            </div>
          ) : (
            <>
              <p className="text-muted-foreground text-center text-sm mb-6">
                يرجى إدخال كلمة المرور الجديدة وتأكيدها.
              </p>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-5">
                  <span className="text-red-500">⚠️</span>
                  {error}
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">كلمة المرور الجديدة</label>
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
                      required
                      minLength={6}
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
                      className="block w-full pl-3 pr-10 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-sm bg-slate-50 focus:bg-white transition-colors"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || error.includes('غير صالح')}
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-60 shadow-md mt-4"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'حفظ كلمة المرور والدخول'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
