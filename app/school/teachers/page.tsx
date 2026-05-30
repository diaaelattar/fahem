import { getCurrentProfile } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TeacherRegistryClient } from '@/components/school/TeacherRegistryClient'

export const dynamic = 'force-dynamic'

export default async function SchoolTeachersPage() {
  const profile = await getCurrentProfile()

  if (!profile || (profile.role !== 'school_admin' && profile.role !== 'admin')) {
    redirect('/auth/school/login')
  }

  const schoolId = profile.school_id
  if (!schoolId) {
    redirect('/school/dashboard')
  }

  const supabase = await createClient()

  // جلب المعلمين المسجلين بالمدرسة مع تفاصيل جدول المعلمين
  const { data: teachersRaw } = await supabase
    .from('profiles')
    .select('id, full_name, email, created_at, teachers(specialty_id)')
    .eq('school_id', schoolId)
    .eq('role', 'teacher')

  const teachers = teachersRaw || []

  // جلب المواد المتوفرة للتخصصات
  const { data: subjectsRaw } = await supabase
    .from('subjects')
    .select('id, name_ar')
    .order('name_ar')

  const subjects = subjectsRaw || []

  return <TeacherRegistryClient initialTeachers={teachers} subjects={subjects} />
}
