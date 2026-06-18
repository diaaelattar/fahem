import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import { TeacherOnboardingForm } from './TeacherOnboardingForm'
import { Brain, BookOpen } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TeacherOnboardingPage() {
  const profile = await getCurrentProfile()

  if (!profile || profile.role !== 'teacher') {
    redirect('/auth/login')
  }

  const supabase = await createClient()

  // If teacher already has a subject, skip onboarding
  const { data: teacher } = await supabase
    .from('teachers')
    .select('subject_id')
    .eq('id', profile.id)
    .maybeSingle()

  if (teacher?.subject_id) {
    redirect('/teacher/dashboard')
  }

  // Load all grades (ordered by stage then grade number)
  const { data: dbGrades } = await supabase
    .from('grades')
    .select('id, name_ar, stage_id, grade_number, track')
    .order('stage_id')
    .order('grade_number')

  // Load all subjects
  const { data: dbSubjects } = await supabase
    .from('subjects')
    .select('id, name_ar, icon')
    .order('name_ar')

  return (
    <div
      className="bg-hero-pattern flex min-h-screen items-center justify-center bg-slate-50 p-4"
      dir="rtl"
    >
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-3xl border border-indigo-50 bg-white shadow-xl shadow-indigo-200/50">
            <Brain className="h-10 w-10 text-indigo-600" />
          </div>
          <h1 className="mb-2 text-3xl font-black text-slate-800">
            مرحباً بك يا أستاذ {profile.full_name.split(' ')[0]}!
          </h1>
          <p className="mx-auto max-w-sm font-medium text-slate-500">
            يسعدنا انضمامك لمنصة استبق - مصر ( فاهم ). يرجى اختيار المادة الأساسية التي تدرّسها. ستتاح لك جميع الصفوف الدراسية تلقائياً.
          </p>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-indigo-50/50 p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">اختر مادتك الأساسية</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                جميع الصفوف الدراسية ستكون متاحة لك داخل المنصة
              </p>
            </div>
          </div>

          <div className="p-6">
            <TeacherOnboardingForm
              dbGrades={dbGrades || []}
              dbSubjects={dbSubjects || []}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
