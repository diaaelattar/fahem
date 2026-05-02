import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { notFound } from 'next/navigation'
import { QuestionEditForm } from '@/components/admin/QuestionEditForm'

export default async function EditQuestionPage({ params }: { params: { id: string } }) {
  await requireAdmin()
  const supabase = createClient()

  const [{ data: question }, { data: subjects }, { data: grades }] = await Promise.all([
    supabase.from('questions').select('*').eq('id', params.id).single(),
    supabase.from('subjects').select('id, name_ar, icon').order('name_ar'),
    supabase.from('grades').select('id, name_ar, grade_number').order('grade_number'),
  ])

  if (!question) notFound()

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">تعديل السؤال</h1>
        <p className="text-muted-foreground mt-1 line-clamp-1">{question.question_text}</p>
      </div>
      <QuestionEditForm question={question} subjects={subjects || []} grades={grades || []} />
    </div>
  )
}
