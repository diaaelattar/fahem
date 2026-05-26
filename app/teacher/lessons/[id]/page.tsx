import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LessonContentEditor } from '@/components/teacher/LessonContentEditor'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Eye,
} from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TeacherLessonDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'teacher') redirect('/auth/login')

  const supabase = await createClient()
  const lessonId = parseInt(params.id, 10)

  // جلب بيانات الدرس والمحتوى
  const [lessonRes, sectionsRes, exercisesRes] = await Promise.all([
    supabase
      .from('lessons')
      .select(
        `
        id, name_ar, sort_order,
        has_content, content_status, view_count, content_updated_at,
        units(
          id, name_ar,
          grades(name_ar),
          subjects(name_ar, icon)
        )
      `
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

  if (!lessonRes.data) redirect('/teacher/lessons')

  const lesson = lessonRes.data
  const unit = lesson.units as any
  const grade = unit?.grades as any
  const subject = unit?.subjects as any
  const sections = sectionsRes.data ?? []
  const exercises = exercisesRes.data ?? []

  const isPublished = lesson.content_status === 'published'

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* شريط التنقل */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/teacher/lessons" className="hover:text-white transition flex items-center gap-1">
          <ArrowRight className="h-4 w-4" />
          شرح الدروس
        </Link>
        <span>/</span>
        <span className="text-white font-medium">{lesson.name_ar}</span>
      </div>

      {/* معلومات الدرس */}
      <div className="rounded-2xl border border-slate-700 bg-slate-800/40 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-5 w-5 text-indigo-400" />
              <h1 className="text-xl font-bold text-white">{lesson.name_ar}</h1>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>{subject?.icon} {subject?.name_ar}</span>
              <span>•</span>
              <span>{grade?.name_ar}</span>
              <span>•</span>
              <span>{unit?.name_ar}</span>
            </div>
          </div>

          {/* حالة النشر */}
          <div className="flex items-center gap-3">
            {isPublished ? (
              <>
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  منشور
                </div>
                {lesson.view_count > 0 && (
                  <div className="flex items-center gap-1.5 rounded-full bg-slate-700 px-3 py-1.5 text-xs text-slate-400">
                    <Eye className="h-3.5 w-3.5" />
                    {lesson.view_count} مشاهدة
                  </div>
                )}
              </>
            ) : lesson.has_content ? (
              <div className="flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-400">
                <Clock className="h-3.5 w-3.5" />
                مسودة
              </div>
            ) : (
              <div className="rounded-full bg-slate-700 px-3 py-1.5 text-xs text-slate-400">
                بدون محتوى
              </div>
            )}
          </div>
        </div>
      </div>

      {/* المحرر */}
      <LessonContentEditor
        lessonId={lessonId}
        lessonName={lesson.name_ar}
        initialSections={sections as any}
        initialExercises={exercises as any}
        currentStatus={lesson.content_status as 'draft' | 'published'}
      />
    </div>
  )
}
