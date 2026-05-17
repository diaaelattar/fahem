import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const PAYMOB_HMAC = process.env.PAYMOB_HMAC

export async function POST(req: Request) {
  try {
    // PayMob sends the HMAC signature in the query string
    const url = new URL(req.url)
    const hmacSignature = url.searchParams.get('hmac')

    const body = await req.json()

    // We only care about TRANSACTION events
    if (body.type !== 'TRANSACTION') {
      return NextResponse.json({ success: true })
    }

    const obj = body.obj

    // 1. Verify HMAC
    if (PAYMOB_HMAC && hmacSignature) {
      const concatenatedString = [
        obj.amount_cents,
        obj.created_at,
        obj.currency,
        obj.error_occured,
        obj.has_parent_transaction,
        obj.id,
        obj.integration_id,
        obj.is_3d_secure,
        obj.is_auth,
        obj.is_capture,
        obj.is_refunded,
        obj.is_standalone_payment,
        obj.is_voided,
        obj.order.id,
        obj.owner,
        obj.pending,
        obj.source_data.pan,
        obj.source_data.sub_type,
        obj.source_data.type,
        obj.success
      ].join('')

      const hashedString = crypto
        .createHmac('sha512', PAYMOB_HMAC)
        .update(concatenatedString)
        .digest('hex')

      if (hashedString !== hmacSignature) {
        console.error('PayMob HMAC verification failed!')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // 2. Process the transaction
    const transactionId = obj.order.merchant_order_id // This is our DB transaction ID
    const isSuccess = obj.success === true && obj.pending === false

    if (!transactionId) {
      return NextResponse.json({ success: true }) // Ignore if no merchant_order_id
    }

    // Use a service role client to bypass RLS in the webhook
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    if (isSuccess) {
      // Fetch transaction to get plan and student info
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single()

      if (transaction && transaction.status !== 'completed') {
        // Update transaction status
        await supabase
          .from('transactions')
          .update({
            status: 'completed',
            reference_id: obj.id.toString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', transactionId)

        // Get plan duration
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('duration_days')
          .eq('id', transaction.plan_id)
          .single()

        if (plan) {
          // Calculate end date
          const endDate = new Date()
          endDate.setDate(endDate.getDate() + plan.duration_days)

          // Insert or update subscription
          await supabase
            .from('student_subscriptions')
            .insert({
              student_id: transaction.student_id,
              plan_id: transaction.plan_id,
              start_date: new Date().toISOString(),
              end_date: endDate.toISOString(),
              status: 'active'
            })

          // Send VIP Activation Notification
          await supabase
            .from('notifications')
            .insert({
              user_id: transaction.student_id,
              title: 'تم تفعيل حساب الـ VIP 👑',
              message: `مبروك! تم تفعيل اشتراكك في باقة "${plan.name_ar}" بنجاح. استمتع بوصول غير محدود للامتحانات حتى ${endDate.toLocaleDateString('ar-EG')}.`,
              type: 'success',
              link: '/student/vip'
            })
        }
      }
    } else {
      // Payment failed
      await supabase
        .from('transactions')
        .update({
          status: 'failed',
          reference_id: obj.id.toString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
