import { createClient } from '@/lib/supabase/server'
import { TeacherExamBuilder } from '@/components/teacher/TeacherExamBuilder'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { getCurrentProfile } from '@/lib/auth/permissions'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EditTeacherExamPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const profile = await getCurrentProfile()

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
    { data: subjects },
    { data: grades },
    { data: semesters },
    { data: units },
    { data: lessons },
    { data: groups }
  ] = await Promise.all([
    supabase.from('subjects').select('id, name_ar, icon').order('name_ar'),
    supabase.from('grades').select('id, name_ar, grade_number').order('grade_number'),
    supabase.from('semesters').select('id, name_ar').order('sort_order'),
    supabase.from('units').select('id, name_ar, subject_id, grade_id, semester_id').eq('is_active', true).order('sort_order'),
    supabase.from('lessons').select('id, name_ar, unit_id').eq('is_active', true).order('sort_order'),
    supabase.from('student_groups').select('id, name_ar').eq('teacher_id', profile?.id).order('created_at')
  ])

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/teacher/exams" className="p-2 rounded-xl hover:bg-slate-200 transition-colors bg-white shadow-sm">
          <ArrowRight className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-800">تعديل الاختبار</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            تعديل {initialData.title}
          </p>
        </div>
      </div>

      {/* Builder */}
      <TeacherExamBuilder
        examId={params.id}
        initialData={initialData}
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
