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
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error || !user) {
        setError(
          'رابط الاستعادة غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.'
        )
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
        password: password,
      })

      if (updateError) {
        setError('حدث خطأ أثناء تحديث كلمة المرور: ' + updateError.message)
        return
      }

      setSuccess(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      const { data: profile } = user
        ? await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()
        : { data: null }

      // Refresh to synchronize cookies/session with Server Components
      router.refresh()

      // Redirect after 3 seconds
      setTimeout(() => {
        if (profile?.role === 'admin') {
          router.push('/admin/dashboard')
        } else if (profile?.role === 'teacher') {
          router.push('/teacher/dashboard')
        } else {
          router.push('/student/dashboard')
        }
      }, 3000)
    } catch {
      setError('حدث خطأ غير متوقع.')
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
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/30 bg-white/15 shadow-xl backdrop-blur-sm transition-transform group-hover:scale-105">
              <Brain className="h-8 w-8 text-yellow-300" />
            </div>
            <div className="font-display text-2xl font-bold">استبق - مصر ( فاهم )</div>
          </Link>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-3xl bg-white p-8 shadow-2xl">
          <h1 className="mb-2 text-center font-display text-2xl font-bold">
            كلمة مرور جديدة
          </h1>

          {success ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 animate-bounce items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-slate-800">
                تم التحديث بنجاح!
              </h2>
              <p className="mb-6 text-sm text-slate-600">
                جاري توجيهك إلى لوحة التحكم الخاصة بك...
              </p>
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <p className="mb-6 text-center text-sm text-muted-foreground">
                يرجى إدخال كلمة المرور الجديدة وتأكيدها.
              </p>

              {error && (
                <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <span className="text-red-500">⚠️</span>
                  {error}
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">
                    كلمة المرور الجديدة
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
                      className="block w-full rounded-xl border border-border bg-slate-50 py-3 pl-3 pr-10 text-sm transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary"
                      placeholder="••••••••"
                      required
                      minLength={6}
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
                      className="block w-full rounded-xl border border-border bg-slate-50 py-3 pl-3 pr-10 text-sm transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || error.includes('غير صالح')}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-3.5 font-bold text-white shadow-md transition-all hover:bg-slate-700 disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'حفظ كلمة المرور والدخول'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
