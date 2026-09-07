// app/api/admin/subjects/route.ts
// API كامل لإدارة المواد الدراسية بواسطة مسؤول النظام (Admin)

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// التحقق من صلاحيات الأدمن
async function verifyAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'غير مسجل الدخول', status: 401 }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'صلاحيات غير كافية - يتطلب حساب مسؤول النظام', status: 403 }
  }

  return { user, profile }
}

// 1. GET: جلب جميع المواد الدراسية بالتفصيل
export async function GET() {
  const auth = await verifyAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const adminClient = createAdminClient()
  const { data: subjects, error } = await adminClient
    .from('subjects')
    .select('*')
    .order('id', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ subjects })
}

// 2. POST: إضافة مادة دراسية جديدة
export async function POST(req: NextRequest) {
  const auth = await verifyAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await req.json()
    const {
      name_ar,
      name_en,
      category,
      applicable_stages,
      education_types,
      teaching_language,
      icon,
      color,
    } = body

    if (!name_ar || typeof name_ar !== 'string' || !name_ar.trim()) {
      return NextResponse.json(
        { error: 'اسم المادة باللغة العربية مطلوب' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // التحقق من عدم تكرار الاسم العربي
    const { data: existing } = await adminClient
      .from('subjects')
      .select('id')
      .eq('name_ar', name_ar.trim())
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'توجد مادة مسجلة بالفعل بهذا الاسم' },
        { status: 400 }
      )
    }

    const { data: inserted, error: insertError } = await adminClient
      .from('subjects')
      .insert({
        name_ar: name_ar.trim(),
        name_en: name_en?.trim() || null,
        category: category?.trim() || 'عام',
        applicable_stages: Array.isArray(applicable_stages) ? applicable_stages : ['primary', 'preparatory', 'secondary'],
        education_types: Array.isArray(education_types) ? education_types : ['public', 'language'],
        teaching_language: teaching_language?.trim() || 'arabic',
        icon: icon?.trim() || '📚',
        color: color?.trim() || '#1B4F72',
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ subject: inserted, message: 'تمت إضافة المادة بنجاح' })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء الإضافة'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// 3. PUT: تحديث مادة دراسية موجودة
export async function PUT(req: NextRequest) {
  const auth = await verifyAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await req.json()
    const {
      id,
      name_ar,
      name_en,
      category,
      applicable_stages,
      education_types,
      teaching_language,
      icon,
      color,
    } = body

    if (!id) {
      return NextResponse.json({ error: 'معرّف المادة (id) مطلوب' }, { status: 400 })
    }

    if (!name_ar || typeof name_ar !== 'string' || !name_ar.trim()) {
      return NextResponse.json(
        { error: 'اسم المادة باللغة العربية مطلوب' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    const { data: updated, error: updateError } = await adminClient
      .from('subjects')
      .update({
        name_ar: name_ar.trim(),
        name_en: name_en?.trim() || null,
        category: category?.trim() || 'عام',
        applicable_stages: Array.isArray(applicable_stages) ? applicable_stages : [],
        education_types: Array.isArray(education_types) ? education_types : [],
        teaching_language: teaching_language?.trim() || 'arabic',
        icon: icon?.trim() || '📚',
        color: color?.trim() || '#1B4F72',
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ subject: updated, message: 'تم تحديث المادة بنجاح' })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء التحديث'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// 4. DELETE: حذف مادة دراسية (مع فحص التبعيات)
export async function DELETE(req: NextRequest) {
  const auth = await verifyAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { searchParams } = new URL(req.url)
    const idParam = searchParams.get('id')

    if (!idParam) {
      return NextResponse.json({ error: 'معرّف المادة (id) مطلوب' }, { status: 400 })
    }

    const id = parseInt(idParam, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'معرّف مادة غير صالح' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // فحص الأسئلة المرتبطة
    const { count: questionsCount } = await adminClient
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('subject_id', id)

    if ((questionsCount || 0) > 0) {
      return NextResponse.json(
        {
          error: `لا يمكن حذف هذه المادة لوجود ${questionsCount} سؤال مرتبط بها في بنك الأسئلة. قم بنقل أو حذف الأسئلة أولاً.`,
        },
        { status: 400 }
      )
    }

    // فحص الوحدات الدراسية المرتبطة
    const { count: unitsCount } = await adminClient
      .from('units')
      .select('id', { count: 'exact', head: true })
      .eq('subject_id', id)

    if ((unitsCount || 0) > 0) {
      return NextResponse.json(
        {
          error: `لا يمكن حذف هذه المادة لوجود ${unitsCount} وحدة دراسية مرتبطة بها. قم بحذف الوحدات أولاً.`,
        },
        { status: 400 }
      )
    }

    // تنفيذ الحذف
    const { error: deleteError } = await adminClient
      .from('subjects')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'تم حذف المادة بنجاح' })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
