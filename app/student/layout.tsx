import { requireStudent } from '@/lib/auth/permissions'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { StudentTopbar } from '@/components/student/StudentTopbar'
import { StudentBottomNav } from '@/components/student/StudentBottomNav'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireStudent()

  return (
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">
      {/* Desktop Sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <StudentSidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 md:mr-64">
        <StudentTopbar profile={profile} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <StudentBottomNav />
    </div>
  )
}
