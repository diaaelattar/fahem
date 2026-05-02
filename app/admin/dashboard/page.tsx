import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { Users, ClipboardList, HelpCircle, TrendingUp, FileText, CheckCircle, Clock, Award } from 'lucide-react'

export default async function AdminDashboardPage() {
  await requireAdmin()
  const supabase = createClient()

  // جلب إحصائيات سريعة
  const [
    { count: studentsCount },
    { count: examsCount },
    { count: questionsCount },
    { count: documentsCount },
    { data: recentAttempts }
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('exams').select('*', { count: 'exact', head: true }),
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('documents').select('*', { count: 'exact', head: true }),
    supabase.from('exam_attempts')
      .select('*, profiles:student_id(full_name), exams(title)')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(8)
  ])

  const stats = [
    { label: 'إجمالي الطلاب', value: studentsCount ?? 0, icon: Users, color: 'bg-blue-500', change: '+12%' },
    { label: 'الاختبارات المنشورة', value: examsCount ?? 0, icon: ClipboardList, color: 'bg-green-500', change: '+5%' },
    { label: 'الأسئلة في البنك', value: questionsCount ?? 0, icon: HelpCircle, color: 'bg-purple-500', change: '+28%' },
    { label: 'المستندات المرفوعة', value: documentsCount ?? 0, icon: FileText, color: 'bg-orange-500', change: '+8%' },
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
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                {stat.change}
              </span>
            </div>
            <div className="text-3xl font-display font-bold text-foreground mb-1">
              {stat.value.toLocaleString('ar-EG')}
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
            { href: '/admin/students/new', label: 'إضافة طالب', icon: '👤', color: 'bg-purple-50 hover:bg-purple-100 text-purple-700' },
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
