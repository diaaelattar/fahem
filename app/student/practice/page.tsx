// app/student/practice/page.tsx
// مركز التدريب — Server Component (نسخة محسّنة)

import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import {
  Brain,
  BookOpen,
  AlertCircle,
  TrendingUp,
  Zap,
  ArrowLeft,
  History,
} from 'lucide-react'
import Link from 'next/link'

export default async function PracticeCenterPage() {
  const profile = await requireStudent()
  const supabase = await createClient()

  // جلب بيانات الطالب
  const { data: student } = await supabase
    .from('students')
    .select('grade_id')
    .eq('id', profile.id)
    .maybeSingle()

  const gradeId = student?.grade_id

  // جلب المواد الدراسية
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name_ar, icon')
    .order('id')

  // جلب عدد الأسئلة لكل مادة في صف الطالب
  const { data: questionCounts } = await supabase
    .from('questions')
    .select('subject_id')
    .eq('grade_id', gradeId || 0)

  // إنشاء خريطة المواد → عدد الأسئلة
  const countMap: Record<number, number> = {}
  questionCounts?.forEach((q: any) => {
    countMap[q.subject_id] = (countMap[q.subject_id] || 0) + 1
  })

  // جلب الوحدات الدراسية المتاحة لصف الطالب
  const { data: units } = await supabase
    .from('units')
    .select('id, name_ar, subjects(id, name_ar, icon), lessons(id, name_ar)')
    .eq('grade_id', gradeId || 0)
    .order('sort_order')

  const unitsWithQuestions: any[] = []
  if (units && units.length > 0) {
    const { data: unitQCounts } = await supabase
      .from('questions')
      .select('unit_id')
      .eq('grade_id', gradeId || 0)
      .not('unit_id', 'is', null)
    const unitQMap: Record<number, number> = {}
    unitQCounts?.forEach((q: any) => {
      unitQMap[q.unit_id] = (unitQMap[q.unit_id] || 0) + 1
    })
    units.forEach((u: any) => {
      if (unitQMap[u.id] > 0)
        unitsWithQuestions.push({ ...u, qCount: unitQMap[u.id] })
    })
  }

  // جلب الاختبارات التي أكملها الطالب (للتدريب عليها لاحقاً)
  const { data: completedAttempts } = await supabase
    .from('exam_attempts')
    .select(
      `
      id, exam_id, score, percentage, is_passed, completed_at,
      exams(id, title, total_points, subjects(name_ar, icon))
    `
    )
    .eq('student_id', profile.id)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(6)

  // جلب بنك الإجابات الخاطئة (إذا كان الجدول موجوداً)
  let wrongTotal = 0
  let wrongPending = 0
  try {
    const { data: wrongAnswers, error } = await supabase
      .from('wrong_answers_bank')
      .select('is_mastered')
      .eq('student_id', profile.id)
    if (!error && wrongAnswers) {
      wrongTotal = wrongAnswers.length
      wrongPending = wrongAnswers.filter((w: any) => !w.is_mastered).length
    }
  } catch {
    /* الجدول غير موجود بعد */
  }

  // المواد التي بها أسئلة فعلاً
  const subjectsWithQuestions =
    subjects?.filter((s: any) => countMap[s.id] > 0) || []
  const subjectsWithoutQuestions =
    subjects?.filter((s: any) => !countMap[s.id]) || []

  return (
    <div className="animate-fade-in space-y-10 pb-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-8 shadow-2xl shadow-violet-500/20">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative z-10 text-white">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <Brain className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">مركز التدريب الذكي</h1>
              <p className="mt-1 text-sm text-white/70">
                تدرب على الأسئلة وراجع أخطاءك — بدون ضغط الوقت
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur">
              <div className="text-3xl font-bold">
                {subjectsWithQuestions.length}
              </div>
              <div className="mt-1 text-xs text-white/60">مادة متاحة</div>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur">
              <div className="text-3xl font-bold">
                {Object.values(countMap).reduce((a, b) => a + b, 0)}
              </div>
              <div className="mt-1 text-xs text-white/60">سؤال للتدريب</div>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur">
              <div
                className={`text-3xl font-bold ${wrongPending > 0 ? 'text-yellow-300' : 'text-green-300'}`}
              >
                {wrongPending}
              </div>
              <div className="mt-1 text-xs text-white/60">خطأ ينتظر</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/student/practice/wrong-answers"
          className="group relative overflow-hidden rounded-3xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50 p-5 transition-all hover:border-rose-400 hover:shadow-lg"
        >
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100">
              <AlertCircle className="h-5 w-5 text-rose-600" />
            </div>
            <h3 className="font-bold text-rose-900">مراجعة الأخطاء</h3>
            {wrongPending > 0 && (
              <span className="mr-auto flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
                {wrongPending}
              </span>
            )}
          </div>
          <p className="text-xs text-rose-700/70">
            {wrongPending > 0
              ? `${wrongPending} سؤال ينتظر مراجعتك`
              : 'لا توجد أخطاء بعد'}
          </p>
        </Link>

        <div className="rounded-3xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-5">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100">
              <Zap className="h-5 w-5 text-indigo-600" />
            </div>
            <h3 className="font-bold text-indigo-900">تدريب حر</h3>
          </div>
          <p className="text-xs text-indigo-700/70">
            اختر مادة أو وحدة أدناه وابدأ التدريب فوراً
          </p>
        </div>

        <Link
          href="#past-exams"
          className="rounded-3xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50 p-5 transition-all hover:border-purple-400 hover:shadow-lg"
        >
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100">
              <History className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="font-bold text-purple-900">تدريب من اختبار</h3>
          </div>
          <p className="text-xs text-purple-700/70">
            أعد التدريب على أسئلة اختباراتك السابقة
          </p>
        </Link>
      </div>

      {/* المواد الدراسية */}
      <div>
        <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
          <BookOpen className="h-6 w-6 text-primary" />
          اختر مادة للتدريب
        </h2>

        {subjectsWithQuestions.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {subjectsWithQuestions.map((subject: any) => {
              const count = countMap[subject.id] || 0
              return (
                <Link
                  key={subject.id}
                  href={`/student/practice/${subject.id}`}
                  className="card-premium group p-6 transition-all hover:scale-[1.01] hover:border-primary/30 hover:shadow-lg"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/5 text-3xl transition-transform group-hover:scale-110">
                      {subject.icon || '📚'}
                    </div>
                    <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-bold text-green-700">
                      {count} سؤال
                    </span>
                  </div>
                  <h3 className="mb-1 text-lg font-bold transition-colors group-hover:text-primary">
                    {subject.name_ar}
                  </h3>
                  <p className="mb-4 text-xs text-muted-foreground">
                    أسئلة متنوعة — سؤال بسؤال مع شرح فوري
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">
                      ابدأ التدريب
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/5 text-primary transition-all group-hover:bg-primary group-hover:text-white">
                      <ArrowLeft className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="card-premium border-dashed p-12 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <h3 className="mb-2 text-lg font-bold">لا توجد أسئلة بعد</h3>
            <p className="text-sm text-muted-foreground">
              سيقوم المعلم بإضافة أسئلة تدريبية لصفك قريباً
            </p>
          </div>
        )}

        {/* مواد بدون أسئلة */}
        {/* وحدات دراسية */}
        {unitsWithQuestions.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-6 text-xl font-bold">
              📦 تدريب على الوحدات الدراسية
            </h2>
            <div className="space-y-8">
              {['term_1', 'term_2', 'full_year'].map((term) => {
                const termUnits = unitsWithQuestions.filter(
                  (u: any) =>
                    u.semester === term || (!u.semester && term === 'full_year')
                )
                if (termUnits.length === 0) return null
                const termLabels: any = {
                  term_1: 'الفصل الدراسي الأول',
                  term_2: 'الفصل الدراسي الثاني',
                  full_year: 'عام دراسي كامل',
                }
                return (
                  <div key={term}>
                    <h3 className="mb-4 border-b border-purple-100 pb-2 text-lg font-bold text-purple-700">
                      {termLabels[term]}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {termUnits.map((unit: any) => (
                        <Link
                          key={unit.id}
                          href={`/student/practice/unit/${unit.id}`}
                          className="card-premium group p-5 transition-all hover:border-purple-200 hover:shadow-md"
                        >
                          <div className="mb-3 flex items-start gap-3">
                            <div className="text-3xl">
                              {unit.subjects?.icon || '📚'}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-purple-600">
                                {unit.subjects?.name_ar}
                              </p>
                              <h3 className="font-bold transition-colors group-hover:text-primary">
                                {unit.name_ar}
                              </h3>
                            </div>
                          </div>
                          <div className="flex items-center justify-between border-t border-border pt-3">
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              <span>{unit.qCount} سؤال</span>
                              <span>{unit.lessons?.length || 0} درس</span>
                            </div>
                            <ArrowLeft className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {subjectsWithoutQuestions.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {subjectsWithoutQuestions.map((subject: any) => (
              <div
                key={subject.id}
                className="flex items-center gap-3 rounded-2xl border border-border/50 p-4 opacity-50"
              >
                <span className="text-2xl">{subject.icon || '📚'}</span>
                <div>
                  <div className="text-sm font-bold">{subject.name_ar}</div>
                  <div className="text-xs text-muted-foreground">
                    لا توجد أسئلة بعد
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* تدريب على اختبارات سابقة */}
      {completedAttempts && completedAttempts.length > 0 && (
        <div id="past-exams">
          <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
            <History className="h-6 w-6 text-purple-500" />
            تدرّب على أسئلة اختباراتك السابقة
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {completedAttempts.map((attempt: any) => {
              const pct = Math.round(attempt.percentage || 0)
              return (
                <Link
                  key={attempt.id}
                  href={`/student/practice/exam/${attempt.exam_id}`}
                  className="card-premium group p-5 transition-all hover:border-purple-200 hover:shadow-lg"
                >
                  <div className="mb-4 flex items-start gap-3">
                    <div className="text-3xl">
                      {attempt.exams?.subjects?.icon || '📚'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-bold">
                        {attempt.exams?.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {attempt.exams?.subjects?.name_ar}
                      </p>
                    </div>
                    <div
                      className={`shrink-0 text-lg font-bold ${pct >= 60 ? 'text-green-600' : 'text-red-500'}`}
                    >
                      {pct}%
                    </div>
                  </div>
                  <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${pct >= 60 ? 'bg-green-500' : 'bg-red-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-600">
                      تدرب على أسئلته
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-50 text-purple-500 transition-all group-hover:bg-purple-500 group-hover:text-white">
                      <ArrowLeft className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
