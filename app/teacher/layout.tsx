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

  // fallback: اجلب المادة من teacher_grade_subjects إن كانت teachers.subject_id فارغة
  let resolvedSubjectId = teacher?.subject_id
  if (!resolvedSubjectId) {
    const { data: tgs } = await supabase
      .from('teacher_grade_subjects')
      .select('subject_id')
      .eq('teacher_id', profile.id)
      .limit(1)
      .maybeSingle()
    if (tgs?.subject_id) {
      resolvedSubjectId = tgs.subject_id
      // حدّث teachers.subject_id تلقائياً لتجنب هذا الـ fallback مستقبلاً
      await supabase
        .from('teachers')
        .update({ subject_id: tgs.subject_id })
        .eq('id', profile.id)
    }
  }

  if (!resolvedSubjectId) {
    redirect('/auth/teacher-onboarding')
  }

  // فحص انتهاء الفترة التجريبية
  // إذا المعلم غير موثق ولديه تاريخ انتهاء تجربة وقد انتهى
  const trialPath = '/teacher/trial-expired'
  if (
    teacher &&
    !teacher.is_verified &&
    teacher.subscription_ends_at &&
    new Date(teacher.subscription_ends_at) < new Date()
  ) {
    redirect(trialPath)
  }

  return (
    <div
      className="flex min-h-screen print:bg-white print:block print:min-h-0"
      dir="rtl"
      style={{
        background: 'linear-gradient(180deg, #0a1628 0%, #070e1c 100%)',
      }}
    >
      {/* Desktop Sidebar — hidden on mobile & print */}
      <div className="hidden md:block print:hidden">
        <TeacherSidebar />
      </div>

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col md:mr-64 print:mr-0 print:m-0 print:w-full print:block">
        <div className="print:hidden">
          <TeacherTopbar profile={profile} />
        </div>
        <main
          id="main-content"
          className="flex-1 overflow-auto p-4 pb-28 text-slate-100 md:p-6 md:pb-6 print:p-0 print:m-0 print:overflow-visible print:block print:text-black"
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <div className="print:hidden">
        <TeacherBottomNav />
      </div>
    </div>
  )
}
