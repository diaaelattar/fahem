import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import { Zap, Swords, Trophy, Target } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

interface ExamAttemptRow {
  completed_at: string
  percentage: number | null
  exams: {
    title: string
    total_points: number
    passing_score: number | null
    subjects: {
      name_ar: string
      icon: string | null
    } | null
  } | null
}

// Component Splitting & Lazy Loading for Performance
import { StudentHero } from '@/components/student/StudentHero'
import { CognitiveRadar } from '@/components/student/CognitiveRadar'

const PerformanceChart = dynamic(
  () => import('@/components/student/PerformanceChart'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 animate-pulse items-center justify-center rounded-2xl bg-slate-100 text-xs text-slate-400">
        جارٍ تحميل التحليل الفني...
      </div>
    ),
  }
)

export default async function StudentDashboardPage() {
  const profile = await requireStudent()
  const supabase = await createClient()

  // ⚡ استعلامات متوازية (Parallel Data Fetching) لإنهاء الـ Database Waterfall
  const [
    subscriptionResult,
    studentGroupsResult,
    studentResult,
    attemptsResult,
    wrongAnswersCountResult,
    rankDataResult,
    bloomStatsResult,
  ] = await Promise.all([
    supabase
      .from('student_subscriptions')
      .select('*, subscription_plans(name_ar)')
      .eq('student_id', profile.id)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .order('end_date', { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from('group_students')
      .select('group_id, student_groups(name_ar)')
      .eq('student_id', profile.id)
      .eq('status', 'active'),

    supabase
      .from('students')
      .select('*, grades(name_ar)')
      .eq('id', profile.id)
      .maybeSingle(),

    supabase
      .from('exam_attempts')
      .select(
        '*, exams(title, total_points, passing_score, subjects(name_ar, icon))'
      )
      .eq('student_id', profile.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(10),

    supabase
      .from('wrong_answers_bank')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', profile.id)
      .eq('is_mastered', false),

    supabase
      .from('leaderboard_weekly')
      .select('rank, weekly_xp')
      .eq('student_id', profile.id)
      .maybeSingle(),

    (
      supabase.rpc as unknown as (
        fn: string,
        args: { p_student_id: string }
      ) => Promise<{
        data:
          | {
              bloom_level: string
              success_rate: number
              correct_answers: number
              total_answers: number
            }[]
          | null
        error: unknown
      }>
    )('get_student_bloom_stats', { p_student_id: profile.id }),
  ])

  const subscription = subscriptionResult.data
  const studentGroups = studentGroupsResult.data as
    | { group_id: string; student_groups: { name_ar: string } | null }[]
    | null
  const student = studentResult.data as unknown as {
    id: string
    last_activity_date: string | null
    streak_days: number | null
    xp_points: number | null
    level: number | null
    grade_id: number | null
    grades: {
      name_ar: string
    } | null
  } | null
  const attempts = attemptsResult.data
  const wrongAnswersCount = wrongAnswersCountResult.count
  const rankData = rankDataResult.data
  const bloomStats = bloomStatsResult.data

  // Check if student is group-only
  const isGroupOnlyStudent =
    studentGroups &&
    studentGroups.length > 0 &&
    !subscription &&
    (profile.email?.endsWith('@istabaq-temp.com') || false)

  if (isGroupOnlyStudent) {
    redirect('/student/group-dashboard')
  }

  // Daily Streak Logic (Background/Fire-and-forget logic preserved)
  const today = new Date().toLocaleDateString('en-CA')
  const lastActivityDate = student?.last_activity_date

  if (student && lastActivityDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString(
      'en-CA'
    )
    let newStreak = 1
    let xpReward = 5

    if (lastActivityDate === yesterday) {
      newStreak = (student.streak_days || 0) + 1
      xpReward = 10
    }

    supabase
      .from('students')
      .update({
        streak_days: newStreak,
        last_activity_date: today,
        xp_points: (student.xp_points || 0) + xpReward,
      })
      .eq('id', profile.id)
      .then(() => {
        supabase
          .from('xp_transactions')
          .insert({
            student_id: profile.id,
            amount: xpReward,
            reason: 'مكافأة الدخول اليومي 🔥',
          })
          .then()
      })

    student.streak_days = newStreak
    student.xp_points = (student.xp_points || 0) + xpReward
  }

  // ⚡ استعلامات تكميلية للاختبارات المتاحة
  const availableExamsResult = await supabase
    .from('exams')
    .select(
      'id, title, duration_minutes, questions_count, total_points, subjects(name_ar, icon)'
    )
    .eq('is_published', true)
    .eq('visibility', 'public')
    .eq('grade_id', student?.grade_id || 0)
    .limit(4)

  const availableExams = availableExamsResult.data as unknown as
    | {
        id: string
        title: string
        duration_minutes: number
        questions_count: number
        total_points: number
        subjects: {
          name_ar: string
          icon: string | null
        } | null
      }[]
    | null

  const xp = student?.xp_points || 0
  const level = student?.level || 1
  const streak = student?.streak_days || 0

  const performanceData =
    (attempts as unknown as ExamAttemptRow[] | null)?.slice(0, 7).map((a) => ({
      date: new Date(a.completed_at).toLocaleDateString('ar-EG', {
        day: 'numeric',
        month: 'short',
      }),
      score: Math.round(a.percentage || 0),
      title: a.exams?.title,
    })) || []

  return (
    <div className="animate-fade-in space-y-6 pb-24 md:pb-12" dir="rtl">
      {/* 🌟 البانر الترحيبي والخبرة */}
      <StudentHero
        fullName={profile.full_name}
        avatarUrl={profile.avatar_url}
        level={level}
        xp={xp}
        streak={streak}
        gradeName={student?.grades?.name_ar || 'الصف الدراسي'}
      />

      {/* 💡 توصيات ذكية للأخطاء السابقة */}
      {(wrongAnswersCount ?? 0) > 0 && (
        <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border-t border-rose-500/30 bg-rose-500/20 p-4 backdrop-blur-md sm:flex-row md:px-8">
          <div className="flex w-full items-center gap-4 text-center sm:w-auto sm:text-right">
            <div>
              <h4 className="text-sm font-bold text-rose-100">
                💡 توصية ذكية من النظام
              </h4>
              <p className="mt-0.5 text-xs text-rose-200/80">
                لديك{' '}
                <strong className="text-white">
                  {wrongAnswersCount} أسئلة
                </strong>{' '}
                أخطأت فيها مسبقاً. مراجعتها الآن سيضاعف نقاطك!
              </p>
            </div>
          </div>
          <Link
            href="/student/practice?mode=mistakes"
            className="w-full shrink-0 rounded-xl bg-rose-500 px-6 py-3 text-center text-xs font-bold text-white shadow-lg sm:w-auto"
          >
            راجع أخطاءك واكسب XP
          </Link>
        </div>
      )}

      {/* 👑 VIP Banner */}
      {!subscription && (
        <div className="relative mb-8 flex flex-col items-center justify-between gap-6 overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 text-white shadow-xl shadow-orange-500/20">
          <div className="relative z-10 flex-1 text-center md:text-right">
            <h3 className="mb-2 text-2xl font-black md:text-3xl">
              افتح جميع قدرات المنصة!
            </h3>
            <p className="text-sm opacity-95">
              اشترك الآن واستمتع باختبارات لا نهائية، تصحيح ذكي، وتقارير أداء
              مفصلة.
            </p>
          </div>
          <Link
            href="/student/premium"
            className="relative z-10 rounded-2xl bg-white px-8 py-4 text-sm font-black text-orange-600"
          >
            اشترك وافتح المنصة
          </Link>
        </div>
      )}

      {/* 🚀 أزرار الاختصارات السريعة */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            href: '/student/practice',
            icon: Zap,
            label: 'تدريب سريع',
            color: 'from-indigo-500 to-violet-600',
          },
          {
            href: '/student/challenges',
            icon: Swords,
            label: 'تحدي الآن',
            color: 'from-rose-500 to-pink-600',
          },
          {
            href: '/student/leaderboard',
            icon: Trophy,
            label: 'لوحة الشرف',
            color: 'from-amber-500 to-orange-500',
          },
          {
            href: '/student/exams',
            icon: Target,
            label: 'اختباراتي',
            color: 'from-emerald-500 to-teal-600',
          },
        ].map(({ href, icon: Icon, label, color }) => (
          <Link
            key={href}
            href={href}
            className={`relative overflow-hidden bg-gradient-to-br ${color} group/action flex flex-col items-center gap-2 rounded-2xl p-4 text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]`}
          >
            <Icon className="mb-1 h-7 w-7" />
            <span className="text-xs font-bold">{label}</span>
          </Link>
        ))}
      </div>

      {/* 📊 شبكة العرض والتحليلات */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* رادار بلوم */}
          <CognitiveRadar bloomStats={bloomStats} />

          {/* الرسم البياني للأداء (حمل كسول) */}
          {performanceData.length > 0 && (
            <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold">تحليل الأداء الفني</h2>
              <PerformanceChart data={performanceData} />
            </div>
          )}

          {/* الاختبارات المتاحة */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                🎯 الاختبارات المدرسية المتاحة
              </h2>
              <Link
                href="/student/exams"
                className="text-xs font-bold text-primary hover:underline"
              >
                الكل ←
              </Link>
            </div>
            {availableExams && availableExams.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {availableExams?.map((exam) => (
                  <Link
                    key={exam.id}
                    href={`/student/exams/${exam.id}/start`}
                    className="group rounded-2xl border border-border bg-white p-4 transition-all hover:border-primary/30 hover:shadow-md"
                  >
                    <h3 className="mb-1 line-clamp-1 text-sm font-bold group-hover:text-primary">
                      {exam.title}
                    </h3>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span>⏱️ {exam.duration_minutes} دقيقة</span>
                      <span>📝 {exam.questions_count} أسئلة</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-primary/20 bg-white p-8 text-center text-slate-500">
                لا توجد اختبارات عامة حالياً.
              </div>
            )}
          </div>
        </div>

        {/* القسم الجانبي (التحديات، لوحة الشرف، النتائج الأخيرة) */}
        <div className="space-y-6">
          {/* ترتيب لوحة الشرف */}
          {rankData && (
            <div className="rounded-3xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-5 text-center">
              <h3 className="mb-2 font-bold text-amber-900">
                🏆 ترتيبك الأسبوعي
              </h3>
              <div className="mb-1 text-4xl font-black text-amber-600">
                #{rankData.rank}
              </div>
              <p className="text-xs text-amber-700">
                {rankData.weekly_xp} نقطة خبرة هذا الأسبوع
              </p>
            </div>
          )}

          {/* آخر النتائج */}
          <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="text-sm font-bold">📈 نشاطي الأخير</h3>
              <Link
                href="/student/results"
                className="text-xs font-bold text-primary hover:underline"
              >
                الكل
              </Link>
            </div>
            <div className="divide-y divide-border">
              {attempts && attempts.length > 0 ? (
                (attempts as unknown as ExamAttemptRow[] | null)
                  ?.slice(0, 5)
                  .map((attempt) => (
                    <Link
                      key={attempt.id}
                      href={`/student/results/${attempt.id}`}
                      className="flex items-center justify-between p-3 transition-colors hover:bg-muted/30"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold">
                          {attempt.exams?.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {attempt.exams?.subjects?.name_ar}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-black ${attempt.is_passed ? 'text-emerald-600' : 'text-rose-500'}`}
                      >
                        {Math.round(attempt.percentage || 0)}%
                      </span>
                    </Link>
                  ))
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  لا توجد محاولات سابقة بعد.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
