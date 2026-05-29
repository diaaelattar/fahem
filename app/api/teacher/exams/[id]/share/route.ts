// app/api/teacher/exams/[id]/share/route.ts
// إدارة توكنات مشاركة الاختبارات — للمعلمين فقط
// GET: جلب التوكن الحالي | POST: إنشاء توكن | PATCH: تعديل (تعطيل/تجديد)

import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/permissions'
import { NextResponse } from 'next/server'

interface Params {
  params: { id: string }
}

// GET: جلب التوكن الحالي للاختبار
export async function GET(_request: Request, { params }: Params) {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'teacher') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const supabase = await createClient()

  // تحقق أن الاختبار يخص هذا المعلم
  const { data: exam } = await supabase
    .from('exams')
    .select('id, title, teacher_id')
    .eq('id', params.id)
    .eq('teacher_id', profile.id)
    .single()

  if (!exam) {
    return NextResponse.json({ error: 'الاختبار غير موجود' }, { status: 404 })
  }

  // جلب أحدث توكن نشط للاختبار
  const { data: token } = await supabase
    .from('exam_share_tokens')
    .select('id, token, is_active, expires_at, created_at')
    .eq('exam_id', params.id)
    .eq('teacher_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ token })
}

// POST: إنشاء توكن جديد للاختبار
export async function POST(_request: Request, { params }: Params) {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'teacher') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const supabase = await createClient()

  // تحقق أن الاختبار يخص هذا المعلم
  const { data: exam } = await supabase
    .from('exams')
    .select('id, teacher_id')
    .eq('id', params.id)
    .eq('teacher_id', profile.id)
    .single()

  if (!exam) {
    return NextResponse.json({ error: 'الاختبار غير موجود' }, { status: 404 })
  }

  // إلغاء تفعيل أي توكنات سابقة
  await supabase
    .from('exam_share_tokens')
    .update({ is_active: false })
    .eq('exam_id', params.id)
    .eq('teacher_id', profile.id)

  // إنشاء توكن جديد
  const { data: newToken, error } = await supabase
    .from('exam_share_tokens')
    .insert({
      exam_id: params.id,
      teacher_id: profile.id,
      is_active: true,
    })
    .select('id, token, is_active, expires_at, created_at')
    .single()

  if (error || !newToken) {
    return NextResponse.json({ error: 'فشل إنشاء رابط المشاركة' }, { status: 500 })
  }

  return NextResponse.json({ token: newToken }, { status: 201 })
}

// PATCH: تعديل التوكن (تفعيل / تعطيل / تجديد)
export async function PATCH(request: Request, { params }: Params) {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'teacher') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const body = await request.json()
  const { action, tokenId } = body

  if (!tokenId) {
    return NextResponse.json({ error: 'معرّف التوكن مفقود' }, { status: 400 })
  }

  const supabase = await createClient()

  // تحقق أن التوكن يخص هذا المعلم
  const { data: token } = await supabase
    .from('exam_share_tokens')
    .select('id, exam_id, teacher_id')
    .eq('id', tokenId)
    .eq('teacher_id', profile.id)
    .single()

  if (!token) {
    return NextResponse.json({ error: 'التوكن غير موجود' }, { status: 404 })
  }

  // تعطيل التوكن
  if (action === 'disable') {
    const { data: updated } = await supabase
      .from('exam_share_tokens')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', tokenId)
      .select('id, token, is_active, expires_at, created_at')
      .single()
    return NextResponse.json({ token: updated })
  }

  // تفعيل التوكن
  if (action === 'enable') {
    const { data: updated } = await supabase
      .from('exam_share_tokens')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', tokenId)
      .select('id, token, is_active, expires_at, created_at')
      .single()
    return NextResponse.json({ token: updated })
  }

  // تجديد التوكن (إنشاء توكن جديد وإلغاء القديم)
  if (action === 'renew') {
    // إلغاء القديم
    await supabase
      .from('exam_share_tokens')
      .update({ is_active: false })
      .eq('exam_id', token.exam_id)
      .eq('teacher_id', profile.id)

    // إنشاء جديد
    const { data: newToken, error } = await supabase
      .from('exam_share_tokens')
      .insert({
        exam_id: token.exam_id,
        teacher_id: profile.id,
        is_active: true,
      })
      .select('id, token, is_active, expires_at, created_at')
      .single()

    if (error || !newToken) {
      return NextResponse.json({ error: 'فشل تجديد الرابط' }, { status: 500 })
    }

    return NextResponse.json({ token: newToken })
  }

  return NextResponse.json({ error: 'action غير معروف' }, { status: 400 })
}
