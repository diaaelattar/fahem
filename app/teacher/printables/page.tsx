import { getCurrentProfile } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PrintablesStudioClient } from '@/components/teacher/PrintablesStudioClient'

export const dynamic = 'force-dynamic'

export default async function TeacherPrintablesPage() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'teacher') redirect('/auth/login')

  const supabase = await createClient()

  // جلب بيانات المعلم والمادة والمدرسة
  const { data: teacher } = await supabase
    .from('teachers')
    .select('subject_id, school_name, subjects(id, name_ar)')
    .eq('id', profile.id)
    .maybeSingle()

  let resolvedSubjectId = teacher?.subject_id
  let subjectName = (teacher?.subjects as any)?.name_ar || ''

  if (!resolvedSubjectId) {
    const { data: tgs } = await supabase
      .from('teacher_grade_subjects')
      .select('subject_id, subjects(id, name_ar)')
      .eq('teacher_id', profile.id)
      .limit(1)
      .maybeSingle()
    if (tgs?.subject_id) {
      resolvedSubjectId = tgs.subject_id
      subjectName = (tgs.subjects as any)?.name_ar || ''
    }
  }

  // جلب الصفوف والمراحل
  const { data: grades } = await supabase
    .from('grades')
    .select('id, name_ar, stage_id, grade_number')
    .order('stage_id')
    .order('grade_number')

  return (
    <PrintablesStudioClient
      profile={profile}
      initialSubjectName={subjectName}
      schoolName={teacher?.school_name || 'مدرسة الشهيد الرسمية'}
      allGrades={grades || []}
    />
  )
}
