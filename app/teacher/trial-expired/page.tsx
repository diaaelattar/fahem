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
    <div className="min-h-screen bg-hero-pattern flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-8">
          <Logo variant="vertical" size="lg" light />
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Header gradient */}
          <div className="bg-gradient-to-l from-amber-500 to-orange-500 p-8 text-center relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative z-10">
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mx-auto mb-4 backdrop-blur-sm">
                <Clock className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-black text-white mb-1">انتهت فترتك التجريبية</h1>
              <p className="text-amber-100 text-sm font-medium">
                الـ 15 يوم التجريبية قد انتهت
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-8 space-y-6">

            {/* Description */}
            <div className="text-center">
              <p className="text-slate-700 font-medium leading-relaxed">
                انتهت فترتك التجريبية المجانية على منصة <span className="font-black text-indigo-700">استباق مصر</span>.
                <br />
                لاستمرار وصولك الكامل، يرجى التواصل مع الإدارة لتفعيل حسابك بشكل دائم.
              </p>
            </div>

            {/* Info boxes */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-blue-900">التفعيل الدائم مجاني تماماً</p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    قم بالتواصل مع الإدارة وسيتم مراجعة بياناتك وتفعيل حسابك في أقرب وقت.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-900">بياناتك محفوظة بأمان</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    مجموعاتك واختباراتك وبيانات طلابك كلها محفوظة وستعود إليها فور تفعيل الحساب.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <a
                href="mailto:support@istabaq.eg?subject=طلب تفعيل حساب معلم&body=السلام عليكم، أرجو تفعيل حسابي على المنصة."
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm shadow-indigo-200"
              >
                <Mail className="w-5 h-5" />
                التواصل مع الإدارة
              </a>

              <button
                onClick={handleSignOut}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-all disabled:opacity-60"
              >
                <LogOut className="w-5 h-5" />
                {loading ? 'جاري الخروج...' : 'تسجيل الخروج'}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 border-t border-border p-4 text-center">
            <p className="text-xs text-slate-500">
              للمساعدة الفورية تواصل معنا على{' '}
              <a href="mailto:support@istabaq.eg" className="text-indigo-600 font-bold hover:underline" dir="ltr">
                support@istabaq.eg
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
