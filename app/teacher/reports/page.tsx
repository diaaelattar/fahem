import { getCurrentProfile } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'
import { BarChart, Users, FileText, CheckCircle, Target } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AnalyticsDashboard } from '@/components/teacher/AnalyticsDashboard'

export default async function TeacherReportsPage({
  searchParams,
}: {
  searchParams: { exam_id?: string; group_id?: string }
}) {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'teacher') redirect('/auth/login')

  const supabase = await createClient()

  const selectedExamId = searchParams.exam_id
  const selectedGroupId = searchParams.group_id

  // Fetch groups
  const { data: groups } = await supabase
    .from('student_groups')
    .select('id, name_ar')
    .eq('teacher_id', profile.id)

  // Fetch exams
  let examsQuery = supabase
    .from('exams')
    .select('id, title, group_id')
    .eq('teacher_id', profile.id)
    .order('created_at', { ascending: false })

  if (selectedGroupId) {
    examsQuery = examsQuery.eq('group_id', selectedGroupId)
  }
  const { data: exams } = await examsQuery

  // If an exam is selected, fetch attempts with exam total_points
  let attempts: any[] = []
  let questionStats: any[] = []

  if (selectedExamId) {
    const { data: fetchedAttempts } = await supabase
      .from('exam_attempts')
      .select(
        '*, students(profiles(full_name)), exams(total_points), exam_proctoring_events(id, event_type)'
      )
      .eq('exam_id', selectedExamId)
      .not('completed_at', 'is', null)
      .order('percentage', { ascending: false })

    if (fetchedAttempts) {
      attempts = fetchedAttempts
    }

    if (attempts.length > 0) {
      // Fetch exam questions
      const { data: examQs } = await supabase
        .from('exam_questions')
        .select('question_id, questions(question_text)')
        .eq('exam_id', selectedExamId)

      // Map question IDs to text
      const questionTextMap = new Map<string, string>()
      examQs?.forEach((eq: any) => {
        if (eq.question_id && eq.questions?.question_text) {
          questionTextMap.set(eq.question_id, eq.questions.question_text)
        }
      })

      // Analyze attempts feedback
      const statsMap = new Map<string, { incorrect: number; total: number }>()
      attempts.forEach((attempt: any) => {
        const feedback = attempt.feedback || {}
        Object.keys(feedback).forEach((qId) => {
          const item = feedback[qId]
          if (typeof item === 'object' && item !== null) {
            const current = statsMap.get(qId) || { incorrect: 0, total: 0 }
            current.total++
            if (item.is_correct === false) {
              current.incorrect++
            }
            statsMap.set(qId, current)
          }
        })
      })

      // Compile stats array
      questionStats = Array.from(statsMap.entries())
        .map(([qId, s]) => {
          const text = questionTextMap.get(qId) || 'سؤال غير معروف'
          const failure_rate = s.total > 0 ? (s.incorrect / s.total) * 100 : 0
          return {
            question_text: text,
            failure_rate,
            total_attempts: s.total,
          }
        })
        .sort((a, b) => b.failure_rate - a.failure_rate)
    }
  }

  return (
    <div className="animate-fade-in space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black text-slate-800">
          <BarChart className="h-6 w-6 text-indigo-600" />
          تقارير الأداء والنتائج
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          تابع أداء طلابك في اختباراتك الخاصة واكتشف نقاط الضعف.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm md:flex-row">
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-bold text-slate-500">
            تصفية حسب المجموعة
          </label>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/teacher/reports`}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${!selectedGroupId && !selectedExamId ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              الكل
            </Link>
            {groups?.map((group: any) => (
              <Link
                key={group.id}
                href={`/teacher/reports?group_id=${group.id}`}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${selectedGroupId === String(group.id) ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                {group.name_ar}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-bold text-slate-500">
            اختر الاختبار لعرض النتائج
          </label>
          <div className="flex flex-wrap gap-2">
            {exams?.map((exam: any) => (
              <Link
                key={exam.id}
                href={`/teacher/reports?exam_id=${exam.id}${selectedGroupId ? `&group_id=${selectedGroupId}` : ''}`}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${selectedExamId === String(exam.id) ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'border border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                {exam.title}
              </Link>
            ))}
            {(!exams || exams.length === 0) && (
              <div className="py-2 text-sm italic text-slate-400">
                لا توجد اختبارات في هذه المجموعة.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results view */}
      {selectedExamId ? (
        <div className="space-y-6">
          {/* Analytics charts and metrics */}
          <AnalyticsDashboard
            attempts={attempts}
            questionStats={questionStats}
          />

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-border p-5">
              <h3 className="font-bold text-slate-800">
                نتائج الطلاب بالتفصيل
              </h3>
            </div>
            {attempts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 text-sm text-slate-500">
                    <tr>
                      <th className="p-4 font-bold">اسم الطالب</th>
                      <th className="p-4 font-bold">تاريخ الاختبار</th>
                      <th className="p-4 font-bold">الدرجة النهائية</th>
                      <th className="p-4 font-bold">النسبة المئوية</th>
                      <th className="p-4 font-bold">المراقبة ورصد الغش</th>
                      <th className="p-4 font-bold">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {attempts.map((attempt: any) => (
                      <tr
                        key={attempt.id}
                        className="transition-colors hover:bg-slate-50"
                      >
                        <td className="p-4 font-bold text-slate-800">
                          {attempt.students?.profiles?.full_name || 'غير معروف'}
                        </td>
                        <td className="p-4 text-sm text-slate-500">
                          {new Date(attempt.completed_at).toLocaleString(
                            'ar-EG',
                            { dateStyle: 'medium', timeStyle: 'short' }
                          )}
                        </td>
                        <td className="p-4 text-sm font-black text-slate-700">
                          {attempt.score} / {attempt.exams?.total_points ?? '—'}
                        </td>
                        <td className="p-4">
                          <span
                            className={`rounded-md px-2.5 py-1 text-sm font-black ${
                              (attempt.percentage || 0) >= 85
                                ? 'bg-emerald-100 text-emerald-700'
                                : (attempt.percentage || 0) >= 50
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {Math.round(attempt.percentage || 0)}%
                          </span>
                        </td>
                        <td className="p-4 text-sm font-medium">
                          {(() => {
                            const violations =
                              attempt.exam_proctoring_events?.length || 0
                            return violations === 0 ? (
                              <span className="font-bold text-emerald-600">
                                ✅ سليم (0)
                              </span>
                            ) : (
                              <span className="font-mono font-bold text-rose-600">
                                ⚠️ مخالفة ({violations})
                              </span>
                            )
                          })()}
                        </td>
                        <td className="p-4">
                          <span
                            className={`text-xs font-bold ${attempt.is_passed ? 'text-emerald-600' : 'text-rose-500'}`}
                          >
                            {attempt.is_passed ? 'ناجح' : 'راسب'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">
                <BarChart className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                <p className="font-bold">
                  لا توجد محاولات لهذا الاختبار حتى الآن.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-indigo-200 bg-indigo-50/50 p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
            <FileText className="h-8 w-8 text-indigo-300" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-indigo-900">
            اختر اختباراً لعرض نتائجه
          </h3>
          <p className="mx-auto max-w-md text-sm text-indigo-600/70">
            قم باختيار أحد الاختبارات من القائمة بالأعلى لترى تفاصيل أداء طلابك
            والمحاولات التي تمت.
          </p>
        </div>
      )}
    </div>
  )
}
