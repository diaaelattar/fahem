'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function VIPCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  )

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
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="mb-6 h-16 w-16 animate-spin text-primary" />
            <h1 className="mb-2 text-2xl font-bold text-slate-800">
              جاري معالجة الدفع...
            </h1>
            <p className="text-slate-500">
              يرجى الانتظار وعدم إغلاق هذه الصفحة.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-slate-800">
              تم تفعيل الاشتراك بنجاح!
            </h1>
            <p className="mb-8 text-slate-500">
              مبروك! حسابك الآن VIP. يمكنك الاستمتاع بجميع ميزات المنصة بدون
              حدود.
            </p>
            <Link
              href="/student/dashboard"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-bold text-white transition-colors hover:bg-primary/90"
            >
              العودة للوحة التحكم
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-slate-800">
              فشلت عملية الدفع
            </h1>
            <p className="mb-8 text-slate-500">
              عذراً، لم نتمكن من إتمام عملية الدفع. يرجى التحقق من رصيدك
              والمحاولة مرة أخرى.
            </p>
            <Link
              href="/student/vip"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-4 font-bold text-white transition-colors hover:bg-slate-900"
            >
              المحاولة مرة أخرى
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
