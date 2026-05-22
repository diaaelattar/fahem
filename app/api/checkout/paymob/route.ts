import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID

export async function POST(req: Request) {
  try {
    if (!PAYMOB_API_KEY || !PAYMOB_INTEGRATION_ID || !PAYMOB_IFRAME_ID) {
      console.error('PayMob environment variables are missing')
      return NextResponse.json({ error: 'بوابات الدفع غير مفعلة حالياً' }, { status: 500 })
    }

    const { planId } = await req.json()
    if (!planId) {
      return NextResponse.json({ error: 'معرف الباقة مطلوب' }, { status: 400 })
    }

    // 1. Check Auth
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 })
    }

    // Fetch user profile for billing data
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

    // 2. Fetch Plan Details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: 'الباقة غير موجودة أو غير متاحة' }, { status: 404 })
    }

    const amountInCents = Math.round(plan.price * 100)

    // 3. Create Pending Transaction in our DB
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        student_id: user.id,
        plan_id: plan.id,
        amount: plan.price,
        payment_method: 'paymob',
        status: 'pending'
      })
      .select()
      .single()

    if (txError || !transaction) {
      console.error('Transaction creation error:', txError)
      return NextResponse.json({ error: 'حدث خطأ في بدء المعاملة' }, { status: 500 })
    }

    // 4. PayMob Step 1: Authentication
    const authRes = await fetch('https://accept.paymob.com/api/auth/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: PAYMOB_API_KEY })
    })
    const authData = await authRes.json()
    const token = authData.token
    if (!token) throw new Error('PayMob Auth failed')

    // 5. PayMob Step 2: Order Registration
    const orderRes = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: token,
        delivery_needed: 'false',
        amount_cents: amountInCents,
        currency: 'EGP',
        merchant_order_id: transaction.id, // Link to our DB
        items: [
          {
            name: plan.name_ar,
            amount_cents: amountInCents,
            description: plan.description_ar,
            quantity: '1'
          }
        ]
      })
    })
    const orderData = await orderRes.json()
    const orderId = orderData.id
    if (!orderId) throw new Error('PayMob Order failed')

    // 6. PayMob Step 3: Payment Key Generation
    const keyRes = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: token,
        amount_cents: amountInCents,
        expiration: 3600,
        order_id: orderId,
        billing_data: {
          apartment: 'NA',
          email: profile?.email || 'student@istabaq.com',
          floor: 'NA',
          first_name: profile?.full_name?.split(' ')[0] || 'Student',
          street: 'NA',
          building: 'NA',
          phone_number: '+201000000000', // Hardcoded or from profile if exists
          shipping_method: 'NA',
          postal_code: 'NA',
          city: 'Cairo',
          country: 'EG',
          last_name: profile?.full_name?.split(' ').slice(1).join(' ') || 'Name',
          state: 'NA'
        },
        currency: 'EGP',
        integration_id: PAYMOB_INTEGRATION_ID,
        lock_order_when_paid: 'false'
      })
    })
    const keyData = await keyRes.json()
    const paymentToken = keyData.token
    if (!paymentToken) throw new Error('PayMob Payment Key failed')

    // 7. Return the Iframe URL
    const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`

    return NextResponse.json({ url: iframeUrl })

  } catch (error: any) {
    console.error('PayMob Checkout Error:', error)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع أثناء الاتصال ببوابة الدفع' }, { status: 500 })
  }
}
