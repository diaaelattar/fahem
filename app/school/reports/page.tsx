import { getCurrentProfile } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  FileText,
  TrendingUp,
  Percent,
  CheckCircle,
  AlertTriangle,
  Award,
  BookOpen
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SchoolReportsPage() {
  const profile = await getCurrentProfile()

  if (!profile || (profile.role !== 'school_admin' && profile.role !== 'admin')) {
    redirect('/auth/school/login')
  }

  const schoolId = profile.school_id
  if (!schoolId) {
    redirect('/school/dashboard')
  }

  const supabase = await createClient()

  // جلب جميع محاولات الطلاب في امتحانات المدرسة
  const { data: attemptsRaw } = await supabase
    .from('exam_attempts')
    .select('id, score, percentage, is_passed, exams!inner(school_id, title)')
    .eq('exams.school_id', schoolId)

  const attempts = attemptsRaw || []

  // حساب مؤشرات الأداء الأساسية (KPIs)
  const totalAttempts = attempts.length
  const passedAttempts = attempts.filter((a) => a.is_passed).length
  const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0
  
  const totalPercentage = attempts.reduce((sum, a) => sum + Number(a.percentage || 0), 0)
  const averagePercentage = totalAttempts > 0 ? Math.round(totalPercentage / totalAttempts) : 0

  return (
    <div className="space-y-8" dir="rtl">
      {/* الترويسة */}
      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-white">التقارير والإحصائيات التحليلية</h2>
        <p className="text-xs text-slate-400 mt-1">تتبع مؤشرات النجاح والرسوب العام وتفاعل الطلاب مع الامتحانات.</p>
      </div>

      {/* بطاقات المؤشرات العامة للتقارير */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-[-30%] left-[-20%] w-32 h-32 rounded-full bg-cyan-500/5 blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">إجمالي المحاولات</span>
              <div className="text-3xl font-extrabold text-white tracking-tight">{totalAttempts}</div>
              <span className="text-[10px] text-slate-500 block">اختباراً تم تقديمه من قبل الطلاب</span>
            </div>
            <div className="h-10 w-10 bg-slate-950/40 rounded-xl flex items-center justify-center border border-white/5 text-cyan-400">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-[-30%] left-[-20%] w-32 h-32 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">نسبة النجاح العامة</span>
              <div className="text-3xl font-extrabold text-white tracking-tight">{passRate}%</div>
              <span className="text-[10px] text-slate-500 block">من إجمالي الطلاب الذين تجاوزوا الدرجة المطلوبة</span>
            </div>
            <div className="h-10 w-10 bg-slate-950/40 rounded-xl flex items-center justify-center border border-white/5 text-emerald-400">
              <Percent className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-[-30%] left-[-20%] w-32 h-32 rounded-full bg-indigo-500/5 blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">متوسط درجات المدرسة</span>
              <div className="text-3xl font-extrabold text-white tracking-tight">{averagePercentage}%</div>
              <span className="text-[10px] text-slate-500 block">معدل التحصيل الدراسي الكلي لجميع الطلاب</span>
            </div>
            <div className="h-10 w-10 bg-slate-950/40 rounded-xl flex items-center justify-center border border-white/5 text-indigo-400">
              <Award className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* تفصيل أداء الامتحانات */}
      <div className="rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">خلاصة أداء اختبارات المدرسة</h3>
        {totalAttempts > 0 ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              يوضح الجدول التالي متوسط الأداء والنسب المئوية المحققة لكل امتحان مسجل بالمدرسة:
            </p>
            <div className="overflow-x-auto rounded-xl border border-slate-900">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900/40 text-slate-400 font-bold">
                  <tr className="border-b border-slate-900">
                    <th className="p-3">عنوان الامتحان</th>
                    <th className="p-3 text-center">المحاولات</th>
                    <th className="p-3 text-center">متوسط النسبة</th>
                    <th className="p-3 text-left">التوصية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 text-slate-300">
                  {Array.from(new Set(attempts.map((a) => (a.exams as any).title))).map((title, idx) => {
                    const examAttempts = attempts.filter((a) => (a.exams as any).title === title)
                    const avgPerc = Math.round(
                      examAttempts.reduce((sum, a) => sum + Number(a.percentage || 0), 0) /
                        examAttempts.length
                    )
                    return (
                      <tr key={idx} className="hover:bg-slate-900/10">
                        <td className="p-3 font-semibold text-white">{title}</td>
                        <td className="p-3 text-center">{examAttempts.length} طلاب</td>
                        <td className={`p-3 text-center font-bold ${avgPerc >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {avgPerc}%
                        </td>
                        <td className="p-3 text-left text-slate-500">
                          {avgPerc >= 70
                            ? 'أداء ممتاز، ينصح بالمتابعة.'
                            : 'أداء متوسط، ينصح بإعادة مراجعة المفاهيم الأساسية.'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <BookOpen className="h-10 w-10 text-slate-800 mb-2" />
            <span className="text-xs">لم يتم رصد أي محاولات تقديم للامتحانات حتى الآن</span>
          </div>
        )}
      </div>
    </div>
  )
}
