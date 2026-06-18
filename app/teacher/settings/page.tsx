import { getCurrentProfile } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeacherSettingsClient } from '@/components/teacher/TeacherSettingsClient'

interface SearchParams {
  error?: string
}

export default async function TeacherSettingsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'teacher') redirect('/auth/login')

  const supabase = await createClient()

  // Use select('*') to avoid schema-cache errors when new columns haven't been
  // applied to the live DB yet — the component handles missing keys gracefully.
  const { data: teacher } = await supabase
    .from('teachers')
    .select('*')
    .eq('id', profile.id)
    .maybeSingle()

  const { data: subject } = teacher?.subject_id
    ? await supabase
        .from('subjects')
        .select('name_ar')
        .eq('id', teacher.subject_id)
        .maybeSingle()
    : { data: null }

  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name_ar, icon')
    .order('name_ar')

  // Load all grades for the multi-picker
  const { data: grades } = await supabase
    .from('grades')
    .select('id, name_ar, stage_id, grade_number, track')
    .order('stage_id')
    .order('grade_number')

  // Load current teacher grade-subject assignments
  const { data: teacherGradeSubjects } = await supabase
    .from('teacher_grade_subjects')
    .select('grade_id, subject_id')
    .eq('teacher_id', profile.id)

  // Map error codes to Arabic messages
  const errorMessages: Record<string, string> = {
    missing_subject: 'يجب تحديد المادة الدراسية أولاً قبل استخدام هذه الخاصية.',
  }
  const errorMsg = searchParams.error ? errorMessages[searchParams.error] ?? null : null

  return (
    <TeacherSettingsClient
      profile={profile}
      teacher={teacher || {}}
      subjectName={subject?.name_ar || ''}
      allSubjects={subjects || []}
      allGrades={grades || []}
      currentGradeSubjects={teacherGradeSubjects || []}
      errorMsg={errorMsg}
    />
  )
}
