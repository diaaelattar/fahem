import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import {
  Users,
  ClipboardList,
  HelpCircle,
  TrendingUp,
  FileText,
  CheckCircle,
  Clock,
  Award,
  TrendingDown,
  Minus,
} from 'lucide-react'

export default async function AdminDashboardPage() {
  await requireAdmin()
  const supabase = await createClient()

  const now = new Date()
  const startOfThisMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString()

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
    supabase
      .from('exams')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true),
    supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', true),
    supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', startOfThisMonth),
    supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', startOfThisMonth),
    supabase
      .from('exams')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .lt('created_at', startOfThisMonth),
    supabase
      .from('exam_attempts')
      .select('*, profiles:student_id(full_name), exams(title)')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(8),
    supabase
      .from('exam_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('is_passed', true)
      .not('completed_at', 'is', null),
    supabase
      .from('exam_attempts')
      .select('*', { count: 'exact', head: true })
      .not('completed_at', 'is', null),
  ])

  const calcChange = (
    current: number,
    previous: number
  ): { text: string; positive: boolean | null } => {
    if (previous === 0 && current === 0)
      return { text: 'لا يوجد بيانات', positive: null }
    if (previous === 0) return { text: `+${current} جديد`, positive: true }
    const diff = current - previous
    const pct = Math.round((diff / previous) * 100)
    if (diff === 0) return { text: 'لا تغيير', positive: null }
    return {
      text: `${diff > 0 ? '+' : ''}${pct}% هذا الشهر`,
      positive: diff > 0,
    }
  }

  const passRate =
    totalCompletedAttempts && totalCompletedAttempts > 0
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
        <h1 className="font-display text-3xl font-bold text-foreground">
          لوحة التحكم
        </h1>
        <p className="mt-1 text-muted-foreground">نظرة عامة على نشاط المنصة</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="mb-4 flex items-start justify-between">
              <div
                className={`h-12 w-12 rounded-xl ${stat.color} flex items-center justify-center shadow-sm`}
              >
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                  stat.change.positive === true
                    ? 'bg-green-50 text-green-600'
                    : stat.change.positive === false
                      ? 'bg-red-50 text-red-600'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {stat.change.positive === true ? (
                  <TrendingUp className="h-3 w-3" />
                ) : stat.change.positive === false ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <Minus className="h-3 w-3" />
                )}
                {stat.change.text}
              </span>
            </div>
            <div className="mb-1 font-display text-3xl font-bold text-foreground">
              {typeof stat.value === 'number'
                ? stat.value.toLocaleString('ar-EG')
                : stat.value}
            </div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-4 text-lg font-bold">الإجراءات السريعة</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            {
              href: '/admin/content',
              label: 'رفع محتوى جديد',
              icon: '📄',
              color: 'bg-blue-50 hover:bg-blue-100 text-blue-700',
            },
            {
              href: '/admin/exams/new',
              label: 'إنشاء اختبار',
              icon: '📝',
              color: 'bg-green-50 hover:bg-green-100 text-green-700',
            },
            {
              href: '/admin/students',
              label: 'إدارة الطلاب',
              icon: '👤',
              color: 'bg-purple-50 hover:bg-purple-100 text-purple-700',
            },
            {
              href: '/admin/reports',
              label: 'عرض التقارير',
              icon: '📊',
              color: 'bg-orange-50 hover:bg-orange-100 text-orange-700',
            },
          ].map((action) => (
            <a
              key={action.href}
              href={action.href}
              className={`${action.color} card-hover rounded-xl p-4 text-center transition-all`}
            >
              <div className="mb-2 text-2xl">{action.icon}</div>
              <div className="text-sm font-semibold">{action.label}</div>
            </a>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="flex items-center justify-between border-b border-border p-6">
          <h2 className="text-lg font-bold">آخر النتائج</h2>
          <a
            href="/admin/reports"
            className="text-sm text-primary hover:underline"
          >
            عرض الكل
          </a>
        </div>
        {recentAttempts && recentAttempts.length > 0 ? (
          <div className="divide-y divide-border">
            {recentAttempts.map((attempt: any) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {attempt.profiles?.full_name || 'طالب'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {attempt.exams?.title || 'اختبار'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <div className="text-left">
                    <div
                      className={`text-lg font-bold ${attempt.percentage >= 50 ? 'text-green-600' : 'text-red-500'}`}
                    >
                      {attempt.percentage?.toFixed(0)}٪
                    </div>
                  </div>
                  {attempt.is_passed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-red-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Award className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">لا توجد نتائج بعد</p>
            <p className="mt-1 text-xs text-muted-foreground">
              ستظهر نتائج الطلاب هنا بعد حل الاختبارات
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
