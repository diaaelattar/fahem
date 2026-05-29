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
    .single()

  const { data: subject } = teacher?.subject_id
    ? await supabase
        .from('subjects')
        .select('name_ar')
        .eq('id', teacher.subject_id)
        .single()
    : { data: null }

  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name_ar')
    .order('name_ar')

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
      errorMsg={errorMsg}
    />
  )
}
