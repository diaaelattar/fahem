'use client'

import { BarChart2, Clock, Target, TrendingUp } from 'lucide-react'

interface SelectedQuestion {
  points: number
  points_override?: number
  difficulty_level: string
}

interface Props {
  questions: SelectedQuestion[]
  durationMinutes: number
}

export function ExamSummaryStats({ questions, durationMinutes }: Props) {
  const total = questions.length
  const totalPoints = questions.reduce((s, q) => s + (q.points_override ?? q.points), 0)

  const diffCounts = { easy: 0, medium: 0, hard: 0 }
  questions.forEach(q => {
    const d = q.difficulty_level as keyof typeof diffCounts
    if (d in diffCounts) diffCounts[d]++
  })

  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0

  const stats = [
    { label: 'إجمالي الدرجات', value: totalPoints, icon: Target, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'عدد الأسئلة', value: total, icon: BarChart2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'مدة الاختبار', value: `${durationMinutes} د`, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'وقت/سؤال', value: total > 0 ? `${Math.round(durationMinutes / total)} د` : '—', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
  ]

  return (
    <div className="bg-white rounded-2xl border border-border p-4 space-y-4">
      <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wide">ملخص الاختبار</h3>

      <div className="grid grid-cols-2 gap-3">
        {stats.map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 flex items-center gap-2`}>
            <s.icon className={`w-4 h-4 ${s.color} shrink-0`} />
            <div>
              <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-muted-foreground leading-tight">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">توزيع الصعوبة</p>
          {/* Progress bar */}
          <div className="flex h-2.5 rounded-full overflow-hidden gap-px">
            {diffCounts.easy > 0 && <div className="bg-green-400 transition-all" style={{ width: `${pct(diffCounts.easy)}%` }} />}
            {diffCounts.medium > 0 && <div className="bg-yellow-400 transition-all" style={{ width: `${pct(diffCounts.medium)}%` }} />}
            {diffCounts.hard > 0 && <div className="bg-red-400 transition-all" style={{ width: `${pct(diffCounts.hard)}%` }} />}
          </div>
          <div className="flex justify-between mt-1.5">
            {[
              ['سهل', diffCounts.easy, 'text-green-600'],
              ['متوسط', diffCounts.medium, 'text-yellow-600'],
              ['صعب', diffCounts.hard, 'text-red-600'],
            ].map(([label, count, cls]) => (
              <div key={label as string} className="text-center">
                <span className={`text-xs font-bold ${cls}`}>{count as number}</span>
                <span className="text-[10px] text-muted-foreground block">{label as string} ({pct(count as number)}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {total === 0 && (
        <p className="text-xs text-center text-muted-foreground py-2">
          أضف أسئلة لعرض الإحصائيات
        </p>
      )}
    </div>
  )
}
