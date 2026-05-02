import { requireStudent } from '@/lib/auth/permissions'
import { StudentSidebar } from '@/components/student/StudentSidebar'
import { StudentTopbar } from '@/components/student/StudentTopbar'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireStudent()

  return (
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">
      <StudentSidebar />
      <div className="flex-1 flex flex-col min-w-0 mr-64">
        <StudentTopbar profile={profile} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
