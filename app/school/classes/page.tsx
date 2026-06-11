import { getCurrentProfile } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClassManagerClient } from '@/components/school/ClassManagerClient'
import { getCachedGrades } from '@/lib/cache/static-data'

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

  // 2. جلب جميع الصفوف من الكاش — يمنع استعلام DB مكرر في نفس الطلب
  const grades = await getCachedGrades()

  // 3. جلب علاقات ربط الطلاب بفصول هذه المدرسة فقط (أمان: مقيّدة بـ school_id)
  const classIds = classes.map((c) => c.id)
  const { data: classStudentsRaw } = classIds.length > 0
    ? await supabase
        .from('class_students')
        .select('class_id')
        .in('class_id', classIds)
    : { data: [] }

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
