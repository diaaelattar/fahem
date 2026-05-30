import { getCurrentProfile } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StudentRegistryClient } from '@/components/school/StudentRegistryClient'

export const dynamic = 'force-dynamic'

export default async function SchoolStudentsPage() {
  const profile = await getCurrentProfile()

  if (!profile || (profile.role !== 'school_admin' && profile.role !== 'admin')) {
    redirect('/auth/school/login')
  }

  const schoolId = profile.school_id
  if (!schoolId) {
    redirect('/school/dashboard')
  }

  const supabase = await createClient()

  // 1. جلب الطلاب المنضمين للمدرسة الحالية
  const { data: studentsRaw } = await supabase
    .from('profiles')
    .select('id, full_name, email, created_at, students(grade_id, student_code)')
    .eq('school_id', schoolId)
    .eq('role', 'student')

  const students = studentsRaw || []

  // 2. جلب الفصول المتاحة في هذه المدرسة
  const { data: classesRaw } = await supabase
    .from('school_classes')
    .select('id, name, grade_id')
    .eq('school_id', schoolId)

  const schoolClasses = classesRaw || []

  // 3. جلب جميع المراحل/الصفوف للتصنيفات العامة للمناهج
  const { data: gradesRaw } = await supabase
    .from('grades')
    .select('id, name_ar')
    .order('sort_order')

  const grades = gradesRaw || []

  return (
    <StudentRegistryClient
      initialStudents={students}
      schoolClasses={schoolClasses}
      grades={grades}
    />
  )
}
