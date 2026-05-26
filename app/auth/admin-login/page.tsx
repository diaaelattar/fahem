'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'

export default function AdminLoginPage() {
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
      if (profile?.role !== 'admin') {
        await supabase.auth.signOut()
        setError('هذه الصفحة مخصصة لمسؤولي النظام فقط')
        return
      }
      // استخدام window.location.href لإجبار المتصفح على تحديث كامل
      // يضمن مزامنة كوكيز الجلسة مع الـ middleware قبل تحميل لوحة الإدارة
      window.location.href = '/admin/dashboard'
    } catch {
      setError('حدث خطأ غير متوقع. حاول مجدداً')
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
        <div className="mb-8 text-center">
          <Link href="/" className="group inline-block">
            <Logo variant="vertical" size="lg" light />
            <div className="mt-3 text-sm font-semibold text-blue-200">
              بوابة المسؤولين والأدمن
            </div>
          </Link>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-2xl">
          <h1 className="mb-6 text-center font-display text-xl font-bold">
            دخول المسؤول
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@istabaq.eg"
                className="w-full rounded-xl border border-border px-4 py-3 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border px-4 py-3 pl-12 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
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
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-bold text-white transition-all hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  جاري الدخول...
                </>
              ) : (
                'دخول لوحة الإدارة'
              )}
            </button>
          </form>
          <div className="mt-5 text-center">
            <Link
              href="/auth/login"
              className="text-sm text-primary hover:underline"
            >
              ← دخول الطلاب والمعلمين
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
