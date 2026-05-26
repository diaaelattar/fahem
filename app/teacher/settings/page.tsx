import { getCurrentProfile } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeacherSettingsClient } from '@/components/teacher/TeacherSettingsClient'

export default async function TeacherSettingsPage() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'teacher') redirect('/auth/login')

  const supabase = await createClient()

  const { data: teacher } = await supabase
    .from('teachers')
    .select(
      'subject_id, is_verified, subscription_status, subscription_ends_at, print_directorate, print_administration, print_school_name, print_academic_year, print_header_type, teacher_display_name, teacher_title, teacher_phone, teacher_social, teacher_logo_url, teacher_watermark_text, show_watermark'
    )
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

  return (
    <TeacherSettingsClient
      profile={profile}
      teacher={teacher || {}}
      subjectName={subject?.name_ar || ''}
      allSubjects={subjects || []}
    />
  )
}
