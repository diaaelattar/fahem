import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { HelpCircle, Filter, X, BookOpen, GraduationCap, Calendar, Layers, FileText } from 'lucide-react'
import { MathRenderer } from '@/components/ui/MathRenderer'
import { QuestionApprovalButtons } from '@/components/admin/QuestionApprovalButtons'
import Link from 'next/link'

interface SearchParams {
  type?: string
  difficulty?: string
  grade?: string
  subject?: string
  semester?: string
  unit?: string
  lesson?: string
  status?: string
  bloom?: string
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function QuestionsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin()
  const supabase = createClient()

  // ─── جلب بيانات الفلاتر (متسلسلة حسب الاختيارات) ───
  const [
    { data: grades },
    { data: subjects },
    { data: semesters },
  ] = await Promise.all([
    supabase
      .from('grades')
      .select('id, name_ar, grade_number, educational_stages(name_ar)')
      .order('grade_number'),
    supabase.from('subjects').select('id, name_ar, icon').order('name_ar'),
    supabase.from('semesters').select('id, name_ar').order('sort_order'),
  ])

  // الوحدات — تعتمد على (الصف + المادة + الفصل)
  const { data: units } = searchParams.grade && searchParams.subject
    ? await supabase
        .from('units')
        .select('id, name_ar')
        .eq('grade_id', searchParams.grade)
        .eq('subject_id', searchParams.subject)
        .order('sort_order')
    : { data: null }

  // الدروس — تعتمد على الوحدة
  const { data: lessons } = searchParams.unit
    ? await supabase
        .from('lessons')
        .select('id, name_ar')
        .eq('unit_id', searchParams.unit)
        .order('sort_order')
    : { data: null }

  // ─── بناء استعلام الأسئلة ───
  let query = supabase
    .from('questions')
    .select(`
      id, question_type, question_text, difficulty_level, bloom_level,
      points, status, is_approved, usage_count, created_at,
      subjects(name_ar, icon),
      grades(name_ar),
      units(name_ar),
      lessons(name_ar)
    `)
    .order('created_at', { ascending: false })
    .limit(60)

  if (searchParams.type)       query = query.eq('question_type', searchParams.type)
  if (searchParams.difficulty) query = query.eq('difficulty_level', searchParams.difficulty)
  if (searchParams.grade)      query = query.eq('grade_id', searchParams.grade)
  if (searchParams.subject)    query = query.eq('subject_id', searchParams.subject)
  if (searchParams.semester)   query = query.eq('semester_id', searchParams.semester)
  if (searchParams.unit)       query = query.eq('unit_id', searchParams.unit)
  if (searchParams.lesson)     query = query.eq('lesson_id', searchParams.lesson)
  if (searchParams.status)     query = query.eq('status', searchParams.status)
  if (searchParams.bloom)      query = query.eq('bloom_level', searchParams.bloom)

  const { data: questions } = await query

  // ─── Labels ───
  const TYPE_LABELS: Record<string, { label: string; color: string }> = {
    mcq:         { label: 'اختيار من متعدد', color: 'bg-blue-100 text-blue-700' },
    true_false:  { label: 'صح/خطأ',          color: 'bg-purple-100 text-purple-700' },
    fill_blank:  { label: 'ملء فراغ',        color: 'bg-orange-100 text-orange-700' },
    essay:       { label: 'مقالية',           color: 'bg-teal-100 text-teal-700' },
    correction:  { label: 'تصحيح',           color: 'bg-pink-100 text-pink-700' },
  }

  const DIFF_COLORS: Record<string, string> = {
    easy:   'bg-green-50 text-green-700 border-green-200',
    medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    hard:   'bg-red-50 text-red-700 border-red-200',
  }

