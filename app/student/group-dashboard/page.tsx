import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import GroupDashboardClient from './GroupDashboardClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function StudentGroupDashboardPage() {
  const profile = await requireStudent()
  const supabase = createClient()

  // 1. Fetch student info
  const { data: student } = await supabase
    .from('students')
    .select('*, grades(name_ar)')
    .eq('id', profile.id)
    .single()

  // 2. Fetch student's groups
  const { data: studentGroups } = await supabase
    .from('group_students')
    .select(`
      group_id,
      source,
      student_groups (
        id,
        name_ar,
        teacher_id,
        teachers (
          id,
          profiles (
            full_name
          )
        )
      )
    `)
    .eq('student_id', profile.id)
    .eq('status', 'active')

  const groupIds = studentGroups?.map((g: any) => g.group_id) || []

  // 3. Fetch exams for these groups
  const { data: exams } = groupIds.length > 0 ? await supabase
    .from('exams')
    .select('id, title, duration_minutes, questions_count, total_points, group_id, student_groups(name_ar)')
    .in('group_id', groupIds)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    : { data: [] }

  // 4. Fetch group sessions
  const { data: sessions } = groupIds.length > 0 ? await supabase
    .from('group_sessions')
    .select('*, student_groups(name_ar)')
    .in('group_id', groupIds)
    .order('scheduled_at', { ascending: false })
    : { data: [] }

  // 5. Fetch completed attempts
  const { data: attempts } = await supabase
    .from('exam_attempts')
    .select('*, exams(id, title)')
    .eq('student_id', profile.id)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })

  // 6. Fetch platform announcements
  const { data: announcements } = await supabase
    .from('platform_announcements')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  return (
    <GroupDashboardClient
      profile={profile}
      studentGroups={studentGroups || []}
      exams={exams || []}
      sessions={sessions || []}
      attempts={attempts || []}
      announcements={announcements || []}
    />
  )
}
