import { Sparkles, Flame, Dumbbell } from 'lucide-react'
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

interface StudentHeroProps {
  fullName: string
  avatarUrl: string | null
  level: number
  xp: number
  streak: number
  gradeName: string
}

export function StudentHero({
  fullName,
  avatarUrl,
  level,
  xp,
  streak,
  gradeName,
}: StudentHeroProps) {
  const xpInCurrentLevel = xp % 100
  const xpProgress = Math.round((xpInCurrentLevel / 100) * 100)

  return (
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
                avatarUrl ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${fullName}`
              }
              alt={fullName}
              className="relative z-10 h-28 w-28 rounded-full border-4 border-white/20 object-cover shadow-2xl md:h-36 md:w-36"
            />
            <div className="absolute -bottom-4 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-yellow-300/30 bg-gradient-to-r from-yellow-500 to-amber-600 px-5 py-1.5 text-[11px] font-black text-white shadow-lg shadow-amber-900/50">
              مستوى {level}
            </div>
          </div>

          <div className="space-y-3 pt-2 text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold text-blue-100 shadow-sm backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-yellow-300" />
              {LEVEL_NAMES[level] || 'بطل'} • {gradeName}
            </div>
            <h1 className="bg-gradient-to-b from-white to-white/80 bg-clip-text font-display text-4xl font-black tracking-tight text-transparent drop-shadow-xl md:text-5xl lg:text-6xl">
              مرحباً، {fullName.split(' ')[0]}!
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
    </section>
  )
}
