import { requireAdmin } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'
import { SchoolManagerClient } from '@/components/admin/SchoolManagerClient'

export const dynamic = 'force-dynamic'

export default async function AdminSchoolsPage() {
  // التحقق من صلاحيات الأدمن العام
  await requireAdmin()

  const supabase = await createClient()

  // جلب كافة المدارس المسجلة بالمنصة مرتبة تنازلياً حسب تاريخ التسجيل
  const { data: schoolsRaw } = await supabase
    .from('schools')
    .select('*')
    .order('created_at', { ascending: false })

  const schools = schoolsRaw || []

  return <SchoolManagerClient initialSchools={schools} />
}
