import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Check if the user is authorized (has active session)
    if (!user) return NextResponse.json({ error: 'غير مسجل الدخول' }, { status: 401 })

    // Enforce RBAC: only admins can delete exams
    const { data: profileRaw } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const profile = profileRaw as any
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 })
    }

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'مطلوب معرف الاختبار' }, { status: 400 })

    const adminClient = createAdminClient()
    
    const { error } = await adminClient.from('exams').delete().eq('id', id)

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete Exam Error:', error)
    return NextResponse.json({ error: error.message || 'خطأ داخلي اثناء الحذف' }, { status: 500 })
  }
}
