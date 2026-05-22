import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { Users, ClipboardList, HelpCircle, TrendingUp, FileText, CheckCircle, Clock, Award, TrendingDown, Minus } from 'lucide-react'

export default async function AdminDashboardPage() {
  await requireAdmin()
  const supabase = await createClient()

  const now = new Date()
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { count: studentsCount },
    { count: examsCount },
    { count: questionsCount },
    { count: studentsLastMonth },
    { count: questionsLastMonth },
    { count: examsLastMonth },
    { data: recentAttempts },
    { count: passedCount },
    { count: totalCompletedAttempts },
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('exams').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('is_approved', true),
    supabase.from('students').select('*', { count: 'exact', head: true }).lt('created_at', startOfThisMonth),
    supabase.from('questions').select('*', { count: 'exact', head: true }).lt('created_at', startOfThisMonth),
    supabase.from('exams').select('*', { count: 'exact', head: true }).eq('is_published', true).lt('created_at', startOfThisMonth),
    supabase.from('exam_attempts')
      .select('*, profiles:student_id(full_name), exams(title)')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(8),
    supabase.from('exam_attempts').select('*', { count: 'exact', head: true }).eq('is_passed', true).not('completed_at', 'is', null),
    supabase.from('exam_attempts').select('*', { count: 'exact', head: true }).not('completed_at', 'is', null),
  ])

  const calcChange = (current: number, previous: number): { text: string; positive: boolean | null } => {
    if (previous === 0 && current === 0) return { text: 'لا يوجد بيانات', positive: null }
    if (previous === 0) return { text: `+${current} جديد`, positive: true }
    const diff = current - previous
    const pct = Math.round((diff / previous) * 100)
    if (diff === 0) return { text: 'لا تغيير', positive: null }
    return { text: `${diff > 0 ? '+' : ''}${pct}% هذا الشهر`, positive: diff > 0 }
  }

  const passRate = totalCompletedAttempts && totalCompletedAttempts > 0
    ? Math.round(((passedCount || 0) / totalCompletedAttempts) * 100)
    : 0

  const stats = [
    {
      label: 'إجمالي الطلاب',
      value: studentsCount ?? 0,
      icon: Users,
      color: 'bg-blue-500',
      change: calcChange(studentsCount ?? 0, studentsLastMonth ?? 0),
    },
    {
      label: 'الاختبارات المنشورة',
      value: examsCount ?? 0,
      icon: ClipboardList,
      color: 'bg-green-500',
      change: calcChange(examsCount ?? 0, examsLastMonth ?? 0),
    },
    {
      label: 'الأسئلة المعتمدة',
      value: questionsCount ?? 0,
      icon: HelpCircle,
      color: 'bg-purple-500',
      change: calcChange(questionsCount ?? 0, questionsLastMonth ?? 0),
    },
    {
      label: 'نسبة النجاح الكلية',
      value: `${passRate}%`,
      icon: TrendingUp,
      color: 'bg-orange-500',
      change: { text: `${totalCompletedAttempts || 0} محاولة`, positive: null },
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">لوحة التحكم</h1>
        <p className="text-muted-foreground mt-1">نظرة عامة على نشاط المنصة</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center shadow-sm`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1
                ${stat.change.positive === true ? 'text-green-600 bg-green-50' :
                  stat.change.positive === false ? 'text-red-600 bg-red-50' :
                  'text-muted-foreground bg-muted'}`}>
                {stat.change.positive === true ? <TrendingUp className="w-3 h-3" /> :
                 stat.change.positive === false ? <TrendingDown className="w-3 h-3" /> :
                 <Minus className="w-3 h-3" />}
                {stat.change.text}
              </span>
            </div>
            <div className="text-3xl font-display font-bold text-foreground mb-1">
              {typeof stat.value === 'number' ? stat.value.toLocaleString('ar-EG') : stat.value}
            </div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="text-lg font-bold mb-4">الإجراءات السريعة</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/admin/content', label: 'رفع محتوى جديد', icon: '📄', color: 'bg-blue-50 hover:bg-blue-100 text-blue-700' },
            { href: '/admin/exams/new', label: 'إنشاء اختبار', icon: '📝', color: 'bg-green-50 hover:bg-green-100 text-green-700' },
            { href: '/admin/students', label: 'إدارة الطلاب', icon: '👤', color: 'bg-purple-50 hover:bg-purple-100 text-purple-700' },
            { href: '/admin/reports', label: 'عرض التقارير', icon: '📊', color: 'bg-orange-50 hover:bg-orange-100 text-orange-700' },
          ].map(action => (
            <a key={action.href} href={action.href}
              className={`${action.color} rounded-xl p-4 text-center transition-all card-hover`}>
              <div className="text-2xl mb-2">{action.icon}</div>
              <div className="text-sm font-semibold">{action.label}</div>
            </a>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-bold">آخر النتائج</h2>
          <a href="/admin/reports" className="text-sm text-primary hover:underline">عرض الكل</a>
        </div>
        {recentAttempts && recentAttempts.length > 0 ? (
          <div className="divide-y divide-border">
            {recentAttempts.map((attempt: any) => (
              <div key={attempt.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{attempt.profiles?.full_name || 'طالب'}</div>
                    <div className="text-xs text-muted-foreground">{attempt.exams?.title || 'اختبار'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <div className="text-left">
                    <div className={`text-lg font-bold ${attempt.percentage >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                      {attempt.percentage?.toFixed(0)}٪
                    </div>
                  </div>
                  {attempt.is_passed
                    ? <CheckCircle className="w-5 h-5 text-green-500" />
                    : <Clock className="w-5 h-5 text-red-400" />
                  }
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Award className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">لا توجد نتائج بعد</p>
            <p className="text-xs text-muted-foreground mt-1">ستظهر نتائج الطلاب هنا بعد حل الاختبارات</p>
          </div>
        )}
      </div>
    </div>
  )
}
