import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { notFound } from 'next/navigation'
import { Users, Clock, TrendingUp, CheckCircle, XCircle, ArrowRight } from 'lucide-react'

export default async function ExamReportsPage({ params }: { params: { id: string } }) {
  await requireAdmin()
  const supabase = createClient()

  const [{ data: exam }, { data: stats }, { data: attempts }] = await Promise.all([
    supabase.from('exams').select('*, subjects(name_ar, icon), grades(name_ar)').eq('id', params.id).single(),
    supabase.rpc('get_exam_statistics', { p_exam_id: params.id }),
    supabase.from('exam_attempts')
      .select('id, score, percentage, is_passed, completed_at, time_spent_seconds, attempt_number, profiles:student_id(full_name)')
      .eq('exam_id', params.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false }),
  ])

  if (!exam) notFound()

  const s = stats as any
  const formatTime = (sec: number) => sec ? `${Math.floor(sec/60)}:${(sec%60).toString().padStart(2,'0')}` : '—'

  const scoreRanges = [
    { label: '90-100٪ (ممتاز)', count: attempts?.filter((a: any) => a.percentage >= 90).length || 0, color: 'bg-emerald-500' },
    { label: '80-89٪ (جيد جداً)', count: attempts?.filter((a: any) => a.percentage >= 80 && a.percentage < 90).length || 0, color: 'bg-green-500' },
    { label: '70-79٪ (جيد)', count: attempts?.filter((a: any) => a.percentage >= 70 && a.percentage < 80).length || 0, color: 'bg-lime-500' },
    { label: '60-69٪ (مقبول)', count: attempts?.filter((a: any) => a.percentage >= 60 && a.percentage < 70).length || 0, color: 'bg-yellow-500' },
    { label: '50-59٪ (ضعيف)', count: attempts?.filter((a: any) => a.percentage >= 50 && a.percentage < 60).length || 0, color: 'bg-orange-400' },
    { label: 'أقل من 50٪ (راسب)', count: attempts?.filter((a: any) => a.percentage < 50).length || 0, color: 'bg-red-500' },
  ]
  const maxCount = Math.max(...scoreRanges.map(r => r.count), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <a href="/admin/exams" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              الاختبارات <ArrowRight className="w-3 h-3" />
            </a>
            <span className="text-sm text-muted-foreground">{exam.title}</span>
          </div>
          <h1 className="text-3xl font-display font-bold">تقرير الاختبار</h1>
          <p className="text-muted-foreground mt-1">{(exam.subjects as any)?.icon} {(exam.subjects as any)?.name_ar} • {(exam.grades as any)?.name_ar}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي المحاولات', value: s?.completed_attempts || 0, icon: Users, color: 'bg-blue-500' },
          { label: 'متوسط الدرجات', value: `${s?.avg_score?.toFixed(0) || 0}٪`, icon: TrendingUp, color: 'bg-purple-500' },
          { label: 'نسبة النجاح', value: `${s?.pass_rate?.toFixed(0) || 0}٪`, icon: CheckCircle, color: 'bg-green-500' },
          { label: 'متوسط الوقت', value: `${s?.avg_time_minutes || 0} دقيقة`, icon: Clock, color: 'bg-orange-500' },
        ].map(stat => (
          <div key={stat.label} className="stat-card">
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold mb-0.5">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-bold text-base mb-5">توزيع الدرجات</h2>
          <div className="space-y-3">
            {scoreRanges.map(range => (
              <div key={range.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{range.label}</span>
                  <span className="font-medium">{range.count} طالب</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${range.color} transition-all`}
                    style={{ width: `${(range.count / maxCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-bold text-base mb-5">إحصائيات سريعة</h2>
          <div className="space-y-3">
            {[
              { label: 'أعلى درجة', value: `${s?.max_score?.toFixed(0) || 0}٪` },
              { label: 'أدنى درجة', value: `${s?.min_score?.toFixed(0) || 0}٪` },
              { label: 'عدد الأسئلة', value: exam.questions_count },
              { label: 'الدرجة الكلية', value: exam.total_points },
              { label: 'درجة النجاح', value: exam.passing_score || `${Math.ceil(exam.total_points * 0.5)} (50٪)` },
              { label: 'مدة الاختبار', value: `${exam.duration_minutes} دقيقة` },
            ].map(item => (
              <div key={item.label} className="flex justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attempts Table */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-bold text-base">نتائج الطلاب التفصيلية</h2>
          <p className="text-sm text-muted-foreground">{attempts?.length || 0} محاولة مكتملة</p>
        </div>
        {attempts && attempts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-border">
                <tr>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">الطالب</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">الدرجة</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">النسبة</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">النتيجة</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">الوقت</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {attempts.map((a: any) => (
                  <tr key={a.id} className="hover:bg-muted/20">
                    <td className="px-5 py-3 text-sm font-medium">{(a.profiles as any)?.full_name || 'طالب'}</td>
                    <td className="px-5 py-3 text-sm">{a.score}/{exam.total_points}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${a.is_passed ? 'bg-green-500' : 'bg-red-400'}`}
                            style={{ width: `${a.percentage || 0}%` }} />
                        </div>
                        <span className={`text-sm font-bold ${a.is_passed ? 'text-green-600' : 'text-red-500'}`}>
                          {a.percentage?.toFixed(0)}٪
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {a.is_passed
                        ? <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit"><CheckCircle className="w-3 h-3" /> ناجح</span>
                        : <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full w-fit"><XCircle className="w-3 h-3" /> راسب</span>
                      }
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{formatTime(a.time_spent_seconds)}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {a.completed_at ? new Date(a.completed_at).toLocaleDateString('ar-EG') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-muted-foreground text-sm">
            لا توجد محاولات مكتملة بعد
          </div>
        )}
      </div>
    </div>
  )
}
