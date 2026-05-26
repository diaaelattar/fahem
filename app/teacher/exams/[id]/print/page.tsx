import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import { PrintExamClient } from '@/components/admin/PrintExamClient'
import { TeacherPrintSettingsBar } from '@/components/teacher/TeacherPrintSettingsBar'

export default async function TeacherPrintExamPage({ params }: { params: { id: string } }) {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'teacher') redirect('/auth/login')

  const supabase = await createClient()

  // Fetch exam — must belong to this teacher
  const { data: exam } = await supabase
    .from('exams')
    .select('*, subjects(name_ar, icon), grades(name_ar), semesters(name_ar)')
    .eq('id', params.id)
    .eq('teacher_id', profile.id)
    .single()

  if (!exam) redirect('/teacher/exams')

  // Fetch questions ordered by question_order
  const { data: examQuestions } = await supabase
    .from('exam_questions')
    .select(
      'question_order, points_override, questions(id, question_type, context_passage, question_text, options, correct_answer, explanation, points, question_image_url, image_position)'
    )
    .eq('exam_id', params.id)
    .order('question_order')

  const questions = (examQuestions || []).map((eq: any) => ({
    ...eq.questions,
    points_override: eq.points_override,
    order: eq.question_order,
  }))

  // Fetch teacher print settings
  const { data: teacher } = await supabase
    .from('teachers')
    .select('print_directorate, print_administration, print_school_name, print_academic_year, print_header_type, teacher_display_name, teacher_title, teacher_phone, teacher_social, teacher_logo_url, teacher_watermark_text, show_watermark')
    .eq('id', profile.id)
    .single()

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      <TeacherPrintSettingsBar
        examId={params.id}
        teacherId={profile.id}
        initialSettings={teacher || {}}
      />
      <PrintExamClient exam={exam} questions={questions} />
    </div>
  )
}
