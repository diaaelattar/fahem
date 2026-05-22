// app/student/achievements/page.tsx
// صفحة الإنجازات — Server Component

import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/permissions'
import { Award, Lock } from 'lucide-react'

const ALL_ACHIEVEMENTS = [
  {
    code: 'first_exam',
    icon: '🎓',
    title: 'الخطوة الأولى',
    desc: 'أكمل اختبارك الأول',
    color: 'from-blue-50 to-sky-50 border-blue-200',
    iconBg: 'bg-blue-100',
  },
  {
    code: 'first_pass',
    icon: '✅',
    title: 'ناجح!',
    desc: 'انجح في اختبارك الأول',
    color: 'from-green-50 to-emerald-50 border-green-200',
    iconBg: 'bg-green-100',
  },
  {
    code: 'five_exams',
    icon: '📚',
    title: 'المثابر',
    desc: 'أكمل 5 اختبارات',
    color: 'from-purple-50 to-violet-50 border-purple-200',
    iconBg: 'bg-purple-100',
  },
  {
    code: 'perfect_score',
    icon: '⭐',
    title: 'النجم الذهبي',
    desc: 'احصل على 100% في أي اختبار',
    color: 'from-yellow-50 to-amber-50 border-yellow-300',
    iconBg: 'bg-yellow-100',
  },
  {
    code: 'high_score',
    icon: '🏆',
    title: 'المتفوق',
    desc: 'احصل على 90% أو أكثر في 3 اختبارات',
    color: 'from-amber-50 to-orange-50 border-amber-200',
    iconBg: 'bg-amber-100',
  },
  {
    code: 'practice_10',
    icon: '💪',
    title: 'المتدرب',
    desc: 'أجب على 10 أسئلة في مركز التدريب',
    color: 'from-indigo-50 to-blue-50 border-indigo-200',
    iconBg: 'bg-indigo-100',
  },
  {
    code: 'wrong_review_5',
    icon: '🔄',
    title: 'المراجع الذكي',
    desc: 'راجع 5 إجابات خاطئة حتى إتقانها',
    color: 'from-rose-50 to-pink-50 border-rose-200',
    iconBg: 'bg-rose-100',
  },
  {
    code: 'streak_3',
    icon: '🔥',
    title: 'سلسلة النار',
    desc: 'أجب على 3 أسئلة متتالية بشكل صحيح في التدريب',
    color: 'from-orange-50 to-red-50 border-orange-200',
    iconBg: 'bg-orange-100',
  },
]

export default async function AchievementsPage() {
  const profile = await requireStudent()
  const supabase = await createClient()

  // جلب الإنجازات المكتسبة
  const { data: earned } = await supabase
    .from('student_achievements')
    .select('achievement_code, earned_at')
    .eq('student_id', profile.id)

  const earnedCodes = new Set(earned?.map((a: any) => a.achievement_code) || [])
  const earnedMap = Object.fromEntries(earned?.map((a: any) => [a.achievement_code, a.earned_at]) || [])

  // إحصائيات
  const { data: attempts } = await supabase
    .from('exam_attempts')
    .select('percentage, is_passed')
    .eq('student_id', profile.id)
    .not('completed_at', 'is', null)

  const { count: masteredCount } = await supabase
    .from('wrong_answers_bank')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', profile.id)
    .eq('is_mastered', true)

  const { count: practiceTotal } = await supabase
    .from('practice_sessions')
    .select('total', { count: 'exact', head: true })
    .eq('student_id', profile.id)
    .not('completed_at', 'is', null)

  // التحقق وتوزيع الإنجازات تلقائياً (server-side check)
  const toAward: string[] = []
  if (attempts && attempts.length >= 1 && !earnedCodes.has('first_exam')) toAward.push('first_exam')
  if (attempts?.some((a: any) => a.is_passed) && !earnedCodes.has('first_pass')) toAward.push('first_pass')
  if (attempts && attempts.length >= 5 && !earnedCodes.has('five_exams')) toAward.push('five_exams')
  if (attempts?.some((a: any) => a.percentage >= 100) && !earnedCodes.has('perfect_score')) toAward.push('perfect_score')
  if ((attempts?.filter((a: any) => a.percentage >= 90) ?? []).length >= 3 && !earnedCodes.has('high_score')) toAward.push('high_score')
  if ((masteredCount || 0) >= 5 && !earnedCodes.has('wrong_review_5')) toAward.push('wrong_review_5')

  if (toAward.length > 0) {
    await supabase.from('student_achievements').insert(
      toAward.map(code => ({ student_id: profile.id, achievement_code: code }))
    )
    toAward.forEach(code => earnedCodes.add(code))
  }

  const earnedCount = earnedCodes.size
  const totalCount = ALL_ACHIEVEMENTS.length

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Award className="w-8 h-8 text-amber-500" />
          إنجازاتي
        </h1>
        <p className="text-muted-foreground mt-1">
          اكتسبت <strong className="text-foreground">{earnedCount}</strong> من أصل {totalCount} إنجاز
        </p>
      </div>

      {/* Progress */}
      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold">مستوى الإنجاز الكلي</span>
          <span className="text-sm font-bold text-primary">{Math.round((earnedCount / totalCount) * 100)}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700"
            style={{ width: `${(earnedCount / totalCount) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>مبتدئ</span>
          <span>محترف</span>
          <span>خبير</span>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {ALL_ACHIEVEMENTS.map(achievement => {
          const isEarned = earnedCodes.has(achievement.code)
          const earnedAt = earnedMap[achievement.code]
          return (
            <div key={achievement.code}
              className={`relative rounded-3xl border-2 p-6 transition-all ${
                isEarned
                  ? `bg-gradient-to-br ${achievement.color} shadow-sm hover:shadow-md`
                  : 'bg-muted/30 border-border/50 opacity-60 grayscale'
              }`}>
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-sm ${
                  isEarned ? achievement.iconBg : 'bg-muted'
                }`}>
                  {isEarned ? achievement.icon : <Lock className="w-6 h-6 text-muted-foreground" />}
                </div>
                <div>
                  <h3 className={`font-bold text-base mb-1 ${isEarned ? '' : 'text-muted-foreground'}`}>
                    {achievement.title}
                  </h3>
                  <p className={`text-xs leading-relaxed ${isEarned ? 'text-foreground/70' : 'text-muted-foreground/60'}`}>
                    {achievement.desc}
                  </p>
                  {isEarned && earnedAt && (
                    <p className="text-[10px] font-bold text-muted-foreground mt-2">
                      ✓ {new Date(earnedAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
              {isEarned && (
                <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow">
                  <span className="text-white text-[10px] font-black">✓</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Motivation */}
      {earnedCount < totalCount && (
        <div className="card-premium p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <h3 className="font-bold text-amber-900 mb-1">ماذا تبقّى؟</h3>
          <p className="text-sm text-amber-700/80">
            تبقّى لك {totalCount - earnedCount} إنجازات. استمر في الاختبارات والتدريب لاكتسابها!
          </p>
        </div>
      )}
    </div>
  )
}
