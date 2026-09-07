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
      <div className="flex min-h-screen bg-slate-50 print:bg-white print:block print:min-h-0" dir="rtl">
        <div className="print:hidden">
          <AdminSidebar />
        </div>
        <div className="flex min-w-0 flex-1 flex-col lg:mr-64 print:mr-0 print:m-0 print:w-full print:block">
          <div className="print:hidden">
            <AdminTopbar profile={profile} />
          </div>
          <main className="flex-1 overflow-auto p-4 md:p-6 print:p-0 print:m-0 print:overflow-visible print:block">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
