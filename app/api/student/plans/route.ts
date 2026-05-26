import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, data: plans })
  } catch (error: any) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الباقات' },
      { status: 500 }
    )
  }
}
