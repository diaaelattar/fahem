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
  const supabase = createClient()

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
    .select('id, question_type, question_text, options, correct_answer, explanation, points, difficulty_level')
    .eq('subject_id', subjectIdNum)
    .eq('grade_id', student?.grade_id || 0)
    .order('created_at')

  if (!questions || questions.length === 0) {
    // حاول جلب الأسئلة بدون فلتر الصف كحل بديل
    const { data: allGradeQ } = await supabase
      .from('questions')
      .select('id, question_type, question_text, options, correct_answer, explanation, points, difficulty_level')
      .eq('subject_id', subjectIdNum)
      .limit(30)

    if (!allGradeQ || allGradeQ.length === 0) {
      return (
        <div className="max-w-2xl mx-auto text-center py-20 animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{(subject as any).name_ar}</h1>
          <p className="text-muted-foreground mb-8">
            لا توجد أسئلة متاحة لهذه المادة بعد.<br />
            سيقوم المعلم بإضافتها قريباً.
          </p>
          <Link href="/student/practice"
            className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors">
            العودة لمركز التدريب
          </Link>
        </div>
      )
    }

    // استخدم الأسئلة بدون فلتر الصف
    const shuffled = [...allGradeQ].sort(() => Math.random() - 0.5).slice(0, 20)
    return <PracticeLayout subject={subject} questions={shuffled} studentId={profile.id} note="أسئلة عامة (غير مصنفة بالصف)" />
  }

  // خلط عشوائي وأخذ 20 سؤال
  const shuffled = [...questions].sort(() => Math.random() - 0.5).slice(0, 20)

  return <PracticeLayout subject={subject} questions={shuffled} studentId={profile.id} />
}

function PracticeLayout({ subject, questions, studentId, note }: {
  subject: any
  questions: any[]
  studentId: string
  note?: string
}) {
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/student/practice" className="hover:text-primary transition-colors">مركز التدريب</Link>
        <span>/</span>
        <span className="text-foreground font-bold">{subject.name_ar}</span>
      </div>

      {/* Header */}
      <div className="card-premium p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-4xl shrink-0">
            {subject.icon || '📚'}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{subject.name_ar}</h1>
            <p className="text-muted-foreground text-sm">
              {questions.length} سؤال • بدون ضغط وقت • شرح فوري لكل إجابة
            </p>
            {note && (
              <span className="inline-block mt-1 text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
                {note}
              </span>
            )}
          </div>
          <div className="hidden md:flex gap-2">
            <span className="text-xs bg-green-100 text-green-700 font-bold px-3 py-1.5 rounded-full">🆓 تدريب حر</span>
            <span className="text-xs bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded-full">⚡ شرح فوري</span>
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
