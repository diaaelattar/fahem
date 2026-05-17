import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import {
  ClipboardList, TrendingUp, Clock, Award, ArrowLeft,
  Zap, Sparkles, Dumbbell, AlertCircle, Swords, Trophy,
  Flame, Star, Target, Layers, Lightbulb, PenTool, Search, Gauge, BrainCircuit, Crown,
  Users, PlusCircle, FileText
} from 'lucide-react'
import PerformanceChart from '@/components/student/PerformanceChart'
import Link from 'next/link'

const LEVEL_NAMES: Record<number, string> = {
  1: 'مبتدئ', 2: 'متعلم', 3: 'متقدم', 4: 'محترف',
  5: 'خبير', 6: 'نخبة', 7: 'أسطورة', 8: 'بطل', 9: 'أمير', 10: 'ملك'
}

export default async function StudentDashboardPage() {
  const profile = await requireStudent()
  const supabase = createClient()

  const { data: student } = await supabase
    .from('students')
    .select('*, grades(name_ar)')
    .eq('id', profile.id)
    .single()

  // Daily Streak Logic
  const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD
  const lastActivityDate = student?.last_activity_date

  if (student && lastActivityDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA')
    let newStreak = 1
    let xpReward = 5

    if (lastActivityDate === yesterday) {
      newStreak = (student.streak_days || 0) + 1
      xpReward = 10
    }

    // Fire and forget updates
    supabase.from('students').update({
      streak_days: newStreak,
      last_activity_date: today,
      xp_points: (student.xp_points || 0) + xpReward
    }).eq('id', profile.id).then(() => {
      supabase.from('xp_transactions').insert({
        student_id: profile.id,
        amount: xpReward,
        reason: 'مكافأة الدخول اليومي 🔥'
      }).then()
    })

    // Optimistically update local variables for render
    student.streak_days = newStreak
    student.xp_points = (student.xp_points || 0) + xpReward
  }

  const { data: attempts } = await supabase
    .from('exam_attempts')
    .select('*, exams(title, total_points, passing_score, subjects(name_ar, icon))')
    .eq('student_id', profile.id)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(10)

  const { data: availableExams } = await supabase
    .from('exams')
    .select('id, title, duration_minutes, questions_count, total_points, subjects(name_ar, icon)')
    .eq('is_published', true)
    .eq('visibility', 'public')
    .eq('grade_id', student?.grade_id || 0)
    .limit(4)

  // Fetch student's groups
  const { data: studentGroups } = await supabase
    .from('group_students')
    .select('group_id, student_groups(name_ar)')
    .eq('student_id', profile.id)
    .eq('status', 'active')

  const groupIds = studentGroups?.map((g: any) => g.group_id) || []

  // Fetch exams from these groups
  const { data: groupExams } = groupIds.length > 0 ? await supabase
    .from('exams')
    .select('id, title, duration_minutes, questions_count, student_groups(name_ar)')
    .in('group_id', groupIds)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(4) : { data: [] }

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
    .single()

  // Recent challenges
  const { data: challenges } = await supabase
    .from('challenges')
    .select('id, status, winner_id, challenger_score, opponent_score, created_at, subjects(name_ar)')
    .or(`challenger_id.eq.${profile.id},opponent_id.eq.${profile.id}`)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(3)

  // Fetch active subscription
  const { data: subscription } = await supabase
    .from('student_subscriptions')
    .select('*, subscription_plans(name_ar)')
    .eq('student_id', profile.id)
    .eq('status', 'active')
    .gte('end_date', new Date().toISOString())
    .order('end_date', { ascending: false })
    .limit(1)
    .single()

  // Fetch Bloom's Taxonomy Stats
  const { data: bloomStats } = await (supabase.rpc as any)('get_student_bloom_stats', { p_student_id: profile.id })

  const bloomLabels: Record<string, { label: string; icon: any; color: string }> = {
    remember: { label: 'تذكر', icon: Lightbulb, color: 'bg-blue-500' },
    understand: { label: 'فهم', icon: BrainCircuit, color: 'bg-emerald-500' },
    apply: { label: 'تطبيق', icon: PenTool, color: 'bg-amber-500' },
    analyze: { label: 'تحليل', icon: Search, color: 'bg-purple-500' },
    evaluate: { label: 'تقييم', icon: Gauge, color: 'bg-rose-500' },
    create: { label: 'إبداع', icon: Sparkles, color: 'bg-indigo-500' }
  }

  const totalAttempts = attempts?.length || 0
  const avgScore = attempts && attempts.length > 0
    ? Math.round(attempts.reduce((acc: number, a: any) => acc + (a.percentage || 0), 0) / attempts.length)
    : 0
  const passedCount = attempts?.filter((a: any) => a.is_passed).length || 0

  const xp = student?.xp_points || 0
  const level = student?.level || 1
  const streak = student?.streak_days || 0
  const xpInCurrentLevel = xp % 100
  const xpProgress = Math.round((xpInCurrentLevel / 100) * 100)

  const performanceData = attempts?.slice(0, 7).map((a: any) => ({
    date: new Date(a.completed_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }),
    score: Math.round(a.percentage || 0),
    title: a.exams?.title
  })) || []

  return (
    <div className="space-y-6 pb-24 md:pb-12 animate-fade-in">

      {/* ── 🌟 NEW HERO LANDSCAPE ─────────────────────────────────────────── */}
      <section className="relative rounded-[2.5rem] bg-slate-900 overflow-hidden shadow-2xl shadow-indigo-900/20 mb-8 group">
        {/* Animated Background Gradients & Glassmorphism */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-700 to-slate-900 opacity-90" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-fuchsia-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />

        <div className="relative p-8 md:p-12 flex flex-col lg:flex-row items-center gap-8 lg:gap-12 backdrop-blur-sm">
          
          {/* Avatar & Welcome */}
          <div className="flex-1 flex flex-col md:flex-row items-center md:items-start text-center md:text-right gap-6 w-full">
            <div className="relative shrink-0 mt-4 md:mt-0">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full blur-xl opacity-60 animate-pulse" />
              <img
                src={profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.full_name}`}
                alt={profile.full_name}
                className="relative w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-white/20 object-cover shadow-2xl z-10"
              />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-[11px] font-black px-5 py-1.5 rounded-full shadow-lg shadow-amber-900/50 border border-yellow-300/30 whitespace-nowrap z-20">
                مستوى {level}
              </div>
            </div>

            <div className="text-white space-y-3 pt-2">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold text-blue-100 backdrop-blur-md shadow-sm">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                {LEVEL_NAMES[level] || 'بطل'} • {(student?.grades as any)?.name_ar || 'الصف الدراسي'}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tight drop-shadow-xl text-transparent bg-clip-text bg-gradient-to-b from-white to-white/80">
                مرحباً، {profile.full_name.split(' ')[0]}!
              </h1>
              <p className="text-blue-100/90 text-sm md:text-base font-medium max-w-md leading-relaxed">
                مستقبلك يبدأ من هنا. استمر في التدريب يومياً لتحطيم أرقامك القياسية والوصول إلى القمة!
              </p>
            </div>
          </div>

          {/* Core Stats & CTA Panel */}
          <div className="w-full lg:w-96 shrink-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-7 shadow-2xl flex flex-col gap-6 relative z-10 hover:bg-white/[0.12] transition-colors">
            {/* XP & Streak Row */}
            <div className="flex justify-between items-center gap-6">
               {/* XP Progress */}
               <div className="flex-1">
                 <div className="flex justify-between items-end mb-2">
                   <span className="text-xs font-bold text-blue-200">نقاطك (XP)</span>
                   <span className="text-2xl font-black text-yellow-400 drop-shadow-sm">{xp}</span>
                 </div>
                 <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-white/10 shadow-inner">
                   <div 
                     className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-rose-500 rounded-full relative transition-all duration-1000" 
                     style={{ width: `${Math.max(5, xpProgress)}%` }}
                   >
                     <div className="absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-l from-white/40 to-transparent" />
                   </div>
                 </div>
                 <div className="flex justify-between text-[10px] text-blue-200/70 mt-2 font-mono font-bold">
                   <span>مستوى {level}</span>
                   <span>يتبقى {100 - xpInCurrentLevel}</span>
                 </div>
               </div>

               {/* Streak */}
               <div className="shrink-0 flex flex-col items-center justify-center bg-black/20 rounded-[1.25rem] p-3 border border-white/10 w-24 h-24 shadow-inner relative overflow-hidden">
                 {streak >= 3 && <div className="absolute inset-0 bg-orange-500/20 animate-pulse" />}
                 <Flame className={`w-8 h-8 relative z-10 ${streak > 0 ? 'text-orange-500' : 'text-slate-500'}`} />
                 <span className="font-black text-2xl text-white mt-0.5 leading-none relative z-10">{streak}</span>
                 <span className="text-[10px] font-bold text-orange-200/80 uppercase relative z-10">يوم متتالي</span>
               </div>
            </div>

            {/* Quick CTA */}
            <Link 
              href="/student/practice" 
              className="group/btn relative flex items-center justify-center w-full py-4 rounded-2xl bg-white text-indigo-900 font-black text-base transition-all hover:scale-[1.03] active:scale-95 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.5)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-100/50 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
              <span className="relative flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-indigo-600" />
                ابدأ التدريب الآن
              </span>
            </Link>
          </div>
        </div>

        {/* Smart Recommendations Banner */}
        {(wrongAnswersCount ?? 0) > 0 && (
          <div className="bg-rose-500/20 backdrop-blur-md border-t border-rose-500/30 p-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-4 text-center sm:text-right w-full sm:w-auto">
                <div className="hidden sm:flex bg-rose-500/20 p-2.5 rounded-2xl border border-rose-500/30">
                  <AlertCircle className="w-5 h-5 text-rose-300" />
                </div>
                <div>
                  <h4 className="text-rose-100 font-bold text-sm">💡 توصية ذكية من النظام</h4>
                  <p className="text-rose-200/80 text-xs mt-0.5">لديك <strong className="text-white">{wrongAnswersCount} أسئلة</strong> أخطأت فيها مسبقاً. مراجعتها الآن سيضاعف نقاطك!</p>
                </div>
             </div>
             <Link href="/student/practice?mode=mistakes" className="w-full sm:w-auto text-center shrink-0 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 hover:-translate-y-0.5">
               راجع أخطاءك واكسب XP
             </Link>
          </div>
        )}
      </section>

      {/* ── VIP Promotional Banner & Subscription Status ────────────────── */}
      {subscription ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white shadow-xl shadow-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-6 mb-8 hover:shadow-emerald-500/30 transition-shadow">
          <div className="absolute right-0 top-0 opacity-10 mix-blend-overlay">
            <Sparkles className="w-64 h-64 -mr-16 -mt-16 animate-pulse" style={{ animationDuration: '4s' }} />
          </div>
          <div className="relative z-10 flex-1 text-center md:text-right">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5 text-xs font-bold mb-3 shadow-sm">
              <Crown className="w-4 h-4 text-yellow-300" />
              أنت مشترك VIP
            </div>
            <h3 className="text-2xl md:text-3xl font-black mb-2 tracking-tight">باقتك الحالية: {(subscription.subscription_plans as any)?.name_ar}</h3>
            <p className="text-emerald-50 text-sm opacity-95 max-w-lg leading-relaxed font-medium">
              صلاحية اشتراكك مستمرة حتى {new Date(subscription.end_date).toLocaleDateString('ar-EG')}. استمر في التفوق واستمتع بجميع مميزات المنصة!
            </p>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 text-white shadow-xl shadow-orange-500/20 flex flex-col md:flex-row items-center justify-between gap-6 mb-8 hover:shadow-orange-500/30 transition-shadow">
          <div className="absolute right-0 top-0 opacity-10 mix-blend-overlay">
            <Star className="w-64 h-64 -mr-16 -mt-16 animate-pulse" style={{ animationDuration: '3s' }} />
          </div>
          <div className="relative z-10 flex-1 text-center md:text-right">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5 text-xs font-bold mb-3 shadow-sm">
              <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
              باقة VIP المميزة
            </div>
            <h3 className="text-2xl md:text-3xl font-black mb-2 tracking-tight">افتح جميع قدرات المنصة!</h3>
            <p className="text-orange-50 text-sm opacity-95 max-w-lg leading-relaxed font-medium">
              اشترك الآن واستمتع باختبارات لا نهائية، تصحيح ذكي، وتقارير أداء مفصلة تضمن لك التفوق المطلق.
            </p>
          </div>
          <div className="relative z-10 shrink-0 w-full md:w-auto">
            <Link 
              href="/student/premium"
              className="flex items-center justify-center gap-2 w-full bg-white text-orange-600 px-8 py-4 rounded-2xl font-black text-sm hover:bg-orange-50 transition-all shadow-2xl hover:shadow-white/30 hover:scale-105 active:scale-95"
            >
              <Crown className="w-5 h-5 text-orange-600" />
              اشترك وافتح المنصة
            </Link>
          </div>
        </div>
      )}

      {/* ── Quick Actions ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/student/practice',    icon: Dumbbell, label: 'تدريب سريع',   color: 'from-indigo-500 to-violet-600',  shadow: 'shadow-indigo-200' },
          { href: '/student/challenges',  icon: Swords,   label: 'تحدي الآن',    color: 'from-rose-500 to-pink-600',      shadow: 'shadow-rose-200' },
          { href: '/student/leaderboard', icon: Trophy,   label: 'لوحة الشرف',   color: 'from-amber-500 to-orange-500',   shadow: 'shadow-amber-200' },
          { href: '/student/exams',       icon: Target,   label: 'اختباراتي',    color: 'from-emerald-500 to-teal-600',   shadow: 'shadow-emerald-200' },
        ].map(({ href, icon: Icon, label, color, shadow }) => (
          <Link key={href} href={href}
            className={`relative overflow-hidden bg-gradient-to-br ${color} rounded-2xl p-4 text-white flex flex-col items-center gap-2 shadow-lg ${shadow} hover:-translate-y-1.5 hover:shadow-2xl hover:scale-105 transition-all duration-300 active:scale-95 group/action`}>
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/action:opacity-100 transition-opacity" />
            <Icon className="w-7 h-7 mb-1" />
            <span className="text-xs font-bold">{label}</span>
          </Link>
        ))}
      </div>

      {/* ── Main grid ───────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left: Charts + Exams */}
        <div className="lg:col-span-2 space-y-6">

          {/* Bloom's Taxonomy Progress */}
          {bloomStats && bloomStats.length > 0 && (
            <div className="bg-white rounded-3xl border border-border p-6 shadow-sm overflow-hidden relative">
               <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Layers className="w-24 h-24" />
               </div>
               <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        رادار المهارات المعرفية
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">تحليل مستوى ذكائك الدراسي بناءً على تصنيف بلوم</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {bloomStats.map((stat: any) => {
                      const config = bloomLabels[stat.bloom_level] || { label: stat.bloom_level, icon: Target, color: 'bg-slate-500' }
                      const Icon = config.icon
                      return (
                        <div key={stat.bloom_level} className="bg-white rounded-2xl p-4 border border-slate-100 relative group hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-8 h-8 rounded-lg ${config.color} flex items-center justify-center shadow-sm`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-xs font-bold text-slate-700">{config.label}</span>
                          </div>
                          
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-end">
                              <span className="text-xl font-black text-slate-900">{Math.round(stat.success_rate)}%</span>
                              <span className="text-[10px] text-muted-foreground font-bold">{stat.correct_answers}/{stat.total_answers}</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
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
            <div className="bg-white rounded-3xl border border-border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold">تحليل الأداء</h2>
                  <p className="text-xs text-muted-foreground">آخر {performanceData.length} اختبارات</p>
                </div>
                <div className="text-xs font-bold text-primary bg-primary/5 border border-primary/10 px-3 py-1 rounded-full">
                  تلقائي
                </div>
              </div>
              <PerformanceChart data={performanceData} />
            </div>
          )}

          {/* Practice + Errors nudge */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/student/practice"
              className="group relative overflow-hidden rounded-3xl border-2 border-indigo-100 bg-white p-5 hover:border-indigo-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
                  <Dumbbell className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-indigo-900">مركز التدريب</h3>
                  <p className="text-xs text-indigo-700/70 mt-0.5">أسئلة مكيّفة بالذكاء الاصطناعي</p>
                </div>
                <ArrowLeft className="w-5 h-5 text-indigo-300 group-hover:text-indigo-600 transition-colors" />
              </div>
            </Link>

            <Link href="/student/practice/wrong-answers"
              className="group relative overflow-hidden rounded-3xl border-2 border-rose-100 bg-white p-5 hover:border-rose-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 to-orange-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6 text-rose-600" />
                  {(wrongAnswersCount || 0) > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                      {wrongAnswersCount}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-rose-900">راجع أخطاءك</h3>
                  <p className="text-xs text-rose-700/70 mt-0.5">
                    {(wrongAnswersCount || 0) > 0 ? `${wrongAnswersCount} سؤال ينتظر` : 'ممتاز! لا أخطاء'}
                  </p>
                </div>
                <ArrowLeft className="w-5 h-5 text-rose-300 group-hover:text-rose-600 transition-colors" />
              </div>
            </Link>
          </div>

          {/* Available Exams */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                الاختبارات المتاحة
              </h2>
              <Link href="/student/exams" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                الكل <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </div>
            {availableExams && availableExams.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {availableExams.map((exam: any) => (
                  <Link key={exam.id} href={`/student/exams/${exam.id}/start`}
                    className="bg-white rounded-2xl border border-border p-4 hover:border-primary/30 hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        {exam.subjects?.icon || '📚'}
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">متاح</span>
                    </div>
                    <h3 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors line-clamp-1">{exam.title}</h3>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{exam.duration_minutes} د</span>
                      <span className="flex items-center gap-1"><ClipboardList className="w-3 h-3" />{exam.questions_count} سؤال</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-primary/20 p-10 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BrainCircuit className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">لا توجد اختبارات مدرسية حالياً</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto leading-relaxed">
                  بإمكانك دائماً إنشاء تدريب مخصص لك بالذكاء الاصطناعي واكتساب نقاط الخبرة (XP) فوراً!
                </p>
                <Link href="/student/practice"
                  className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-xl inline-flex items-center gap-2 transition-transform hover:scale-105 shadow-md shadow-primary/20">
                  <Zap className="w-4 h-4 fill-white" />
                  أنشئ تدريباً ذكياً الآن
                </Link>
              </div>
            )}
          </div>
          {/* Teacher Groups Exams */}
          {groupIds.length > 0 ? (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" />
                  اختبارات المعلمين (مجموعاتي)
                </h2>
                <Link href="/student/join-group" className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1">
                  <PlusCircle className="w-3.5 h-3.5" /> انضمام لمجموعة
                </Link>
              </div>
              
              {groupExams && groupExams.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {groupExams.map((exam: any) => (
                    <Link key={exam.id} href={`/student/exams/${exam.id}/start`}
                      className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-4 hover:border-indigo-300 hover:shadow-md transition-all group">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-500 shadow-sm">
                          <FileText className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">خاص</span>
                      </div>
                      <h3 className="font-bold text-sm mb-1 group-hover:text-indigo-700 transition-colors line-clamp-1">{exam.title}</h3>
                      <div className="text-xs text-indigo-500 mb-2 font-medium">{exam.student_groups?.name_ar}</div>
                      <div className="flex items-center gap-3 text-[10px] text-indigo-400 font-bold">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{exam.duration_minutes} د</span>
                        <span className="flex items-center gap-1"><ClipboardList className="w-3 h-3" />{exam.questions_count} سؤال</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-indigo-50/30 rounded-2xl border border-dashed border-indigo-200 p-6 text-center">
                  <p className="text-indigo-400 text-sm font-medium">لا توجد اختبارات جديدة من معلميك حالياً.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
              <div className="relative z-10">
                <h3 className="text-xl font-black mb-1 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  هل لديك كود دعوة من معلمك؟
                </h3>
                <p className="text-indigo-100 text-sm font-medium">انضم لمجموعات المعلمين الخاصة بك لتصلك الواجبات والاختبارات الحصرية.</p>
              </div>
              <Link href="/student/join-group" className="relative z-10 shrink-0 bg-white text-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md active:scale-95">
                إدخال الكود <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Right: rank + challenges + recent */}
        <div className="space-y-4">

          {/* Leaderboard rank */}
          {rankData && (
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-amber-900">ترتيبك هذا الأسبوع</h3>
              </div>
              <div className="text-5xl font-black text-amber-600 text-center my-4">
                #{rankData.rank}
              </div>
              <div className="text-center text-sm text-amber-700 font-medium">
                {rankData.weekly_xp} نقطة هذا الأسبوع
              </div>
              <Link href="/student/leaderboard"
                className="block mt-4 text-center text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-xl py-2 transition-colors">
                عرض لوحة الشرف الكاملة
              </Link>
            </div>
          )}

          {/* Recent Challenges */}
          {challenges && challenges.length > 0 && (
            <div className="bg-white rounded-3xl border border-border p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold flex items-center gap-2">
                  <Swords className="w-4 h-4 text-indigo-500" /> آخر تحدياتي
                </h3>
                <Link href="/student/challenges" className="text-xs text-primary font-bold hover:underline">تحدي جديد</Link>
              </div>
              <div className="space-y-2">
                {challenges.map((c: any) => {
                  const won = c.winner_id === profile.id
                  const draw = c.winner_id === null
                  return (
                    <div key={c.id} className={`flex items-center justify-between p-3 rounded-2xl
                      ${won ? 'bg-emerald-50' : draw ? 'bg-slate-50' : 'bg-rose-50'}`}>
                      <div className="text-sm font-bold">
                        {won ? '🏆 فوز' : draw ? '🤝 تعادل' : '😤 خسارة'}
                      </div>
                      <div className="text-xs text-muted-foreground">{(c.subjects as any)?.name_ar}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Recent Results */}
          <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-sm">نشاطي الأخير</h3>
              <Link href="/student/results" className="text-xs text-primary font-bold hover:underline">الكل</Link>
            </div>
            <div className="divide-y divide-border">
              {attempts && attempts.length > 0 ? attempts.slice(0, 5).map((attempt: any) => (
                <Link key={attempt.id} href={`/student/results/${attempt.id}`}
                  className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-lg shrink-0">
                    {attempt.exams?.subjects?.icon || '📚'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{attempt.exams?.title}</p>
                    <p className="text-[10px] text-muted-foreground">{attempt.exams?.subjects?.name_ar}</p>
                  </div>
                  <div className={`text-sm font-black ${attempt.is_passed ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {Math.round(attempt.percentage || 0)}%
                  </div>
                </Link>
              )) : (
                <div className="text-center py-8 text-xs text-muted-foreground italic">
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
