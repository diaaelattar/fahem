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

  const supabase = createClient()
  const { data: teacher } = await supabase.from('teachers').select('subject_id').eq('id', profile.id).single()

  if (teacher?.subject_id) {
    redirect('/teacher/dashboard')
  }

  const { data: subjects } = await supabase.from('subjects').select('id, name_ar, icon').order('name_ar')

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 bg-hero-pattern" dir="rtl">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white shadow-xl shadow-indigo-200/50 mb-4 border border-indigo-50">
            <Brain className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-2">مرحباً بك يا أستاذ {profile.full_name.split(' ')[0]}!</h1>
          <p className="text-slate-500 font-medium max-w-sm mx-auto">
            يسعدنا انضمامك لمنصة استباق مصر. يرجى تحديد مادتك التخصصية لنتمكن من تجهيز بوابتك الخاصة.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="bg-indigo-50/50 p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">اختر مادتك التخصصية</h2>
              <p className="text-xs text-slate-500 mt-0.5">سيكون حسابك مخصصاً بالكامل لهذه المادة</p>
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
