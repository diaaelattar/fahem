import {
  Lightbulb,
  BrainCircuit,
  PenTool,
  Search,
  Gauge,
  Sparkles,
  Layers,
  Target,
} from 'lucide-react'

interface BloomStat {
  bloom_level: string
  success_rate: number
  correct_answers: number
  total_answers: number
}

interface CognitiveRadarProps {
  bloomStats: BloomStat[]
}

const bloomLabels: Record<
  string,
  {
    label: string
    icon: React.ComponentType<{ className?: string }>
    color: string
  }
> = {
  remember: { label: 'تذكر', icon: Lightbulb, color: 'bg-blue-500' },
  understand: { label: 'فهم', icon: BrainCircuit, color: 'bg-emerald-500' },
  apply: { label: 'تطبيق', icon: PenTool, color: 'bg-amber-500' },
  analyze: { label: 'تحليل', icon: Search, color: 'bg-purple-500' },
  evaluate: { label: 'تقييم', icon: Gauge, color: 'bg-rose-500' },
  create: { label: 'إبداع', icon: Sparkles, color: 'bg-indigo-500' },
}

export function CognitiveRadar({ bloomStats }: CognitiveRadarProps) {
  if (!bloomStats || bloomStats.length === 0) return null

  return (
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
          {bloomStats.map((stat) => {
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
                      className={`h-full ${config.color} rounded-full transition-all`}
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
  )
}
