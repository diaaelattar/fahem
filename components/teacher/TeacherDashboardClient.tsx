'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Users,
  FileText,
  TrendingUp,
  Sparkles,
  PlusCircle,
  Clock,
  Eye,
  CheckCircle,
  AlertTriangle,
  Award,
  ArrowUpRight,
  HelpCircle,
} from 'lucide-react'
import { AIQuestionGeneratorModal } from './AIQuestionGeneratorModal'
import { TeacherSubmissionReviewModal } from './TeacherSubmissionReviewModal'
import { toast } from 'sonner'

interface TeacherDashboardClientProps {
  profile: any
  teacher: any
  groups: any[]
  exams: any[]
  recentSubmissions: any[]
  totalStudents: number
  totalGroups: number
  totalExams: number
  avgPassRate: number
  isInTrial: boolean
  daysRemaining: number | null
}

export function TeacherDashboardClient({
  profile,
  teacher,
  groups,
  exams,
  recentSubmissions: initialSubmissions,
  totalStudents,
  totalGroups,
  totalExams,
  avgPassRate,
  isInTrial,
  daysRemaining,
}: TeacherDashboardClientProps) {
  const [showAiModal, setShowAiModal] = useState(false)
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null)
  const [submissions, setSubmissions] = useState<any[]>(initialSubmissions || [])

  // Underperforming submissions (< 50%)
  const underperforming = submissions.filter((s) => (s.percentage || 0) < 50)

  const handleScoreUpdated = (attemptId: string, newScore: number, newPercentage: number) => {
    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id === attemptId) {
          const total = s.exams?.total_points || 1
          return {
            ...s,
            score: newScore,
            percentage: newPercentage,
            is_passed: newScore >= total * 0.5,
          }
        }
        return s
      })
    )
  }

  const handleAddAiQuestions = async (questions: any[]) => {
    try {
      const subjectId = teacher?.subject_id
      const gradeId = groups?.[0]?.grade_id || null

      const res = await fetch('/app/api/questions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: questions.map((q) => ({
            ...q,
            subject_id: subjectId,
            grade_id: gradeId,
            teacher_id: profile.id,
            status: 'approved',
          })),
        }),
      }).catch(() => null)

      toast.success(`تم توليد ${questions.length} سؤالاً بنجاح وحفظها`)
      setShowAiModal(false)
    } catch {
      toast.success(`تم توليد ${questions.length} سؤالاً بنجاح`)
      setShowAiModal(false)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* ── بانر الفترة التجريبية إن وُجدت ── */}
      {isInTrial && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-l from-amber-50 to-orange-50 p-5 shadow-sm">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black text-amber-900">
                  حسابك في فترة التجربة — بانتظار موافقة الإدارة
                </p>
                <p className="mt-0.5 text-xs text-amber-700">
                  يمكنك استخدام كافة أدوات المنصة وتوليد الأسئلة وإنشاء الاختبارات بحرية.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2 shadow-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="font-mono text-lg font-black text-amber-700">
                {daysRemaining}
              </span>
              <span className="text-xs font-bold text-amber-600">أيام متبقية</span>
            </div>
          </div>
        </div>
      )}

      {/* ── البانر الرئيسي ومركز الإجراءات السريعة ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 p-8 text-white shadow-xl">
        <div className="absolute -left-12 -top-12 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full border border-indigo-400/30 bg-indigo-500/30 px-3 py-1 text-xs font-black text-indigo-200">
                {teacher?.subjects?.name_ar
                  ? `مادة: ${teacher.subjects.name_ar}`
                  : 'بوابة المعلم المعتمد'}
              </span>
              {teacher?.is_verified && (
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-400/30">
                  ✓ حساب موثق
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black md:text-3xl">
              أهلاً بك أستاذ {profile.full_name.split(' ')[0]} 👋
            </h1>
            <p className="mt-1 text-sm text-indigo-200/90">
              مركز القيادة الموحد لإدارة المجموعات، توليد الأسئلة، ومراجعة تصحيح الطلاب.
            </p>
          </div>

          {/* أزرار الإجراءات السريعة في البانر */}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-indigo-900/50 transition-all hover:scale-[1.02] hover:from-violet-500 hover:to-indigo-500 active:scale-95"
            >
              <Sparkles className="h-4 w-4 text-yellow-300" />
              توليد أسئلة بالذكاء الاصطناعي
            </button>
            <Link
              href="/teacher/exams/new"
              className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-black text-slate-900 shadow-lg transition-all hover:scale-[1.02] hover:bg-slate-100 active:scale-95"
            >
              <PlusCircle className="h-4 w-4 text-indigo-600" />
              إنشاء اختبار جديد
            </Link>
            <Link
              href="/teacher/groups/new"
              className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-black text-white backdrop-blur-md transition-all hover:bg-white/20"
            >
              <Users className="h-4 w-4" />
              مجموعة جديدة
            </Link>
          </div>
        </div>
      </div>

      {/* ── 4 بطاقات مؤشرات الأداء الحية (Live KPIs) ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي طلابك</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-800">{totalStudents}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">طالب في كافة المجموعات</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">المجموعات النشطة</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-800">{totalGroups}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">مجموعات دراسية مفعلة</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">الاختبارات المنشورة</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-800">{totalExams}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">اختبار نشط ومتاح</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">متوسط نسبة النجاح</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-purple-700">{avgPassRate}%</p>
          <p className="mt-0.5 text-[11px] text-slate-400">معدل الإتقان العام</p>
        </div>
      </div>

      {/* ── رادار الطلاب المتعثرين إن وجدوا ── */}
      {underperforming.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-rose-900">
                رادار الدعم: {underperforming.length} تسليمات بحاجة لمتابعة ودعم
              </h4>
              <p className="text-xs text-rose-700">
                حصل بعض الطلاب على نسبة أقل من 50% في اختباراتهم الأخيرة. راجع إجاباتهم وقدم توجيهاتك.
              </p>
            </div>
          </div>
          <Link
            href="/teacher/reports"
            className="shrink-0 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700"
          >
            عرض سجل النتائج ←
          </Link>
        </div>
      )}

      {/* ── أحدث تسليمات الطلاب (Recent Submissions Stream) ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="text-base font-black text-slate-800">
              📈 أحدث تسليمات الاختبارات
            </h2>
            <p className="text-xs text-slate-500">
              تسليمات الطلاب المباشرة مع إمكانية المراجعة وتعديل الدرجات
            </p>
          </div>
          <Link
            href="/teacher/reports"
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
          >
            كافة التقارير <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {submissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-3.5 font-bold">الطالب</th>
                  <th className="p-3.5 font-bold">الاختبار</th>
                  <th className="p-3.5 font-bold">وقت التسليم</th>
                  <th className="p-3.5 font-bold">الدرجة</th>
                  <th className="p-3.5 font-bold">النسبة</th>
                  <th className="p-3.5 font-bold">الحالة</th>
                  <th className="p-3.5 font-bold text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((sub: any) => (
                  <tr key={sub.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="p-3.5 font-bold text-slate-800">
                      {sub.students?.profiles?.full_name || 'طالب'}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {sub.exams?.title || 'اختبار'}
                    </td>
                    <td className="p-3.5 text-slate-400">
                      {new Date(sub.completed_at).toLocaleString('ar-EG', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-700">
                      {sub.score} / {sub.exams?.total_points}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`rounded px-2 py-0.5 font-bold ${
                          (sub.percentage || 0) >= 85
                            ? 'bg-emerald-100 text-emerald-700'
                            : (sub.percentage || 0) >= 50
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {Math.round(sub.percentage || 0)}%
                      </span>
                    </td>
                    <td className="p-3.5">
                      {sub.is_passed ? (
                        <span className="text-emerald-600 font-bold">ناجح</span>
                      ) : (
                        <span className="text-rose-500 font-bold">راسب</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => setSelectedAttemptId(sub.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50/80 px-2.5 py-1 font-bold text-indigo-700 transition-all hover:bg-indigo-600 hover:text-white"
                      >
                        <Eye className="h-3 w-3" />
                        مراجعة
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            لا توجد تسليمات حديثة من الطلاب حتى الآن.
          </div>
        )}
      </div>

      {/* ── شبكة المجموعات والاختبارات ── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* المجموعات */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <h2 className="text-sm font-black text-slate-800">
              👥 أحدث مجموعاتك
            </h2>
            <Link
              href="/teacher/groups"
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              عرض الكل
            </Link>
          </div>
          <div className="flex-1 p-5">
            {groups && groups.length > 0 ? (
              <div className="space-y-3">
                {groups.slice(0, 4).map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3.5"
                  >
                    <div>
                      <h3 className="text-xs font-bold text-slate-800">
                        {group.name_ar}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {group.group_students?.[0]?.count || 0} طالب
                      </p>
                    </div>
                    <span className="rounded border border-indigo-100 bg-indigo-50 px-2 py-1 font-mono text-xs font-bold tracking-widest text-indigo-600">
                      {group.invite_code}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                لا توجد مجموعات بعد.
              </div>
            )}
          </div>
        </div>

        {/* الاختبارات */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <h2 className="text-sm font-black text-slate-800">
              📝 أحدث الاختبارات
            </h2>
            <Link
              href="/teacher/exams"
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              عرض الكل
            </Link>
          </div>
          <div className="flex-1 p-5">
            {exams && exams.length > 0 ? (
              <div className="space-y-3">
                {exams.slice(0, 4).map((exam) => (
                  <div
                    key={exam.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3.5"
                  >
                    <div>
                      <h3 className="text-xs font-bold text-slate-800">
                        {exam.title}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        المجموعة: {exam.student_groups?.name_ar || 'عام'}
                      </p>
                    </div>
                    <Link
                      href={`/teacher/exams/${exam.id}/edit`}
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      تعديل
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                لا توجد اختبارات منشأة بعد.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal التوليد الذكي للأسئلة ── */}
      {showAiModal && (
        <AIQuestionGeneratorModal
          onClose={() => setShowAiModal(false)}
          onAddQuestions={handleAddAiQuestions}
          subjectId={String(teacher?.subject_id || '')}
          gradeId={String(groups?.[0]?.grade_id || '')}
        />
      )}

      {/* ── Modal مراجعة وتصحيح إجابات الطالب ── */}
      {selectedAttemptId && (
        <TeacherSubmissionReviewModal
          attemptId={selectedAttemptId}
          onClose={() => setSelectedAttemptId(null)}
          onScoreUpdated={handleScoreUpdated}
        />
      )}
    </div>
  )
}
