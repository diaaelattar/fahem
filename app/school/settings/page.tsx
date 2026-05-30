import { getCurrentProfile } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SchoolSettingsClient } from '@/components/school/SchoolSettingsClient'

export const dynamic = 'force-dynamic'

export default async function SchoolSettingsPage() {
  const profile = await getCurrentProfile()

  if (!profile || (profile.role !== 'school_admin' && profile.role !== 'admin')) {
    redirect('/auth/school/login')
  }

  const schoolId = profile.school_id
  if (!schoolId) {
    redirect('/school/dashboard')
  }

  const supabase = await createClient()

  // جلب معلومات المدرسة الحالية
  const { data: school } = await supabase
    .from('schools')
    .select('*')
    .eq('id', schoolId)
    .single()

  return <SchoolSettingsClient school={school} />
}
