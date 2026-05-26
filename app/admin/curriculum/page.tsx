// app/admin/curriculum/page.tsx
// صفحة إدارة المناهج — هيكل هرمي كامل مع الوحدات والدروس

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import {
  BookOpen,
  GraduationCap,
  School,
  Layers,
  Plus,
  ChevronLeft,
  BarChart2,
} from 'lucide-react'
import Link from 'next/link'

export default async function CurriculumPage({
  searchParams,
}: {
  searchParams: { tab?: string; grade?: string; subject?: string }
}) {
  await requireAdmin()
  const supabase = await createClient()
  const activeTab = searchParams.tab || 'structure'

  // جلب الهيكل الهرمي
  const { data: stages } = await supabase
    .from('educational_stages')
    .select(`id, name_ar, stage_code, grades(id, name_ar, grade_number)`)
    .order('sort_order')

  // جلب الوحدات مع إحصائياتها
  const { data: units } = await supabase
    .from('units')
    .select(
      `
      id, name_ar, sort_order, is_active, description, semester,
      subjects(id, name_ar, icon),
      grades(id, name_ar),
      lessons(id, name_ar, is_active)
    `
    )
    .order('sort_order')

  // جلب الأسئلة غير المصنفة
  const { count: unclassifiedCount } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .is('unit_id', null)

  // جلب المواد والصفوف للفلاتر
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name_ar, icon')
    .order('id')
  const { data: grades } = await supabase
    .from('grades')
    .select('id, name_ar')
    .order('grade_number')

  // فلترة الوحدات
  let filteredUnits = units || []
  if (searchParams.grade)
    filteredUnits = filteredUnits.filter(
      (u: any) => String(u.grades?.id) === searchParams.grade
    )
  if (searchParams.subject)
    filteredUnits = filteredUnits.filter(
      (u: any) => String(u.subjects?.id) === searchParams.subject
    )

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة المناهج</h1>
          <p className="mt-0.5 text-muted-foreground">
            هيكل هرمي: مادة → وحدة → درس → أسئلة
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/curriculum/units/new"
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> وحدة جديدة
          </Link>
        </div>
      </div>

      {/* Alert: Unclassified Questions */}
      {(unclassifiedCount || 0) > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-amber-800">
                {unclassifiedCount} سؤال غير مصنف بعد
              </p>
              <p className="text-xs text-amber-600">
                هذه الأسئلة لم تُعيَّن لوحدة أو درس بعد
              </p>
            </div>
          </div>
          <Link
            href="/admin/questions?unclassified=true"
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-amber-600"
          >
            تصنيفها الآن
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div className="flex w-fit gap-1 rounded-xl bg-muted p-1">
        {[
          { key: 'structure', label: 'الهيكل الهرمي' },
          { key: 'units', label: `الوحدات (${units?.length || 0})` },
          { key: 'stats', label: 'الإحصائيات' },
        ].map((tab) => (
          <Link
            key={tab.key}
            href={`/admin/curriculum?tab=${tab.key}`}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
              activeTab === tab.key
                ? 'bg-white text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* TAB: UNITS LIST */}
      {activeTab === 'units' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <form className="flex gap-3">
              <select
                name="grade"
                defaultValue={searchParams.grade || ''}
                className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
              >
                <option value="">كل الصفوف</option>
                {grades?.map((g: any) => (
                  <option key={g.id} value={g.id}>
                    {g.name_ar}
                  </option>
                ))}
              </select>
              <select
                name="subject"
                defaultValue={searchParams.subject || ''}
                className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
              >
                <option value="">كل المواد</option>
                {subjects?.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.icon} {s.name_ar}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white"
              >
                فلتر
              </button>
            </form>
          </div>

          {filteredUnits.length > 0 ? (
            <div className="space-y-8">
              {['term_1', 'term_2', 'full_year'].map((term) => {
                const termUnits = filteredUnits.filter(
                  (u: any) =>
                    u.semester === term || (!u.semester && term === 'full_year')
                )

                if (termUnits.length === 0) return null

                const termLabels: any = {
                  term_1: 'الفصل الدراسي الأول',
                  term_2: 'الفصل الدراسي الثاني',
                  full_year: 'عام دراسي كامل',
                }

                return (
                  <div key={term} className="space-y-4">
                    <h3 className="border-b border-border pb-2 text-lg font-bold text-primary">
                      {termLabels[term]}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {termUnits.map((unit: any) => {
                        const lessonCount =
                          unit.lessons?.filter((l: any) => l.is_active)
                            .length || 0
                        return (
                          <Link
                            key={unit.id}
                            href={`/admin/curriculum/units/${unit.id}`}
                            className="group rounded-2xl border border-border bg-white p-5 transition-all hover:border-primary/30 hover:shadow-md"
                          >
                            <div className="mb-3 flex items-start justify-between">
                              <div className="text-2xl">
                                {unit.subjects?.icon || '📚'}
                              </div>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${unit.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}
                              >
                                {unit.is_active ? 'نشط' : 'معطّل'}
                              </span>
                            </div>
                            <h3 className="mb-1 text-base font-bold transition-colors group-hover:text-primary">
                              {unit.name_ar}
                            </h3>
                            <p className="mb-3 text-xs text-muted-foreground">
                              {unit.subjects?.name_ar} • {unit.grades?.name_ar}
                            </p>
                            <div className="flex items-center justify-between border-t border-border pt-3">
                              <span className="text-xs font-bold text-muted-foreground">
                                {lessonCount} درس
                              </span>
                              <ChevronLeft className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-white p-16 text-center">
              <Layers className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
              <h3 className="mb-2 text-lg font-bold">لا توجد وحدات بعد</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                أضف وحدات دراسية لكل مادة لتنظيم المحتوى
              </p>
              <Link
                href="/admin/curriculum/units/new"
                className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90"
              >
                + إضافة وحدة جديدة
              </Link>
            </div>
          )}
        </div>
      )}

      {/* TAB: STRUCTURE */}
      {activeTab === 'structure' && (
        <div className="space-y-6">
          {(stages || []).map((stage: any) => (
            <div
              key={stage.id}
              className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
            >
              <div className="flex items-center gap-3 border-b bg-slate-50 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold">{stage.name_ar}</h2>
                <span className="text-xs text-muted-foreground">
                  ({stage.grades?.length || 0} صفوف)
                </span>
              </div>
              <div className="divide-y divide-border">
                {(stage.grades || [])
                  .sort((a: any, b: any) => a.grade_number - b.grade_number)
                  .map((grade: any) => {
                    const gradeUnits = (units || []).filter(
                      (u: any) => u.grades?.id === grade.id
                    )
                    return (
                      <div key={grade.id} className="p-5">
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="flex items-center gap-2 font-bold">
                            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                            {grade.name_ar}
                            <span className="text-xs font-normal text-muted-foreground">
                              ({gradeUnits.length} وحدة)
                            </span>
                          </h3>
                          <Link
                            href={`/admin/curriculum/units/new?grade=${grade.id}`}
                            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/5"
                          >
                            <Plus className="h-3.5 w-3.5" /> وحدة
                          </Link>
                        </div>
                        {gradeUnits.length > 0 ? (
                          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                            {gradeUnits.map((unit: any) => {
                              const lessonCount = unit.lessons?.length || 0
                              return (
                                <Link
                                  key={unit.id}
                                  href={`/admin/curriculum/units/${unit.id}`}
                                  className="group rounded-xl border border-border bg-gradient-to-br from-muted/30 to-muted/10 p-3 transition-all hover:border-primary/30 hover:bg-white hover:shadow-sm"
                                >
                                  <div className="mb-1 flex items-center gap-2">
                                    <span className="text-lg">
                                      {unit.subjects?.icon || '📚'}
                                    </span>
                                    <span className="truncate text-sm font-bold transition-colors group-hover:text-primary">
                                      {unit.name_ar}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {unit.subjects?.name_ar} • {lessonCount} درس
                                  </div>
                                </Link>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-border bg-muted/10 py-4 text-center">
                            <p className="text-xs text-muted-foreground">
                              لا توجد وحدات بعد لهذا الصف
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB: STATS */}
      {activeTab === 'stats' && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'إجمالي الوحدات',
              value: units?.length || 0,
              icon: '📦',
              color: 'bg-blue-50 text-blue-600',
            },
            {
              label: 'إجمالي الدروس',
              value:
                units?.reduce(
                  (acc: number, u: any) => acc + (u.lessons?.length || 0),
                  0
                ) || 0,
              icon: '📖',
              color: 'bg-purple-50 text-purple-600',
            },
            {
              label: 'أسئلة غير مصنفة',
              value: unclassifiedCount || 0,
              icon: '❓',
              color: 'bg-amber-50 text-amber-600',
            },
            {
              label: 'مواد نشطة',
              value: subjects?.length || 0,
              icon: '✅',
              color: 'bg-green-50 text-green-600',
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-white p-6 text-center"
            >
              <div
                className={`h-12 w-12 rounded-2xl ${stat.color} mx-auto mb-3 flex items-center justify-center text-2xl`}
              >
                {stat.icon}
              </div>
              <div className="mb-1 text-3xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
