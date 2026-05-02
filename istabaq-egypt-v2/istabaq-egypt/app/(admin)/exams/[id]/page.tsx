import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { ExamBuilder } from '@/components/admin/ExamBuilder'
import { notFound } from 'next/navigation'

export default async function EditExamPage({ params }: { params: { id: string } }) {
  await requireAdmin()
  const supabase = createClient()

  const [{ data: exam }, { data: subjects }, { data: grades }, { data: semesters }] = await Promise.all([
    supabase.from('exams').select('*').eq('id', params.id).single(),
    supabase.from('subjects').select('id, name_ar, icon').order('name_ar'),
    supabase.from('grades').select('id, name_ar, grade_number').order('grade_number'),
    supabase.from('semesters').select('id, name_ar').order('sort_order'),
  ])

  if (!exam) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">تعديل الاختبار</h1>
        <p className="text-muted-foreground mt-1">{exam.title}</p>
      </div>
      <ExamBuilder
        subjects={subjects || []}
        grades={grades || []}
        semesters={semesters || []}
        examId={params.id}
        initialData={exam}
      />
    </div>
  )
}
