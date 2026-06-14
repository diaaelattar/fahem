'use client'

import { useState } from 'react'
import {
  User, Phone, Shield, BookOpen, Trophy, TrendingUp,
  CheckCircle2, XCircle, BarChart3, Loader2, ChevronDown, ChevronUp,
  Star, AlertCircle, Wallet, GraduationCap, Calendar
} from 'lucide-react'

interface StudentData {
  student: {
    name: string
    grade_id: number
    wallet_balance: number
  }
  stats: {
    total_exams: number
    passed_exams: number
    avg_score: number
    lessons_practiced: number
  }
  recent_exams: Array<{
    id: string
    score: number | null
    max_score: number | null
    created_at: string
    status: string
    exams: { title: string; passing_score: number } | null
  }>
  lesson_stats: Record<string, { correct: number; total: number }>
}

export default function ParentDashboardPage() {
  const [studentPhone, setStudentPhone] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<StudentData | null>(null)
  const [showAllExams, setShowAllExams] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_phone: studentPhone.trim(),
          parent_phone: parentPhone.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'حدث خطأ')
      } else {
        setData(json)
      }
    } catch {
      setError('تعذر الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  const visibleExams = showAllExams ? data?.recent_exams : data?.recent_exams?.slice(0, 5)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" dir="rtl">
      {/* Decorative orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 py-10">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-2xl shadow-indigo-500/40">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="font-bold text-4xl text-white tracking-tight">بوابة ولي الأمر</h1>
          <p className="mt-2 text-indigo-200/80 text-sm">تابع مسيرة ابنك أو ابنتك الدراسية بكل سهولة</p>
        </div>

        {/* Login Form */}
        {!data && (
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
            <div className="border-b border-white/10 bg-gradient-to-r from-indigo-600/30 to-violet-600/30 px-8 py-5">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-indigo-300" />
                <p className="font-bold text-white">التحقق من الهوية</p>
              </div>
              <p className="mt-1 text-xs text-indigo-200/60">لا تحتاج لكلمة مرور — فقط أرقام الهواتف</p>
            </div>
            <div className="p-8">
              {error && (
                <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-indigo-200">رقم هاتف الطالب</label>
                  <div className="relative">
                    <Phone className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-indigo-400" />
                    <input
                      type="tel"
                      value={studentPhone}
                      onChange={e => setStudentPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      dir="ltr"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-4 pr-12 text-left font-mono text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-indigo-200">رقم هاتف ولي الأمر</label>
                  <div className="relative">
                    <Shield className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-violet-400" />
                    <input
                      type="tel"
                      value={parentPhone}
                      onChange={e => setParentPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      dir="ltr"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-4 pr-12 text-left font-mono text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-4 font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50 hover:scale-[1.01] disabled:opacity-60 disabled:scale-100"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Shield className="h-5 w-5" />}
                  {loading ? 'جارٍ التحقق…' : 'عرض متابعة الابن / الابنة'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Dashboard Data */}
        {data && (
          <div className="space-y-6">
            {/* Student Header Card */}
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
              <div className="bg-gradient-to-r from-indigo-600/40 to-violet-600/40 px-8 py-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
                    <GraduationCap className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">{data.student.name}</h2>
                    <p className="mt-1 text-sm text-indigo-200/80">الصف الدراسي: الصف {data.student.grade_id}</p>
                  </div>
                  <button
                    onClick={() => { setData(null); setError('') }}
                    className="mr-auto text-xs text-indigo-300 hover:text-white transition-colors underline"
                  >
                    تغيير الطالب
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'إجمالي الاختبارات', value: data.stats.total_exams, icon: BookOpen, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/10 border-blue-500/20' },
                { label: 'اختبارات ناجحة', value: data.stats.passed_exams, icon: Trophy, color: 'from-emerald-500 to-green-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                { label: 'متوسط الدرجات', value: `${data.stats.avg_score}%`, icon: TrendingUp, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/10 border-amber-500/20' },
                { label: 'دروس مذاكرة', value: data.stats.lessons_practiced, icon: Star, color: 'from-violet-500 to-purple-500', bg: 'bg-violet-500/10 border-violet-500/20' },
              ].map((stat, i) => (
                <div key={i} className={`rounded-2xl border ${stat.bg} p-4 backdrop-blur-xl`}>
                  <div className={`mb-3 inline-flex rounded-xl bg-gradient-to-br ${stat.color} p-2 shadow-lg`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-2xl font-black text-white">{stat.value}</div>
                  <div className="mt-0.5 text-xs text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Recent Exams */}
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
              <div className="border-b border-white/10 px-6 py-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-400" />
                  <h3 className="font-bold text-white">آخر الاختبارات</h3>
                </div>
              </div>
              <div className="divide-y divide-white/5">
                {!visibleExams?.length && (
                  <div className="px-6 py-8 text-center text-slate-400 text-sm">لا توجد اختبارات حتى الآن</div>
                )}
                {visibleExams?.map(exam => {
                  const score = exam.score ?? 0
                  const max = exam.max_score ?? 100
                  const pct = Math.round((score / max) * 100)
                  const passed = pct >= (exam.exams?.passing_score ?? 60)
                  return (
                    <div key={exam.id} className="flex items-center gap-4 px-6 py-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {passed ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-white text-sm">{exam.exams?.title ?? 'اختبار'}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                            <div
                              className={`h-full rounded-full transition-all ${
                                passed ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-gradient-to-r from-red-500 to-rose-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="shrink-0 text-xs font-bold text-slate-300">{pct}%</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-left">
                        <div className={`text-sm font-bold ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
                          {score}/{max}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(exam.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {(data?.recent_exams?.length ?? 0) > 5 && (
                <button
                  onClick={() => setShowAllExams(v => !v)}
                  className="flex w-full items-center justify-center gap-2 border-t border-white/10 py-3 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {showAllExams ? <><ChevronUp className="h-4 w-4" /> عرض أقل</> : <><ChevronDown className="h-4 w-4" /> عرض الكل ({data?.recent_exams?.length})</>}
                </button>
              )}
            </div>

            {/* Lesson Progress */}
            {Object.keys(data.lesson_stats).length > 0 && (
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
                <div className="border-b border-white/10 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-violet-400" />
                    <h3 className="font-bold text-white">تقدم الدروس</h3>
                  </div>
                </div>
                <div className="divide-y divide-white/5">
                  {Object.entries(data.lesson_stats).slice(0, 8).map(([lessonId, stats]) => {
                    const pct = Math.round((stats.correct / stats.total) * 100)
                    return (
                      <div key={lessonId} className="flex items-center gap-4 px-6 py-3">
                        <div className="h-8 w-8 shrink-0 rounded-lg bg-violet-500/20 flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-violet-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-300">درس #{lessonId}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs font-bold text-slate-300">{pct}%</span>
                          </div>
                        </div>
                        <div className="shrink-0 text-xs text-slate-500">{stats.correct}/{stats.total} صح</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
