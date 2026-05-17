'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function VIPCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    const success = searchParams.get('success') === 'true'
    const pending = searchParams.get('pending') === 'true'

    if (success && !pending) {
      setStatus('success')
    } else if (pending) {
      setStatus('loading')
    } else {
      setStatus('error')
    }
  }, [searchParams])

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl border border-slate-100 animate-fade-in">
        
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">جاري معالجة الدفع...</h1>
            <p className="text-slate-500">يرجى الانتظار وعدم إغلاق هذه الصفحة.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">تم تفعيل الاشتراك بنجاح!</h1>
            <p className="text-slate-500 mb-8">
              مبروك! حسابك الآن VIP. يمكنك الاستمتاع بجميع ميزات المنصة بدون حدود.
            </p>
            <Link 
              href="/student/dashboard" 
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              العودة للوحة التحكم
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">فشلت عملية الدفع</h1>
            <p className="text-slate-500 mb-8">
              عذراً، لم نتمكن من إتمام عملية الدفع. يرجى التحقق من رصيدك والمحاولة مرة أخرى.
            </p>
            <Link 
              href="/student/vip" 
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              المحاولة مرة أخرى
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
