// app/student/practice/unit/[unitId]/page.tsx
// تدريب على وحدة دراسية كاملة

import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, ArrowLeft } from 'lucide-react'
import { PracticeSessionClient } from '@/components/student/PracticeSessionClient'

interface Props {
  params: { unitId: string }
}

export default async function PracticeUnitPage({ params }: Props) {
  const profile = await requireStudent()
  const supabase = await createClient()
  const unitId = parseInt(params.unitId, 10)
  if (isNaN(unitId)) notFound()

  // جلب الوحدة
  const { data: unit } = await supabase
    .from('units')
    .select('id, name_ar, subjects(id, name_ar, icon), grades(id, name_ar)')
    .eq('id', unitId)
    .single()

  if (!unit) notFound()

  // التحقق من صلاحية الطالب (نفس الصف)
  const { data: student } = await supabase
    .from('students')
    .select('grade_id')
    .eq('id', profile.id)
    .maybeSingle()

  if (student?.grade_id !== (unit.grades as any)?.id) {
    return (
      <div className="py-20 text-center">
        <div className="mb-4 text-6xl">🔒</div>
        <h1 className="mb-2 text-2xl font-bold">هذه الوحدة لصف آخر</h1>
        <Link href="/student/practice" className="text-primary hover:underline">
          العودة للتدريب
        </Link>
      </div>
    )
  }

  // جلب أسئلة الوحدة كاملة
  const { data: questions } = await supabase
    .from('questions')
    .select(
      'id, question_type, context_passage, question_text, options, correct_answer, explanation, points, difficulty_level, lesson_id'
    )
    .eq('unit_id', unitId)
    .order('lesson_id', { ascending: true })

  if (!questions || questions.length === 0) {
    return (
      <div className="mx-auto max-w-lg animate-fade-in py-20 text-center">
        <div className="mb-4 text-5xl">
          {(unit.subjects as any)?.icon || '📚'}
        </div>
        <h1 className="mb-2 text-2xl font-bold">{(unit as any).name_ar}</h1>
        <p className="mb-8 text-muted-foreground">
          لا توجد أسئلة بعد في هذه الوحدة
        </p>
        <Link
          href="/student/practice"
          className="rounded-xl bg-primary px-6 py-3 font-medium text-white"
        >
          العودة
        </Link>
      </div>
    )
  }

  // جلب دروس الوحدة للعرض
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, name_ar')
    .eq('unit_id', unitId)
    .order('sort_order')

  const shuffled = [...questions].sort(() => Math.random() - 0.5)

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/student/practice"
          className="transition-colors hover:text-primary"
        >
          مركز التدريب
        </Link>
        <span>/</span>
        <span className="font-bold">{(unit as any).name_ar}</span>
      </div>

      <div className="card-premium p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-4xl">
            {(unit.subjects as any)?.icon || '📚'}
          </div>
          <div className="flex-1">
            <div className="mb-1 text-xs font-bold text-purple-600">
              تدريب على وحدة كاملة
            </div>
            <h1 className="text-2xl font-bold">{(unit as any).name_ar}</h1>
            <p className="text-sm text-muted-foreground">
              {(unit.subjects as any)?.name_ar} • {shuffled.length} سؤال من{' '}
              {lessons?.length || 0} درس
            </p>
          </div>
        </div>
        {lessons && lessons.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
            {lessons.map((l: any) => (
              <Link
                key={l.id}
                href={`/student/practice/lesson/${l.id}`}
                className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              >
                {l.name_ar}
              </Link>
            ))}
          </div>
        )}
      </div>

      <PracticeSessionClient
        questions={shuffled as any[]}
        subject={unit.subjects as any}
        studentId={profile.id}
      />
    </div>
  )
}