  const STATUS_STYLES: Record<string, string> = {
    draft:    'bg-slate-100 text-slate-600',
    review:   'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }

  const BLOOM_LABELS: Record<string, { ar: string; color: string }> = {
    remember:   { ar: 'تذكر',   color: 'bg-blue-100 text-blue-700' },
    understand: { ar: 'فهم',    color: 'bg-emerald-100 text-emerald-700' },
    apply:      { ar: 'تطبيق', color: 'bg-amber-100 text-amber-700' },
    analyze:    { ar: 'تحليل', color: 'bg-purple-100 text-purple-700' },
    evaluate:   { ar: 'تقييم', color: 'bg-rose-100 text-rose-700' },
    create:     { ar: 'إبداع', color: 'bg-indigo-100 text-indigo-700' },
  }

  // بناء query string مع الحفاظ على الفلاتر الأخرى
  function buildHref(key: string, value: string, extra?: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    const current = searchParams as Record<string, string | undefined>
    // نسخ الفلاتر الحالية
    for (const k of ['type','difficulty','grade','subject','semester','unit','lesson','status','bloom']) {
      if (current[k]) p.set(k, current[k]!)
    }
    if (extra) {
      // إذا تغير grade، نحذف subject/semester/unit/lesson
      for (const [k, v] of Object.entries(extra)) {
        if (v === undefined) p.delete(k)
        else p.set(k, v)
      }
    }
    // Toggle: إذا كانت القيمة موجودة بالفعل، احذفها
    if (current[key] === value) p.delete(key)
    else p.set(key, value)
    return `/admin/questions?${p.toString()}`
  }

  const isActive = (key: string, value: string) =>
    (searchParams as Record<string, string | undefined>)[key] === value

  const hasFilters = Object.values(searchParams).some(Boolean)

  return (
    <div className="space-y-5" dir="rtl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">بنك الأسئلة</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {questions?.length || 0} سؤال
            {searchParams.grade && grades && ` • ${grades.find(g => g.id == (searchParams.grade as any))?.name_ar}`}
            {searchParams.subject && subjects && ` • ${subjects.find(s => s.id == (searchParams.subject as any))?.name_ar}`}
          </p>
        </div>
        <a
          href="/admin/questions/new"
          className="bg-primary text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          + إضافة سؤال
        </a>
      </div>

      {/* ── منظومة الفلترة التعليمية ── */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">

        {/* ── الصف الدراسي ── */}
        <div className="p-4 border-b border-border/60">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm font-bold text-slate-700">الصف الدراسي</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(grades as any[])?.map(g => (
              <a
                key={g.id}
                href={buildHref('grade', String(g.id), { subject: undefined, semester: undefined, unit: undefined, lesson: undefined })}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                  isActive('grade', String(g.id))
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'border-border hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                {g.name_ar}
              </a>
            ))}
          </div>
        </div>

