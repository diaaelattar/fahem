import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy, Zap, Flame, Swords, Medal } from 'lucide-react'

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

const MEDAL_STYLES = [
  'from-yellow-400 to-amber-500 shadow-yellow-200',
  'from-slate-300 to-slate-400 shadow-slate-200',
  'from-amber-600 to-amber-700 shadow-amber-200',
]

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch leaderboard from view
  const { data: board } = await supabase
    .from('leaderboard_weekly')
    .select('*')
    .order('rank')
    .limit(50)

  // Find current user's rank
  const myEntry = board?.find((e) => e.student_id === user.id)

  return (
    <div
      className="mx-auto max-w-2xl animate-fade-in space-y-6 pb-24"
      dir="rtl"
    >
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-700 to-indigo-800 p-6 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/20">
              <Trophy className="h-7 w-7 text-yellow-300" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">لوحة الشرف</h1>
              <p className="text-sm text-blue-200">أفضل الطلاب هذا الأسبوع</p>
            </div>
          </div>

          {/* My rank card */}
          {myEntry && (
            <div className="rounded-2xl border border-white/20 bg-white/15 p-4 backdrop-blur">
              <p className="mb-2 text-xs text-blue-200">ترتيبك الحالي</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/30 text-xl font-black text-yellow-300">
                    #{myEntry.rank}
                  </div>
                  <div>
                    <p className="font-bold">{myEntry.full_name}</p>
                    <p className="text-xs text-blue-200">
                      المستوى {myEntry.level} —{' '}
                      {LEVEL_NAMES[myEntry.level] || 'بطل'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-yellow-300">
                    {myEntry.weekly_xp}
                  </div>
                  <div className="text-xs text-blue-200">نقطة هذا الأسبوع</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top 3 Podium */}
      {board && board.length >= 3 && (
        <div className="rounded-3xl border border-border bg-white p-6">
          <h2 className="mb-6 text-center text-sm font-bold uppercase tracking-wide text-muted-foreground">
            🏆 المراكز الثلاثة الأولى
          </h2>
          <div className="flex items-end justify-center gap-4">
            {/* 2nd */}
            <div className="flex flex-1 flex-col items-center gap-2">
              <div className="relative">
                <img
                  src={
                    board[1]?.avatar_url ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${board[1]?.full_name}`
                  }
                  alt={board[1]?.full_name}
                  className="h-14 w-14 rounded-2xl border-4 border-slate-300 object-cover"
                />
                <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-slate-300 to-slate-400 text-xs font-black text-white shadow">
                  2
                </div>
              </div>
              <p className="line-clamp-1 text-center text-xs font-bold">
                {board[1]?.full_name}
              </p>
              <div className="rounded-xl bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600">
                {board[1]?.weekly_xp} XP
              </div>
              <div className="flex h-16 w-full items-center justify-center rounded-t-xl bg-slate-200">
                <Medal className="h-6 w-6 text-slate-400" />
              </div>
            </div>
            {/* 1st */}
            <div className="flex flex-1 flex-col items-center gap-2">
              <div className="animate-bounce text-2xl">👑</div>
              <div className="relative">
                <img
                  src={
                    board[0]?.avatar_url ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${board[0]?.full_name}`
                  }
                  alt={board[0]?.full_name}
                  className="w-18 h-18 h-[72px] w-[72px] rounded-2xl border-4 border-yellow-400 object-cover shadow-lg shadow-yellow-200"
                />
                <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-sm font-black text-white shadow-lg">
                  1
                </div>
              </div>
              <p className="line-clamp-1 text-center text-sm font-bold">
                {board[0]?.full_name}
              </p>
              <div className="rounded-xl bg-yellow-100 px-3 py-1 text-sm font-bold text-yellow-700">
                {board[0]?.weekly_xp} XP
              </div>
              <div className="flex h-24 w-full items-center justify-center rounded-t-xl bg-yellow-400">
                <Trophy className="h-8 w-8 text-white" />
              </div>
            </div>
            {/* 3rd */}
            <div className="flex flex-1 flex-col items-center gap-2">
              <div className="relative">
                <img
                  src={
                    board[2]?.avatar_url ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${board[2]?.full_name}`
                  }
                  alt={board[2]?.full_name}
                  className="h-14 w-14 rounded-2xl border-4 border-amber-600 object-cover"
                />
                <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-700 text-xs font-black text-white shadow">
                  3
                </div>
              </div>
              <p className="line-clamp-1 text-center text-xs font-bold">
                {board[2]?.full_name}
              </p>
              <div className="rounded-xl bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700">
                {board[2]?.weekly_xp} XP
              </div>
              <div className="flex h-10 w-full items-center justify-center rounded-t-xl bg-amber-600">
                <Medal className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full list */}
      <div className="overflow-hidden rounded-3xl border border-border bg-white">
        <div className="border-b border-border bg-muted/30 p-4">
          <h2 className="text-sm font-bold text-muted-foreground">
            المراتب 4 — 50
          </h2>
        </div>
        <div className="divide-y divide-border">
          {board?.slice(3).map((entry) => {
            const isMe = entry.student_id === user.id
            return (
              <div
                key={entry.student_id}
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${isMe ? 'border-r-4 border-primary bg-primary/5' : 'hover:bg-muted/30'}`}
              >
                {/* Rank */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black ${isMe ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                >
                  {entry.rank}
                </div>

                {/* Avatar */}
                <img
                  src={
                    entry.avatar_url ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${entry.full_name}`
                  }
                  alt={entry.full_name}
                  className="h-9 w-9 shrink-0 rounded-xl object-cover"
                />

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm font-bold ${isMe ? 'text-primary' : ''}`}
                  >
                    {entry.full_name} {isMe && '(أنت)'}
                  </p>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{entry.grade_name}</span>
                    {entry.streak_days > 0 && (
                      <span className="flex items-center gap-0.5 text-amber-500">
                        <Flame className="h-3 w-3" />
                        {entry.streak_days} يوم
                      </span>
                    )}
                    {entry.total_battles_won > 0 && (
                      <span className="flex items-center gap-0.5 text-indigo-500">
                        <Swords className="h-3 w-3" />
                        {entry.total_battles_won}
                      </span>
                    )}
                  </div>
                </div>

                {/* XP */}
                <div className="shrink-0 text-right">
                  <div
                    className={`text-base font-black ${isMe ? 'text-primary' : 'text-foreground'}`}
                  >
                    {entry.weekly_xp}
                  </div>
                  <div className="flex items-center justify-end gap-0.5 text-[10px] text-muted-foreground">
                    <Zap className="h-2.5 w-2.5" /> XP
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {(!board || board.length === 0) && (
          <div className="py-16 text-center text-muted-foreground">
            <Trophy className="mx-auto mb-3 h-12 w-12 opacity-20" />
            <p className="font-medium">لا يوجد بيانات بعد</p>
            <p className="mt-1 text-sm">ابدأ التدريب لتظهر في لوحة الشرف!</p>
          </div>
        )}
      </div>
    </div>
  )
}
