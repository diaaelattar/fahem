import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/permissions'

export async function GET() {
  try {
    const profile = await getCurrentProfile()
    if (!profile || profile.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    const { data: student } = await supabase
      .from('students')
      .select('wallet_balance')
      .eq('id', profile.id)
      .single()

    const { data: transactions } = await supabase
      .from('wallet_transactions')
      .select('id, amount, transaction_type, comment, created_at')
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      balance: student?.wallet_balance ?? 0,
      transactions: transactions ?? [],
    })
  } catch (err) {
    console.error('Wallet GET error:', err)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await getCurrentProfile()
    if (!profile || profile.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { card_code } = await req.json()
    if (!card_code) {
      return NextResponse.json({ error: 'يرجى إدخال كود الكارت' }, { status: 400 })
    }

    const supabase = await createClient()

    // Use our secure DB function
    const { data, error } = await supabase.rpc('charge_wallet_with_scratch_card', {
      card_code: card_code.trim().toUpperCase()
    })

    if (error) {
      console.error('RPC error:', error)
      return NextResponse.json({ error: 'حدث خطأ أثناء معالجة الكود' }, { status: 500 })
    }

    if (!data?.success) {
      return NextResponse.json({ error: data?.message ?? 'فشلت عملية الشحن' }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: data.message, amount: data.amount })
  } catch (err) {
    console.error('Wallet POST error:', err)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
