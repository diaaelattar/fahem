import { getCurrentProfile } from '@/lib/auth/permissions'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { StudentTopbar } from '@/components/student/StudentTopbar'
import { StudentBottomNav } from '@/components/student/StudentBottomNav'

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getCurrentProfile()

  // If no profile, user is in onboarding (enforced by middleware)
  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50" dir="rtl">
        {children}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50" dir="rtl">
      {/* Skip to Main Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:right-4 focus:z-50 focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
      >
        تخطى إلى المحتوى الرئيسي
      </a>

      {/* Desktop Sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <StudentSidebar />
      </div>

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col md:mr-64">
        <StudentTopbar profile={profile} />
        <main id="main-content" className="flex-1 overflow-auto p-4 pb-28 md:p-6 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <StudentBottomNav />
    </div>
  )
}
