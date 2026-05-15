'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Crown, Loader2, Sparkles, AlertCircle } from 'lucide-react'
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
        fetch('/api/student/subscription-status')
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
    if (!window.confirm(`هل أنت متأكد من الاشتراك في ${plan.name_ar} بمبلغ ${plan.price} ج.م؟ (هذه محاكاة لعملية الدفع)`)) {
      return
    }

    setProcessingId(plan.id)
    try {
      const res = await fetch('/api/student/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id })
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-12 px-4 sm:px-6 lg:px-8 font-cairo">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-800 font-bold text-sm mb-6 shadow-sm border border-violet-200">
            <Crown className="w-4 h-4" />
            استثمر في مستقبلك
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
            باقات الاشتراك <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">VIP</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            احصل على وصول غير محدود لجميع الاختبارات، الشروحات التفصيلية، وبنك الأسئلة المتكامل. اختر الباقة التي تناسب طموحك.
          </p>
        </div>

        {/* Current Status Banner */}
        {status?.hasActiveSubscription && (
          <div className="max-w-3xl mx-auto mb-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">أنت الآن مشترك VIP!</h3>
              <p className="text-green-50 text-sm">
                باقتك الحالية ({status.subscription.plan.name_ar}) صالحة حتى {new Date(status.subscription.end_date).toLocaleDateString('ar-EG')}
              </p>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => {
            // Make the second plan (usually yearly) stand out
            const isPopular = index === 1
            
            return (
              <div 
                key={plan.id}
                className={`relative rounded-3xl transition-all duration-300 ${
                  isPopular 
                    ? 'bg-gradient-to-b from-violet-900 to-indigo-900 text-white shadow-2xl scale-100 md:scale-105 z-10 border border-violet-700/50' 
                    : 'bg-white text-slate-900 shadow-xl border border-slate-100'
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg whitespace-nowrap">
                      الأكثر مبيعاً 🔥
                    </span>
                  </div>
                )}

                <div className="p-8">
                  <h3 className={`text-2xl font-black mb-2 ${isPopular ? 'text-white' : 'text-slate-900'}`}>
                    {plan.name_ar}
                  </h3>
                  <p className={`text-sm mb-6 h-10 ${isPopular ? 'text-violet-200' : 'text-slate-500'}`}>
                    {plan.description_ar}
                  </p>
                  
                  <div className="flex items-baseline gap-2 mb-8">
                    <span className="text-5xl font-black">{plan.price}</span>
                    <span className={`text-lg font-bold ${isPopular ? 'text-violet-300' : 'text-slate-400'}`}>ج.م</span>
                    <span className={`text-sm ${isPopular ? 'text-violet-300' : 'text-slate-400'}`}>/ {plan.duration_days} يوم</span>
                  </div>

                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={processingId === plan.id || status?.hasActiveSubscription}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                      isPopular
                        ? 'bg-white text-violet-900 hover:bg-violet-50'
                        : 'bg-violet-600 text-white hover:bg-violet-700'
                    } ${status?.hasActiveSubscription ? 'opacity-50 cursor-not-allowed' : 'shadow-lg hover:-translate-y-0.5'}`}
                  >
                    {processingId === plan.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : status?.hasActiveSubscription ? (
                      'مشترك حالياً'
                    ) : (
                      'اشترك الآن'
                    )}
                  </button>

                  <div className="mt-8 space-y-4">
                    <p className={`text-sm font-bold uppercase tracking-wider ${isPopular ? 'text-violet-300' : 'text-slate-400'}`}>
                      المميزات التي ستحصل عليها:
                    </p>
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${isPopular ? 'text-emerald-400' : 'text-emerald-500'}`} />
                          <span className={`text-sm ${isPopular ? 'text-violet-50' : 'text-slate-600'}`}>
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
        <div className="mt-16 text-center flex flex-col items-center justify-center gap-2 text-slate-500">
          <AlertCircle className="w-5 h-5 text-slate-400" />
          <p className="text-sm">مدفوعات آمنة 100%، يمكنك الإلغاء في أي وقت.</p>
        </div>

      </div>
    </div>
  )
}
