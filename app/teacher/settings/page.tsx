import { getCurrentProfile } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'
import { TeacherSettingsClient } from '@/components/teacher/TeacherSettingsClient'

export default async function TeacherSettingsPage() {
  const profile = await getCurrentProfile()
  const supabase = await createClient()

  const { data: teacher } = await supabase
    .from('teachers')
    .select('subject_id, is_verified, subscription_status, subscription_ends_at, print_directorate, print_administration, print_school_name, print_academic_year')
    .eq('id', profile.id)
    .single()

  const { data: subject } = teacher?.subject_id
    ? await supabase.from('subjects').select('name_ar').eq('id', teacher.subject_id).single()
    : { data: null }

  return (
    <TeacherSettingsClient
      profile={profile}
      teacher={teacher || {}}
      subjectName={subject?.name_ar || ''}
    />
  )
}
