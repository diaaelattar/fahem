// app/student/practice/[subjectId]/page.tsx
// جلسة التدريب الحرة على مادة معينة

import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PracticeSessionClient } from '@/components/student/PracticeSessionClient'
import { BookOpen } from 'lucide-react'

interface Props {
  params: { subjectId: string }
  searchParams: { grade?: string }
}

export default async function PracticeSubjectPage({ params }: Props) {
  const profile = await requireStudent()
  const supabase = await createClient()

  // معرف المادة (عدد صحيح)
  const subjectIdNum = parseInt(params.subjectId, 10)
  if (isNaN(subjectIdNum)) notFound()

  // جلب بيانات المادة
  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name_ar, icon')
    .eq('id', subjectIdNum)
    .single()

  if (!subject) notFound()

  // جلب الصف الدراسي للطالب
  const { data: student } = await supabase
    .from('students')
    .select('grade_id')
    .eq('id', profile.id)
    .single()

  // جلب أسئلة هذه المادة للصف الدراسي
  const { data: questions, error } = await supabase
    .from('questions')
    .select(
      'id, question_type, context_passage, question_text, options, correct_answer, explanation, points, difficulty_level'
    )
    .eq('subject_id', subjectIdNum)
    .eq('grade_id', student?.grade_id || 0)
    .order('created_at')

  if (!questions || questions.length === 0) {
    // حاول جلب الأسئلة بدون فلتر الصف كحل بديل
    const { data: allGradeQ } = await supabase
      .from('questions')
      .select(
        'id, question_type, context_passage, question_text, options, correct_answer, explanation, points, difficulty_level'
      )
      .eq('subject_id', subjectIdNum)
      .limit(30)

    if (!allGradeQ || allGradeQ.length === 0) {
      return (
        <div className="mx-auto max-w-2xl animate-fade-in py-20 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-muted">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">
            {(subject as any).name_ar}
          </h1>
          <p className="mb-8 text-muted-foreground">
            لا توجد أسئلة متاحة لهذه المادة بعد.
            <br />
            سيقوم المعلم بإضافتها قريباً.
          </p>
          <Link
            href="/student/practice"
            className="rounded-xl bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary/90"
          >
            العودة لمركز التدريب
          </Link>
        </div>
      )
    }

    // استخدم الأسئلة بدون فلتر الصف
    const shuffled = [...allGradeQ].sort(() => Math.random() - 0.5).slice(0, 20)
    return (
      <PracticeLayout
        subject={subject}
        questions={shuffled}
        studentId={profile.id}
        note="أسئلة عامة (غير مصنفة بالصف)"
      />
    )
  }

  // خلط عشوائي وأخذ 20 سؤال
  const shuffled = [...questions].sort(() => Math.random() - 0.5).slice(0, 20)

  return (
    <PracticeLayout
      subject={subject}
      questions={shuffled}
      studentId={profile.id}
    />
  )
}

function PracticeLayout({
  subject,
  questions,
  studentId,
  note,
}: {
  subject: any
  questions: any[]
  studentId: string
  note?: string
}) {
  return (
    <div className="animate-fade-in space-y-6 pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/student/practice"
          className="transition-colors hover:text-primary"
        >
          مركز التدريب
        </Link>
        <span>/</span>
        <span className="font-bold text-foreground">{subject.name_ar}</span>
      </div>

      {/* Header */}
      <div className="card-premium p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-4xl">
            {subject.icon || '📚'}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{subject.name_ar}</h1>
            <p className="text-sm text-muted-foreground">
              {questions.length} سؤال • بدون ضغط وقت • شرح فوري لكل إجابة
            </p>
            {note && (
              <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                {note}
              </span>
            )}
          </div>
          <div className="hidden gap-2 md:flex">
            <span className="rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700">
              🆓 تدريب حر
            </span>
            <span className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700">
              ⚡ شرح فوري
            </span>
          </div>
        </div>
      </div>

      <PracticeSessionClient
        questions={questions as any[]}
        subject={subject as any}
        studentId={studentId}
      />
    </div>
  )
}
