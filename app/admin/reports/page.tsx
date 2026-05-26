import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import {
  BarChart3,
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  Download,
  AlertTriangle,
  Target,
} from 'lucide-react'

export default async function AdminReportsPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: stats } = await supabase.rpc('get_admin_dashboard_stats')

  const { data: examStats } = await supabase
    .from('exams')
    .select(
      `
      id, title, attempts_count, avg_score, questions_count,
      subjects(name_ar, icon), grades(name_ar)
    `
    )
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

  const bloomMap: Record<string, { total: number; correct: number }> = {
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
    create: 'إبداع',
  }

  // Fetch hardest questions (by error rate) - requires get_hardest_questions function
  const { data: hardestQuestions } = await (supabase.rpc as any)(
    'get_hardest_questions',
    { p_limit: 8 }
  )

  const s = stats as any

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">
            التقارير والإحصائيات
          </h1>
          <p className="mt-1 text-muted-foreground">
            تحليل شامل لأداء الطلاب والمنصة
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted">
          <Download className="h-4 w-4" />
          تصدير التقرير
        </button>
      </div>

      {/* Platform Overview */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'إجمالي الطلاب',
            value: s?.total_students || 0,
            icon: Users,
            color: 'bg-blue-500',
          },
          {
            label: 'الاختبارات المنشورة',
            value: s?.published_exams || 0,
            icon: BarChart3,
            color: 'bg-green-500',
          },
          {
            label: 'محاولات مكتملة',
            value: s?.total_attempts || 0,
            icon: Clock,
            color: 'bg-purple-500',
          },
          {
            label: 'متوسط المنصة',
            value: `${s?.avg_platform_score?.toFixed(0) || 0}٪`,
            icon: TrendingUp,
            color: 'bg-orange-500',
          },
        ].map((stat) => (
          <div key={stat.label} className="stat-card">
            <div
              className={`h-12 w-12 rounded-xl ${stat.color} mb-4 flex items-center justify-center shadow-sm`}
            >
              <stat.icon className="h-6 w-6 text-white" />
            </div>
            <div className="mb-1 text-3xl font-bold">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Exams Performance */}
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="border-b border-border p-5">
            <h2 className="text-lg font-bold">أداء الاختبارات</h2>
            <p className="text-sm text-muted-foreground">
              أكثر الاختبارات نشاطاً
            </p>
          </div>
          <div className="divide-y divide-border">
            {examStats && examStats.length > 0 ? (
              examStats.map((exam: any) => (
                <div
                  key={exam.id}
                  className="flex items-center gap-3 px-5 py-4"
                >
                  <div className="text-xl">{exam.subjects?.icon || '📚'}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{exam.title}</p>
                    <div className="mt-1 flex gap-2">
                      <span className="text-xs text-muted-foreground">
                        {exam.attempts_count} محاولة
                      </span>
                      <span className="text-xs text-muted-foreground">
                        • {exam.questions_count} سؤال
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${exam.avg_score || 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="shrink-0 text-left">
                    <div
                      className={`text-lg font-bold ${(exam.avg_score || 0) >= 50 ? 'text-green-600' : 'text-red-500'}`}
                    >
                      {(exam.avg_score || 0).toFixed(0)}٪
                    </div>
                    <div className="text-xs text-muted-foreground">متوسط</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                لا توجد بيانات كافية بعد
              </div>
            )}
          </div>
        </div>

        {/* Top Students */}
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="border-b border-border p-5">
            <h2 className="text-lg font-bold">أفضل الطلاب أداءً</h2>
            <p className="text-sm text-muted-foreground">
              بناءً على آخر النتائج
            </p>
          </div>
          <div className="divide-y divide-border">
            {topStudents && topStudents.length > 0 ? (
              topStudents.map((item: any, i) => (
                <div
                  key={item.student_id + i}
                  className="flex items-center gap-3 px-5 py-3.5"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white ${
                      i === 0
                        ? 'bg-yellow-400'
                        : i === 1
                          ? 'bg-slate-400'
                          : i === 2
                            ? 'bg-amber-600'
                            : 'bg-primary/20 text-primary'
                    }`}
                  >
                    {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {(item.profiles as any)?.full_name || 'طالب'}
                    </p>
                  </div>
                  <div
                    className={`text-base font-bold ${item.percentage >= 80 ? 'text-green-600' : item.percentage >= 60 ? 'text-yellow-600' : 'text-red-500'}`}
                  >
                    {item.percentage?.toFixed(0)}٪
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                لا توجد بيانات بعد
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bloom's Taxonomy Analytics */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="border-b border-border p-5">
          <h2 className="text-lg font-bold">تحليل الأداء حسب مستويات بلوم</h2>
          <p className="text-sm text-muted-foreground">
            يوضح نقاط قوة وضعف الطلاب في المستويات المعرفية المختلفة
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {Object.entries(bloomMap).map(([level, data]) => {
              const percentage =
                data.total > 0
                  ? Math.round((data.correct / data.total) * 100)
                  : 0
              return (
                <div
                  key={level}
                  className="rounded-xl border border-border bg-slate-50 p-4 text-center"
                >
                  <div className="mb-2 text-sm font-bold">
                    {bloomLabels[level]}
                  </div>
                  <div
                    className={`font-display text-2xl font-bold ${percentage >= 70 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-500'}`}
                  >
                    {percentage}٪
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {data.correct} من {data.total} صحيح
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Hardest Questions — Content Factory Insight */}
      {hardestQuestions && hardestQuestions.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                الأسئلة الأصعب — رؤى لمصنع المحتوى
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                الأسئلة التي يخطئ فيها الطلاب بشكل متكرر — تحتاج لمراجعة أو شرح
                إضافي
              </p>
            </div>
            <span className="rounded-full bg-orange-100 px-3 py-1.5 text-xs font-medium text-orange-700">
              أعلى {hardestQuestions.length} سؤالاً
            </span>
          </div>
          <div className="divide-y divide-border">
            {hardestQuestions.map((q: any, i: number) => (
              <div
                key={q.question_id}
                className="flex items-center gap-4 px-5 py-4"
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
                    q.error_rate >= 70
                      ? 'bg-red-100 text-red-700'
                      : q.error_rate >= 50
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {Math.round(q.error_rate)}٪
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium leading-snug">
                    {q.question_text}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground">
                      {q.subject_name} • {q.grade_name}
                    </span>
                    {q.bloom_level && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        بلوم: {q.bloom_level}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {q.total_attempts} محاولة
                    </span>
                  </div>
                </div>
                <a
                  href={`/admin/questions/${q.question_id}`}
                  className="shrink-0 rounded-lg border border-primary/30 px-3 py-1.5 text-xs text-primary transition-colors hover:bg-primary/5"
                >
                  تعديل
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {s?.recent_activity && s.recent_activity.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="border-b border-border p-5">
            <h2 className="text-lg font-bold">النشاط الأخير</h2>
          </div>
          <div className="divide-y divide-border">
            {s.recent_activity.map((activity: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {activity.student_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.exam_title}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={`text-base font-bold ${activity.is_passed ? 'text-green-600' : 'text-red-500'}`}
                  >
                    {activity.score?.toFixed(0)}٪
                  </div>
                  {activity.is_passed ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-red-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
