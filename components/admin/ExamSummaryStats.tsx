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
  const totalPoints = questions.reduce(
    (s, q) => s + (q.points_override ?? q.points),
    0
  )

  const diffCounts = { easy: 0, medium: 0, hard: 0 }
  questions.forEach((q) => {
    const d = q.difficulty_level as keyof typeof diffCounts
    if (d in diffCounts) diffCounts[d]++
  })

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0)

  const stats = [
    {
      label: 'إجمالي الدرجات',
      value: totalPoints,
      icon: Target,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'عدد الأسئلة',
      value: total,
      icon: BarChart2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'مدة الاختبار',
      value: `${durationMinutes} د`,
      icon: Clock,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'وقت/سؤال',
      value: total > 0 ? `${Math.round(durationMinutes / total)} د` : '—',
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ]

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-white p-4">
      <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
        ملخص الاختبار
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`${s.bg} flex items-center gap-2 rounded-xl p-3`}
          >
            <s.icon className={`h-4 w-4 ${s.color} shrink-0`} />
            <div>
              <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[10px] leading-tight text-muted-foreground">
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-muted-foreground">
            توزيع الصعوبة
          </p>
          {/* Progress bar */}
          <div className="flex h-2.5 gap-px overflow-hidden rounded-full">
            {diffCounts.easy > 0 && (
              <div
                className="bg-green-400 transition-all"
                style={{ width: `${pct(diffCounts.easy)}%` }}
              />
            )}
            {diffCounts.medium > 0 && (
              <div
                className="bg-yellow-400 transition-all"
                style={{ width: `${pct(diffCounts.medium)}%` }}
              />
            )}
            {diffCounts.hard > 0 && (
              <div
                className="bg-red-400 transition-all"
                style={{ width: `${pct(diffCounts.hard)}%` }}
              />
            )}
          </div>
          <div className="mt-1.5 flex justify-between">
            {[
              ['سهل', diffCounts.easy, 'text-green-600'],
              ['متوسط', diffCounts.medium, 'text-yellow-600'],
              ['صعب', diffCounts.hard, 'text-red-600'],
            ].map(([label, count, cls]) => (
              <div key={label as string} className="text-center">
                <span className={`text-xs font-bold ${cls}`}>
                  {count as number}
                </span>
                <span className="block text-[10px] text-muted-foreground">
                  {label as string} ({pct(count as number)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {total === 0 && (
        <p className="py-2 text-center text-xs text-muted-foreground">
          أضف أسئلة لعرض الإحصائيات
        </p>
      )}
    </div>
  )
}
