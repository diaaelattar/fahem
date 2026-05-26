import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LessonViewer } from '@/components/student/LessonViewer'
import { ExercisePlayer } from '@/components/student/ExercisePlayer'
import {
  ArrowRight,
  BookOpen,
  Brain,
  Eye,
} from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function StudentLessonPage({
  params,
}: {
  params: { id: string }
}) {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'student') redirect('/auth/login')

  const supabase = await createClient()
  const lessonId = parseInt(params.id, 10)

  // جلب الدرس والمحتوى والتدريبات
  const [lessonRes, sectionsRes, exercisesRes] = await Promise.all([
    supabase
      .from('lessons')
      .select(
        `
        id, name_ar, view_count,
        units(
          id, name_ar,
          grades(name_ar),
          subjects(name_ar, icon)
        )
      `
      )
      .eq('id', lessonId)
      .eq('has_content', true)
      .eq('content_status', 'published')
      .single(),
    supabase
      .from('lesson_sections')
      .select('id, section_type, title, body, sort_order')
      .eq('lesson_id', lessonId)
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('lesson_exercises')
      .select('id, question_type, question_text, options, correct_answer, explanation, difficulty_level')
      .eq('lesson_id', lessonId)
      .eq('is_active', true)
      .order('sort_order'),
  ])

  // إذا لم يكن الدرس منشوراً أو غير موجود
  if (!lessonRes.data) redirect('/student/lessons')

  const lesson = lessonRes.data
  const unit = lesson.units as any
  const grade = unit?.grades as any
  const subject = unit?.subjects as any
  const sections = sectionsRes.data ?? []
  const exercises = exercisesRes.data ?? []

  // تسجيل المشاهدة (بدون انتظار)
  supabase
    .from('lessons')
    .update({ view_count: (lesson.view_count ?? 0) + 1 })
    .eq('id', lessonId)
    .then(() => {})

  return (
    <div className="min-h-screen bg-gray-50">
      {/* رأس الصفحة */}
      <div className="border-b border-border bg-white px-8 py-5 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/student/lessons"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
            الدروس
          </Link>
          <span className="text-border">/</span>
          <h1 className="font-bold text-gray-900 truncate">{lesson.name_ar}</h1>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{subject?.icon} {subject?.name_ar}</span>
          <span>•</span>
          <span>{grade?.name_ar}</span>
          <span>•</span>
          <span>{unit?.name_ar}</span>
          {lesson.view_count > 0 && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {lesson.view_count} مشاهدة
              </span>
            </>
          )}
        </div>
      </div>

      <div className="px-8 py-6 max-w-4xl mx-auto space-y-8">
        {/* ─── شرح الدرس ──────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-gray-900">شرح الدرس</h2>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {sections.length} قسم
            </span>
          </div>

          <LessonViewer sections={sections as any} />
        </section>

        {/* ─── التدريبات ─────────────────────────────────────────────────── */}
        {exercises.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-gray-900">تدريبات الدرس</h2>
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
                {exercises.length} تدريب
              </span>
            </div>

            <ExercisePlayer exercises={exercises as any} lessonId={lessonId} />
          </section>
        )}

        {exercises.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <Brain className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <p className="mt-3 text-muted-foreground">لا توجد تدريبات لهذا الدرس بعد</p>
          </div>
        )}
      </div>
    </div>
  )
}
