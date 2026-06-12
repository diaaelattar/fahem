import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import {
  HelpCircle,
  X,
  GraduationCap,
  Calendar,
  Layers,
  FileText,
  Lock,
} from 'lucide-react'
import { QuestionsListClient } from '@/components/admin/QuestionsListClient'
import Link from 'next/link'

interface SearchParams {
  type?: string
  difficulty?: string
  grade?: string
  semester?: string
  unit?: string
  lesson?: string
  bloom?: string
  limit?: string
  mine?: string
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TeacherQuestionsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'teacher') redirect('/auth/login')

  const supabase = await createClient()

  // ── جلب مادة المعلم ──
  const { data: teacherData } = await supabase
    .from('teachers')
    .select('subject_id, subjects(name_ar, icon)')
    .eq('id', profile.id)
    .single()

  const teacherSubjectId = teacherData?.subject_id ?? null
  const teacherSubject = teacherData?.subjects as unknown as {
    name_ar: string
    icon: string
  } | null

  // الـ layout يتحقق من subject_id ويحيل إلى onboarding عند الحاجة
  // إزالة الـ redirect المكرر هنا يمنع سلسلة الإحالة الخاطئة
  if (!teacherSubjectId) {
    // في حال نادر: إذا لم تكن المادة محددة، لا يُعاد توجيه المستخدم خارج بوابة المعلم
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-bold text-slate-500">لم يتم تحديد مادتك بعد. يرجى إعداد حسابك من الإعدادات.</p>
      </div>
    )
  }

  const [{ data: grades }, { data: semesters }] = await Promise.all([
    supabase
      .from('grades')
      .select('id, name_ar, grade_number')
      .order('grade_number'),
    supabase.from('semesters').select('id, name_ar').order('sort_order'),
  ])

  let unitsQuery = supabase
    .from('units')
    .select('id, name_ar')
    .eq('grade_id', searchParams.grade)
    .eq('subject_id', teacherSubjectId)
    .order('sort_order')

  if (searchParams.semester) {
    unitsQuery = unitsQuery.eq('semester_id', searchParams.semester)
  }

  const { data: units } =
    searchParams.grade && teacherSubjectId ? await unitsQuery : { data: null }

  const { data: lessons } = searchParams.unit
    ? await supabase
        .from('lessons')
        .select('id, name_ar')
        .eq('unit_id', searchParams.unit)
        .order('sort_order')
    : { data: null }

  const limit = parseInt(searchParams.limit || '60', 10)
  const showMineOnly = searchParams.mine === '1'

  let query = supabase
    .from('questions')
    .select(
      `
      id, question_type, context_passage, question_text, difficulty_level, bloom_level,
      points, status, is_approved, usage_count, created_at, teacher_id,
      subjects(name_ar, icon),
      grades(name_ar),
      units(name_ar),
      lessons(name_ar)
    `
    )
    .order('created_at', { ascending: false })
    .limit(limit) as any

  // ── فلتر المادة: دائماً مقيّد بمادة المعلم ──
  if (teacherSubjectId) {
    query = query.eq('subject_id', teacherSubjectId)
  }

  // فلتر: أسئلتي فقط أو كل الأسئلة
  if (showMineOnly) {
    query = query.eq('teacher_id', profile.id)
  }

  if (searchParams.type) query = query.eq('question_type', searchParams.type)
  if (searchParams.difficulty)
    query = query.eq('difficulty_level', searchParams.difficulty)
  if (searchParams.grade) query = query.eq('grade_id', searchParams.grade)
  if (searchParams.semester)
    query = query.eq('semester_id', searchParams.semester)
  if (searchParams.unit) query = query.eq('unit_id', searchParams.unit)
  if (searchParams.lesson) query = query.eq('lesson_id', searchParams.lesson)
  if (searchParams.bloom) query = query.eq('bloom_level', searchParams.bloom)

  const { data: questions } = await query

  // ── Labels ──
  const TYPE_LABELS: Record<string, { label: string; color: string }> = {
    mcq: { label: 'اختيار من متعدد', color: 'bg-blue-100 text-blue-700' },
    true_false: { label: 'صح/خطأ', color: 'bg-purple-100 text-purple-700' },
    fill_blank: { label: 'ملء فراغ', color: 'bg-orange-100 text-orange-700' },
    essay: { label: 'مقالية', color: 'bg-teal-100 text-teal-700' },
    correction: { label: 'تصحيح', color: 'bg-pink-100 text-pink-700' },
  }

  const DIFF_COLORS: Record<string, string> = {
    easy: 'bg-green-50 text-green-700 border-green-200',
    medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    hard: 'bg-red-50 text-red-700 border-red-200',
  }

  const STATUS_STYLES: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    review: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }

  const BLOOM_LABELS: Record<string, { ar: string; color: string }> = {
    remember: { ar: 'تذكر', color: 'bg-blue-100 text-blue-700' },
    understand: { ar: 'فهم', color: 'bg-emerald-100 text-emerald-700' },
    apply: { ar: 'تطبيق', color: 'bg-amber-100 text-amber-700' },
    analyze: { ar: 'تحليل', color: 'bg-purple-100 text-purple-700' },
    evaluate: { ar: 'تقييم', color: 'bg-rose-100 text-rose-700' },
    create: { ar: 'إبداع', color: 'bg-indigo-100 text-indigo-700' },
  }

  function buildHref(
    key: string,
    value: string,
    extra?: Record<string, string | undefined>
  ) {
    const p = new URLSearchParams()
    const current = searchParams as Record<string, string | undefined>
    for (const k of [
      'type',
      'difficulty',
      'grade',
      'semester',
      'unit',
      'lesson',
      'bloom',
      'limit',
      'mine',
    ]) {
      if (current[k]) p.set(k, current[k]!)
    }
    if (extra) {
      for (const [k, v] of Object.entries(extra)) {
        if (v === undefined) p.delete(k)
        else p.set(k, v)
      }
    }
    if (current[key] === value) p.delete(key)
    else p.set(key, value)
    return `/teacher/questions?${p.toString()}`
  }

  const isActive = (key: string, value: string) =>
    (searchParams as Record<string, string | undefined>)[key] === value

  const hasFilters = Object.entries(searchParams).some(
    ([k, v]) => k !== 'mine' && Boolean(v)
  )

  // عدد أسئلتي
  const myQuestionsCount =
    (questions as any[])?.filter((q: any) => q.teacher_id === profile.id)
      .length || 0

  return (
    <div className="space-y-5" dir="rtl">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">بنك الأسئلة</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            يعرض {questions?.length || 0} سؤال
            {showMineOnly && ' (أسئلتي فقط)'}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={
              showMineOnly ? '/teacher/questions' : '/teacher/questions?mine=1'
            }
            className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
              showMineOnly
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-border hover:bg-muted'
            }`}
          >
            {showMineOnly ? 'عرض الكل' : `أسئلتي (${myQuestionsCount})`}
          </a>
          <a
            href="/teacher/questions/new"
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            + إنشاء سؤال
          </a>
        </div>
      </div>

      {/* ── بانر المادة المقيّدة ── */}
      {teacherSubject && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
            <Lock className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-800">
              📚 يعرض أسئلة مادة:{' '}
              <span className="text-emerald-700">
                {teacherSubject.icon} {teacherSubject.name_ar}
              </span>{' '}
              فقط
            </p>
            <p className="mt-0.5 text-xs text-emerald-600">
              يتم عرض الأسئلة المرتبطة بمادتك الدراسية تلقائياً
            </p>
          </div>
        </div>
      )}

      {/* ── منظومة الفلترة التعليمية ── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        {/* ── الصف الدراسي ── */}
        <div className="border-b border-border/60 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <GraduationCap className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-sm font-bold text-slate-700">
              الصف الدراسي
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(grades as any[])?.map((g) => (
              <a
                key={g.id}
                href={buildHref('grade', String(g.id), {
                  semester: undefined,
                  unit: undefined,
                  lesson: undefined,
                })}
                role="button"
                aria-pressed={isActive('grade', String(g.id)) ? 'true' : 'false'}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive('grade', String(g.id))
                    ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                    : 'border-border hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                {g.name_ar}
              </a>
            ))}
          </div>
        </div>

        {/* ── الفصل الدراسي ── */}
        <div className="border-b border-border/60 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100">
              <Calendar className="h-4 w-4 text-amber-600" />
            </div>
            <span className="text-sm font-bold text-slate-700">
              الفصل الدراسي
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(semesters as any[])?.map((sem) => (
              <a
                key={sem.id}
                href={buildHref('semester', String(sem.id), {
                  unit: undefined,
                  lesson: undefined,
                })}
                role="button"
                aria-pressed={isActive('semester', String(sem.id)) ? 'true' : 'false'}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive('semester', String(sem.id))
                    ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                    : 'border-border hover:border-amber-300 hover:bg-amber-50'
                }`}
              >
                {sem.name_ar}
              </a>
            ))}
          </div>
        </div>

        {/* ── الوحدة الدراسية ── */}
        {units && units.length > 0 && (
          <div className="border-b border-border/60 bg-slate-50/50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                <Layers className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-sm font-bold text-slate-700">
                الوحدة الدراسية
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(units as any[]).map((u) => (
                <a
                  key={u.id}
                  href={buildHref('unit', String(u.id), { lesson: undefined })}
                  role="button"
                  aria-pressed={isActive('unit', String(u.id)) ? 'true' : 'false'}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    isActive('unit', String(u.id))
                      ? 'border-purple-600 bg-purple-600 text-white shadow-sm'
                      : 'border-border hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  {u.name_ar}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── الدرس ── */}
        {lessons && lessons.length > 0 && (
          <div className="border-b border-border/60 bg-slate-50/50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-100">
                <FileText className="h-4 w-4 text-rose-600" />
              </div>
              <span className="text-sm font-bold text-slate-700">الدرس</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(lessons as any[]).map((l) => (
                <a
                  key={l.id}
                  href={buildHref('lesson', String(l.id))}
                  role="button"
                  aria-pressed={isActive('lesson', String(l.id)) ? 'true' : 'false'}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    isActive('lesson', String(l.id))
                      ? 'border-rose-600 bg-rose-600 text-white shadow-sm'
                      : 'border-border hover:border-rose-300 hover:bg-rose-50'
                  }`}
                >
                  {l.name_ar}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── الفلاتر الثانوية ── */}
        <div className="flex flex-wrap gap-x-6 gap-y-3 p-4">
          {/* نوع السؤال */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              نوع السؤال
            </p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(TYPE_LABELS).map(([type, { label, color }]) => (
                <a
                  key={type}
                  href={buildHref('type', type)}
                  role="button"
                  aria-pressed={isActive('type', type) ? 'true' : 'false'}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
                    isActive('type', type)
                      ? color + ' border-current'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* مستوى الصعوبة */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              الصعوبة
            </p>
            <div className="flex gap-1.5">
              {[
                ['easy', 'سهل'],
                ['medium', 'متوسط'],
                ['hard', 'صعب'],
              ].map(([d, label]) => (
                <a
                  key={d}
                  href={buildHref('difficulty', d)}
                  role="button"
                  aria-pressed={isActive('difficulty', d) ? 'true' : 'false'}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
                    isActive('difficulty', d)
                      ? DIFF_COLORS[d] + ' !border-current'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* تصنيف بلوم */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              تصنيف بلوم
            </p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(BLOOM_LABELS).map(([k, { ar, color }]) => (
                <a
                  key={k}
                  href={buildHref('bloom', k)}
                  role="button"
                  aria-pressed={isActive('bloom', k) ? 'true' : 'false'}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
                    isActive('bloom', k)
                      ? color + ' border-current'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {ar}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* مسح الفلاتر */}
        {hasFilters && (
          <div className="px-4 pb-3">
            <a
              href={
                showMineOnly
                  ? '/teacher/questions?mine=1'
                  : '/teacher/questions'
              }
              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-500 transition-colors hover:text-red-700"
            >
              <X className="h-3.5 w-3.5" />
              مسح جميع الفلاتر
            </a>
          </div>
        )}
      </div>

      {/* ── قائمة الأسئلة ── */}
      {questions && questions.length > 0 ? (
        <>
          <QuestionsListClient
            questions={questions}
            TYPE_LABELS={TYPE_LABELS}
            DIFF_COLORS={DIFF_COLORS}
            BLOOM_LABELS={BLOOM_LABELS}
            STATUS_STYLES={STATUS_STYLES}
            basePath="/teacher/questions"
            showApprovalActions={false}
            showPrintButton={true}
          />
          {questions.length === limit && (
            <div className="mb-8 mt-6 flex justify-center">
              <Link
                href={buildHref('limit', (limit + 60).toString())}
                className="rounded-2xl border-2 border-slate-200 bg-white px-8 py-3 text-sm font-bold text-primary shadow-sm transition-all hover:border-primary/30 hover:bg-slate-50"
              >
                عرض المزيد من الأسئلة ↓
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-border bg-white p-16 text-center">
          <HelpCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="mb-2 text-lg font-bold">لا توجد أسئلة</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            {hasFilters
              ? 'لا توجد أسئلة تطابق هذه الفلاتر'
              : 'ابدأ بإنشاء أسئلة خاصة بك'}
          </p>
          {hasFilters ? (
            <a
              href="/teacher/questions"
              className="inline-block rounded-xl bg-muted px-6 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/80"
            >
              مسح الفلاتر
            </a>
          ) : (
            <a
              href="/teacher/questions/new"
              className="inline-block rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
            >
              إنشاء سؤال جديد
            </a>
          )}
        </div>
      )}
    </div>
  )
}
