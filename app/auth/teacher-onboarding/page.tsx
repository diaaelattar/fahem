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
  const { data: teacher } = await supabase
    .from('teachers')
    .select('subject_id')
    .eq('id', profile.id)
    .single()

  if (teacher?.subject_id) {
    redirect('/teacher/dashboard')
  }

  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name_ar, icon')
    .order('name_ar')

  return (
    <div
      className="bg-hero-pattern flex min-h-screen items-center justify-center bg-slate-50 p-4"
      dir="rtl"
    >
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-3xl border border-indigo-50 bg-white shadow-xl shadow-indigo-200/50">
            <Brain className="h-10 w-10 text-indigo-600" />
          </div>
          <h1 className="mb-2 text-3xl font-black text-slate-800">
            مرحباً بك يا أستاذ {profile.full_name.split(' ')[0]}!
          </h1>
          <p className="mx-auto max-w-sm font-medium text-slate-500">
            يسعدنا انضمامك لمنصة استباق مصر. يرجى تحديد مادتك التخصصية لنتمكن من
            تجهيز بوابتك الخاصة.
          </p>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-indigo-50/50 p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">اختر مادتك التخصصية</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                سيكون حسابك مخصصاً بالكامل لهذه المادة
              </p>
            </div>
          </div>

          <div className="p-6">
            <TeacherOnboardingForm subjects={subjects || []} />
          </div>
        </div>
      </div>
    </div>
  )
}
