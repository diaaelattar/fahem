import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    // Fetch the latest active subscription
    const { data: sub, error } = await supabase
      .from('student_subscriptions')
      .select(
        `
        *,
        plan:subscription_plans (name_ar, price, duration_days)
      `
      )
      .eq('student_id', user.id)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .order('end_date', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is 'No rows found'
      throw error
    }

    return NextResponse.json({
      success: true,
      hasActiveSubscription: !!sub,
      subscription: sub || null,
    })
  } catch (error: any) {
    console.error('Error fetching subscription status:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب حالة الاشتراك' },
      { status: 500 }
    )
  }
}
