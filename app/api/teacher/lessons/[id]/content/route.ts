import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/teacher/lessons/[id]/content
 * جلب محتوى الدرس (الأقسام والتدريبات)
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const lessonId = parseInt(params.id, 10)

  const [lessonRes, sectionsRes, exercisesRes] = await Promise.all([
    supabase
      .from('lessons')
      .select(
        'id, name_ar, has_content, content_status, view_count, content_updated_at, units(name_ar, grades(name_ar), subjects(name_ar))'
      )
      .eq('id', lessonId)
      .single(),
    supabase
      .from('lesson_sections')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('sort_order'),
    supabase
      .from('lesson_exercises')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('sort_order'),
  ])

  return NextResponse.json({
    lesson: lessonRes.data,
    sections: sectionsRes.data ?? [],
    exercises: exercisesRes.data ?? [],
  })
}

/**
 * POST /api/teacher/lessons/[id]/content
 * حفظ محتوى الدرس (الأقسام والتدريبات) — يدعم الحفظ الكامل وتغيير الحالة
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  // التحقق من دور المعلم
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'teacher')
    return NextResponse.json({ error: 'للمعلمين فقط' }, { status: 403 })

  const lessonId = parseInt(params.id, 10)
  const body = await req.json()
  const { sections, exercises, action } = body

  // ── حفظ الأقسام ───────────────────────────────────────────────────────────
  if (sections && Array.isArray(sections)) {
    // حذف الأقسام القديمة وإعادة الإدراج (upsert بالكامل)
    await supabase.from('lesson_sections').delete().eq('lesson_id', lessonId)

    if (sections.length > 0) {
      const sectionsToInsert = sections.map((s: any, idx: number) => ({
        lesson_id: lessonId,
        teacher_id: user.id,
        section_type: s.section_type,
        title: s.title || null,
        body: s.body,
        sort_order: idx,
        is_active: true,
      }))
      await supabase.from('lesson_sections').insert(sectionsToInsert)
    }
  }

  // ── حفظ التدريبات الجديدة (إضافة فقط، لا حذف) ───────────────────────────
  if (exercises && Array.isArray(exercises) && exercises.length > 0) {
    const exToInsert = exercises.map((ex: any, idx: number) => ({
      lesson_id: lessonId,
      teacher_id: user.id,
      question_type: ex.question_type,
      question_text: ex.question_text,
      options: ex.options ?? null,
      correct_answer: ex.correct_answer,
      explanation: ex.explanation ?? null,
      difficulty_level: ex.difficulty_level ?? 'medium',
      sort_order: ex.sort_order ?? idx,
      source: ex.source ?? 'teacher',
      is_active: true,
    }))
    await supabase.from('lesson_exercises').insert(exToInsert)
  }

  // ── تحديث حالة الدرس ──────────────────────────────────────────────────────
  const hasAnySections = sections && sections.length > 0
  const updatePayload: any = {
    teacher_id: user.id,
    has_content: hasAnySections,
    content_updated_at: new Date().toISOString(),
  }

  if (action === 'publish') {
    updatePayload.content_status = 'published'
  } else if (action === 'draft') {
    updatePayload.content_status = 'draft'
  }

  await supabase.from('lessons').update(updatePayload).eq('id', lessonId)

  return NextResponse.json({ success: true })
}
