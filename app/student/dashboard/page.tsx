import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import {
  ClipboardList, TrendingUp, Clock, Award, ArrowLeft,
  Zap, Sparkles, Dumbbell, AlertCircle, Swords, Trophy,
  Flame, Star, Target, Layers, Lightbulb, PenTool, Search, Gauge, BrainCircuit
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
    .eq('grade_id', student?.grade_id || 0)
    .limit(4)

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

      {/* ── Hero Welcome ─────────────────────────────────────────── */}
      <section className="relative rounded-3xl bg-gradient-to-br from-primary via-blue-700 to-indigo-800 overflow-hidden shadow-2xl shadow-primary/30 p-6 text-white">
        <div className="absolute inset-0 opacity-10 bg-[url('/grid.svg')]" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-200 text-xs font-bold mb-2 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              أهلاً بك في منصتك
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-1">
              مرحباً، {profile.full_name.split(' ')[0]}!
            </h1>
            <p className="text-blue-200 text-sm">
              {(student?.grades as any)?.name_ar || 'الصف الدراسي'}
            </p>
          </div>
          {/* Avatar */}
          <img
            src={profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.full_name}`}
            alt={profile.full_name}
            className="w-16 h-16 rounded-2xl border-2 border-white/30 object-cover shrink-0"
          />
        </div>

        {/* Stats row */}
        <div className="relative mt-5 grid grid-cols-3 gap-3">
          {[
            { v: totalAttempts, l: 'اختبارات' },
            { v: `${avgScore}%`, l: 'متوسط' },
            { v: passedCount, l: 'ناجح' },
          ].map(s => (
            <div key={s.l} className="bg-white/10 backdrop-blur rounded-2xl p-3 text-center border border-white/20">
              <div className="text-2xl font-black text-yellow-300">{s.v}</div>
              <div className="text-[10px] text-blue-200">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── XP & Level Card ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* XP Progress */}
        <div className="sm:col-span-2 bg-white rounded-3xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-md shadow-yellow-200">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-black text-base">المستوى {level}</p>
                <p className="text-xs text-muted-foreground">{LEVEL_NAMES[level] || 'بطل'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-black text-xl text-primary">{xp} XP</p>
              <p className="text-xs text-muted-foreground">{100 - xpInCurrentLevel} للمستوى القادم</p>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-700"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 font-bold">
            <span>المستوى {level}</span>
            <span>{xpInCurrentLevel}/100</span>
            <span>المستوى {level + 1}</span>
          </div>
        </div>

        {/* Streak */}
        <div className={`bg-white rounded-3xl border p-5 shadow-sm flex flex-col items-center justify-center gap-2 text-center
          ${streak >= 3 ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50' : 'border-border'}`}>
          <div className={`text-4xl ${streak >= 3 ? 'animate-bounce' : ''}`}>
            {streak >= 7 ? '🔥' : streak >= 3 ? '⚡' : '📅'}
          </div>
          <div className="font-black text-3xl text-amber-600">{streak}</div>
          <div className="text-xs text-muted-foreground font-medium">يوم متتالي</div>
          {streak >= 3 && (
            <div className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
              استمر! 🎯
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/student/practice',    icon: Dumbbell, label: 'تدريب سريع',   color: 'from-indigo-500 to-violet-600',  shadow: 'shadow-indigo-200' },
          { href: '/student/challenges',  icon: Swords,   label: 'تحدي الآن',    color: 'from-rose-500 to-pink-600',      shadow: 'shadow-rose-200' },
          { href: '/student/leaderboard', icon: Trophy,   label: 'لوحة الشرف',   color: 'from-amber-500 to-orange-500',   shadow: 'shadow-amber-200' },
          { href: '/student/exams',       icon: Target,   label: 'اختباراتي',    color: 'from-emerald-500 to-teal-600',   shadow: 'shadow-emerald-200' },
        ].map(({ href, icon: Icon, label, color, shadow }) => (
          <Link key={href} href={href}
            className={`bg-gradient-to-br ${color} rounded-2xl p-4 text-white flex flex-col items-center gap-2 shadow-lg ${shadow} hover:scale-105 transition-transform active:scale-95`}>
            <Icon className="w-6 h-6" />
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
                        <div key={stat.bloom_level} className="bg-slate-50 rounded-2xl p-4 border border-border/50 relative group hover:border-primary/30 transition-colors">
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
              className="group rounded-3xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-5 hover:border-indigo-400 hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
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
              className="group rounded-3xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50 p-5 hover:border-rose-400 hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
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
              <div className="bg-white rounded-2xl border border-dashed border-border p-10 text-center">
                <ClipboardList className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm font-medium">لا توجد اختبارات متاحة حالياً</p>
              </div>
            )}
          </div>
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
