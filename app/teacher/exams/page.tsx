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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-600" />
            إدارة الاختبارات
          </h1>
          <p className="text-sm text-slate-500 mt-1">قم بإنشاء اختبارات مخصصة لمجموعاتك باستخدام بنك أسئلة استباق.</p>
        </div>
        <Link 
          href="/teacher/exams/new" 
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-200 transition-all active:scale-95"
        >
          <PlusCircle className="w-5 h-5" />
          إنشاء اختبار
        </Link>
      </div>

      {/* Exams List */}
      {exams && exams.length > 0 ? (
        <AnimatedExamGrid exams={exams} />
      ) : (
        <div className="bg-white rounded-3xl border border-dashed border-border p-12 text-center flex flex-col items-center animate-fade-in">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">لا يوجد لديك أي اختبارات</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-6">
            قم بإنشاء اختبارك الأول واختيار الأسئلة من بنك الأسئلة لإرسالها لطلاب مجموعاتك.
          </p>
          <Link 
            href="/teacher/exams/new" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-200"
          >
            <PlusCircle className="w-5 h-5" />
            أنشئ أول اختبار
          </Link>
        </div>
      )}
    </div>
  )
}
