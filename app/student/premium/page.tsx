'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircle2,
  Crown,
  Loader2,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Plan {
  id: string
  name_ar: string
  description_ar: string
  price: number
  duration_days: number
  features: string[]
}

interface SubscriptionStatus {
  hasActiveSubscription: boolean
  subscription: any
}

export default function PremiumPricingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [plansRes, statusRes] = await Promise.all([
        fetch('/api/student/plans'),
        fetch('/api/student/subscription-status'),
      ])

      const plansData = await plansRes.json()
      const statusData = await statusRes.json()

      if (plansData.success) setPlans(plansData.data)
      if (statusData.success) setStatus(statusData)
    } catch (error) {
      console.error(error)
      toast.error('حدث خطأ أثناء تحميل الباقات')
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (plan: Plan) => {
    if (
      !window.confirm(
        `هل أنت متأكد من الاشتراك في ${plan.name_ar} بمبلغ ${plan.price} ج.م؟ (هذه محاكاة لعملية الدفع)`
      )
    ) {
      return
    }

    setProcessingId(plan.id)
    try {
      const res = await fetch('/api/student/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'فشل الاشتراك')

      toast.success(data.message)
      await fetchData() // Refresh status
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ غير متوقع')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="font-cairo min-h-screen bg-[#FAFAFA] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-100 px-4 py-2 text-sm font-bold text-violet-800 shadow-sm">
            <Crown className="h-4 w-4" />
            استثمر في مستقبلك
          </div>
          <h1 className="mb-6 text-4xl font-black leading-tight text-slate-900 md:text-5xl">
            باقات الاشتراك{' '}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              VIP
            </span>
          </h1>
          <p className="text-lg leading-relaxed text-slate-600">
            احصل على وصول غير محدود لجميع الاختبارات، الشروحات التفصيلية، وبنك
            الأسئلة المتكامل. اختر الباقة التي تناسب طموحك.
          </p>
        </div>

        {/* Current Status Banner */}
        {status?.hasActiveSubscription && (
          <div className="mx-auto mb-12 flex max-w-3xl items-center gap-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white shadow-xl">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="mb-1 text-lg font-bold">أنت الآن مشترك VIP!</h3>
              <p className="text-sm text-green-50">
                باقتك الحالية ({status.subscription.plan.name_ar}) صالحة حتى{' '}
                {new Date(status.subscription.end_date).toLocaleDateString(
                  'ar-EG'
                )}
              </p>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2">
          {plans.map((plan, index) => {
            // Make the second plan (usually yearly) stand out
            const isPopular = index === 1

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl transition-all duration-300 ${
                  isPopular
                    ? 'z-10 scale-100 border border-violet-700/50 bg-gradient-to-b from-violet-900 to-indigo-900 text-white shadow-2xl md:scale-105'
                    : 'border border-slate-100 bg-white text-slate-900 shadow-xl'
                }`}
              >
                {isPopular && (
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                    <span className="whitespace-nowrap rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-1 text-sm font-bold text-white shadow-lg">
                      الأكثر مبيعاً 🔥
                    </span>
                  </div>
                )}

                <div className="p-8">
                  <h3
                    className={`mb-2 text-2xl font-black ${isPopular ? 'text-white' : 'text-slate-900'}`}
                  >
                    {plan.name_ar}
                  </h3>
                  <p
                    className={`mb-6 h-10 text-sm ${isPopular ? 'text-violet-200' : 'text-slate-500'}`}
                  >
                    {plan.description_ar}
                  </p>

                  <div className="mb-8 flex items-baseline gap-2">
                    <span className="text-5xl font-black">{plan.price}</span>
                    <span
                      className={`text-lg font-bold ${isPopular ? 'text-violet-300' : 'text-slate-400'}`}
                    >
                      ج.م
                    </span>
                    <span
                      className={`text-sm ${isPopular ? 'text-violet-300' : 'text-slate-400'}`}
                    >
                      / {plan.duration_days} يوم
                    </span>
                  </div>

                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={
                      processingId === plan.id || status?.hasActiveSubscription
                    }
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-bold transition-all ${
                      isPopular
                        ? 'bg-white text-violet-900 hover:bg-violet-50'
                        : 'bg-violet-600 text-white hover:bg-violet-700'
                    } ${status?.hasActiveSubscription ? 'cursor-not-allowed opacity-50' : 'shadow-lg hover:-translate-y-0.5'}`}
                  >
                    {processingId === plan.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : status?.hasActiveSubscription ? (
                      'مشترك حالياً'
                    ) : (
                      'اشترك الآن'
                    )}
                  </button>

                  <div className="mt-8 space-y-4">
                    <p
                      className={`text-sm font-bold uppercase tracking-wider ${isPopular ? 'text-violet-300' : 'text-slate-400'}`}
                    >
                      المميزات التي ستحصل عليها:
                    </p>
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2
                            className={`mt-0.5 h-5 w-5 shrink-0 ${isPopular ? 'text-emerald-400' : 'text-emerald-500'}`}
                          />
                          <span
                            className={`text-sm ${isPopular ? 'text-violet-50' : 'text-slate-600'}`}
                          >
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Safe Payment Guarantee */}
        <div className="mt-16 flex flex-col items-center justify-center gap-2 text-center text-slate-500">
          <AlertCircle className="h-5 w-5 text-slate-400" />
          <p className="text-sm">مدفوعات آمنة 100%، يمكنك الإلغاء في أي وقت.</p>
        </div>
      </div>
    </div>
  )
}
