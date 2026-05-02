// app/admin/exams/[id]/reports/page.tsx
// تقرير اختبار مفصل للمدير

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { notFound } from 'next/navigation'
import { ArrowRight, Users, TrendingUp, CheckCircle, XCircle, Clock, Award, BarChart3 } from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: { id: string }
}

export default async function ExamReportPage({ params }: Props) {
  await requireAdmin()
  const supabase = createClient()

  const [{ data: rawExam }, { data: rawAttempts }] = await Promise.all([
    supabase
      .from('exams')
      .select(`
        id, title, total_points, passing_score, questions_count,
        duration_minutes, is_published, created_at,
        subjects(name_ar, icon),
        grades(name_ar)
      `)
      .eq('id', params.id)
      .single(),
    supabase
      .from('exam_attempts')
      .select(`
        id, score, percentage, is_passed, completed_at,
        time_spent_seconds, attempt_number,
        profiles:student_id(full_name, email)
      `)
      .eq('exam_id', params.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false }),
  ])

  const attempts: any[] = rawAttempts || []
  const exam: any = rawExam

  if (!exam) notFound()

  const totalAttempts = attempts?.length || 0
  const passedCount = attempts?.filter(a => a.is_passed).length || 0
  const failedCount = totalAttempts - passedCount
  const avgScore = totalAttempts > 0
    ? attempts!.reduce((acc, a) => acc + (a.percentage || 0), 0) / totalAttempts
    : 0
  const passRate = totalAttempts > 0 ? (passedCount / totalAttempts) * 100 : 0
  const bestScore = totalAttempts > 0 ? Math.max(...attempts!.map(a => a.percentage || 0)) : 0
  const avgTime = totalAttempts > 0
    ? attempts!.reduce((acc, a) => acc + (a.time_spent_seconds || 0), 0) / totalAttempts
    : 0

  // توزيع الدرجات
  const distribution = {
    excellent: attempts?.filter(a => (a.percentage || 0) >= 90).length || 0,
    veryGood: attempts?.filter(a => (a.percentage || 0) >= 80 && (a.percentage || 0) < 90).length || 0,
    good: attempts?.filter(a => (a.percentage || 0) >= 70 && (a.percentage || 0) < 80).length || 0,
    pass: attempts?.filter(a => (a.percentage || 0) >= 60 && (a.percentage || 0) < 70).length || 0,
    fail: attempts?.filter(a => (a.percentage || 0) < 60).length || 0,
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = Math.round(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6 pb-10">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/exams" className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{exam.title}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {(exam.subjects as any)?.name_ar} • {(exam.grades as any)?.name_ar}
            </p>
          </div>
        </div>
        <Link
          href={`/admin/exams/${params.id}`}
          className="flex items-center gap-2 border border-border px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
        >
          تعديل الاختبار
        </Link>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي المحاولات', value: totalAttempts, icon: Users, color: 'bg-blue-500', bg: 'bg-blue-50 text-blue-700' },
          { label: 'نسبة النجاح', value: `${passRate.toFixed(0)}٪`, icon: TrendingUp, color: 'bg-green-500', bg: 'bg-green-50 text-green-700' },
          { label: 'متوسط الدرجات', value: `${avgScore.toFixed(0)}٪`, icon: BarChart3, color: 'bg-purple-500', bg: 'bg-purple-50 text-purple-700' },
          { label: 'أعلى درجة', value: `${bestScore.toFixed(0)}٪`, icon: Award, color: 'bg-yellow-500', bg: 'bg-yellow-50 text-yellow-700' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-border p-5">
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3 shadow-sm`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-3xl font-bold mb-0.5">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* توزيع الدرجات */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-bold text-lg mb-5 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> توزيع الدرجات
          </h2>
          {totalAttempts > 0 ? (
            <div className="space-y-3">
              {[
                { label: 'ممتاز (90-100٪)', count: distribution.excellent, color: 'bg-green-500' },
                { label: 'جيد جداً (80-90٪)', count: distribution.veryGood, color: 'bg-blue-500' },
                { label: 'جيد (70-80٪)', count: distribution.good, color: 'bg-yellow-500' },
                { label: 'مقبول (60-70٪)', count: distribution.pass, color: 'bg-orange-400' },
                { label: 'راسب (أقل من 60٪)', count: distribution.fail, color: 'bg-red-500' },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-muted-foreground shrink-0 text-left">{row.label}</div>
                  <div className="flex-1 h-7 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${row.color} rounded-full transition-all flex items-center justify-end pr-2`}
                      style={{ width: totalAttempts > 0 ? `${(row.count / totalAttempts) * 100}%` : '0%', minWidth: row.count > 0 ? '30px' : '0' }}
                    >
                      {row.count > 0 && (
                        <span className="text-white text-xs font-bold">{row.count}</span>
                      )}
                    </div>
                  </div>
                  <div className="w-16 text-xs text-muted-foreground text-left">
                    {totalAttempts > 0 ? `${((row.count / totalAttempts) * 100).toFixed(0)}٪` : '0٪'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground text-sm">
              لا توجد محاولات بعد
            </div>
          )}
        </div>

        {/* ملخص الاختبار */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-bold text-lg mb-5">معلومات الاختبار</h2>
          <div className="space-y-3 text-sm">
            {[
              { label: 'عدد الأسئلة', value: exam.questions_count || '—' },
              { label: 'الدرجة الكاملة', value: exam.total_points },
              { label: 'درجة النجاح', value: exam.passing_score ? `${exam.passing_score} من ${exam.total_points}` : '—' },
              { label: 'مدة الاختبار', value: `${exam.duration_minutes} دقيقة` },
              { label: 'متوسط وقت الحل', value: totalAttempts > 0 ? `${formatTime(avgTime)} دقيقة` : '—' },
              { label: 'تاريخ الإنشاء', value: formatDate(exam.created_at) },
              { label: 'الحالة', value: exam.is_published ? '🟢 منشور' : '⚫ مسودة' },
              { label: 'ناجح / راسب', value: `${passedCount} ✅ / ${failedCount} ❌` },
            ].map(row => (
              <div key={row.label} className="flex justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* جدول الطلاب */}
      {attempts && attempts.length > 0 ? (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-lg">نتائج الطلاب ({totalAttempts})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-border">
                <tr>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">الطالب</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">الدرجة</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">النسبة</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">الوقت</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">التاريخ</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">النتيجة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {attempts.map((a: any) => (
                  <tr key={a.id} className="hover:bg-muted/20">
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-sm font-medium">{a.profiles?.full_name || 'طالب'}</p>
                        <p className="text-xs text-muted-foreground">{a.profiles?.email}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm font-mono">
                      {a.score}/{exam.total_points}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-[80px] h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${a.is_passed ? 'bg-green-500' : 'bg-red-400'}`}
                            style={{ width: `${a.percentage || 0}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold ${a.is_passed ? 'text-green-600' : 'text-red-500'}`}>
                          {(a.percentage || 0).toFixed(0)}٪
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-foreground font-mono">
                      {a.time_spent_seconds ? formatTime(a.time_spent_seconds) : '—'}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {a.completed_at ? formatDate(a.completed_at) : '—'}
                      {a.attempt_number > 1 && (
                        <span className="mr-1 text-orange-500">(م{a.attempt_number})</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {a.is_passed
                        ? <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit"><CheckCircle className="w-3 h-3" /> ناجح</span>
                        : <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full w-fit"><XCircle className="w-3 h-3" /> راسب</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border p-16 text-center">
          <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">لا توجد محاولات بعد</h3>
          <p className="text-muted-foreground text-sm">ستظهر نتائج الطلاب هنا بعد حل الاختبار</p>
        </div>
      )}
    </div>
  )
}