        {/* ── المادة الدراسية ── */}
        <div className="p-4 border-b border-border/60">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-sm font-bold text-slate-700">المادة الدراسية</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(subjects as any[])?.map(s => (
              <a
                key={s.id}
                href={buildHref('subject', String(s.id), { unit: undefined, lesson: undefined })}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all flex items-center gap-1 ${
                  isActive('subject', String(s.id))
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'border-border hover:border-emerald-300 hover:bg-emerald-50'
                }`}
              >
                <span>{s.icon}</span> {s.name_ar}
              </a>
            ))}
          </div>
        </div>

        {/* ── الفصل الدراسي ── */}
        <div className="p-4 border-b border-border/60">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-sm font-bold text-slate-700">الفصل الدراسي</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(semesters as any[])?.map(sem => (
              <a
                key={sem.id}
                href={buildHref('semester', String(sem.id))}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                  isActive('semester', String(sem.id))
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'border-border hover:border-amber-300 hover:bg-amber-50'
                }`}
              >
                {sem.name_ar}
              </a>
            ))}
          </div>
        </div>

        {/* ── الوحدة الدراسية — تظهر فقط إذا تم اختيار الصف والمادة ── */}
        {units && units.length > 0 && (
          <div className="p-4 border-b border-border/60 bg-slate-50/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-sm font-bold text-slate-700">الوحدة الدراسية</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(units as any[]).map(u => (
                <a
                  key={u.id}
                  href={buildHref('unit', String(u.id), { lesson: undefined })}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                    isActive('unit', String(u.id))
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'border-border hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  {u.name_ar}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── الدرس — يظهر فقط إذا تم اختيار وحدة ── */}
        {lessons && lessons.length > 0 && (
          <div className="p-4 border-b border-border/60 bg-slate-50/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-rose-600" />
              </div>
              <span className="text-sm font-bold text-slate-700">الدرس</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(lessons as any[]).map(l => (
                <a
                  key={l.id}
                  href={buildHref('lesson', String(l.id))}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                    isActive('lesson', String(l.id))
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'border-border hover:border-rose-300 hover:bg-rose-50'
                  }`}
                >
                  {l.name_ar}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── الفلاتر الثانوية: النوع / المستوى / بلوم / الحالة ── */}
        <div className="p-4 flex flex-wrap gap-x-6 gap-y-3">

          {/* نوع السؤال */}
          <div>
            <p className="text-[11px] font-bold text-muted-foreground mb-2 uppercase tracking-wide">نوع السؤال</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(TYPE_LABELS).map(([type, { label, color }]) => (
                <a key={type} href={buildHref('type', type)}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-all border ${
                    isActive('type', type) ? color + ' border-current' : 'border-border hover:bg-muted'
                  }`}>
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* مستوى الصعوبة */}
          <div>
            <p className="text-[11px] font-bold text-muted-foreground mb-2 uppercase tracking-wide">الصعوبة</p>
            <div className="flex gap-1.5">
              {[['easy','سهل'],['medium','متوسط'],['hard','صعب']].map(([d, label]) => (
                <a key={d} href={buildHref('difficulty', d)}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-medium border transition-all ${
                    isActive('difficulty', d) ? DIFF_COLORS[d] + ' !border-current' : 'border-border hover:bg-muted'
                  }`}>
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* مستوى بلوم */}
          <div>
            <p className="text-[11px] font-bold text-muted-foreground mb-2 uppercase tracking-wide">تصنيف بلوم</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(BLOOM_LABELS).map(([k, { ar, color }]) => (
                <a key={k} href={buildHref('bloom', k)}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-medium border transition-all ${
                    isActive('bloom', k) ? color + ' border-current' : 'border-border hover:bg-muted'
                  }`}>
                  {ar}
                </a>
              ))}
            </div>
          </div>

          {/* الحالة */}
          <div>
            <p className="text-[11px] font-bold text-muted-foreground mb-2 uppercase tracking-wide">الحالة</p>
            <div className="flex gap-1.5">
              {[['draft','مسودة'],['review','للمراجعة'],['approved','معتمد'],['rejected','مرفوض']].map(([s, label]) => (
                <a key={s} href={buildHref('status', s)}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-medium border transition-all ${
                    isActive('status', s) ? STATUS_STYLES[s] + ' !border-current' : 'border-border hover:bg-muted'
                  }`}>
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* مسح الفلاتر */}
        {hasFilters && (
          <div className="px-4 pb-3">
            <a
              href="/admin/questions"
              className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-bold transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              مسح جميع الفلاتر
            </a>
          </div>
        )}
      </div>

      {/* ── قائمة الأسئلة ── */}
      {questions && questions.length > 0 ? (
        <div className="space-y-2">
          {questions.map((q: any) => {
            const typeInfo = TYPE_LABELS[q.question_type] || { label: q.question_type, color: 'bg-slate-100 text-slate-700' }
            const bloom = q.bloom_level ? BLOOM_LABELS[q.bloom_level] : null
            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-border p-4 hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                      {q.difficulty_level && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${DIFF_COLORS[q.difficulty_level]}`}>
                          {q.difficulty_level === 'easy' ? 'سهل' : q.difficulty_level === 'medium' ? 'متوسط' : 'صعب'}
                        </span>
                      )}
                      {bloom && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${bloom.color}`}>
                          بلوم: {bloom.ar}
                        </span>
                      )}
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[q.status || 'draft']}`}>
                        {q.status === 'approved' ? '✓ معتمد' : q.status === 'review' ? '⏳ مراجعة' : q.status === 'rejected' ? '✗ مرفوض' : 'مسودة'}
                      </span>
                    </div>

                    {/* نص السؤال */}
                    <MathRenderer text={q.question_text} className="text-sm font-medium leading-relaxed line-clamp-2" />

                    {/* التسلسل التعليمي */}
                    <div className="flex flex-wrap items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                      {q.grades?.name_ar && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded-full">{q.grades.name_ar}</span>
                      )}
                      {q.subjects?.name_ar && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded-full">{q.subjects.icon} {q.subjects.name_ar}</span>
                      )}
                      {q.units?.name_ar && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded-full">📦 {q.units.name_ar}</span>
                      )}
                      {q.lessons?.name_ar && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded-full">📄 {q.lessons.name_ar}</span>
                      )}
                      <span className="mr-auto">{q.points} {q.points === 1 ? 'درجة' : 'درجات'} • استُخدم {q.usage_count} مرة</span>
                    </div>
                  </div>

                  {/* أزرار التحكم */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <QuestionApprovalButtons questionId={q.id} currentStatus={q.status || 'draft'} />
                    <a
                      href={`/admin/questions/${q.id}`}
                      className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                    >
                      تعديل
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border p-16 text-center">
          <HelpCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">لا توجد أسئلة</h3>
          <p className="text-muted-foreground text-sm mb-6">
            {hasFilters ? 'لا توجد أسئلة تطابق هذه الفلاتر' : 'ارفع محتوى ليقوم الذكاء الاصطناعي بتوليد أسئلة'}
          </p>
          {hasFilters ? (
            <a href="/admin/questions" className="bg-muted text-muted-foreground px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-muted/80 inline-block">
              مسح الفلاتر
            </a>
          ) : (
            <a href="/admin/content" className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90 inline-block">
              رفع محتوى جديد
            </a>
          )}
        </div>
      )}
    </div>
  )
}
