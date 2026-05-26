import { getCurrentProfile } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'
import { FileText, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AnimatedExamGrid } from '@/components/teacher/AnimatedExamGrid'

export default async function TeacherExamsPage() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'teacher') redirect('/auth/login')

  const supabase = await createClient()

  // Fetch teacher's exams
  const { data: exams } = await supabase
    .from('exams')
    .select('*, student_groups(name_ar)')
    .eq('teacher_id', profile.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex animate-fade-in flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-slate-800">
            <FileText className="h-6 w-6 text-emerald-600" />
            إدارة الاختبارات
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            قم بإنشاء اختبارات مخصصة لمجموعاتك باستخدام بنك أسئلة استباق.
          </p>
        </div>
        <Link
          href="/teacher/exams/new"
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-95"
        >
          <PlusCircle className="h-5 w-5" />
          إنشاء اختبار
        </Link>
      </div>

      {/* Exams List */}
      {exams && exams.length > 0 ? (
        <AnimatedExamGrid exams={exams} />
      ) : (
        <div className="flex animate-fade-in flex-col items-center rounded-3xl border border-dashed border-border bg-white p-12 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
            <FileText className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-slate-800">
            لا يوجد لديك أي اختبارات
          </h3>
          <p className="mx-auto mb-6 max-w-md text-slate-500">
            قم بإنشاء اختبارك الأول واختيار الأسئلة من بنك الأسئلة لإرسالها
            لطلاب مجموعاتك.
          </p>
          <Link
            href="/teacher/exams/new"
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700"
          >
            <PlusCircle className="h-5 w-5" />
            أنشئ أول اختبار
          </Link>
        </div>
      )}
    </div>
  )
}
