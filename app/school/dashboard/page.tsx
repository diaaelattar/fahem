import { getCurrentProfile } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  Users,
  GraduationCap,
  BookOpen,
  FileSpreadsheet,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowUpRight
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SchoolDashboardPage() {
  const profile = await getCurrentProfile()

  if (!profile || (profile.role !== 'school_admin' && profile.role !== 'admin')) {
    redirect('/auth/school/login')
  }

  const supabase = await createClient()
  const schoolId = profile.school_id

  if (!schoolId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="text-slate-400 max-w-md">
          <h2 className="text-xl font-bold text-white mb-2">مدرسة غير مرتبطة</h2>
          <p className="text-sm">لم يتم ربط حسابك بمؤسسة تعليمية حتى الآن. يرجى مراجعة الإدارة العامة للمنصة.</p>
        </div>
      </div>
    )
  }

  // جلب إحصائيات المجموعات والطلاب والمعلمين والاشتراك
  const [
    { count: teachersCount },
    { count: classesCount },
    { count: studentsCount },
    { count: examsCount },
    { data: latestExams },
    { data: teachersList },
    { data: schoolInfo },
    { data: recentAttempts }
  ] = await Promise.all([
    supabase.from('teachers').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
    supabase.from('school_classes').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('role', 'student'),
    supabase.from('exams').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
    supabase.from('exams').select('id, title, created_at, questions_count, total_points, teacher_id').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(5),
    supabase.from('profiles').select('id, full_name').eq('school_id', schoolId).eq('role', 'teacher'),
    supabase.from('schools').select('name, subscription_end_date, subscription_plan').eq('id', schoolId).maybeSingle(),
    supabase.from('exam_attempts').select('id, score, percentage, is_passed, exams!inner(school_id, subject_id)').eq('exams.school_id', schoolId).order('created_at', { ascending: false }).limit(120)
  ])

  // خريطة لتسريع البحث عن أسماء المعلمين في الذاكرة
  const teacherNameMap = new Map<string, string>()
  teachersList?.forEach((t) => teacherNameMap.set(t.id, t.full_name))

  // حساب مؤشرات ذكاء اصطناعي حقيقية من محاولات الطلاب الأخيرة
  const attempts = recentAttempts || []
  const totalAttempts = attempts.length
  const passedAttempts = attempts.filter((a) => a.is_passed).length
  const overallPassRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : null

  // حساب تاريخ انتهاء الاشتراك بصورة ديناميكية
  const subscriptionEndDate = schoolInfo?.subscription_end_date
    ? new Date(schoolInfo.subscription_end_date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
    : null
  const subscriptionPlan = schoolInfo?.subscription_plan || 'الباقة المدرسية الشاملة (PRO)'

  const kpis = [
    {
      title: 'أعضاء هيئة التدريس',
      value: teachersCount || 0,
      icon: Users,
      color: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20 text-blue-400',
      label: 'معلم نشط'
    },
    {
      title: 'الطلاب المسجلون',
      value: studentsCount || 0,
      icon: GraduationCap,
      color: 'from-cyan-500/10 to-teal-500/10 border-cyan-500/20 text-cyan-400',
      label: 'طالب وطالبة'
    },
    {
      title: 'الفصول الدراسية',
      value: classesCount || 0,
      icon: BookOpen,
      color: 'from-indigo-500/10 to-purple-500/10 border-indigo-500/20 text-indigo-400',
      label: 'فصل تعليمي'
    },
    {
      title: 'الاختبارات المنشأة',
      value: examsCount || 0,
      icon: FileSpreadsheet,
      color: 'from-violet-500/10 to-fuchsia-500/10 border-violet-500/20 text-violet-400',
      label: 'امتحان مقيم'
    }
  ]

  return (
    <div className="space-y-8" dir="rtl">
      {/* الترويسة والترحيب */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">لوحة القيادة والمراقبة</h2>
          <p className="text-slate-400 mt-1.5 text-sm">متابعة فورية وشاملة لأداء المدرسة العام ومؤشرات التقدم الدراسي.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-300">
          <Clock className="h-4 w-4 text-cyan-400" />
          <span>آخر تحديث: تلقائي وفوري</span>
        </div>
      </div>

      {/* بطاقات الإحصائيات (KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon
          return (
            <div
              key={idx}
              className={`bg-gradient-to-br ${kpi.color} border p-6 rounded-2xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-300`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.title}</span>
                  <div className="text-3xl font-extrabold text-white tracking-tight">
                    {kpi.value}
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 block">{kpi.label}</span>
                </div>
                <div className="h-10 w-10 bg-slate-950/40 rounded-xl flex items-center justify-center border border-white/5">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* شبكة التقارير والامتحانات */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* أحدث الامتحانات */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">آخر الامتحانات المنشأة</h3>
              <p className="text-xs text-slate-500 mt-1">الامتحانات التي تم إعدادها بواسطة معلمي المدرسة مؤخراً.</p>
            </div>
            <Link
              href="/school/exams"
              className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              عرض الكل
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            {latestExams && latestExams.length > 0 ? (
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-400 text-xs font-bold">
                    <th className="pb-3 font-semibold">عنوان الامتحان</th>
                    <th className="pb-3 font-semibold">بواسطة المعلم</th>
                    <th className="pb-3 font-semibold text-center">الأسئلة</th>
                    <th className="pb-3 font-semibold text-center">الدرجة</th>
                    <th className="pb-3 font-semibold text-left">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60">
                  {latestExams.map((exam) => (
                    <tr key={exam.id} className="text-slate-300 hover:text-white transition-colors">
                      <td className="py-3.5 font-semibold text-white max-w-[200px] truncate">{exam.title}</td>
                      <td className="py-3.5 text-xs text-slate-400">
                        {teacherNameMap.get(exam.teacher_id) || 'معلم بالمدرسة'}
                      </td>
                      <td className="py-3.5 text-xs text-center">{exam.questions_count || 0}</td>
                      <td className="py-3.5 text-xs text-center">{exam.total_points || 0}</td>
                      <td className="py-3.5 text-xs text-slate-500 text-left">
                        {new Date(exam.created_at).toLocaleDateString('ar-EG', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <FileSpreadsheet className="h-10 w-10 text-slate-700 mb-2" />
                <span className="text-xs">لا توجد امتحانات منشأة حتى الآن</span>
              </div>
            )}
          </div>
        </div>

        {/* تقارير الذكاء الاصطناعي ومستجدات المدرسة */}
        <div className="space-y-6">
          {/* ملخص الأداء العام */}
          <div className="rounded-2xl border border-cyan-900/20 bg-gradient-to-b from-cyan-950/20 to-slate-950/40 p-6 space-y-4">
            <div className="flex items-center gap-2 text-cyan-400">
              <Sparkles className="h-5 w-5" />
              <h3 className="text-sm font-bold tracking-wider uppercase">ملخص الأداء العام</h3>
            </div>
            {totalAttempts > 0 ? (
              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-900 space-y-3">
                <div className="flex gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-200 leading-relaxed">
                    معدل النجاح العام بناءً على آخر <span className="text-cyan-400 font-bold">{totalAttempts}</span> محاولة:
                    <span className={`font-bold mr-1 ${(overallPassRate ?? 0) >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {overallPassRate}%
                    </span>
                  </p>
                </div>
                <div className="flex gap-2 border-t border-slate-900 pt-3">
                  <TrendingUp className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {(overallPassRate ?? 0) >= 70
                      ? 'أداء المدرسة ممتاز. استمر في الجهود المبذولة وراقب المستجدات الدورية.'
                      : 'الأداء يحتاج متابعة. ننصح بمراجعة الامتحانات ذات المعدلات المنخفضة.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-900">
                <p className="text-xs text-slate-400 leading-relaxed">
                  لم يتم تسجيل أي محاولات بعد. سيظهر هنا ملخص الأداء تلقائياً بعد تقديم الطلاب لأول امتحان.
                </p>
              </div>
            )}
          </div>

          {/* حالة الاشتراك */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-6 space-y-3">
            <h4 className="text-xs font-bold text-slate-400">حالة باقة الاشتراك الحالي</h4>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-white">{subscriptionPlan}</span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 px-2 py-1 rounded-md">
                نشط
              </span>
            </div>
            {subscriptionEndDate ? (
              <p className="text-xs text-slate-500">تاريخ التجديد القادم: {subscriptionEndDate}</p>
            ) : (
              <p className="text-xs text-slate-600">تواصل مع إدارة المنصة لمعرفة تفاصيل الاشتراك.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
