import { getCurrentProfile } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClassManagerClient } from '@/components/school/ClassManagerClient'

export const dynamic = 'force-dynamic'

export default async function SchoolClassesPage() {
  const profile = await getCurrentProfile()

  if (!profile || (profile.role !== 'school_admin' && profile.role !== 'admin')) {
    redirect('/auth/school/login')
  }

  const schoolId = profile.school_id
  if (!schoolId) {
    redirect('/school/dashboard')
  }

  const supabase = await createClient()

  // 1. جلب الفصول الخاصة بهذه المدرسة
  const { data: classesRaw } = await supabase
    .from('school_classes')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  const classes = classesRaw || []

  // 2. جلب جميع الصفوف المتاحة في النظام لربط الفصول بها
  const { data: gradesRaw } = await supabase
    .from('grades')
    .select('id, name_ar')
    .order('sort_order')

  const grades = gradesRaw || []

  // 3. جلب جميع علاقات ربط الطلاب بالفصول لحساب الأعداد
  const { data: classStudentsRaw } = await supabase
    .from('class_students')
    .select('class_id')

  const classStudentCounts: { [classId: string]: number } = {}
  
  // تجميع الحسابات في الذاكرة
  classStudentsRaw?.forEach((item) => {
    classStudentCounts[item.class_id] = (classStudentCounts[item.class_id] || 0) + 1
  })

  return (
    <ClassManagerClient
      initialClasses={classes}
      grades={grades}
      classStudentCounts={classStudentCounts}
      schoolId={schoolId}
    />
  )
}
