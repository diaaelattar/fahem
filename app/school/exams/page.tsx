import { getCurrentProfile } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExamManagerClient } from '@/components/school/ExamManagerClient'

export const dynamic = 'force-dynamic'

export default async function SchoolExamsPage() {
  const profile = await getCurrentProfile()

  if (!profile || (profile.role !== 'school_admin' && profile.role !== 'admin')) {
    redirect('/auth/school/login')
  }

  const schoolId = profile.school_id
  if (!schoolId) {
    redirect('/school/dashboard')
  }

  const supabase = await createClient()

  // 1. جلب الامتحانات الخاصة بالمدرسة
  const { data: examsRaw } = await supabase
    .from('exams')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  const exams = examsRaw || []

  // 2. جلب المواد لتصنيف المواد
  const { data: subjectsRaw } = await supabase
    .from('subjects')
    .select('id, name_ar')
    .order('name_ar')

  const subjects = subjectsRaw || []

  // 3. جلب الصفوف لتصنيف المراحل الدراسية
  const { data: gradesRaw } = await supabase
    .from('grades')
    .select('id, name_ar')

  const grades = gradesRaw || []

  // 4. جلب المعلمين لعرض اسم منشئ الامتحان
  const { data: teachersRaw } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('school_id', schoolId)
    .eq('role', 'teacher')

  const teachers = teachersRaw || []

  return (
    <ExamManagerClient
      initialExams={exams}
      subjects={subjects}
      grades={grades}
      teachers={teachers}
    />
  )
}
