import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const body = await request.json()
    const adminClient = createAdminClient()
    
    const { data: doc, error } = await adminClient.from('documents').insert({
      ...body,
      admin_id: user.id
    }).select().single()

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ doc })
  } catch (error: any) {
    console.error('Create Document Error:', error)
    return NextResponse.json({ error: error.message || 'خطأ داخلي' }, { status: 500 })
  }
}
