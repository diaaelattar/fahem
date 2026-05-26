// app/admin/exams/[id]/page.tsx
// Server Component — تعديل اختبار موجود
import { createClient } from '@/lib/supabase/server'
import { ExamBuilder } from '@/components/admin/ExamBuilder'
import { ArrowRight, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DeleteExamButton } from './DeleteExamButton'
import { ExportExamButton } from '@/components/admin/ExportExamButton'
import { Printer, Eye } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function EditExamPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

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
    supabase
      .from('grades')
      .select('id, name_ar, grade_number')
      .order('grade_number'),
    supabase.from('semesters').select('id, name_ar').order('sort_order'),
    supabase
      .from('units')
      .select('id, name_ar, subject_id, grade_id, semester_id')
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('lessons')
      .select('id, name_ar, unit_id')
      .eq('is_active', true)
      .order('sort_order'),
  ])

  if (!exam) notFound()

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/exams"
            className="rounded-xl p-2 transition-colors hover:bg-muted"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-display text-3xl font-bold">تعديل الاختبار</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{exam.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/exams/${params.id}/print`}
            target="_blank"
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200"
            title="طباعة الاختبار كملف PDF"
          >
            <Printer className="h-4 w-4" />
            طباعة
          </Link>
          <Link
            href={`/admin/exams/${params.id}/preview`}
            target="_blank"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700"
            title="معاينة الاختبار كما يراه الطالب"
          >
            <Eye className="h-4 w-4" />
            معاينة
          </Link>
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
