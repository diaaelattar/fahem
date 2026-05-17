import { getCurrentProfile } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import { TeacherSidebar } from '@/components/teacher/TeacherSidebar'
import { TeacherTopbar } from '@/components/teacher/TeacherTopbar'
import { TeacherBottomNav } from '@/components/teacher/TeacherBottomNav'

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile()

  if (!profile || profile.role !== 'teacher') {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">
      {/* Desktop Sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <TeacherSidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 md:mr-64">
        <TeacherTopbar profile={profile} />
        <main className="flex-1 p-4 pb-28 md:pb-6 md:p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <TeacherBottomNav />
    </div>
  )
}
