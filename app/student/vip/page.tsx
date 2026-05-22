import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import { Crown, CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { SubscribeButton } from './SubscribeButton'

export const dynamic = 'force-dynamic'

export default async function VIPPlansPage() {
  const profile = await getCurrentProfile()

  if (!profile || profile.role !== 'student') {
    redirect('/auth/login')
  }

  const supabase = await createClient()
  
  // Fetch active plans
  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true })

  // Check current subscription
  const { data: activeSub } = await supabase
    .from('student_subscriptions')
    .select('*, subscription_plans(name_ar)')
    .eq('student_id', profile.id)
    .eq('status', 'active')
    .gt('end_date', new Date().toISOString())
    .single()

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/student/dashboard" className="p-2 rounded-xl hover:bg-slate-200 transition-colors bg-white shadow-sm">
            <ArrowRight className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2">
              <Crown className="w-8 h-8 text-yellow-500" />
              باقات الـ VIP
            </h1>
            <p className="text-slate-500 mt-1">
              استمتع بوصول غير محدود لجميع الامتحانات وتدرب بلا قيود
            </p>
          </div>
        </div>
      </div>

      {activeSub && (
        <div className="bg-gradient-to-r from-yellow-400 to-amber-500 p-6 rounded-3xl text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shadow-yellow-500/20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-xl mb-1">أنت الآن مشترك في {activeSub.subscription_plans?.name_ar}</h2>
              <p className="text-yellow-50 text-sm">
                صالح حتى: {new Date(activeSub.end_date).toLocaleDateString('ar-EG')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Grid */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-8">
        {plans?.map((plan) => {
          const isAnnual = plan.duration_days > 100
          
          return (
            <div 
              key={plan.id}
              className={`relative bg-white rounded-3xl p-8 transition-all ${
                isAnnual 
                  ? 'border-2 border-primary shadow-xl shadow-primary/10 transform md:-translate-y-4' 
                  : 'border border-slate-200 shadow-sm'
              }`}
            >
              {isAnnual && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-sm font-bold px-4 py-1 rounded-full whitespace-nowrap">
                  الخيار الأفضل والأوفر
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-slate-800 mb-2">{plan.name_ar}</h3>
                <p className="text-slate-500 text-sm h-10">{plan.description_ar}</p>
              </div>

              <div className="text-center mb-8">
                <span className="text-5xl font-black text-slate-800">{plan.price}</span>
                <span className="text-slate-500 mr-2">ج.م</span>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features?.map((feature: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-slate-700 font-medium text-sm">
                    <CheckCircle className={`w-5 h-5 shrink-0 ${isAnnual ? 'text-primary' : 'text-emerald-500'}`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <SubscribeButton planId={plan.id} isPrimary={isAnnual} disabled={!!activeSub} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
