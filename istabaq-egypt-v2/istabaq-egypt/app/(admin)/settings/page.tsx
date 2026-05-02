import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { SettingsForm } from '@/components/admin/SettingsForm'

export default async function SettingsPage() {
  const profile = await requireAdmin()
  const supabase = createClient()

  const { data: admin } = await supabase.from('admins').select('*').eq('id', profile.id).single()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">الإعدادات</h1>
        <p className="text-muted-foreground mt-1">إدارة حسابك وإعدادات المنصة</p>
      </div>
      <SettingsForm profile={profile} admin={admin} />
    </div>
  )
}
