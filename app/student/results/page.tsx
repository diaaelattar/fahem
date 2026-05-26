import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import { CheckCircle, XCircle, Clock, TrendingUp, Award } from 'lucide-react'
import Link from 'next/link'

export default async function StudentResultsPage() {
  const profile = await requireStudent()
  const supabase = await createClient()

  const { data: attempts } = await supabase
    .from('exam_attempts')
    .select(
      `
      id, score, percentage, is_passed, completed_at, time_spent_seconds, attempt_number,
      exams(id, title, total_points, passing_score, subjects(name_ar, icon), grades(name_ar))
    `
    )
    .eq('student_id', (profile as any).id)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })

  const totalAttempts = attempts?.length || 0
  const avgScore =
    attempts && attempts.length > 0
      ? Math.round(
          attempts.reduce(
            (acc: number, a: any) => acc + (a.percentage || 0),
            0
          ) / attempts.length
        )
      : 0
  const passedCount = attempts?.filter((a: any) => a.is_passed).length || 0
  const bestScore =
    attempts && attempts.length > 0
      ? Math.max(...attempts.map((a: any) => a.percentage || 0))
      : 0

  const formatTime = (seconds: number) => {
    if (!seconds) return '—'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">نتائجي</h1>
        <p className="mt-1 text-muted-foreground">
          سجل أدائك في جميع الاختبارات
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          {
            label: 'إجمالي الاختبارات',
            value: totalAttempts,
            icon: Clock,
            color: 'text-blue-600 bg-blue-50',
          },
          {
            label: 'متوسط الدرجات',
            value: `${avgScore}٪`,
            icon: TrendingUp,
            color: 'text-purple-600 bg-purple-50',
          },
          {
            label: 'اختبارات ناجحة',
            value: passedCount,
            icon: CheckCircle,
            color: 'text-green-600 bg-green-50',
          },
          {
            label: 'أعلى درجة',
            value: `${bestScore.toFixed(0)}٪`,
            icon: Award,
            color: 'text-yellow-600 bg-yellow-50',
          },
        ].map((stat) => (
          <div key={stat.label} className="stat-card">
            <div
              className={`h-10 w-10 rounded-xl ${stat.color} mb-3 flex items-center justify-center`}
            >
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="mb-0.5 text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Results List */}
      {attempts && attempts.length > 0 ? (
        <div className="space-y-3">
          {attempts.map((attempt: any) => (
            <Link key={attempt.id} href={`/student/results/${attempt.id}`}>
              <div className="card-hover mb-3 cursor-pointer rounded-2xl border border-border bg-white p-5 transition-all hover:border-primary/50">
                <div className="flex items-center gap-4">
                  <div className="shrink-0 text-3xl">
                    {attempt.exams?.subjects?.icon || '📚'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-bold">
                      {attempt.exams?.title}
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{attempt.exams?.subjects?.name_ar}</span>
                      {attempt.exams?.grades?.name_ar && (
                        <span>• {attempt.exams.grades.name_ar}</span>
                      )}
                      {attempt.completed_at && (
                        <span>
                          •{' '}
                          {new Date(attempt.completed_at).toLocaleDateString(
                            'ar-EG',
                            { day: 'numeric', month: 'long', year: 'numeric' }
                          )}
                        </span>
                      )}
                      {attempt.time_spent_seconds && (
                        <span>
                          • مدة الحل: {formatTime(attempt.time_spent_seconds)}
                        </span>
                      )}
                      {attempt.attempt_number > 1 && (
                        <span className="text-orange-500">
                          • المحاولة {attempt.attempt_number}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-left">
                    <div
                      className={`mb-0.5 text-3xl font-bold ${attempt.is_passed ? 'text-green-600' : 'text-red-500'}`}
                    >
                      {attempt.percentage?.toFixed(0)}٪
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {attempt.score}/{attempt.exams?.total_points} درجة
                    </div>
                  </div>
                  <div className="shrink-0">
                    {attempt.is_passed ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                        <XCircle className="h-6 w-6 text-red-500" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Score bar */}
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${attempt.is_passed ? 'bg-green-500' : 'bg-red-400'}`}
                    style={{ width: `${attempt.percentage || 0}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-white p-16 text-center">
          <TrendingUp className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="mb-2 text-lg font-bold">لا توجد نتائج بعد</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            ابدأ بحل الاختبارات لترى نتائجك هنا
          </p>
          <a
            href="/student/exams"
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
          >
            ابدأ اختباراً
          </a>
        </div>
      )}
    </div>
  )
}
