import { requireAdmin } from '@/lib/auth/permissions'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopbar } from '@/components/admin/AdminTopbar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin()

  return (
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 mr-64">
        <AdminTopbar profile={profile} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
