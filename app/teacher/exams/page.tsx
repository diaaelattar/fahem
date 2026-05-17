import { getCurrentProfile } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'
import { FileText, PlusCircle, Clock, ClipboardList, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default async function TeacherExamsPage() {
  const profile = await getCurrentProfile()
  const supabase = createClient()

  // Fetch teacher's exams
  const { data: exams } = await supabase
    .from('exams')
    .select('*, student_groups(name_ar)')
    .eq('teacher_id', profile.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam: any) => (
            <div key={exam.id} className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden group">
              <div className="p-5 border-b border-border flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">{exam.title}</h3>
                  <div className="text-xs text-slate-500 font-medium bg-slate-100 inline-block px-2 py-0.5 rounded-md">
                    مجموعة: {exam.student_groups?.name_ar || 'عام'}
                  </div>
                </div>
                <div className={`p-1.5 rounded-full ${exam.is_published ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`} title={exam.is_published ? 'منشور' : 'مسودة'}>
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="p-5 flex gap-4 text-sm font-bold text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {exam.duration_minutes} دقيقة
                </div>
                <div className="flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-slate-400" />
                  {exam.questions_count || 0} أسئلة
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-border mt-auto grid grid-cols-2 gap-2">
                <Link href={`/teacher/exams/${exam.id}/edit`} className="text-center text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 py-2 rounded-lg transition-colors">
                  تعديل الأسئلة
                </Link>
                <Link href={`/teacher/reports?exam_id=${exam.id}`} className="text-center text-xs font-bold text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 py-2 rounded-lg transition-colors">
                  النتائج والتقارير
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-dashed border-border p-12 text-center flex flex-col items-center">
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
