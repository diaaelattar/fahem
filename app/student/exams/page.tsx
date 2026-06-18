import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import { Clock, BookOpen, Lock, CheckCircle } from 'lucide-react'

export default async function StudentExamsPage() {
  const profile = await requireStudent()
  const supabase = await createClient()

  const { data: student } = await supabase
    .from('students')
    .select('grade_id')
    .eq('id', profile.id)
    .maybeSingle()

  const { data: exams } = await supabase
    .from('exams')
    .select(
      'id, title, description, duration_minutes, total_points, questions_count, available_from, available_until, subjects(name_ar, icon), grades(name_ar)'
    )
    .eq('is_published', true)
    .eq('grade_id', student?.grade_id || 0)
    .order('created_at', { ascending: false })

  const { data: myAttempts } = await supabase
    .from('exam_attempts')
    .select('exam_id, percentage, is_passed, attempt_number')
    .eq('student_id', profile.id)
    .not('completed_at', 'is', null)

  const attemptMap = new Map(myAttempts?.map((a) => [a.exam_id, a]) || [])
  const now = new Date()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">اختباراتي</h1>
        <p className="mt-1 text-muted-foreground">
          جميع الاختبارات المتاحة لصفك الدراسي
        </p>
      </div>

      {exams && exams.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {exams.map((exam: any) => {
            const attempt = attemptMap.get(exam.id)
            const isExpired =
              exam.available_until && new Date(exam.available_until) < now
            const notStarted =
              exam.available_from && new Date(exam.available_from) > now

            return (
              <div
                key={exam.id}
                className={`overflow-hidden rounded-2xl border-2 bg-white transition-all ${
                  isExpired || notStarted
                    ? 'border-border opacity-60'
                    : 'card-hover border-border hover:border-primary/30'
                }`}
              >
                <div className="p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="text-3xl">
                      {exam.subjects?.icon || '📚'}
                    </div>
                    {attempt ? (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${attempt.is_passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                      >
                        <span className="text-[10px]">
                          {attempt.is_passed ? '✅' : '❌'}
                        </span>
                        <span>{attempt.is_passed ? 'ناجح' : 'راسب'}</span>
                        <span className="opacity-50">•</span>
                        <span dir="ltr">{attempt.percentage?.toFixed(0)}%</span>
                      </span>
                    ) : isExpired ? (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                        منتهي
                      </span>
                    ) : notStarted ? (
                      <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-700">
                        لم يبدأ بعد
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                        متاح
                      </span>
                    )}
                  </div>
                  <h3 className="mb-1 text-base font-bold leading-snug">
                    {exam.title}
                  </h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    {exam.subjects?.name_ar}
                  </p>
                  {exam.description && (
                    <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
                      {exam.description}
                    </p>
                  )}

                  <div className="mb-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                      <Clock className="h-3 w-3" />
                      {exam.duration_minutes} دقيقة
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                      <BookOpen className="h-3 w-3" />
                      {exam.questions_count} سؤال
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-1">
                      {exam.total_points} درجة
                    </span>
                  </div>

                  {!attempt && !isExpired && !notStarted ? (
                    <a
                      href={`/student/exams/${exam.id}/start`}
                      className="block w-full rounded-xl bg-primary py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-primary/90"
                    >
                      ابدأ الاختبار
                    </a>
                  ) : attempt ? (
                    <a
                      href={`/student/results/${exam.id}`}
                      className="block w-full rounded-xl border border-border py-2.5 text-center text-sm font-medium transition-colors hover:bg-muted"
                    >
                      عرض النتيجة
                    </a>
                  ) : (
                    <button
                      disabled
                      className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-muted py-2.5 text-sm font-medium text-muted-foreground"
                    >
                      <Lock className="h-4 w-4" />
                      {isExpired ? 'انتهت فترة الاختبار' : 'لم يبدأ بعد'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-white p-16 text-center">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="mb-2 text-lg font-bold">لا توجد اختبارات متاحة</h3>
          <p className="text-sm text-muted-foreground">
            ستظهر الاختبارات هنا عندما ينشرها معلمك
          </p>
        </div>
      )}
    </div>
  )
}
