import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import {
  ClipboardList,
  TrendingUp,
  Clock,
  Award,
  ArrowLeft,
  Zap,
  Sparkles,
  Dumbbell,
  AlertCircle,
  Swords,
  Trophy,
  Flame,
  Star,
  Target,
  Layers,
  Lightbulb,
  PenTool,
  Search,
  Gauge,
  BrainCircuit,
  Crown,
  Users,
  PlusCircle,
  FileText,
} from 'lucide-react'
import PerformanceChart from '@/components/student/PerformanceChart'
import Link from 'next/link'

const LEVEL_NAMES: Record<number, string> = {
  1: 'مبتدئ',
  2: 'متعلم',
  3: 'متقدم',
  4: 'محترف',
  5: 'خبير',
  6: 'نخبة',
  7: 'أسطورة',
  8: 'بطل',
  9: 'أمير',
  10: 'ملك',
}

export default async function StudentDashboardPage() {
  const profile = await requireStudent()
  const supabase = await createClient()

  // Fetch active subscription first for redirect check
  const { data: subscription } = await supabase
    .from('student_subscriptions')
    .select('*, subscription_plans(name_ar)')
    .eq('student_id', profile.id)
    .eq('status', 'active')
    .gte('end_date', new Date().toISOString())
    .order('end_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Fetch student's groups for redirect check
  const { data: studentGroups } = await supabase
    .from('group_students')
    .select('group_id, student_groups(name_ar)')
    .eq('student_id', profile.id)
    .eq('status', 'active')

  // Check if student is group-only (has active groups, no active subscription, and has temporary email)
  const isGroupOnlyStudent =
    studentGroups &&
    studentGroups.length > 0 &&
    !subscription &&
    (profile.email?.endsWith('@istabaq-temp.com') || false)

  if (isGroupOnlyStudent) {
    redirect('/student/group-dashboard')
  }

  const { data: student } = await supabase
    .from('students')
    .select('*, grades(name_ar)')
    .eq('id', profile.id)
    .maybeSingle()

  // Daily Streak Logic
  const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD
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

    // Fire and forget updates
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

    // Optimistically update local variables for render
    student.streak_days = newStreak
    student.xp_points = (student.xp_points || 0) + xpReward
  }

  const { data: attempts } = await supabase
    .from('exam_attempts')
    .select(
      '*, exams(title, total_points, passing_score, subjects(name_ar, icon))'
    )
    .eq('student_id', profile.id)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(10)

  const { data: availableExams } = await supabase
    .from('exams')
    .select(
      'id, title, duration_minutes, questions_count, total_points, subjects(name_ar, icon)'
    )
    .eq('is_published', true)
    .eq('visibility', 'public')
    .eq('grade_id', student?.grade_id || 0)
    .limit(4)

  const groupIds = studentGroups?.map((g: any) => g.group_id) || []

  // Fetch exams from these groups
  const { data: groupExams } =
    groupIds.length > 0
      ? await supabase
          .from('exams')
          .select(
            'id, title, duration_minutes, questions_count, student_groups(name_ar)'
          )
          .in('group_id', groupIds)
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(4)
      : { data: [] }

  const { count: wrongAnswersCount } = await supabase
    .from('wrong_answers_bank')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', profile.id)
    .eq('is_mastered', false)

  // Leaderboard rank
  const { data: rankData } = await supabase
    .from('leaderboard_weekly')
    .select('rank, weekly_xp')
    .eq('student_id', profile.id)
    .maybeSingle()

  // Recent challenges
  const { data: challenges } = await supabase
    .from('challenges')
    .select(
      'id, status, winner_id, challenger_score, opponent_score, created_at, subjects(name_ar)'
    )
    .or(`challenger_id.eq.${profile.id},opponent_id.eq.${profile.id}`)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(3)

  // subscription is already fetched at the top of the page

  // Fetch Bloom's Taxonomy Stats
  const { data: bloomStats } = await (supabase.rpc as any)(
    'get_student_bloom_stats',
    { p_student_id: profile.id }
  )

  const bloomLabels: Record<
    string,
    { label: string; icon: any; color: string }
  > = {
    remember: { label: 'تذكر', icon: Lightbulb, color: 'bg-blue-500' },
    understand: { label: 'فهم', icon: BrainCircuit, color: 'bg-emerald-500' },
    apply: { label: 'تطبيق', icon: PenTool, color: 'bg-amber-500' },
    analyze: { label: 'تحليل', icon: Search, color: 'bg-purple-500' },
    evaluate: { label: 'تقييم', icon: Gauge, color: 'bg-rose-500' },
    create: { label: 'إبداع', icon: Sparkles, color: 'bg-indigo-500' },
  }

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

  const xp = student?.xp_points || 0
  const level = student?.level || 1
  const streak = student?.streak_days || 0
  const xpInCurrentLevel = xp % 100
  const xpProgress = Math.round((xpInCurrentLevel / 100) * 100)

  const performanceData =
    attempts?.slice(0, 7).map((a: any) => ({
      date: new Date(a.completed_at).toLocaleDateString('ar-EG', {
        day: 'numeric',
        month: 'short',
      }),
      score: Math.round(a.percentage || 0),
      title: a.exams?.title,
    })) || []

  return (
    <div className="animate-fade-in space-y-6 pb-24 md:pb-12">
      {/* ── 🌟 NEW HERO LANDSCAPE ─────────────────────────────────────────── */}
      <section className="group relative mb-8 overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl shadow-indigo-900/20">
        {/* Animated Background Gradients & Glassmorphism */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-700 to-slate-900 opacity-90" />
        <div
          className="absolute right-0 top-0 h-96 w-96 animate-pulse rounded-full bg-fuchsia-500 opacity-40 mix-blend-multiply blur-[128px] filter"
          style={{ animationDuration: '4s' }}
        />
        <div
          className="absolute bottom-0 left-0 h-96 w-96 animate-pulse rounded-full bg-blue-500 opacity-40 mix-blend-multiply blur-[128px] filter"
          style={{ animationDuration: '6s' }}
        />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />

        <div className="relative flex flex-col items-center gap-8 p-8 backdrop-blur-sm md:p-12 lg:flex-row lg:gap-12">
          {/* Avatar & Welcome */}
          <div className="flex w-full flex-1 flex-col items-center gap-6 text-center md:flex-row md:items-start md:text-right">
            <div className="relative mt-4 shrink-0 md:mt-0">
              <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 opacity-60 blur-xl" />
              <img
                src={
                  profile.avatar_url ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${profile.full_name}`
                }
                alt={profile.full_name}
                className="relative z-10 h-28 w-28 rounded-full border-4 border-white/20 object-cover shadow-2xl md:h-36 md:w-36"
              />
              <div className="absolute -bottom-4 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-yellow-300/30 bg-gradient-to-r from-yellow-500 to-amber-600 px-5 py-1.5 text-[11px] font-black text-white shadow-lg shadow-amber-900/50">
                مستوى {level}
              </div>
            </div>

            <div className="space-y-3 pt-2 text-white">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold text-blue-100 shadow-sm backdrop-blur-md">
                <Sparkles className="h-4 w-4 text-yellow-300" />
                {LEVEL_NAMES[level] || 'بطل'} •{' '}
                {(student?.grades as any)?.name_ar || 'الصف الدراسي'}
              </div>
              <h1 className="bg-gradient-to-b from-white to-white/80 bg-clip-text font-display text-4xl font-black tracking-tight text-transparent drop-shadow-xl md:text-5xl lg:text-6xl">
                مرحباً، {profile.full_name.split(' ')[0]}!
              </h1>
              <p className="max-w-md text-sm font-medium leading-relaxed text-blue-100/90 md:text-base">
                مستقبلك يبدأ من هنا. استمر في التدريب يومياً لتحطيم أرقامك
                القياسية والوصول إلى القمة!
              </p>
            </div>
          </div>

          {/* Core Stats & CTA Panel */}
          <div className="relative z-10 flex w-full shrink-0 flex-col gap-6 rounded-3xl border border-white/20 bg-white/10 p-7 shadow-2xl backdrop-blur-xl transition-colors hover:bg-white/[0.12] lg:w-96">
            {/* XP & Streak Row */}
            <div className="flex items-center justify-between gap-6">
              {/* XP Progress */}
              <div className="flex-1">
                <div className="mb-2 flex items-end justify-between">
                  <span className="text-xs font-bold text-blue-200">
                    نقاطك (XP)
                  </span>
                  <span className="text-2xl font-black text-yellow-400 drop-shadow-sm">
                    {xp}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-black/40 shadow-inner">
                  <div
                    className="relative h-full rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-rose-500 transition-all duration-1000"
                    style={{ width: `${Math.max(5, xpProgress)}%` }}
                  >
                    <div className="absolute bottom-0 right-0 top-0 w-12 bg-gradient-to-l from-white/40 to-transparent" />
                  </div>
                </div>
                <div className="mt-2 flex justify-between font-mono text-[10px] font-bold text-blue-200/70">
                  <span>مستوى {level}</span>
                  <span>يتبقى {100 - xpInCurrentLevel}</span>
                </div>
              </div>

              {/* Streak */}
              <div className="relative flex h-24 w-24 shrink-0 flex-col items-center justify-center overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/20 p-3 shadow-inner">
                {streak >= 3 && (
                  <div className="absolute inset-0 animate-pulse bg-orange-500/20" />
                )}
                <Flame
                  className={`relative z-10 h-8 w-8 ${streak > 0 ? 'text-orange-500' : 'text-slate-500'}`}
                />
                <span className="relative z-10 mt-0.5 text-2xl font-black leading-none text-white">
                  {streak}
                </span>
                <span className="relative z-10 text-[10px] font-bold uppercase text-orange-200/80">
                  يوم متتالي
                </span>
              </div>
            </div>

            {/* Quick CTA */}
            <Link
              href="/student/practice"
              className="group/btn relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-white py-4 text-base font-black text-indigo-900 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] transition-all hover:scale-[1.03] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.5)] active:scale-95"
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-indigo-100/50 to-transparent group-hover/btn:animate-[shimmer_1.5s_infinite]" />
              <span className="relative flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-indigo-600" />
                ابدأ التدريب الآن
              </span>
            </Link>
          </div>
        </div>

        {/* Smart Recommendations Banner */}
        {(wrongAnswersCount ?? 0) > 0 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-rose-500/30 bg-rose-500/20 p-4 backdrop-blur-md sm:flex-row md:px-8">
            <div className="flex w-full items-center gap-4 text-center sm:w-auto sm:text-right">
              <div className="hidden rounded-2xl border border-rose-500/30 bg-rose-500/20 p-2.5 sm:flex">
                <AlertCircle className="h-5 w-5 text-rose-300" />
              </div>
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
              className="w-full shrink-0 rounded-xl bg-rose-500 px-6 py-3 text-center text-xs font-bold text-white shadow-lg shadow-rose-500/20 transition-all hover:-translate-y-0.5 hover:bg-rose-600 hover:shadow-rose-500/40 sm:w-auto"
            >
              راجع أخطاءك واكسب XP
            </Link>
          </div>
        )}
      </section>

      {/* ── VIP Promotional Banner & Subscription Status ────────────────── */}
      {subscription ? (
        <div className="relative mb-8 flex flex-col items-center justify-between gap-6 overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white shadow-xl shadow-emerald-500/20 transition-shadow hover:shadow-emerald-500/30 md:flex-row">
          <div className="absolute right-0 top-0 opacity-10 mix-blend-overlay">
            <Sparkles
              className="-mr-16 -mt-16 h-64 w-64 animate-pulse"
              style={{ animationDuration: '4s' }}
            />
          </div>
          <div className="relative z-10 flex-1 text-center md:text-right">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-4 py-1.5 text-xs font-bold shadow-sm backdrop-blur-sm">
              <Crown className="h-4 w-4 text-yellow-300" />
              أنت مشترك VIP
            </div>
            <h3 className="mb-2 text-2xl font-black tracking-tight md:text-3xl">
              باقتك الحالية: {(subscription.subscription_plans as any)?.name_ar}
            </h3>
            <p className="max-w-lg text-sm font-medium leading-relaxed text-emerald-50 opacity-95">
              صلاحية اشتراكك مستمرة حتى{' '}
              {new Date(subscription.end_date).toLocaleDateString('ar-EG')}.
              استمر في التفوق واستمتع بجميع مميزات المنصة!
            </p>
          </div>
        </div>
      ) : (
        <div className="relative mb-8 flex flex-col items-center justify-between gap-6 overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 text-white shadow-xl shadow-orange-500/20 transition-shadow hover:shadow-orange-500/30 md:flex-row">
          <div className="absolute right-0 top-0 opacity-10 mix-blend-overlay">
            <Star
              className="-mr-16 -mt-16 h-64 w-64 animate-pulse"
              style={{ animationDuration: '3s' }}
            />
          </div>
          <div className="relative z-10 flex-1 text-center md:text-right">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-4 py-1.5 text-xs font-bold shadow-sm backdrop-blur-sm">
              <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
              باقة VIP المميزة
            </div>
            <h3 className="mb-2 text-2xl font-black tracking-tight md:text-3xl">
              افتح جميع قدرات المنصة!
            </h3>
            <p className="max-w-lg text-sm font-medium leading-relaxed text-orange-50 opacity-95">
              اشترك الآن واستمتع باختبارات لا نهائية، تصحيح ذكي، وتقارير أداء
              مفصلة تضمن لك التفوق المطلق.
            </p>
          </div>
          <div className="relative z-10 w-full shrink-0 md:w-auto">
            <Link
              href="/student/premium"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-black text-orange-600 shadow-2xl transition-all hover:scale-105 hover:bg-orange-50 hover:shadow-white/30 active:scale-95"
            >
              <Crown className="h-5 w-5 text-orange-600" />
              اشترك وافتح المنصة
            </Link>
          </div>
        </div>
      )}

      {/* ── Quick Actions ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            href: '/student/practice',
            icon: Dumbbell,
            label: 'تدريب سريع',
            color: 'from-indigo-500 to-violet-600',
            shadow: 'shadow-indigo-200',
          },
          {
            href: '/student/challenges',
            icon: Swords,
            label: 'تحدي الآن',
            color: 'from-rose-500 to-pink-600',
            shadow: 'shadow-rose-200',
          },
          {
            href: '/student/leaderboard',
            icon: Trophy,
            label: 'لوحة الشرف',
            color: 'from-amber-500 to-orange-500',
            shadow: 'shadow-amber-200',
          },
          {
            href: '/student/exams',
            icon: Target,
            label: 'اختباراتي',
            color: 'from-emerald-500 to-teal-600',
            shadow: 'shadow-emerald-200',
          },
        ].map(({ href, icon: Icon, label, color, shadow }) => (
          <Link
            key={href}
            href={href}
            className={`relative overflow-hidden bg-gradient-to-br ${color} flex flex-col items-center gap-2 rounded-2xl p-4 text-white shadow-lg ${shadow} group/action transition-all duration-300 hover:-translate-y-1.5 hover:scale-105 hover:shadow-2xl active:scale-95`}
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover/action:opacity-100" />
            <Icon className="mb-1 h-7 w-7" />
            <span className="text-xs font-bold">{label}</span>
          </Link>
        ))}
      </div>

      {/* ── Main grid ───────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Charts + Exams */}
        <div className="space-y-6 lg:col-span-2">
          {/* Bloom's Taxonomy Progress */}
          {bloomStats && bloomStats.length > 0 && (
            <div className="relative overflow-hidden rounded-3xl border border-border bg-white p-6 shadow-sm">
              <div className="absolute right-0 top-0 p-4 opacity-5">
                <Layers className="h-24 w-24" />
              </div>
              <div className="relative">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 text-lg font-bold">
                      <Target className="h-5 w-5 text-primary" />
                      رادار المهارات المعرفية
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      تحليل مستوى ذكائك الدراسي بناءً على تصنيف بلوم
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {bloomStats.map((stat: any) => {
                    const config = bloomLabels[stat.bloom_level] || {
                      label: stat.bloom_level,
                      icon: Target,
                      color: 'bg-slate-500',
                    }
                    const Icon = config.icon
                    return (
                      <div
                        key={stat.bloom_level}
                        className="group relative rounded-2xl border border-slate-100 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
                      >
                        <div className="mb-3 flex items-center gap-3">
                          <div
                            className={`h-8 w-8 rounded-lg ${config.color} flex items-center justify-center shadow-sm`}
                          >
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-xs font-bold text-slate-700">
                            {config.label}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-end justify-between">
                            <span className="text-xl font-black text-slate-900">
                              {Math.round(stat.success_rate)}%
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground">
                              {stat.correct_answers}/{stat.total_answers}
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                            <div
                              className={`h-full ${config.color} rounded-full transition-all duration-1000`}
                              style={{ width: `${stat.success_rate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Performance Chart */}
          {performanceData.length > 0 && (
            <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">تحليل الأداء</h2>
                  <p className="text-xs text-muted-foreground">
                    آخر {performanceData.length} اختبارات
                  </p>
                </div>
                <div className="rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
                  تلقائي
                </div>
              </div>
              <PerformanceChart data={performanceData} />
            </div>
          )}

          {/* Practice + Errors nudge */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/student/practice"
              className="group relative overflow-hidden rounded-3xl border-2 border-indigo-100 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400 hover:shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100">
                  <Dumbbell className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-indigo-900">مركز التدريب</h3>
                  <p className="mt-0.5 text-xs text-indigo-700/70">
                    أسئلة مكيّفة بالذكاء الاصطناعي
                  </p>
                </div>
                <ArrowLeft className="h-5 w-5 text-indigo-300 transition-colors group-hover:text-indigo-600" />
              </div>
            </Link>

            <Link
              href="/student/practice/wrong-answers"
              className="group relative overflow-hidden rounded-3xl border-2 border-rose-100 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-rose-400 hover:shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 to-orange-50/50 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative flex items-center gap-4">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100">
                  <AlertCircle className="h-6 w-6 text-rose-600" />
                  {(wrongAnswersCount || 0) > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white">
                      {wrongAnswersCount}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-rose-900">راجع أخطاءك</h3>
                  <p className="mt-0.5 text-xs text-rose-700/70">
                    {(wrongAnswersCount || 0) > 0
                      ? `${wrongAnswersCount} سؤال ينتظر`
                      : 'ممتاز! لا أخطاء'}
                  </p>
                </div>
                <ArrowLeft className="h-5 w-5 text-rose-300 transition-colors group-hover:text-rose-600" />
              </div>
            </Link>
          </div>

          {/* Available Exams */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <Zap className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                الاختبارات المتاحة
              </h2>
              <Link
                href="/student/exams"
                className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                الكل <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
            </div>
            {availableExams && availableExams.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {availableExams.map((exam: any) => (
                  <Link
                    key={exam.id}
                    href={`/student/exams/${exam.id}/start`}
                    className="group rounded-2xl border border-border bg-white p-4 transition-all hover:border-primary/30 hover:shadow-md"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-2xl transition-transform group-hover:scale-110">
                        {exam.subjects?.icon || '📚'}
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        متاح
                      </span>
                    </div>
                    <h3 className="mb-1 line-clamp-1 text-sm font-bold transition-colors group-hover:text-primary">
                      {exam.title}
                    </h3>
                    <div className="flex items-center gap-3 text-[10px] font-medium text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {exam.duration_minutes} د
                      </span>
                      <span className="flex items-center gap-1">
                        <ClipboardList className="h-3 w-3" />
                        {exam.questions_count} سؤال
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-primary/20 bg-white p-10 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <BrainCircuit className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 font-bold text-slate-800">
                  لا توجد اختبارات مدرسية حالياً
                </h3>
                <p className="mx-auto mb-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  بإمكانك دائماً إنشاء تدريب مخصص لك بالذكاء الاصطناعي واكتساب
                  نقاط الخبرة (XP) فوراً!
                </p>
                <Link
                  href="/student/practice"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-md shadow-primary/20 transition-transform hover:scale-105 hover:bg-primary/90"
                >
                  <Zap className="h-4 w-4 fill-white" />
                  أنشئ تدريباً ذكياً الآن
                </Link>
              </div>
            )}
          </div>
          {/* Teacher Groups Exams */}
          {groupIds.length > 0 ? (
            <div className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <Users className="h-5 w-5 text-indigo-500" />
                  اختبارات المعلمين (مجموعاتي)
                </h2>
                <Link
                  href="/student/join-group"
                  className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-50"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> انضمام لمجموعة
                </Link>
              </div>

              {groupExams && groupExams.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {groupExams.map((exam: any) => (
                    <Link
                      key={exam.id}
                      href={`/student/exams/${exam.id}/start`}
                      className="group rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 transition-all hover:border-indigo-300 hover:shadow-md"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-500 shadow-sm">
                          <FileText className="h-5 w-5" />
                        </div>
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                          خاص
                        </span>
                      </div>
                      <h3 className="mb-1 line-clamp-1 text-sm font-bold transition-colors group-hover:text-indigo-700">
                        {exam.title}
                      </h3>
                      <div className="mb-2 text-xs font-medium text-indigo-500">
                        {exam.student_groups?.name_ar}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-indigo-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {exam.duration_minutes} د
                        </span>
                        <span className="flex items-center gap-1">
                          <ClipboardList className="h-3 w-3" />
                          {exam.questions_count} سؤال
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/30 p-6 text-center">
                  <p className="text-sm font-medium text-indigo-400">
                    لا توجد اختبارات جديدة من معلميك حالياً.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="relative mt-8 flex flex-col items-center justify-between gap-6 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white shadow-lg sm:flex-row">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
              <div className="relative z-10">
                <h3 className="mb-1 flex items-center gap-2 text-xl font-black">
                  <Users className="h-5 w-5" />
                  هل لديك كود دعوة من معلمك؟
                </h3>
                <p className="text-sm font-medium text-indigo-100">
                  انضم لمجموعات المعلمين الخاصة بك لتصلك الواجبات والاختبارات
                  الحصرية.
                </p>
              </div>
              <Link
                href="/student/join-group"
                className="relative z-10 flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-indigo-600 shadow-md transition-all hover:bg-indigo-50 active:scale-95"
              >
                إدخال الكود <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Right: rank + challenges + recent */}
        <div className="space-y-4">
          {/* Leaderboard rank */}
          {rankData && (
            <div className="rounded-3xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <h3 className="font-bold text-amber-900">ترتيبك هذا الأسبوع</h3>
              </div>
              <div className="my-4 text-center text-5xl font-black text-amber-600">
                #{rankData.rank}
              </div>
              <div className="text-center text-sm font-medium text-amber-700">
                {rankData.weekly_xp} نقطة هذا الأسبوع
              </div>
              <Link
                href="/student/leaderboard"
                className="mt-4 block rounded-xl bg-amber-100 py-2 text-center text-xs font-bold text-amber-700 transition-colors hover:bg-amber-200"
              >
                عرض لوحة الشرف الكاملة
              </Link>
            </div>
          )}

          {/* Recent Challenges */}
          {challenges && challenges.length > 0 && (
            <div className="rounded-3xl border border-border bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-bold">
                  <Swords className="h-4 w-4 text-indigo-500" /> آخر تحدياتي
                </h3>
                <Link
                  href="/student/challenges"
                  className="text-xs font-bold text-primary hover:underline"
                >
                  تحدي جديد
                </Link>
              </div>
              <div className="space-y-2">
                {challenges.map((c: any) => {
                  const won = c.winner_id === profile.id
                  const draw = c.winner_id === null
                  return (
                    <div
                      key={c.id}
                      className={`flex items-center justify-between rounded-2xl p-3 ${won ? 'bg-emerald-50' : draw ? 'bg-slate-50' : 'bg-rose-50'}`}
                    >
                      <div className="text-sm font-bold">
                        {won ? '🏆 فوز' : draw ? '🤝 تعادل' : '😤 خسارة'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(c.subjects as any)?.name_ar}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Recent Results */}
          <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="text-sm font-bold">نشاطي الأخير</h3>
              <Link
                href="/student/results"
                className="text-xs font-bold text-primary hover:underline"
              >
                الكل
              </Link>
            </div>
            <div className="divide-y divide-border">
              {attempts && attempts.length > 0 ? (
                attempts.slice(0, 5).map((attempt: any) => (
                  <Link
                    key={attempt.id}
                    href={`/student/results/${attempt.id}`}
                    className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-lg">
                      {attempt.exams?.subjects?.icon || '📚'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold">
                        {attempt.exams?.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {attempt.exams?.subjects?.name_ar}
                      </p>
                    </div>
                    <div
                      className={`text-sm font-black ${attempt.is_passed ? 'text-emerald-600' : 'text-rose-500'}`}
                    >
                      {Math.round(attempt.percentage || 0)}%
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-8 text-center text-xs italic text-muted-foreground">
                  لا توجد محاولات بعد
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
