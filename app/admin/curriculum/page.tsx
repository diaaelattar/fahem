// app/admin/curriculum/page.tsx
// صفحة إدارة المناهج — هيكل هرمي كامل مع الوحدات والدروس

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { BookOpen, GraduationCap, School, Layers, Plus, ChevronLeft, BarChart2 } from 'lucide-react'
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
    .select(`
      id, name_ar, sort_order, is_active, description, semester,
      subjects(id, name_ar, icon),
      grades(id, name_ar),
      lessons(id, name_ar, is_active)
    `)
    .order('sort_order')

  // جلب الأسئلة غير المصنفة
  const { count: unclassifiedCount } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .is('unit_id', null)

  // جلب المواد والصفوف للفلاتر
  const { data: subjects } = await supabase.from('subjects').select('id, name_ar, icon').order('id')
  const { data: grades } = await supabase.from('grades').select('id, name_ar').order('grade_number')

  // فلترة الوحدات
  let filteredUnits = units || []
  if (searchParams.grade) filteredUnits = filteredUnits.filter((u: any) => String(u.grades?.id) === searchParams.grade)
  if (searchParams.subject) filteredUnits = filteredUnits.filter((u: any) => String(u.subjects?.id) === searchParams.subject)

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة المناهج</h1>
          <p className="text-muted-foreground mt-0.5">هيكل هرمي: مادة → وحدة → درس → أسئلة</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/curriculum/units/new"
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> وحدة جديدة
          </Link>
        </div>
      </div>

      {/* Alert: Unclassified Questions */}
      {(unclassifiedCount || 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-amber-800">
                {unclassifiedCount} سؤال غير مصنف بعد
              </p>
              <p className="text-xs text-amber-600">هذه الأسئلة لم تُعيَّن لوحدة أو درس بعد</p>
            </div>
          </div>
          <Link href="/admin/questions?unclassified=true"
            className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors">
            تصنيفها الآن
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
        {[
          { key: 'structure', label: 'الهيكل الهرمي' },
          { key: 'units', label: `الوحدات (${units?.length || 0})` },
          { key: 'stats', label: 'الإحصائيات' },
        ].map(tab => (
          <Link key={tab.key} href={`/admin/curriculum?tab=${tab.key}`}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.key ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}>
            {tab.label}
          </Link>
        ))}
      </div>

      {/* TAB: UNITS LIST */}
      {activeTab === 'units' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <form className="flex gap-3">
              <select name="grade" defaultValue={searchParams.grade || ''}
                className="border border-border rounded-xl px-3 py-2 text-sm bg-white">
                <option value="">كل الصفوف</option>
                {grades?.map((g: any) => <option key={g.id} value={g.id}>{g.name_ar}</option>)}
              </select>
              <select name="subject" defaultValue={searchParams.subject || ''}
                className="border border-border rounded-xl px-3 py-2 text-sm bg-white">
                <option value="">كل المواد</option>
                {subjects?.map((s: any) => <option key={s.id} value={s.id}>{s.icon} {s.name_ar}</option>)}
              </select>
              <button type="submit" className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold">فلتر</button>
            </form>
          </div>

          {filteredUnits.length > 0 ? (
            <div className="space-y-8">
              {['term_1', 'term_2', 'full_year'].map(term => {
                const termUnits = filteredUnits.filter((u: any) => 
                  u.semester === term || (!u.semester && term === 'full_year')
                )
                
                if (termUnits.length === 0) return null

                const termLabels: any = {
                  term_1: 'الفصل الدراسي الأول',
                  term_2: 'الفصل الدراسي الثاني',
                  full_year: 'عام دراسي كامل'
                }

                return (
                  <div key={term} className="space-y-4">
                    <h3 className="font-bold text-lg border-b border-border pb-2 text-primary">{termLabels[term]}</h3>
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {termUnits.map((unit: any) => {
                        const lessonCount = unit.lessons?.filter((l: any) => l.is_active).length || 0
                        return (
                          <Link key={unit.id} href={`/admin/curriculum/units/${unit.id}`}
                            className="group bg-white rounded-2xl border border-border p-5 hover:border-primary/30 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-3">
                              <div className="text-2xl">{unit.subjects?.icon || '📚'}</div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${unit.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                                {unit.is_active ? 'نشط' : 'معطّل'}
                              </span>
                            </div>
                            <h3 className="font-bold text-base mb-1 group-hover:text-primary transition-colors">{unit.name_ar}</h3>
                            <p className="text-xs text-muted-foreground mb-3">
                              {unit.subjects?.name_ar} • {unit.grades?.name_ar}
                            </p>
                            <div className="flex items-center justify-between pt-3 border-t border-border">
                              <span className="text-xs font-bold text-muted-foreground">{lessonCount} درس</span>
                              <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
            <div className="bg-white rounded-2xl border border-dashed border-border p-16 text-center">
              <Layers className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">لا توجد وحدات بعد</h3>
              <p className="text-muted-foreground text-sm mb-6">أضف وحدات دراسية لكل مادة لتنظيم المحتوى</p>
              <Link href="/admin/curriculum/units/new"
                className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary/90">
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
            <div key={stage.id} className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
              <div className="p-5 border-b bg-slate-50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold">{stage.name_ar}</h2>
                <span className="text-xs text-muted-foreground">({stage.grades?.length || 0} صفوف)</span>
              </div>
              <div className="divide-y divide-border">
                {(stage.grades || [])
                  .sort((a: any, b: any) => a.grade_number - b.grade_number)
                  .map((grade: any) => {
                    const gradeUnits = (units || []).filter((u: any) => u.grades?.id === grade.id)
                    return (
                      <div key={grade.id} className="p-5">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                            {grade.name_ar}
                            <span className="text-xs text-muted-foreground font-normal">({gradeUnits.length} وحدة)</span>
                          </h3>
                          <Link href={`/admin/curriculum/units/new?grade=${grade.id}`}
                            className="flex items-center gap-1 text-primary text-xs font-bold hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors">
                            <Plus className="w-3.5 h-3.5" /> وحدة
                          </Link>
                        </div>
                        {gradeUnits.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {gradeUnits.map((unit: any) => {
                              const lessonCount = unit.lessons?.length || 0
                              return (
                                <Link key={unit.id} href={`/admin/curriculum/units/${unit.id}`}
                                  className="group bg-gradient-to-br from-muted/30 to-muted/10 border border-border rounded-xl p-3 hover:bg-white hover:border-primary/30 hover:shadow-sm transition-all">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">{unit.subjects?.icon || '📚'}</span>
                                    <span className="text-sm font-bold truncate group-hover:text-primary transition-colors">{unit.name_ar}</span>
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {unit.subjects?.name_ar} • {lessonCount} درس
                                  </div>
                                </Link>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-4 bg-muted/10 border border-dashed border-border rounded-xl">
                            <p className="text-xs text-muted-foreground">لا توجد وحدات بعد لهذا الصف</p>
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
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي الوحدات', value: units?.length || 0, icon: '📦', color: 'bg-blue-50 text-blue-600' },
            { label: 'إجمالي الدروس', value: units?.reduce((acc: number, u: any) => acc + (u.lessons?.length || 0), 0) || 0, icon: '📖', color: 'bg-purple-50 text-purple-600' },
            { label: 'أسئلة غير مصنفة', value: unclassifiedCount || 0, icon: '❓', color: 'bg-amber-50 text-amber-600' },
            { label: 'مواد نشطة', value: subjects?.length || 0, icon: '✅', color: 'bg-green-50 text-green-600' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl border border-border p-6 text-center">
              <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center text-2xl mx-auto mb-3`}>
                {stat.icon}
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
