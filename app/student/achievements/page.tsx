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
  const earnedMap = Object.fromEntries(
    earned?.map((a: any) => [a.achievement_code, a.earned_at]) || []
  )

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
  if (attempts && attempts.length >= 1 && !earnedCodes.has('first_exam'))
    toAward.push('first_exam')
  if (attempts?.some((a: any) => a.is_passed) && !earnedCodes.has('first_pass'))
    toAward.push('first_pass')
  if (attempts && attempts.length >= 5 && !earnedCodes.has('five_exams'))
    toAward.push('five_exams')
  if (
    attempts?.some((a: any) => a.percentage >= 100) &&
    !earnedCodes.has('perfect_score')
  )
    toAward.push('perfect_score')
  if (
    (attempts?.filter((a: any) => a.percentage >= 90) ?? []).length >= 3 &&
    !earnedCodes.has('high_score')
  )
    toAward.push('high_score')
  if ((masteredCount || 0) >= 5 && !earnedCodes.has('wrong_review_5'))
    toAward.push('wrong_review_5')

  if (toAward.length > 0) {
    await supabase
      .from('student_achievements')
      .insert(
        toAward.map((code) => ({
          student_id: profile.id,
          achievement_code: code,
        }))
      )
    toAward.forEach((code) => earnedCodes.add(code))
  }

  const earnedCount = earnedCodes.size
  const totalCount = ALL_ACHIEVEMENTS.length

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-bold">
          <Award className="h-8 w-8 text-amber-500" />
          إنجازاتي
        </h1>
        <p className="mt-1 text-muted-foreground">
          اكتسبت <strong className="text-foreground">{earnedCount}</strong> من
          أصل {totalCount} إنجاز
        </p>
      </div>

      {/* Progress */}
      <div className="card-premium p-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-bold">مستوى الإنجاز الكلي</span>
          <span className="text-sm font-bold text-primary">
            {Math.round((earnedCount / totalCount) * 100)}%
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700"
            style={{ width: `${(earnedCount / totalCount) * 100}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>مبتدئ</span>
          <span>محترف</span>
          <span>خبير</span>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ALL_ACHIEVEMENTS.map((achievement) => {
          const isEarned = earnedCodes.has(achievement.code)
          const earnedAt = earnedMap[achievement.code]
          return (
            <div
              key={achievement.code}
              className={`relative rounded-3xl border-2 p-6 transition-all ${
                isEarned
                  ? `bg-gradient-to-br ${achievement.color} shadow-sm hover:shadow-md`
                  : 'border-border/50 bg-muted/30 opacity-60 grayscale'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-sm ${
                    isEarned ? achievement.iconBg : 'bg-muted'
                  }`}
                >
                  {isEarned ? (
                    achievement.icon
                  ) : (
                    <Lock className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3
                    className={`mb-1 text-base font-bold ${isEarned ? '' : 'text-muted-foreground'}`}
                  >
                    {achievement.title}
                  </h3>
                  <p
                    className={`text-xs leading-relaxed ${isEarned ? 'text-foreground/70' : 'text-muted-foreground/60'}`}
                  >
                    {achievement.desc}
                  </p>
                  {isEarned && earnedAt && (
                    <p className="mt-2 text-[10px] font-bold text-muted-foreground">
                      ✓{' '}
                      {new Date(earnedAt).toLocaleDateString('ar-EG', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              </div>
              {isEarned && (
                <div className="absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 shadow">
                  <span className="text-[10px] font-black text-white">✓</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Motivation */}
      {earnedCount < totalCount && (
        <div className="card-premium border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 text-center">
          <div className="mb-3 text-4xl">🎯</div>
          <h3 className="mb-1 font-bold text-amber-900">ماذا تبقّى؟</h3>
          <p className="text-sm text-amber-700/80">
            تبقّى لك {totalCount - earnedCount} إنجازات. استمر في الاختبارات
            والتدريب لاكتسابها!
          </p>
        </div>
      )}
    </div>
  )
}
