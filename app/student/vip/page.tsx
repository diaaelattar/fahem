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
    <div className="mx-auto max-w-6xl animate-fade-in space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/student/dashboard"
            className="rounded-xl bg-white p-2 shadow-sm transition-colors hover:bg-slate-200"
          >
            <ArrowRight className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-black text-slate-800">
              <Crown className="h-8 w-8 text-yellow-500" />
              باقات الـ VIP
            </h1>
            <p className="mt-1 text-slate-500">
              استمتع بوصول غير محدود لجميع الامتحانات وتدرب بلا قيود
            </p>
          </div>
        </div>
      </div>

      {activeSub && (
        <div className="flex flex-col items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-yellow-400 to-amber-500 p-6 text-white shadow-xl shadow-yellow-500/20 sm:flex-row">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="mb-1 text-xl font-bold">
                أنت الآن مشترك في {activeSub.subscription_plans?.name_ar}
              </h2>
              <p className="text-sm text-yellow-50">
                صالح حتى:{' '}
                {new Date(activeSub.end_date).toLocaleDateString('ar-EG')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Grid */}
      <div className="mx-auto grid max-w-4xl gap-8 pt-8 md:grid-cols-2">
        {plans?.map((plan) => {
          const isAnnual = plan.duration_days > 100

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl bg-white p-8 transition-all ${
                isAnnual
                  ? 'transform border-2 border-primary shadow-xl shadow-primary/10 md:-translate-y-4'
                  : 'border border-slate-200 shadow-sm'
              }`}
            >
              {isAnnual && (
                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-primary px-4 py-1 text-sm font-bold text-white">
                  الخيار الأفضل والأوفر
                </div>
              )}

              <div className="mb-8 text-center">
                <h3 className="mb-2 text-2xl font-black text-slate-800">
                  {plan.name_ar}
                </h3>
                <p className="h-10 text-sm text-slate-500">
                  {plan.description_ar}
                </p>
              </div>

              <div className="mb-8 text-center">
                <span className="text-5xl font-black text-slate-800">
                  {plan.price}
                </span>
                <span className="mr-2 text-slate-500">ج.م</span>
              </div>

              <ul className="mb-8 space-y-4">
                {plan.features?.map((feature: string, i: number) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm font-medium text-slate-700"
                  >
                    <CheckCircle
                      className={`h-5 w-5 shrink-0 ${isAnnual ? 'text-primary' : 'text-emerald-500'}`}
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <SubscribeButton
                planId={plan.id}
                isPrimary={isAnnual}
                disabled={!!activeSub}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
