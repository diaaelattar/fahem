// app/student/practice/lesson/[lessonId]/page.tsx
// تدريب على درس واحد — تركيز كامل

import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Target } from 'lucide-react'
import { PracticeSessionClient } from '@/components/student/PracticeSessionClient'
import { LessonSummaryClient } from '@/components/student/LessonSummaryClient'

interface Props { params: { lessonId: string } }

export default async function PracticeLessonPage({ params }: Props) {
  const profile = await requireStudent()
  const supabase = createClient()
  const lessonId = parseInt(params.lessonId, 10)
  if (isNaN(lessonId)) notFound()

  // جلب الدرس
  const { data: lesson } = await supabase
    .from('lessons')
    .select(`
      id, name_ar, duration_minutes, objectives, summary,
      units(id, name_ar, subjects(id, name_ar, icon), grades(id, name_ar))
    `)
    .eq('id', lessonId)
    .single()

  if (!lesson) notFound()

  const unit = (lesson as any).units

  // جلب أسئلة الدرس
  const { data: questions } = await supabase
    .from('questions')
    .select('id, question_type, context_passage, question_text, options, correct_answer, explanation, points, difficulty_level')
    .eq('lesson_id', lessonId)
    .order('created_at')

  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 animate-fade-in">
        <div className="text-5xl mb-4">📭</div>
        <h1 className="text-2xl font-bold mb-2">{(lesson as any).name_ar}</h1>
        <p className="text-muted-foreground mb-8">لا توجد أسئلة بعد لهذا الدرس</p>
        <Link href={`/student/practice/unit/${unit?.id}`}
          className="bg-primary text-white px-6 py-3 rounded-xl font-medium">العودة للوحدة</Link>
      </div>
    )
  }

  const shuffled = [...questions].sort(() => Math.random() - 0.5)

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Link href="/student/practice" className="hover:text-primary">مركز التدريب</Link>
        <span>/</span>
        <Link href={`/student/practice/unit/${unit?.id}`} className="hover:text-primary">{unit?.name_ar}</Link>
        <span>/</span>
        <span className="font-bold">{(lesson as any).name_ar}</span>
      </div>

      <div className="card-premium p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center text-4xl shrink-0">
            {unit?.subjects?.icon || '📖'}
          </div>
          <div>
            <div className="text-xs font-bold text-rose-500 mb-1 flex items-center gap-1">
              <Target className="w-3 h-3" /> تدريب مركّز على درس
            </div>
            <h1 className="text-2xl font-bold">{(lesson as any).name_ar}</h1>
            <p className="text-muted-foreground text-sm">
              {unit?.subjects?.name_ar} • {unit?.name_ar} • {shuffled.length} سؤال
            </p>
          </div>
        </div>
        {(lesson as any).objectives && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs font-bold text-muted-foreground mb-1">🎯 أهداف الدرس</p>
            <p className="text-sm text-muted-foreground">{(lesson as any).objectives}</p>
          </div>
        )}
      </div>

      <LessonSummaryClient summary={(lesson as any).summary} />

      <PracticeSessionClient
        questions={shuffled as any[]}
        subject={unit?.subjects as any}
        studentId={profile.id}
      />
    </div>
  )
}
