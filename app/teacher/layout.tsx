import { getCurrentProfile } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import { TeacherSidebar } from '@/components/teacher/TeacherSidebar'
import { TeacherTopbar } from '@/components/teacher/TeacherTopbar'
import { TeacherBottomNav } from '@/components/teacher/TeacherBottomNav'
import { createClient } from '@/lib/supabase/server'

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getCurrentProfile()

  if (!profile || profile.role !== 'teacher') {
    redirect('/auth/login')
  }

  const supabase = await createClient()
  const { data: teacher } = await supabase
    .from('teachers')
    .select(
      'subject_id, is_verified, subscription_status, subscription_ends_at'
    )
    .eq('id', profile.id)
    .maybeSingle()

  if (!teacher?.subject_id) {
    redirect('/auth/teacher-onboarding')
  }

  // فحص انتهاء الفترة التجريبية
  // إذا المعلم غير موثق ولديه تاريخ انتهاء تجربة وقد انتهى
  const trialPath = '/teacher/trial-expired'
  if (
    !teacher.is_verified &&
    teacher.subscription_ends_at &&
    new Date(teacher.subscription_ends_at) < new Date()
  ) {
    redirect(trialPath)
  }

  return (
    <div
      className="flex min-h-screen"
      dir="rtl"
      style={{ background: 'linear-gradient(180deg, #0a1628 0%, #070e1c 100%)' }}
    >
      {/* Desktop Sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <TeacherSidebar />
      </div>

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col md:mr-64">
        <TeacherTopbar profile={profile} />
        <main id="main-content" className="flex-1 overflow-auto p-4 pb-28 md:p-6 md:pb-6 text-slate-100">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <TeacherBottomNav />
    </div>
  )
}
