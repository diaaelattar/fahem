// app/admin/curriculum/units/[unitId]/page.tsx
// صفحة تفاصيل الوحدة الدراسية مع دروسها

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Plus, BookOpen, Edit2, Trash2, FileText, Zap } from 'lucide-react'
import { UnitDetailClient } from '@/components/admin/UnitDetailClient'

interface Props { params: { unitId: string } }

export default async function UnitDetailPage({ params }: Props) {
  await requireAdmin()
  const supabase = createClient()
  const unitId = parseInt(params.unitId, 10)

  // جلب الوحدة
  const { data: unit } = await supabase
    .from('units')
    .select(`
      id, name_ar, description, sort_order, is_active,
      subjects(id, name_ar, icon),
      grades(id, name_ar)
    `)
    .eq('id', unitId)
    .single()

  if (!unit) notFound()

  // جلب دروس الوحدة
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, name_ar, sort_order, duration_minutes, is_active, objectives')
    .eq('unit_id', unitId)
    .order('sort_order')

  // عدد الأسئلة لكل درس
  const { data: questionCounts } = await supabase
    .from('questions')
    .select('lesson_id')
    .eq('unit_id', unitId)

  const lessonQCount: Record<number, number> = {}
  questionCounts?.forEach((q: any) => {
    if (q.lesson_id) lessonQCount[q.lesson_id] = (lessonQCount[q.lesson_id] || 0) + 1
  })

  // الأسئلة التابعة للوحدة مباشرةً (غير مصنفة لدرس)
  const { count: unitOnlyQuestions } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('unit_id', unitId)
    .is('lesson_id', null)

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/curriculum?tab=units" className="hover:text-primary transition-colors">الوحدات</Link>
        <span>/</span>
        <span className="text-foreground font-bold">{(unit as any).name_ar}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">
            {(unit.subjects as any)?.icon || '📚'}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{(unit as any).name_ar}</h1>
            <p className="text-muted-foreground text-sm">
              {(unit.subjects as any)?.name_ar} • {(unit.grades as any)?.name_ar}
            </p>
            {(unit as any).description && (
              <p className="text-sm text-muted-foreground mt-1">{(unit as any).description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/curriculum/units/${unitId}/edit`}
            className="flex items-center gap-2 border border-border px-4 py-2 rounded-xl text-sm font-medium hover:bg-muted transition-colors">
            <Edit2 className="w-4 h-4" /> تعديل
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-border p-5 text-center">
          <div className="text-3xl font-bold text-primary">{lessons?.length || 0}</div>
          <div className="text-xs text-muted-foreground mt-1">عدد الدروس</div>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5 text-center">
          <div className="text-3xl font-bold text-indigo-600">
            {(questionCounts?.length || 0)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">إجمالي الأسئلة</div>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5 text-center">
          <div className={`text-3xl font-bold ${(unitOnlyQuestions || 0) > 0 ? 'text-amber-500' : 'text-green-500'}`}>
            {unitOnlyQuestions || 0}
          </div>
          <div className="text-xs text-muted-foreground mt-1">غير مصنفة لدرس</div>
        </div>
      </div>

      {/* Lessons List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            دروس هذه الوحدة
          </h2>
          <UnitDetailClient unitId={unitId} />
        </div>

        {lessons && lessons.length > 0 ? (
          <div className="space-y-3">
            {lessons.map((lesson: any, idx: number) => {
              const qCount = lessonQCount[lesson.id] || 0
              return (
                <div key={lesson.id}
                  className="bg-white rounded-2xl border border-border p-5 flex items-center gap-4 hover:border-primary/30 hover:shadow-sm transition-all">
                  {/* Order Badge */}
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm shrink-0">
                    {idx + 1}
                  </div>

                  {/* Lesson Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{lesson.name_ar}</h3>
                      {!lesson.is_active && (
                        <span className="text-[10px] bg-muted text-muted-foreground font-bold px-2 py-0.5 rounded-full">معطّل</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>⏱️ {lesson.duration_minutes} دقيقة</span>
                      <span>❓ {qCount} سؤال</span>
                      {lesson.objectives && <span>🎯 أهداف محددة</span>}
                    </div>
                  </div>

                  {/* Question Count Badge */}
                  <div className="text-center shrink-0">
                    <div className={`text-lg font-bold ${qCount > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                      {qCount}
                    </div>
                    <div className="text-[10px] text-muted-foreground">سؤال</div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/admin/curriculum/lessons/${lesson.id}`}
                      className="flex items-center gap-1.5 bg-primary/5 text-primary text-xs font-bold px-3 py-2 rounded-xl hover:bg-primary hover:text-white transition-all">
                      <FileText className="w-3.5 h-3.5" />
                      إدارة
                    </Link>
                    <Link href={`/admin/curriculum/lessons/${lesson.id}/create-exam`}
                      className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-bold px-3 py-2 rounded-xl hover:bg-green-500 hover:text-white transition-all">
                      <Zap className="w-3.5 h-3.5" />
                      اختبار
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-border p-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">لا توجد دروس بعد</h3>
            <p className="text-muted-foreground text-sm mb-6">أضف دروساً لهذه الوحدة لتنظيم الأسئلة</p>
          </div>
        )}
      </div>

      {/* Quick Link to Questions */}
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-indigo-900 mb-1">إدارة أسئلة هذه الوحدة</h3>
          <p className="text-sm text-indigo-700/70">
            عرض وتعديل الأسئلة المرتبطة بهذه الوحدة كاملةً
          </p>
        </div>
        <Link href={`/admin/questions?unit=${unitId}`}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors">
          عرض الأسئلة
        </Link>
      </div>
    </div>
  )
}
