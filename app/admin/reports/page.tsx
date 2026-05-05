import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { BarChart3, Users, TrendingUp, CheckCircle, Clock, Download } from 'lucide-react'

export default async function AdminReportsPage() {
  await requireAdmin()
  const supabase = createClient()

  const { data: stats } = await supabase.rpc('get_admin_dashboard_stats')

  const { data: examStats } = await supabase
    .from('exams')
    .select(`
      id, title, attempts_count, avg_score, questions_count,
      subjects(name_ar, icon), grades(name_ar)
    `)
    .gt('attempts_count', 0)
    .order('attempts_count', { ascending: false })
    .limit(10)

  const { data: topStudents } = await supabase
    .from('exam_attempts')
    .select('student_id, percentage, profiles:student_id(full_name)')
    .not('completed_at', 'is', null)
    .order('percentage', { ascending: false })
    .limit(10)

  // Fetch Bloom's Taxonomy Analytics
  // For each question in student_answers, calculate the success rate based on bloom_level
  const { data: bloomStatsRaw } = await supabase
    .from('student_answers')
    .select('is_correct, questions(bloom_level)')
    .not('is_correct', 'is', null)
  
  const bloomMap: Record<string, { total: number, correct: number }> = {
    remember: { total: 0, correct: 0 },
    understand: { total: 0, correct: 0 },
    apply: { total: 0, correct: 0 },
    analyze: { total: 0, correct: 0 },
    evaluate: { total: 0, correct: 0 },
    create: { total: 0, correct: 0 },
  }

  if (bloomStatsRaw) {
    bloomStatsRaw.forEach((ans: any) => {
      const level = ans.questions?.bloom_level
      if (level && bloomMap[level]) {
        bloomMap[level].total += 1
        if (ans.is_correct) bloomMap[level].correct += 1
      }
    })
  }

  const bloomLabels: Record<string, string> = {
    remember: 'تذكر',
    understand: 'فهم',
    apply: 'تطبيق',
    analyze: 'تحليل',
    evaluate: 'تقييم',
    create: 'إبداع'
  }

  const s = stats as any

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">التقارير والإحصائيات</h1>
          <p className="text-muted-foreground mt-1">تحليل شامل لأداء الطلاب والمنصة</p>
        </div>
        <button className="flex items-center gap-2 border border-border px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors">
          <Download className="w-4 h-4" />
          تصدير التقرير
        </button>
      </div>

      {/* Platform Overview */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          { label: 'إجمالي الطلاب', value: s?.total_students || 0, icon: Users, color: 'bg-blue-500' },
          { label: 'الاختبارات المنشورة', value: s?.published_exams || 0, icon: BarChart3, color: 'bg-green-500' },
          { label: 'محاولات مكتملة', value: s?.total_attempts || 0, icon: Clock, color: 'bg-purple-500' },
          { label: 'متوسط المنصة', value: `${s?.avg_platform_score?.toFixed(0) || 0}٪`, icon: TrendingUp, color: 'bg-orange-500' },
        ].map(stat => (
          <div key={stat.label} className="stat-card">
            <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mb-4 shadow-sm`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Exams Performance */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-bold text-lg">أداء الاختبارات</h2>
            <p className="text-sm text-muted-foreground">أكثر الاختبارات نشاطاً</p>
          </div>
          <div className="divide-y divide-border">
            {examStats && examStats.length > 0 ? examStats.map((exam: any) => (
              <div key={exam.id} className="px-5 py-4 flex items-center gap-3">
                <div className="text-xl">{exam.subjects?.icon || '📚'}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{exam.title}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{exam.attempts_count} محاولة</span>
                    <span className="text-xs text-muted-foreground">• {exam.questions_count} سؤال</span>
                  </div>
                  <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${exam.avg_score || 0}%` }} />
                  </div>
                </div>
                <div className="text-left shrink-0">
                  <div className={`text-lg font-bold ${(exam.avg_score || 0) >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                    {(exam.avg_score || 0).toFixed(0)}٪
                  </div>
                  <div className="text-xs text-muted-foreground">متوسط</div>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-muted-foreground text-sm">
                لا توجد بيانات كافية بعد
              </div>
            )}
          </div>
        </div>

        {/* Top Students */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-bold text-lg">أفضل الطلاب أداءً</h2>
            <p className="text-sm text-muted-foreground">بناءً على آخر النتائج</p>
          </div>
          <div className="divide-y divide-border">
            {topStudents && topStudents.length > 0 ? topStudents.map((item: any, i) => (
              <div key={item.student_id + i} className="px-5 py-3.5 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                  i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-600' : 'bg-primary/20 text-primary'
                }`}>
                  {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{(item.profiles as any)?.full_name || 'طالب'}</p>
                </div>
                <div className={`text-base font-bold ${item.percentage >= 80 ? 'text-green-600' : item.percentage >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
                  {item.percentage?.toFixed(0)}٪
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-muted-foreground text-sm">لا توجد بيانات بعد</div>
            )}
          </div>
        </div>
      </div>

      {/* Bloom's Taxonomy Analytics */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-bold text-lg">تحليل الأداء حسب مستويات بلوم</h2>
          <p className="text-sm text-muted-foreground">يوضح نقاط قوة وضعف الطلاب في المستويات المعرفية المختلفة</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(bloomMap).map(([level, data]) => {
              const percentage = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
              return (
                <div key={level} className="bg-slate-50 p-4 rounded-xl border border-border text-center">
                  <div className="text-sm font-bold mb-2">{bloomLabels[level]}</div>
                  <div className={`text-2xl font-display font-bold ${percentage >= 70 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                    {percentage}٪
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {data.correct} من {data.total} صحيح
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {s?.recent_activity && s.recent_activity.length > 0 && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-bold text-lg">النشاط الأخير</h2>
          </div>
          <div className="divide-y divide-border">
            {s.recent_activity.map((activity: any, i: number) => (
              <div key={i} className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{activity.student_name}</p>
                    <p className="text-xs text-muted-foreground">{activity.exam_title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`text-base font-bold ${activity.is_passed ? 'text-green-600' : 'text-red-500'}`}>
                    {activity.score?.toFixed(0)}٪
                  </div>
                  {activity.is_passed
                    ? <CheckCircle className="w-4 h-4 text-green-500" />
                    : <div className="w-4 h-4 rounded-full border-2 border-red-400" />
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
