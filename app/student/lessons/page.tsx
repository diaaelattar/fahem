import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  GraduationCap,
  Layers,
  PlayCircle,
  Search,
  Sparkles,
} from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface SearchParams {
  grade?: string
  unit?: string
}

export default async function StudentLessonsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'student') redirect('/auth/login')

  const supabase = await createClient()

  // جلب بيانات الطالب لمعرفة صفه ومادته
  const { data: studentData } = await supabase
    .from('students')
    .select('grade_id, grades(name_ar)')
    .eq('id', profile.id)
    .single()

  const studentGradeId = studentData?.grade_id ?? null

  // جلب الصفوف (للفلاتر)
  const { data: grades } = await supabase
    .from('grades')
    .select('id, name_ar, grade_number')
    .order('grade_number')

  const gradeId = (searchParams.grade ?? studentGradeId) as string | null

  // جلب وحدات الصف المختار
  const { data: gradeUnits } = gradeId
    ? await supabase
        .from('units')
        .select('id, name_ar, subjects(name_ar, icon)')
        .eq('grade_id', gradeId)
        .order('sort_order')
    : { data: null }

  const units = gradeUnits

  // حساب unitIds للفلترة
  let targetUnitIds: string[] = []
  if (searchParams.unit) {
    targetUnitIds = [searchParams.unit]
  } else if (gradeUnits) {
    targetUnitIds = gradeUnits.map((u: any) => u.id)
  }

  // جلب الدروس المنشورة مع محتوى
  let lessonsData: any[] = []
  if (targetUnitIds.length > 0) {
    const { data } = await supabase
      .from('lessons')
      .select(
        `
        id, name_ar, sort_order, view_count, content_updated_at,
        unit_id,
        units(id, name_ar, grade_id, grades(name_ar), subjects(name_ar, icon))
      `
      )
      .in('unit_id', targetUnitIds)
      .eq('has_content', true)
      .eq('content_status', 'published')
      .order('sort_order')
    lessonsData = data ?? []
  }

  const lessons = lessonsData


  // جلب التدريبات المكتملة للطالب
  const { data: completedAttempts } = await supabase
    .from('exercise_attempts')
    .select('lesson_id')
    .eq('student_id', profile.id)

  const completedLessonIds = new Set(
    completedAttempts?.map((a) => a.lesson_id) ?? []
  )

  function buildHref(key: string, value: string | null) {
    const params = new URLSearchParams()
    if (gradeId) params.set('grade', gradeId)
    if (searchParams.unit) params.set('unit', searchParams.unit)
    if (value === null) {
      params.delete(key)
      if (key === 'grade') params.delete('unit')
    } else {
      params.set(key, value)
      if (key === 'grade') params.delete('unit')
    }
    return `/student/lessons${params.toString() ? '?' + params.toString() : ''}`
  }

  const total = lessons?.length ?? 0
  const completed = lessons?.filter((l) => completedLessonIds.has(l.id)).length ?? 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── رأس الصفحة ───────────────────────────────────────────── */}
      <div className="border-b border-border bg-white px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="h-7 w-7 text-primary" />
              دروسي
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              استعرض شروح الدروس والتدريبات التفاعلية
            </p>
          </div>

          {total > 0 && (
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-white px-5 py-3">
              <div className="text-center">
                <div className="text-xl font-bold text-primary">{total}</div>
                <div className="text-xs text-muted-foreground">درس متاح</div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <div className="text-xl font-bold text-emerald-600">{completed}</div>
                <div className="text-xs text-muted-foreground">تم التدريب</div>
              </div>
            </div>
          )}
        </div>

        {/* شريط التقدم */}
        {total > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>تقدمك في الدروس</span>
              <span>{Math.round((completed / total) * 100)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${(completed / total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="px-8 py-6 space-y-5">
        {/* ─── فلاتر الصفوف ─────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
              <GraduationCap className="h-4 w-4" />
              الصف:
            </span>
            {grades?.map((grade) => (
              <Link
                key={grade.id}
                href={buildHref('grade', grade.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                  gradeId === grade.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white border border-border text-muted-foreground hover:border-primary hover:text-primary'
                }`}
              >
                {grade.name_ar}
              </Link>
            ))}
          </div>

          {gradeId && units && units.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                <Layers className="h-4 w-4" />
                الوحدة:
              </span>
              <Link
                href={buildHref('unit', null)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                  !searchParams.unit
                    ? 'bg-violet-600 text-white'
                    : 'bg-white border border-border text-muted-foreground hover:border-violet-500 hover:text-violet-600'
                }`}
              >
                الكل
              </Link>
              {units.map((unit) => (
                <Link
                  key={unit.id}
                  href={buildHref('unit', unit.id)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                    searchParams.unit === unit.id
                      ? 'bg-violet-600 text-white'
                      : 'bg-white border border-border text-muted-foreground hover:border-violet-500 hover:text-violet-600'
                  }`}
                >
                  {unit.name_ar}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ─── قائمة الدروس ─────────────────────────────────────────── */}
        {!lessons || lessons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-16 text-center bg-white">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 font-medium text-muted-foreground">
              {gradeId ? 'لا توجد دروس متاحة حالياً' : 'اختر صفك الدراسي لعرض الدروس'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              سيضيف معلمك الدروس وشروحها قريباً
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {lessons.map((lesson) => {
              const unit = lesson.units as any
              const grade = unit?.grades as any
              const subject = unit?.subjects as any
              const isDone = completedLessonIds.has(lesson.id)

              return (
                <Link
                  key={lesson.id}
                  href={`/student/lessons/${lesson.id}`}
                  className="group relative flex flex-col rounded-2xl border border-border bg-white p-5 shadow-sm transition-all hover:border-primary hover:shadow-md"
                >
                  {/* أيقونة الاكتمال */}
                  {isDone && (
                    <div className="absolute left-4 top-4">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    </div>
                  )}

                  {/* المادة والصف */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{subject?.icon}</span>
                    <div className="text-xs text-muted-foreground">
                      {subject?.name_ar} • {grade?.name_ar}
                    </div>
                  </div>

                  {/* اسم الدرس */}
                  <h2 className="font-bold text-gray-900 text-base leading-snug group-hover:text-primary transition-colors">
                    {lesson.name_ar}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">{unit?.name_ar}</p>

                  {/* زر الدخول */}
                  <div className="mt-4 flex items-center justify-between">
                    <div
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                        isDone
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-primary/5 text-primary'
                      }`}
                    >
                      {isDone ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          أكملت التدريبات
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-3.5 w-3.5" />
                          ابدأ الدرس
                        </>
                      )}
                    </div>
                    <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
