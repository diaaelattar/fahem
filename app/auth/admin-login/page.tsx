'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Brain, Eye, EyeOff, Loader2, AlertCircle, Shield } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'

export default function AdminLoginPage() {
  const router = useRouter()
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
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profileRaw } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
      const profile = profileRaw as any
      if (profile?.role !== 'admin') {
        await supabase.auth.signOut()
        setError('هذه الصفحة مخصصة لمسؤولي النظام فقط')
        return
      }
      router.push('/admin/dashboard')
      router.refresh()
    } catch {
      setError('حدث خطأ غير متوقع. حاول مجدداً')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-hero-pattern flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block group">
            <Logo variant="vertical" size="lg" light />
            <div className="text-blue-200 text-sm mt-3 font-semibold">بوابة المسؤولين والأدمن</div>
          </Link>
        </div>


        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h1 className="text-xl font-display font-bold text-center mb-6">دخول المسؤول</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-semibold block mb-1.5">البريد الإلكتروني</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="admin@istabaq.eg"
                className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1.5">كلمة المرور</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary pr-4 pl-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" />جاري الدخول...</> : 'دخول لوحة الإدارة'}
            </button>
          </form>
          <div className="mt-5 text-center">
            <Link href="/auth/login" className="text-sm text-primary hover:underline">← دخول الطلاب</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
