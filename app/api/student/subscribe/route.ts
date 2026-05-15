import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { planId, paymentMethod = 'simulation' } = await request.json()
    if (!planId) {
      return NextResponse.json({ error: 'معرف الباقة مطلوب' }, { status: 400 })
    }

    // 1. Fetch Plan Details
    const { data: plan, error: planErr } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planErr || !plan) {
      return NextResponse.json({ error: 'الباقة غير موجودة' }, { status: 404 })
    }

    // 2. Create Transaction (Simulating successful payment)
    const { data: transaction, error: txErr } = await supabase
      .from('transactions')
      .insert({
        student_id: user.id,
        plan_id: plan.id,
        amount: plan.price,
        payment_method: paymentMethod,
        status: 'completed',
        reference_id: `SIM-${Date.now()}`
      })
      .select()
      .single()

    if (txErr) throw txErr

    // 3. Create or update Subscription
    // Calculate End Date
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + plan.duration_days)

    const { error: subErr } = await supabase
      .from('student_subscriptions')
      .insert({
        student_id: user.id,
        plan_id: plan.id,
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        status: 'active'
      })

    if (subErr) throw subErr

    return NextResponse.json({ 
      success: true, 
      message: 'تم تفعيل الاشتراك بنجاح!',
      transaction 
    })

  } catch (error: any) {
    console.error('Error in subscription:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء إتمام الاشتراك' }, { status: 500 })
  }
}
