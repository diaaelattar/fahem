import { getCurrentProfile } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'
import { Users, FileText, TrendingUp, Link as LinkIcon, PlusCircle, Clock, ShieldCheck, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AnimatedBanner, AnimatedStatCard, AnimatedSection } from '@/components/teacher/DashboardAnimations'

export default async function TeacherDashboard() {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'teacher') redirect('/auth/login')

  const supabase = await createClient()

  // Fetch teacher data including trial status
  const { data: teacher } = await supabase
    .from('teachers')
    .select('is_verified, subscription_status, subscription_ends_at')
    .eq('id', profile.id)
    .single()

  // Fetch teacher's groups and total students
  const { data: groups } = await supabase
    .from('student_groups')
    .select('*, group_students(count)')
    .eq('teacher_id', profile.id)
    .order('created_at', { ascending: false })

  // Fetch teacher's exams
  const { data: exams } = await supabase
    .from('exams')
    .select('id, title, is_published, created_at, student_groups(name_ar)')
    .eq('teacher_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const totalGroups = groups?.length || 0
  const totalStudents = groups?.reduce((sum, g) => sum + (g.group_students[0]?.count || 0), 0) || 0
  const totalExams = exams?.length || 0

  // حساب الأيام المتبقية في الفترة التجريبية
  const isInTrial = !teacher?.is_verified && teacher?.subscription_ends_at
  const daysRemaining = isInTrial
    ? Math.max(0, Math.ceil((new Date(teacher.subscription_ends_at!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  return (
    <div className="space-y-6">

      {/* ── بانر الفترة التجريبية (يظهر للمعلمين غير الموثقين فقط) ── */}
      {isInTrial && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-l from-amber-50 to-orange-50 p-5 shadow-sm animate-fade-in">
          {/* خلفية زخرفية */}
          <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-amber-200/30 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-orange-200/40 blur-xl" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="font-black text-amber-900 text-base leading-tight">
                  حسابك في فترة التجربة — بانتظار موافقة الإدارة
                </p>
                <p className="text-sm text-amber-700 mt-1 font-medium">
                  يمكنك استخدام المنصة بالكامل الآن. بعد مراجعة بياناتك، سيُفعَّل حسابك بشكل دائم من قِبل الأدمن.
                </p>
              </div>
            </div>

            {/* عداد الأيام */}
            <div className="shrink-0 flex items-center gap-3 rounded-xl bg-white border border-amber-200 px-5 py-3 shadow-sm">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <div className="text-center">
                <p className="text-2xl font-black text-amber-700 leading-none">{daysRemaining}</p>
                <p className="text-xs font-bold text-amber-500 mt-0.5">
                  {daysRemaining === 1 ? 'يوم متبقي' : 'يوم متبقٍ'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* بانر الحساب الموثق */}
      {teacher?.is_verified && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 animate-fade-in">
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
          <p className="text-sm font-bold text-emerald-800">حسابك موثَّق ومفعَّل بشكل دائم ✓</p>
        </div>
      )}

      {/* Welcome Banner */}
      <AnimatedBanner>
        <div className="bg-gradient-to-l from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black mb-2">أهلاً بك أستاذ {profile.full_name.split(' ')[0]} 👋</h1>
              <p className="text-indigo-100 font-medium">منصتك الخاصة لإدارة طلابك واختباراتك بكل احترافية وسهولة.</p>
            </div>
            <div className="shrink-0 flex gap-3 w-full md:w-auto">
              <Link href="/teacher/groups/new" className="flex-1 md:flex-none bg-white text-indigo-700 hover:bg-indigo-50 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                <PlusCircle className="w-5 h-5" />
                مجموعة جديدة
              </Link>
              <Link href="/teacher/exams/new" className="flex-1 md:flex-none bg-indigo-500 hover:bg-indigo-400 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border border-indigo-400">
                <FileText className="w-5 h-5" />
                اختبار جديد
              </Link>
            </div>
          </div>
        </div>
      </AnimatedBanner>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AnimatedStatCard index={0}>
          <div className="bg-white rounded-2xl p-6 border border-border shadow-sm flex items-center gap-4 h-full">
            <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Users className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-bold">إجمالي طلابك</p>
              <p className="text-3xl font-black text-slate-800">{totalStudents}</p>
            </div>
          </div>
        </AnimatedStatCard>

        <AnimatedStatCard index={1}>
          <div className="bg-white rounded-2xl p-6 border border-border shadow-sm flex items-center gap-4 h-full">
            <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <TrendingUp className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-bold">المجموعات النشطة</p>
              <p className="text-3xl font-black text-slate-800">{totalGroups}</p>
            </div>
          </div>
        </AnimatedStatCard>

        <AnimatedStatCard index={2}>
          <div className="bg-white rounded-2xl p-6 border border-border shadow-sm flex items-center gap-4 h-full">
            <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <FileText className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-bold">الاختبارات المنشورة</p>
              <p className="text-3xl font-black text-slate-800">{totalExams}</p>
            </div>
          </div>
        </AnimatedStatCard>
      </div>

      <AnimatedSection delay={0.4}>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Quick Groups View */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h2 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                <Users className="w-5 h-5 text-indigo-500" />
                أحدث مجموعاتك
              </h2>
              <Link href="/teacher/groups" className="text-sm font-bold text-indigo-600 hover:text-indigo-800">عرض الكل</Link>
            </div>
            <div className="p-5 flex-1">
              {groups && groups.length > 0 ? (
                <div className="space-y-3">
                  {groups.slice(0, 4).map((group: any) => (
                    <div key={group.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors">
                      <div>
                        <h3 className="font-bold text-slate-800">{group.name_ar}</h3>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                          <Users className="w-3.5 h-3.5" /> {group.group_students[0]?.count || 0} طالب
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] text-slate-500 font-bold">كود الدعوة</span>
                        <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 tracking-widest">{group.invite_code}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-3 py-8">
                  <Users className="w-12 h-12 text-slate-300" />
                  <div>
                    <p className="font-bold">لا توجد مجموعات بعد</p>
                    <p className="text-sm">ابدأ بإنشاء مجموعة لطلابك لدعوتهم</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Exams */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h2 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                <FileText className="w-5 h-5 text-emerald-500" />
                أحدث الاختبارات
              </h2>
              <Link href="/teacher/exams" className="text-sm font-bold text-indigo-600 hover:text-indigo-800">عرض الكل</Link>
            </div>
            <div className="p-5 flex-1">
              {exams && exams.length > 0 ? (
                <div className="space-y-3">
                  {exams.map((exam: any) => (
                    <div key={exam.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-colors">
                      <div>
                        <h3 className="font-bold text-slate-800">{exam.title}</h3>
                        <div className="text-xs text-slate-500 mt-1">
                          مجموعة: {exam.student_groups?.name_ar || 'عام'}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${exam.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {exam.is_published ? 'منشور' : 'مسودة'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-3 py-8">
                  <FileText className="w-12 h-12 text-slate-300" />
                  <div>
                    <p className="font-bold">لم تنشئ أي اختبارات بعد</p>
                    <p className="text-sm">يمكنك سحب الأسئلة من البنك المركزي بسهولة</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </AnimatedSection>
    </div>
  )
}
