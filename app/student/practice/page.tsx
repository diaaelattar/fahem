// app/student/practice/page.tsx
// مركز التدريب — Server Component (نسخة محسّنة)

import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import { Brain, BookOpen, AlertCircle, TrendingUp, Zap, ArrowLeft, History } from 'lucide-react'
import Link from 'next/link'

export default async function PracticeCenterPage() {
  const profile = await requireStudent()
  const supabase = await createClient()

  // جلب بيانات الطالب
  const { data: student } = await supabase
    .from('students')
    .select('grade_id')
    .eq('id', profile.id)
    .single()

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
      if (unitQMap[u.id] > 0) unitsWithQuestions.push({ ...u, qCount: unitQMap[u.id] })
    })
  }

  // جلب الاختبارات التي أكملها الطالب (للتدريب عليها لاحقاً)
  const { data: completedAttempts } = await supabase
    .from('exam_attempts')
    .select(`
      id, exam_id, score, percentage, is_passed, completed_at,
      exams(id, title, total_points, subjects(name_ar, icon))
    `)
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
  } catch { /* الجدول غير موجود بعد */ }

  // المواد التي بها أسئلة فعلاً
  const subjectsWithQuestions = subjects?.filter((s: any) => countMap[s.id] > 0) || []
  const subjectsWithoutQuestions = subjects?.filter((s: any) => !countMap[s.id]) || []

  return (
    <div className="space-y-10 animate-fade-in pb-12">
      {/* Hero */}
      <section className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-8 shadow-2xl shadow-violet-500/20">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">مركز التدريب الذكي</h1>
              <p className="text-white/70 text-sm mt-1">تدرب على الأسئلة وراجع أخطاءك — بدون ضغط الوقت</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold">{subjectsWithQuestions.length}</div>
              <div className="text-xs text-white/60 mt-1">مادة متاحة</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold">{Object.values(countMap).reduce((a, b) => a + b, 0)}</div>
              <div className="text-xs text-white/60 mt-1">سؤال للتدريب</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center">
              <div className={`text-3xl font-bold ${wrongPending > 0 ? 'text-yellow-300' : 'text-green-300'}`}>
                {wrongPending}
              </div>
              <div className="text-xs text-white/60 mt-1">خطأ ينتظر</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link href="/student/practice/wrong-answers"
          className="group relative overflow-hidden rounded-3xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50 p-5 hover:border-rose-400 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="font-bold text-rose-900">مراجعة الأخطاء</h3>
            {wrongPending > 0 && (
              <span className="mr-auto w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center">
                {wrongPending}
              </span>
            )}
          </div>
          <p className="text-xs text-rose-700/70">
            {wrongPending > 0 ? `${wrongPending} سؤال ينتظر مراجعتك` : 'لا توجد أخطاء بعد'}
          </p>
        </Link>

        <div className="rounded-3xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="font-bold text-indigo-900">تدريب حر</h3>
          </div>
          <p className="text-xs text-indigo-700/70">اختر مادة أو وحدة أدناه وابدأ التدريب فوراً</p>
        </div>

        <Link href="#past-exams"
          className="rounded-3xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50 p-5 hover:border-purple-400 hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
              <History className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-bold text-purple-900">تدريب من اختبار</h3>
          </div>
          <p className="text-xs text-purple-700/70">أعد التدريب على أسئلة اختباراتك السابقة</p>
        </Link>
      </div>

      {/* المواد الدراسية */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          اختر مادة للتدريب
        </h2>

        {subjectsWithQuestions.length > 0 ? (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {subjectsWithQuestions.map((subject: any) => {
              const count = countMap[subject.id] || 0
              return (
                <Link key={subject.id} href={`/student/practice/${subject.id}`}
                  className="group card-premium p-6 hover:border-primary/30 hover:shadow-lg hover:scale-[1.01] transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                      {subject.icon || '📚'}
                    </div>
                    <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-1 rounded-full">
                      {count} سؤال
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    {subject.name_ar}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    أسئلة متنوعة — سؤال بسؤال مع شرح فوري
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">ابدأ التدريب</span>
                    <div className="w-9 h-9 rounded-full bg-primary/5 group-hover:bg-primary text-primary group-hover:text-white flex items-center justify-center transition-all">
                      <ArrowLeft className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="card-premium p-12 text-center border-dashed">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">لا توجد أسئلة بعد</h3>
            <p className="text-muted-foreground text-sm">سيقوم المعلم بإضافة أسئلة تدريبية لصفك قريباً</p>
          </div>
        )}

        {/* مواد بدون أسئلة */}
        {/* وحدات دراسية */}
        {unitsWithQuestions.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-6">📦 تدريب على الوحدات الدراسية</h2>
            <div className="space-y-8">
              {['term_1', 'term_2', 'full_year'].map(term => {
                const termUnits = unitsWithQuestions.filter((u: any) => u.semester === term || (!u.semester && term === 'full_year'))
                if (termUnits.length === 0) return null
                const termLabels: any = { term_1: 'الفصل الدراسي الأول', term_2: 'الفصل الدراسي الثاني', full_year: 'عام دراسي كامل' }
                return (
                  <div key={term}>
                    <h3 className="text-lg font-bold mb-4 text-purple-700 border-b border-purple-100 pb-2">{termLabels[term]}</h3>
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {termUnits.map((unit: any) => (
                        <Link key={unit.id} href={`/student/practice/unit/${unit.id}`}
                          className="group card-premium p-5 hover:border-purple-200 hover:shadow-md transition-all">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="text-3xl">{unit.subjects?.icon || '📚'}</div>
                            <div className="flex-1">
                              <p className="text-xs text-purple-600 font-bold">{unit.subjects?.name_ar}</p>
                              <h3 className="font-bold group-hover:text-primary transition-colors">{unit.name_ar}</h3>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-border">
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              <span>{unit.qCount} سؤال</span>
                              <span>{unit.lessons?.length || 0} درس</span>
                            </div>
                            <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
          <div className="mt-4 grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {subjectsWithoutQuestions.map((subject: any) => (
              <div key={subject.id} className="rounded-2xl border border-border/50 p-4 flex items-center gap-3 opacity-50">
                <span className="text-2xl">{subject.icon || '📚'}</span>
                <div>
                  <div className="font-bold text-sm">{subject.name_ar}</div>
                  <div className="text-xs text-muted-foreground">لا توجد أسئلة بعد</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* تدريب على اختبارات سابقة */}
      {completedAttempts && completedAttempts.length > 0 && (
        <div id="past-exams">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <History className="w-6 h-6 text-purple-500" />
            تدرّب على أسئلة اختباراتك السابقة
          </h2>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {completedAttempts.map((attempt: any) => {
              const pct = Math.round(attempt.percentage || 0)
              return (
                <Link key={attempt.id}
                  href={`/student/practice/exam/${attempt.exam_id}`}
                  className="group card-premium p-5 hover:border-purple-200 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="text-3xl">{attempt.exams?.subjects?.icon || '📚'}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base truncate">{attempt.exams?.title}</h3>
                      <p className="text-xs text-muted-foreground">{attempt.exams?.subjects?.name_ar}</p>
                    </div>
                    <div className={`text-lg font-bold shrink-0 ${pct >= 60 ? 'text-green-600' : 'text-red-500'}`}>
                      {pct}%
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full ${pct >= 60 ? 'bg-green-500' : 'bg-red-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-600 font-bold">تدرب على أسئلته</span>
                    <div className="w-8 h-8 rounded-full bg-purple-50 group-hover:bg-purple-500 text-purple-500 group-hover:text-white flex items-center justify-center transition-all">
                      <ArrowLeft className="w-4 h-4" />
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
