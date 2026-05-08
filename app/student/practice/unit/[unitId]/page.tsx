// app/student/practice/unit/[unitId]/page.tsx
// تدريب على وحدة دراسية كاملة

import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, ArrowLeft } from 'lucide-react'
import { PracticeSessionClient } from '@/components/student/PracticeSessionClient'

interface Props { params: { unitId: string } }

export default async function PracticeUnitPage({ params }: Props) {
  const profile = await requireStudent()
  const supabase = createClient()
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
    .from('students').select('grade_id').eq('id', profile.id).single()

  if (student?.grade_id !== (unit.grades as any)?.id) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold mb-2">هذه الوحدة لصف آخر</h1>
        <Link href="/student/practice" className="text-primary hover:underline">العودة للتدريب</Link>
      </div>
    )
  }

  // جلب أسئلة الوحدة كاملة
  const { data: questions } = await supabase
    .from('questions')
    .select('id, question_type, context_passage, question_text, options, correct_answer, explanation, points, difficulty_level, lesson_id')
    .eq('unit_id', unitId)
    .order('lesson_id', { ascending: true })

  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 animate-fade-in">
        <div className="text-5xl mb-4">{(unit.subjects as any)?.icon || '📚'}</div>
        <h1 className="text-2xl font-bold mb-2">{(unit as any).name_ar}</h1>
        <p className="text-muted-foreground mb-8">لا توجد أسئلة بعد في هذه الوحدة</p>
        <Link href="/student/practice" className="bg-primary text-white px-6 py-3 rounded-xl font-medium">العودة</Link>
      </div>
    )
  }

  // جلب دروس الوحدة للعرض
  const { data: lessons } = await supabase
    .from('lessons').select('id, name_ar').eq('unit_id', unitId).order('sort_order')

  const shuffled = [...questions].sort(() => Math.random() - 0.5)

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/student/practice" className="hover:text-primary transition-colors">مركز التدريب</Link>
        <span>/</span>
        <span className="font-bold">{(unit as any).name_ar}</span>
      </div>

      <div className="card-premium p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center text-4xl shrink-0">
            {(unit.subjects as any)?.icon || '📚'}
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold text-purple-600 mb-1">تدريب على وحدة كاملة</div>
            <h1 className="text-2xl font-bold">{(unit as any).name_ar}</h1>
            <p className="text-muted-foreground text-sm">
              {(unit.subjects as any)?.name_ar} • {shuffled.length} سؤال من {lessons?.length || 0} درس
            </p>
          </div>
        </div>
        {lessons && lessons.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-4 pt-4 border-t border-border">
            {lessons.map((l: any) => (
              <Link key={l.id} href={`/student/practice/lesson/${l.id}`}
                className="text-xs bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground font-medium px-3 py-1.5 rounded-lg transition-colors">
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
