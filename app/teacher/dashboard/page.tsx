import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeacherDashboardClient } from '@/components/teacher/TeacherDashboardClient'

export const dynamic = 'force-dynamic'

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // ⚡ استعلامات متوازية فائقة السرعة للوحة المعلم دون أي Waterfall
  const [
    profileResult,
    teacherResult,
    groupsResult,
    examsResult,
    recentAttemptsResult,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),

    supabase
      .from('teachers')
      .select(
        'is_verified, subscription_status, subscription_ends_at, subject_id, subjects(name_ar, icon)'
      )
      .eq('id', user.id)
      .maybeSingle(),

    supabase
      .from('student_groups')
      .select('*, group_students(count)')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('exams')
      .select('id, title, is_published, created_at, student_groups(name_ar), total_points')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false })
      .limit(6),

    supabase
      .from('exam_attempts')
      .select(
        `
        id, score, percentage, is_passed, completed_at,
        students(profiles(full_name, avatar_url)),
        exams!inner(id, title, total_points, teacher_id)
      `
      )
      .eq('exams.teacher_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(8),
  ])

  const profile = profileResult.data
  if (!profile || profile.role !== 'teacher') redirect('/auth/login')

  const teacher = teacherResult.data
  const groups = (groupsResult.data as any[]) || []
  const exams = (examsResult.data as any[]) || []
  const recentSubmissions = (recentAttemptsResult.data as any[]) || []

  const totalGroups = groups.length
  const totalStudents = groups.reduce(
    (sum, g) => sum + (g.group_students?.[0]?.count || 0),
    0
  )
  const totalExams = exams.length

  // حساب متوسط نسبة نجاح طلاب المعلم عبر كافة التسليمات
  const passedCount = recentSubmissions.filter((s) => s.is_passed).length
  const avgPassRate =
    recentSubmissions.length > 0
      ? Math.round((passedCount / recentSubmissions.length) * 100)
      : 100

  // حساب الأيام المتبقية في الفترة التجريبية
  const isInTrial = !teacher?.is_verified && teacher?.subscription_ends_at
  const daysRemaining = isInTrial
    ? Math.max(
        0,
        Math.ceil(
          (new Date(teacher.subscription_ends_at!).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : null

  return (
    <TeacherDashboardClient
      profile={profile}
      teacher={teacher}
      groups={groups}
      exams={exams}
      recentSubmissions={recentSubmissions}
      totalStudents={totalStudents}
      totalGroups={totalGroups}
      totalExams={totalExams}
      avgPassRate={avgPassRate}
      isInTrial={!!isInTrial}
      daysRemaining={daysRemaining}
    />
  )
}
