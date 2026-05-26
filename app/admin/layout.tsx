import { requireAdmin } from '@/lib/auth/permissions'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { SidebarProvider } from '@/components/admin/SidebarContext'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireAdmin()

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-slate-50" dir="rtl">
        <AdminSidebar />
        {/* 
          - On mobile (< lg): no right margin, full width 
          - On desktop (lg+): mr-64 to offset the fixed sidebar  
        */}
        <div className="flex min-w-0 flex-1 flex-col lg:mr-64">
          <AdminTopbar profile={profile} />
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
