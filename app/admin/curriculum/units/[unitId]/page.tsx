// app/admin/curriculum/units/[unitId]/page.tsx
// صفحة تفاصيل الوحدة الدراسية مع دروسها

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight,
  Plus,
  BookOpen,
  Edit2,
  Trash2,
  FileText,
  Zap,
} from 'lucide-react'
import { UnitDetailClient } from '@/components/admin/UnitDetailClient'

interface Props {
  params: { unitId: string }
}

export default async function UnitDetailPage({ params }: Props) {
  await requireAdmin()
  const supabase = await createClient()
  const unitId = parseInt(params.unitId, 10)

  // جلب الوحدة
  const { data: unit } = await supabase
    .from('units')
    .select(
      `
      id, name_ar, description, sort_order, is_active,
      subjects(id, name_ar, icon),
      grades(id, name_ar)
    `
    )
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
    if (q.lesson_id)
      lessonQCount[q.lesson_id] = (lessonQCount[q.lesson_id] || 0) + 1
  })

  // الأسئلة التابعة للوحدة مباشرةً (غير مصنفة لدرس)
  const { count: unitOnlyQuestions } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('unit_id', unitId)
    .is('lesson_id', null)

  return (
    <div className="animate-fade-in space-y-6 pb-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/admin/curriculum?tab=units"
          className="transition-colors hover:text-primary"
        >
          الوحدات
        </Link>
        <span>/</span>
        <span className="font-bold text-foreground">
          {(unit as any).name_ar}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
            {(unit as any).subjects?.icon || '📚'}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{(unit as any).name_ar}</h1>
            <p className="text-sm text-muted-foreground">
              {(unit as any).subjects?.name_ar} •{' '}
              {(unit as any).grades?.name_ar}
            </p>
            {(unit as any).description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {(unit as any).description}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/curriculum/units/${unitId}/edit`}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Edit2 className="h-4 w-4" /> تعديل
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-white p-5 text-center">
          <div className="text-3xl font-bold text-primary">
            {lessons?.length || 0}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">عدد الدروس</div>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5 text-center">
          <div className="text-3xl font-bold text-indigo-600">
            {questionCounts?.length || 0}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            إجمالي الأسئلة
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5 text-center">
          <div
            className={`text-3xl font-bold ${(unitOnlyQuestions || 0) > 0 ? 'text-amber-500' : 'text-green-500'}`}
          >
            {unitOnlyQuestions || 0}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            غير مصنفة لدرس
          </div>
        </div>
      </div>

      {/* Lessons List */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <BookOpen className="h-5 w-5 text-primary" />
            دروس هذه الوحدة
          </h2>
          <UnitDetailClient unitId={unitId} />
        </div>

        {lessons && lessons.length > 0 ? (
          <div className="space-y-3">
            {lessons.map((lesson: any, idx: number) => {
              const qCount = lessonQCount[lesson.id] || 0
              return (
                <div
                  key={lesson.id}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5 transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  {/* Order Badge */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary">
                    {idx + 1}
                  </div>

                  {/* Lesson Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{lesson.name_ar}</h3>
                      {!lesson.is_active && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                          معطّل
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>⏱️ {lesson.duration_minutes} دقيقة</span>
                      <span>❓ {qCount} سؤال</span>
                      {lesson.objectives && <span>🎯 أهداف محددة</span>}
                    </div>
                  </div>

                  {/* Question Count Badge */}
                  <div className="shrink-0 text-center">
                    <div
                      className={`text-lg font-bold ${qCount > 0 ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      {qCount}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      سؤال
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={`/admin/curriculum/lessons/${lesson.id}`}
                      className="flex items-center gap-1.5 rounded-xl bg-primary/5 px-3 py-2 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-white"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      إدارة
                    </Link>
                    <Link
                      href={`/admin/curriculum/lessons/${lesson.id}/create-exam`}
                      className="flex items-center gap-1.5 rounded-xl bg-green-50 px-3 py-2 text-xs font-bold text-green-700 transition-all hover:bg-green-500 hover:text-white"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      اختبار
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <h3 className="mb-2 text-lg font-bold">لا توجد دروس بعد</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              أضف دروساً لهذه الوحدة لتنظيم الأسئلة
            </p>
          </div>
        )}
      </div>

      {/* Quick Link to Questions */}
      <div className="flex items-center justify-between rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 p-6">
        <div>
          <h3 className="mb-1 font-bold text-indigo-900">
            إدارة أسئلة هذه الوحدة
          </h3>
          <p className="text-sm text-indigo-700/70">
            عرض وتعديل الأسئلة المرتبطة بهذه الوحدة كاملةً
          </p>
        </div>
        <Link
          href={`/admin/questions?unit=${unitId}`}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-700"
        >
          عرض الأسئلة
        </Link>
      </div>
    </div>
  )
}
