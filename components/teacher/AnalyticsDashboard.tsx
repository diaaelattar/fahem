'use client'
import { useState } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, TrendingUp, AlertTriangle, Trophy } from 'lucide-react'

interface Attempt {
  id: string
  student_id: string
  percentage: number | null
  score: number | null
  is_passed: boolean | null
  completed_at: string
  students?: { profiles?: { full_name?: string } | null } | null
}

interface QuestionStat {
  question_text: string
  failure_rate: number
  total_attempts: number
}

interface AnalyticsDashboardProps {
  attempts: Attempt[]
  questionStats?: QuestionStat[]
}

const PASS_COLORS = ['#10b981', '#ef4444']

export function AnalyticsDashboard({ attempts, questionStats = [] }: AnalyticsDashboardProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  
  if (attempts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
        <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="font-bold text-slate-600">لا توجد بيانات كافية لعرض التحليلات</p>
        <p className="text-sm text-slate-400 mt-1">قم باختيار اختبار تم تقديمه لعرض التحليلات</p>
      </div>
    )
  }

  // Build score distribution data
  const scoreRanges = [
    { name: 'ضعيف (0-49%)', count: 0, color: '#ef4444' },
    { name: 'مقبول (50-69%)', count: 0, color: '#f59e0b' },
    { name: 'جيد (70-84%)', count: 0, color: '#3b82f6' },
    { name: 'ممتاز (85-100%)', count: 0, color: '#10b981' },
  ]
  
  attempts.forEach(a => {
    const p = a.percentage || 0
    if (p < 50) scoreRanges[0].count++
    else if (p < 70) scoreRanges[1].count++
    else if (p < 85) scoreRanges[2].count++
    else scoreRanges[3].count++
  })

  // Pass/Fail pie data
  const passed = attempts.filter(a => a.is_passed).length
  const failed = attempts.length - passed
  const passFailData = [
    { name: 'ناجح', value: passed },
    { name: 'راسب', value: failed },
  ]

  // Unique students for selector
  const studentsMap = new Map<string, string>()
  attempts.forEach(a => {
    const name = a.students?.profiles?.full_name || 'طالب'
    studentsMap.set(a.student_id, name)
  })
  const students = Array.from(studentsMap.entries())

  // Selected student growth data
  const studentAttempts = selectedStudentId
    ? attempts
        .filter(a => a.student_id === selectedStudentId)
        .sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime())
        .map((a, i) => ({ 
          exam: `محاولة ${i + 1}`, 
          percentage: Math.round(a.percentage || 0) 
        }))
    : []

  // Average score
  const avgScore = Math.round(attempts.reduce((s, a) => s + (a.percentage || 0), 0) / attempts.length)
  const topScore = Math.max(...attempts.map(a => a.percentage || 0))
  const passRate = Math.round((passed / attempts.length) * 100)

  return (
    <div className="space-y-6" dir="rtl">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'عدد المحاولات', value: attempts.length, icon: Users, bg: 'bg-blue-50', text: 'text-blue-600' },
          { label: 'متوسط الدرجات', value: `${avgScore}%`, icon: TrendingUp, bg: 'bg-indigo-50', text: 'text-indigo-600' },
          { label: 'أعلى درجة', value: `${Math.round(topScore)}%`, icon: Trophy, bg: 'bg-emerald-50', text: 'text-emerald-600' },
          { label: 'نسبة النجاح', value: `${passRate}%`, icon: AlertTriangle, bg: passRate >= 60 ? 'bg-emerald-50' : 'bg-rose-50', text: passRate >= 60 ? 'text-emerald-600' : 'text-rose-600' },
        ].map(({ label, value, icon: Icon, bg, text }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${text}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold">{label}</p>
              <p className="text-xl font-black text-slate-800">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-bold text-slate-700 mb-4 text-sm">📊 توزيع الدرجات</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={scoreRanges}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {scoreRanges.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pass/Fail Pie */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-bold text-slate-700 mb-4 text-sm">🎯 نسبة النجاح والرسوب</h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            <div className="w-[160px] h-[160px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={passFailData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {passFailData.map((_, index) => (
                      <Cell key={index} fill={PASS_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm font-bold text-slate-700">ناجح: {passed}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm font-bold text-slate-700">راسب: {failed}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Growth Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h3 className="font-bold text-slate-700 text-sm">📈 منحنى نمو الطالب</h3>
          <select
            value={selectedStudentId || ''}
            onChange={e => setSelectedStudentId(e.target.value || null)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 w-full sm:w-auto"
          >
            <option value="">اختر طالباً لعرض تطوره</option>
            {students.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
        {selectedStudentId && studentAttempts.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={studentAttempts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="exam" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip formatter={(v) => [`${v}%`, 'الدرجة']} />
              <Line type="monotone" dataKey="percentage" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
            {selectedStudentId ? 'هذا الطالب لديه محاولة واحدة فقط' : 'اختر طالباً من القائمة أعلاه لعرض تطوره'}
          </div>
        )}
      </div>

      {/* Hardest Questions */}
      {questionStats.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-bold text-slate-700 mb-4 text-sm">🚨 أصعب الأسئلة (تحتاج إعادة شرح)</h3>
          <div className="space-y-3">
            {questionStats.slice(0, 5).map((q, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-red-500">{Math.round(q.failure_rate)}% نسبة الخطأ</span>
                  <span className="text-slate-600 line-clamp-1 flex-1 text-right ml-4">{q.question_text}</span>
                  <span className="text-slate-400 shrink-0 mr-2">({q.total_attempts} محاولة)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-red-400"
                    style={{ width: `${q.failure_rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
