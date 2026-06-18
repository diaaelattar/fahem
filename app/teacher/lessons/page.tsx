import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TeacherLesson, Unit, Grade } from '@/types/teacher'
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Eye,
  GraduationCap,
  Layers,
  PenSquare,
} from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface SearchParams {
  grade?: string
  unit?: string
}

export default async function TeacherLessonsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'teacher') redirect('/auth/login')

  const supabase = await createClient()

  // جلب بيانات المعلم (المادة ملزمة للمعلم)
  const { data: teacherData } = await supabase
    .from('teachers')
    .select('subject_id, subjects(name_ar, icon)')
    .eq('id', profile.id)
    .maybeSingle()

  const teacherSubjectId = teacherData?.subject_id ?? null
  const teacherSubject = teacherData?.subjects as unknown as { name_ar: string; icon: string } | null

  // الـ layout يضمن بالفعل وجود subject_id ويحيل إلى onboarding عند الحاجة.
  // إزالة الـ redirect المكرر هنا يمنع سلسلة الإحالة الخاطئة (lessons → onboarding → dashboard).
  if (!teacherSubjectId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-bold text-slate-500">لم يتم تحديد مادتك بعد. يرجى إعداد حسابك من الإعدادات.</p>
      </div>
    )
  }

  // جلب الصفوف والوحدات
  const [{ data: grades }, unitsRes] = await Promise.all([
    supabase.from('grades').select('id, name_ar, grade_number').order('grade_number'),
    searchParams.grade
      ? supabase
          .from('units')
          .select('id, name_ar')
          .eq('grade_id', searchParams.grade)
          .eq('subject_id', teacherSubjectId)
          .order('sort_order')
      : Promise.resolve({ data: null }),
  ])

  const units = unitsRes.data

  // جلب الوحدات المرتبطة بالمادة (للفلتر الداخلي)
  const unitIdsQuery = supabase
    .from('units')
    .select('id')
    .eq('subject_id', teacherSubjectId)

  const unitIdsResult = await (searchParams.grade
    ? unitIdsQuery.eq('grade_id', searchParams.grade)
    : unitIdsQuery)

  const allUnitIds = (unitIdsResult.data ?? []).map((u: { id: string }) => u.id)

  // فلترة الـ unitIds أكثر بناءً على الفلترة المختارة
  let targetUnitIds = allUnitIds
  if (searchParams.unit) {
    targetUnitIds = allUnitIds.includes(searchParams.unit)
      ? [searchParams.unit]
      : []
  }

  // استعلام الدروس
  let lessonsData: TeacherLesson[] = []
  if (targetUnitIds.length > 0) {
    const { data } = await supabase
      .from('lessons')
      .select(
        `
        id, name_ar, sort_order,
        has_content, content_status, view_count,
        unit_id,
        units(id, name_ar, grade_id, grades(name_ar))
      `
      )
      .in('unit_id', targetUnitIds)
      .order('sort_order')
    lessonsData = (data as unknown as TeacherLesson[]) ?? []
  }

  const lessons = lessonsData

  // إحصائيات سريعة
  const total = lessons?.length ?? 0
  const published = lessons?.filter((l) => l.content_status === 'published').length ?? 0
  const draft = lessons?.filter((l) => l.content_status === 'draft' && l.has_content).length ?? 0
  const empty = lessons?.filter((l) => !l.has_content).length ?? 0

  // دالة بناء الروابط مع الفلاتر
  function buildHref(key: string, value: string | null) {
    const params = new URLSearchParams()
    if (searchParams.grade) params.set('grade', searchParams.grade)
    if (searchParams.unit) params.set('unit', searchParams.unit)
    if (value === null || (key === 'grade' && value === searchParams.grade)) {
      params.delete(key)
      if (key === 'grade') params.delete('unit')
    } else {
      params.set(key, value)
      if (key === 'grade') params.delete('unit')
    }
    const q = params.toString()
    return `/teacher/lessons${q ? '?' + q : ''}`
  }

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-indigo-500" />
            شرح الدروس
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            مادة:{' '}
            <span className="font-bold text-indigo-600">
              {teacherSubject?.icon} {teacherSubject?.name_ar}
            </span>
          </p>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'إجمالي الدروس', value: total, color: 'text-slate-800', bg: 'bg-white border-slate-200' },
          { label: 'منشورة', value: published, color: 'text-emerald-700', bg: 'bg-emerald-50/50 border-emerald-100' },
          { label: 'مسودة', value: draft, color: 'text-amber-700', bg: 'bg-amber-50/50 border-amber-100' },
          { label: 'بدون محتوى', value: empty, color: 'text-rose-700', bg: 'bg-rose-50/50 border-rose-100' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-2xl ${stat.bg} border p-5 shadow-sm`}>
            <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-xs font-bold text-slate-500 mt-1.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* فلاتر الصفوف */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-bold text-slate-500">
            <GraduationCap className="h-4 w-4" />
            الصف:
          </span>
          <Link
            href="/teacher/lessons"
            className={`rounded-xl px-3.5 py-2 text-xs transition-all ${
              !searchParams.grade
                ? 'bg-indigo-600 text-white shadow-sm font-bold shadow-indigo-100'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium'
            }`}
          >
            كل الصفوف
          </Link>
          {grades?.map((grade) => (
            <Link
              key={grade.id}
              href={buildHref('grade', grade.id)}
              className={`rounded-xl px-3.5 py-2 text-xs transition-all ${
                searchParams.grade === grade.id
                  ? 'bg-indigo-600 text-white shadow-sm font-bold shadow-indigo-100'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium'
              }`}
            >
              {grade.name_ar}
            </Link>
          ))}
        </div>

        {/* فلاتر الوحدات */}
        {searchParams.grade && units && units.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-bold text-slate-500">
              <Layers className="h-4 w-4" />
              الوحدة:
            </span>
            <Link
              href={buildHref('unit', null)}
              className={`rounded-xl px-3.5 py-2 text-xs transition-all ${
                !searchParams.unit
                  ? 'bg-violet-600 text-white shadow-sm font-bold shadow-violet-100'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium'
              }`}
            >
              كل الوحدات
            </Link>
            {units.map((unit) => (
              <Link
                key={unit.id}
                href={buildHref('unit', unit.id)}
                className={`rounded-xl px-3.5 py-2 text-xs transition-all ${
                  searchParams.unit === unit.id
                    ? 'bg-violet-600 text-white shadow-sm font-bold shadow-violet-100'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium'
                }`}
              >
                {unit.name_ar}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* قائمة الدروس */}
      {!lessons || lessons.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-16 text-center shadow-sm">
          <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 font-bold text-slate-400">
            {searchParams.grade || searchParams.unit
              ? 'لا توجد دروس بهذه الفلاتر'
              : 'اختر صفاً لعرض الدروس'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => {
            const unit = lesson.units as unknown as Unit
            const grade = unit?.grades as unknown as Grade
            const isPublished = lesson.content_status === 'published'
            const hasDraft = lesson.has_content && !isPublished
            const isEmpty = !lesson.has_content

            return (
              <div
                key={lesson.id}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-white px-5 py-4 transition-all hover:border-indigo-200 hover:shadow-sm"
              >
                {/* أيقونة الحالة */}
                <div className="shrink-0">
                  {isPublished ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : hasDraft ? (
                    <Clock className="h-5 w-5 text-amber-500" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                  )}
                </div>

                {/* معلومات الدرس */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 text-sm">{lesson.name_ar}</div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
                    <span>{grade?.name_ar}</span>
                    <span>•</span>
                    <span>{unit?.name_ar}</span>
                    {isPublished && lesson.view_count > 0 && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5 text-slate-400" />
                          {lesson.view_count} مشاهدة
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* شارة الحالة */}
                <div className="shrink-0">
                  {isPublished ? (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                      منشور
                    </span>
                  ) : hasDraft ? (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                      مسودة
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500">
                      بدون محتوى
                    </span>
                  )}
                </div>

                {/* أزرار الإجراءات */}
                <div className="flex shrink-0 items-center gap-2 md:opacity-0 transition-opacity group-hover:opacity-100">
                  <Link
                    href={`/teacher/lessons/${lesson.id}`}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-100 shadow-sm"
                  >
                    <PenSquare className="h-3.5 w-3.5" />
                    {isEmpty ? 'إضافة شرح' : 'تعديل'}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
