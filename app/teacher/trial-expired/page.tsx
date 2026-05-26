'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Clock, LogOut, Mail, ShieldCheck, AlertTriangle } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'

export default function TrialExpiredPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.replace('/auth/login')
  }

  return (
    <div
      className="bg-hero-pattern flex min-h-screen items-center justify-center p-4"
      dir="rtl"
    >
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Logo variant="vertical" size="lg" light />
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
          {/* Header gradient */}
          <div className="relative overflow-hidden bg-gradient-to-l from-amber-500 to-orange-500 p-8 text-center">
            <div className="pointer-events-none absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative z-10">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <Clock className="h-10 w-10 text-white" />
              </div>
              <h1 className="mb-1 text-2xl font-black text-white">
                انتهت فترتك التجريبية
              </h1>
              <p className="text-sm font-medium text-amber-100">
                الـ 15 يوم التجريبية قد انتهت
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="space-y-6 p-8">
            {/* Description */}
            <div className="text-center">
              <p className="font-medium leading-relaxed text-slate-700">
                انتهت فترتك التجريبية المجانية على منصة{' '}
                <span className="font-black text-indigo-700">استباق مصر</span>.
                <br />
                لاستمرار وصولك الكامل، يرجى التواصل مع الإدارة لتفعيل حسابك بشكل
                دائم.
              </p>
            </div>

            {/* Info boxes */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <div>
                  <p className="text-sm font-bold text-blue-900">
                    التفعيل الدائم مجاني تماماً
                  </p>
                  <p className="mt-0.5 text-xs text-blue-700">
                    قم بالتواصل مع الإدارة وسيتم مراجعة بياناتك وتفعيل حسابك في
                    أقرب وقت.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-bold text-amber-900">
                    بياناتك محفوظة بأمان
                  </p>
                  <p className="mt-0.5 text-xs text-amber-700">
                    مجموعاتك واختباراتك وبيانات طلابك كلها محفوظة وستعود إليها
                    فور تفعيل الحساب.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <a
                href="mailto:support@istabaq.eg?subject=طلب تفعيل حساب معلم&body=السلام عليكم، أرجو تفعيل حسابي على المنصة."
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-bold text-white shadow-sm shadow-indigo-200 transition-all hover:bg-indigo-700"
              >
                <Mail className="h-5 w-5" />
                التواصل مع الإدارة
              </a>

              <button
                onClick={handleSignOut}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-3.5 font-bold text-slate-700 transition-all hover:bg-slate-200 disabled:opacity-60"
              >
                <LogOut className="h-5 w-5" />
                {loading ? 'جاري الخروج...' : 'تسجيل الخروج'}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border bg-slate-50 p-4 text-center">
            <p className="text-xs text-slate-500">
              للمساعدة الفورية تواصل معنا على{' '}
              <a
                href="mailto:support@istabaq.eg"
                className="font-bold text-indigo-600 hover:underline"
                dir="ltr"
              >
                support@istabaq.eg
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
