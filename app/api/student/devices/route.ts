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
    const { data: sessions } = await supabase
      .from('student_device_sessions')
      .select('id, device_name, device_type, ip_address, last_active_at, created_at')
      .eq('student_id', profile.id)
      .order('last_active_at', { ascending: false })

    return NextResponse.json({ sessions: sessions ?? [] })
  } catch (err) {
    console.error('Devices GET error:', err)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const profile = await getCurrentProfile()
    if (!profile || profile.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { session_id } = await req.json()
    if (!session_id) {
      return NextResponse.json({ error: 'معرف الجلسة مطلوب' }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('student_device_sessions')
      .delete()
      .eq('id', session_id)
      .eq('student_id', profile.id) // RLS double-check

    if (error) {
      return NextResponse.json({ error: 'فشل حذف الجلسة' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Devices DELETE error:', err)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  // Register current device session
  try {
    const profile = await getCurrentProfile()
    if (!profile || profile.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { device_name, device_type, ip_address, user_agent } = body

    const supabase = await createClient()

    // Check if already registered (same user agent)
    const { data: existing } = await supabase
      .from('student_device_sessions')
      .select('id')
      .eq('student_id', profile.id)
      .eq('user_agent', user_agent)
      .single()

    if (existing) {
      // Update last_active_at
      await supabase
        .from('student_device_sessions')
        .update({ last_active_at: new Date().toISOString(), ip_address })
        .eq('id', existing.id)
      return NextResponse.json({ success: true, action: 'updated' })
    }

    // Count active sessions
    const { count } = await supabase
      .from('student_device_sessions')
      .select('id', { count: 'exact' })
      .eq('student_id', profile.id)

    if ((count ?? 0) >= 2) {
      return NextResponse.json({
        error: 'تجاوزت عدد الأجهزة المسموح بها (2). إدارة أجهزتك من صفحة الملف الشخصي.',
        devices_limit_reached: true
      }, { status: 403 })
    }

    const { error } = await supabase.from('student_device_sessions').insert({
      student_id: profile.id,
      device_name: device_name || 'Unknown Device',
      device_type: device_type || 'Desktop',
      ip_address: ip_address || 'unknown',
      user_agent: user_agent || 'unknown',
    })

    if (error) {
      return NextResponse.json({ error: 'فشل تسجيل الجهاز' }, { status: 500 })
    }

    return NextResponse.json({ success: true, action: 'created' })
  } catch (err) {
    console.error('Devices POST error:', err)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
