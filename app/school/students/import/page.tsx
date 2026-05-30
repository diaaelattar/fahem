import { getCurrentProfile } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StudentImportWizard } from '@/components/school/StudentImportWizard'

export const dynamic = 'force-dynamic'

export default async function SchoolStudentsImportPage() {
  const profile = await getCurrentProfile()

  if (!profile || (profile.role !== 'school_admin' && profile.role !== 'admin')) {
    redirect('/auth/school/login')
  }

  const schoolId = profile.school_id
  if (!schoolId) {
    redirect('/school/dashboard')
  }

  const supabase = await createClient()

  // 1. جلب الفصول المتاحة في هذه المدرسة لربط الطلاب
  const { data: classesRaw } = await supabase
    .from('school_classes')
    .select('id, name, grade_id')
    .eq('school_id', schoolId)

  const schoolClasses = classesRaw || []

  // 2. جلب جميع الصفوف المتاحة في المنهج
  const { data: gradesRaw } = await supabase
    .from('grades')
    .select('id, name_ar')
    .order('sort_order')

  const grades = gradesRaw || []

  return <StudentImportWizard schoolClasses={schoolClasses} grades={grades} />
}
