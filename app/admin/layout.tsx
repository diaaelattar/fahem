import { requireAdmin } from '@/lib/auth/permissions'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { SidebarProvider } from '@/components/admin/SidebarContext'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin()

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-slate-50 flex" dir="rtl">
        <AdminSidebar />
        {/* 
          - On mobile (< lg): no right margin, full width 
          - On desktop (lg+): mr-64 to offset the fixed sidebar  
        */}
        <div className="flex-1 flex flex-col min-w-0 lg:mr-64">
          <AdminTopbar profile={profile} />
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
