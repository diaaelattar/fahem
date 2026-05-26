import { createClient } from '@/lib/supabase/server'
import { TeacherExamBuilder } from '@/components/teacher/TeacherExamBuilder'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { getCurrentProfile } from '@/lib/auth/permissions'
import { notFound, redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EditTeacherExamPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'teacher') redirect('/auth/login')

  // Fetch exam data to edit
  const { data: initialData } = await supabase
    .from('exams')
    .select('*')
    .eq('id', params.id)
    .eq('teacher_id', profile?.id)
    .single()

  if (!initialData) {
    return notFound()
  }

  const [
    { data: teacherData },
    { data: subjects },
    { data: grades },
    { data: semesters },
    { data: units },
    { data: lessons },
    { data: groups },
  ] = await Promise.all([
    supabase
      .from('teachers')
      .select('subject_id')
      .eq('id', profile?.id)
      .single(),
    supabase.from('subjects').select('id, name_ar, icon').order('name_ar'),
    supabase
      .from('grades')
      .select('id, name_ar, grade_number')
      .order('grade_number'),
    supabase.from('semesters').select('id, name_ar').order('sort_order'),
    supabase
      .from('units')
      .select('id, name_ar, subject_id, grade_id, semester_id')
      .order('sort_order'),
    supabase.from('lessons').select('id, name_ar, unit_id').order('sort_order'),
    supabase
      .from('student_groups')
      .select('id, name_ar')
      .eq('teacher_id', profile?.id)
      .order('created_at'),
  ])

  return (
    <div className="mx-auto max-w-7xl animate-fade-in space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/teacher/exams"
          className="rounded-xl bg-white p-2 shadow-sm transition-colors hover:bg-slate-200"
        >
          <ArrowRight className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-800">تعديل الاختبار</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            تعديل {initialData.title}
          </p>
        </div>
      </div>

      {/* Builder */}
      <TeacherExamBuilder
        examId={params.id}
        initialData={initialData}
        teacherSubjectId={teacherData?.subject_id?.toString() || ''}
        subjects={subjects || []}
        grades={grades || []}
        semesters={semesters || []}
        units={units || []}
        lessons={lessons || []}
        groups={groups || []}
      />
    </div>
  )
}
