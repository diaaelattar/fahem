import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import { ClipboardList, CheckCircle, TrendingUp, Clock, Award, ArrowLeft } from 'lucide-react'

export default async function StudentDashboardPage() {
  const profile = await requireStudent()
  const supabase = createClient()

  const { data: student } = await supabase
    .from('students')
    .select('*, grades(name_ar)')
    .eq('id', profile.id)
    .single()

  const { data: attempts } = await supabase
    .from('exam_attempts')
    .select('*, exams(title, total_points, subjects(name_ar, icon))')
    .eq('student_id', profile.id)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(5)

  const { data: availableExams } = await supabase
    .from('exams')
    .select('id, title, duration_minutes, questions_count, total_points, subjects(name_ar, icon)')
    .eq('is_published', true)
    .eq('grade_id', student?.grade_id || 0)
    .limit(6)

  const totalAttempts = attempts?.length || 0
  const avgScore = attempts && attempts.length > 0
    ? Math.round(attempts.reduce((acc: number, a: any) => acc + (a.percentage || 0), 0) / attempts.length)
    : 0
  const passedCount = attempts?.filter((a: any) => a.is_passed).length || 0

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="bg-gradient-to-l from-green-600 to-green-700 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.08),transparent)]" />
        <div className="relative">
          <h1 className="text-3xl font-display font-bold mb-1">مرحباً، {profile.full_name.split(' ')[0]}! 🎓</h1>
          <p className="text-green-100">
            {(student?.grades as any)?.name_ar || 'الصف الدراسي'} • {student?.class_section || 'الفصل'}
          </p>
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-white/15 backdrop-blur rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{totalAttempts}</div>
              <div className="text-xs text-green-100 mt-0.5">اختبار حُلّ</div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{avgScore}٪</div>
              <div className="text-xs text-green-100 mt-0.5">متوسط الدرجات</div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold">{passedCount}</div>
              <div className="text-xs text-green-100 mt-0.5">اختبار ناجح</div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Exams */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">الاختبارات المتاحة</h2>
          <a href="/student/exams" className="text-sm text-primary hover:underline flex items-center gap-1">
            عرض الكل <ArrowLeft className="w-4 h-4" />
          </a>
        </div>

        {availableExams && availableExams.length > 0 ? (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {availableExams.map((exam: any) => (
              <a key={exam.id} href={`/student/exams/${exam.id}`}
                className="bg-white rounded-2xl border border-border p-5 card-hover group">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-2xl">{exam.subjects?.icon || '📚'}</div>
                  <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full font-medium">متاح</span>
                </div>
                <h3 className="font-bold text-base mb-1 group-hover:text-primary transition-colors">{exam.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{exam.subjects?.name_ar}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{exam.duration_minutes} دقيقة</span>
                  <span className="flex items-center gap-1"><ClipboardList className="w-3.5 h-3.5" />{exam.questions_count} سؤال</span>
                  <span>{exam.total_points} درجة</span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border p-12 text-center">
            <ClipboardList className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">لا توجد اختبارات متاحة حالياً</p>
          </div>
        )}
      </div>

      {/* Recent Results */}
      {attempts && attempts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">آخر نتائجي</h2>
            <a href="/student/results" className="text-sm text-primary hover:underline flex items-center gap-1">
              عرض الكل <ArrowLeft className="w-4 h-4" />
            </a>
          </div>
          <div className="bg-white rounded-2xl border border-border divide-y divide-border overflow-hidden">
            {attempts.map((attempt: any) => (
              <div key={attempt.id} className="px-6 py-4 flex items-center gap-4">
                <div className="text-xl">{attempt.exams?.subjects?.icon || '📚'}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{attempt.exams?.title}</p>
                  <p className="text-xs text-muted-foreground">{attempt.exams?.subjects?.name_ar}</p>
                </div>
                <div className="text-left">
                  <div className={`text-xl font-bold ${attempt.is_passed ? 'text-green-600' : 'text-red-500'}`}>
                    {attempt.percentage?.toFixed(0)}٪
                  </div>
                  <div className="text-xs text-muted-foreground">{attempt.score}/{attempt.exams?.total_points}</div>
                </div>
                {attempt.is_passed
                  ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                  : <div className="w-5 h-5 rounded-full border-2 border-red-400 shrink-0" />
                }
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
