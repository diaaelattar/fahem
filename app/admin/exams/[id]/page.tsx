// app/admin/exams/[id]/page.tsx
// Server Component — تعديل اختبار موجود
import { createClient } from '@/lib/supabase/server'
import { ExamBuilder } from '@/components/admin/ExamBuilder'
import { ArrowRight, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DeleteExamButton } from './DeleteExamButton'
import { ExportExamButton } from '@/components/admin/ExportExamButton'

export const dynamic = 'force-dynamic'

export default async function EditExamPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const [
    { data: exam },
    { data: subjects },
    { data: grades },
    { data: semesters },
    { data: units },
    { data: lessons },
  ] = await Promise.all([
    supabase.from('exams').select('*').eq('id', params.id).single(),
    supabase.from('subjects').select('id, name_ar, icon').order('name_ar'),
    supabase.from('grades').select('id, name_ar, grade_number').order('grade_number'),
    supabase.from('semesters').select('id, name_ar').order('sort_order'),
    supabase.from('units').select('id, name_ar, subject_id, grade_id, semester_id').eq('is_active', true).order('sort_order'),
    supabase.from('lessons').select('id, name_ar, unit_id').eq('is_active', true).order('sort_order'),
  ])

  if (!exam) notFound()

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/exams" className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-display font-bold">تعديل الاختبار</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{exam.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExportExamButton examId={params.id} examTitle={exam.title} />
          <DeleteExamButton examId={params.id} examTitle={exam.title} />
        </div>
      </div>

      {/* Builder in edit mode */}
      <ExamBuilder
        examId={params.id}
        initialData={exam}
        subjects={subjects || []}
        grades={grades || []}
        semesters={semesters || []}
        units={units || []}
        lessons={lessons || []}
      />
    </div>
  )
}
