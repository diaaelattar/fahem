import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import { Clock, BookOpen, Lock, CheckCircle } from 'lucide-react'

export default async function StudentExamsPage() {
  const profile = await requireStudent()
  const supabase = await createClient()

  const { data: student } = await supabase.from('students').select('grade_id').eq('id', profile.id).single()

  const { data: exams } = await supabase
    .from('exams')
    .select('id, title, description, duration_minutes, total_points, questions_count, available_from, available_until, subjects(name_ar, icon), grades(name_ar)')
    .eq('is_published', true)
    .eq('grade_id', student?.grade_id || 0)
    .order('created_at', { ascending: false })

  const { data: myAttempts } = await supabase
    .from('exam_attempts')
    .select('exam_id, percentage, is_passed, attempt_number')
    .eq('student_id', profile.id)
    .not('completed_at', 'is', null)

  const attemptMap = new Map(myAttempts?.map(a => [a.exam_id, a]) || [])
  const now = new Date()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">اختباراتي</h1>
        <p className="text-muted-foreground mt-1">جميع الاختبارات المتاحة لصفك الدراسي</p>
      </div>

      {exams && exams.length > 0 ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {exams.map((exam: any) => {
            const attempt = attemptMap.get(exam.id)
            const isExpired = exam.available_until && new Date(exam.available_until) < now
            const notStarted = exam.available_from && new Date(exam.available_from) > now

            return (
              <div key={exam.id} className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${
                isExpired || notStarted ? 'opacity-60 border-border' : 'border-border card-hover hover:border-primary/30'
              }`}>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{exam.subjects?.icon || '📚'}</div>
                    {attempt
                      ? <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold ${attempt.is_passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          <span className="text-[10px]">{attempt.is_passed ? '✅' : '❌'}</span>
                          <span>{attempt.is_passed ? 'ناجح' : 'راسب'}</span>
                          <span className="opacity-50">•</span>
                          <span dir="ltr">{attempt.percentage?.toFixed(0)}%</span>
                        </span>
                      : isExpired
                        ? <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">منتهي</span>
                        : notStarted
                          ? <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">لم يبدأ بعد</span>
                          : <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">متاح</span>
                    }
                  </div>
                  <h3 className="font-bold text-base mb-1 leading-snug">{exam.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{exam.subjects?.name_ar}</p>
                  {exam.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{exam.description}</p>}

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1 bg-muted rounded-full px-2.5 py-1">
                      <Clock className="w-3 h-3" />{exam.duration_minutes} دقيقة
                    </span>
                    <span className="flex items-center gap-1 bg-muted rounded-full px-2.5 py-1">
                      <BookOpen className="w-3 h-3" />{exam.questions_count} سؤال
                    </span>
                    <span className="bg-muted rounded-full px-2.5 py-1">{exam.total_points} درجة</span>
                  </div>

                  {!attempt && !isExpired && !notStarted ? (
                    <a href={`/student/exams/${exam.id}/start`}
                      className="block w-full text-center bg-primary text-white py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors">
                      ابدأ الاختبار
                    </a>
                  ) : attempt ? (
                    <a href={`/student/results/${exam.id}`}
                      className="block w-full text-center border border-border py-2.5 rounded-xl font-medium text-sm hover:bg-muted transition-colors">
                      عرض النتيجة
                    </a>
                  ) : (
                    <button disabled
                      className="w-full flex items-center justify-center gap-2 bg-muted text-muted-foreground py-2.5 rounded-xl font-medium text-sm cursor-not-allowed">
                      <Lock className="w-4 h-4" />
                      {isExpired ? 'انتهت فترة الاختبار' : 'لم يبدأ بعد'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border p-16 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">لا توجد اختبارات متاحة</h3>
          <p className="text-muted-foreground text-sm">ستظهر الاختبارات هنا عندما ينشرها معلمك</p>
        </div>
      )}
    </div>
  )
}
