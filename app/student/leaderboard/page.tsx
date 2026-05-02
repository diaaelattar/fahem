import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy, Zap, Flame, Swords, Medal } from 'lucide-react'

const LEVEL_NAMES: Record<number, string> = {
  1: 'مبتدئ', 2: 'متعلم', 3: 'متقدم', 4: 'محترف',
  5: 'خبير', 6: 'نخبة', 7: 'أسطورة', 8: 'بطل', 9: 'أمير', 10: 'ملك'
}

const MEDAL_STYLES = [
  'from-yellow-400 to-amber-500 shadow-yellow-200',
  'from-slate-300 to-slate-400 shadow-slate-200',
  'from-amber-600 to-amber-700 shadow-amber-200',
]

export default async function LeaderboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch leaderboard from view
  const { data: board } = await supabase
    .from('leaderboard_weekly')
    .select('*')
    .order('rank')
    .limit(50)

  // Find current user's rank
  const myEntry = board?.find(e => e.student_id === user.id)

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-24" dir="rtl">

      {/* Header */}
      <div className="bg-gradient-to-br from-primary via-blue-700 to-indigo-800 rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('/grid.svg')]" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-yellow-400/20 rounded-2xl flex items-center justify-center">
              <Trophy className="w-7 h-7 text-yellow-300" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">لوحة الشرف</h1>
              <p className="text-blue-200 text-sm">أفضل الطلاب هذا الأسبوع</p>
            </div>
          </div>

          {/* My rank card */}
          {myEntry && (
            <div className="bg-white/15 backdrop-blur rounded-2xl p-4 border border-white/20">
              <p className="text-blue-200 text-xs mb-2">ترتيبك الحالي</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-400/30 rounded-xl flex items-center justify-center text-xl font-black text-yellow-300">
                    #{myEntry.rank}
                  </div>
                  <div>
                    <p className="font-bold">{myEntry.full_name}</p>
                    <p className="text-blue-200 text-xs">المستوى {myEntry.level} — {LEVEL_NAMES[myEntry.level] || 'بطل'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-yellow-300 font-black text-xl">{myEntry.weekly_xp}</div>
                  <div className="text-blue-200 text-xs">نقطة هذا الأسبوع</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top 3 Podium */}
      {board && board.length >= 3 && (
        <div className="bg-white rounded-3xl border border-border p-6">
          <h2 className="text-center font-bold text-muted-foreground text-sm mb-6 uppercase tracking-wide">🏆 المراكز الثلاثة الأولى</h2>
          <div className="flex items-end justify-center gap-4">
            {/* 2nd */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="relative">
                <img
                  src={board[1]?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${board[1]?.full_name}`}
                  alt={board[1]?.full_name}
                  className="w-14 h-14 rounded-2xl border-4 border-slate-300 object-cover"
                />
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center text-white text-xs font-black shadow">2</div>
              </div>
              <p className="text-xs font-bold text-center line-clamp-1">{board[1]?.full_name}</p>
              <div className="bg-slate-100 rounded-xl px-3 py-1 text-sm font-bold text-slate-600">{board[1]?.weekly_xp} XP</div>
              <div className="w-full bg-slate-200 rounded-t-xl h-16 flex items-center justify-center">
                <Medal className="w-6 h-6 text-slate-400" />
              </div>
            </div>
            {/* 1st */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="text-2xl animate-bounce">👑</div>
              <div className="relative">
                <img
                  src={board[0]?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${board[0]?.full_name}`}
                  alt={board[0]?.full_name}
                  className="w-18 h-18 rounded-2xl border-4 border-yellow-400 object-cover shadow-lg shadow-yellow-200 w-[72px] h-[72px]"
                />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-white text-sm font-black shadow-lg">1</div>
              </div>
              <p className="text-sm font-bold text-center line-clamp-1">{board[0]?.full_name}</p>
              <div className="bg-yellow-100 rounded-xl px-3 py-1 text-sm font-bold text-yellow-700">{board[0]?.weekly_xp} XP</div>
              <div className="w-full bg-yellow-400 rounded-t-xl h-24 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-white" />
              </div>
            </div>
            {/* 3rd */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="relative">
                <img
                  src={board[2]?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${board[2]?.full_name}`}
                  alt={board[2]?.full_name}
                  className="w-14 h-14 rounded-2xl border-4 border-amber-600 object-cover"
                />
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full flex items-center justify-center text-white text-xs font-black shadow">3</div>
              </div>
              <p className="text-xs font-bold text-center line-clamp-1">{board[2]?.full_name}</p>
              <div className="bg-amber-100 rounded-xl px-3 py-1 text-sm font-bold text-amber-700">{board[2]?.weekly_xp} XP</div>
              <div className="w-full bg-amber-600 rounded-t-xl h-10 flex items-center justify-center">
                <Medal className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full list */}
      <div className="bg-white rounded-3xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <h2 className="font-bold text-sm text-muted-foreground">المراتب 4 — 50</h2>
        </div>
        <div className="divide-y divide-border">
          {board?.slice(3).map((entry) => {
            const isMe = entry.student_id === user.id
            return (
              <div
                key={entry.student_id}
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${isMe ? 'bg-primary/5 border-r-4 border-primary' : 'hover:bg-muted/30'}`}
              >
                {/* Rank */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shrink-0
                  ${isMe ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                  {entry.rank}
                </div>

                {/* Avatar */}
                <img
                  src={entry.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${entry.full_name}`}
                  alt={entry.full_name}
                  className="w-9 h-9 rounded-xl object-cover shrink-0"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm truncate ${isMe ? 'text-primary' : ''}`}>
                    {entry.full_name} {isMe && '(أنت)'}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span>{entry.grade_name}</span>
                    {entry.streak_days > 0 && (
                      <span className="flex items-center gap-0.5 text-amber-500">
                        <Flame className="w-3 h-3" />{entry.streak_days} يوم
                      </span>
                    )}
                    {entry.total_battles_won > 0 && (
                      <span className="flex items-center gap-0.5 text-indigo-500">
                        <Swords className="w-3 h-3" />{entry.total_battles_won}
                      </span>
                    )}
                  </div>
                </div>

                {/* XP */}
                <div className="text-right shrink-0">
                  <div className={`font-black text-base ${isMe ? 'text-primary' : 'text-foreground'}`}>
                    {entry.weekly_xp}
                  </div>
                  <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground justify-end">
                    <Zap className="w-2.5 h-2.5" /> XP
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {(!board || board.length === 0) && (
          <div className="text-center py-16 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">لا يوجد بيانات بعد</p>
            <p className="text-sm mt-1">ابدأ التدريب لتظهر في لوحة الشرف!</p>
          </div>
        )}
      </div>
    </div>
  )
}
