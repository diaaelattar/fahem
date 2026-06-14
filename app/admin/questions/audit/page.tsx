import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import {
  ShieldCheck,
  Info,
  CheckCircle2,
  Clock,
  HelpCircle,
  Sparkles,
} from 'lucide-react'
import { QuestionAuditCenter } from '@/components/admin/QuestionAuditCenter'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface SearchParams {
  subject?: string
  grade?: string
  tab?: string
}

export default async function QuestionAuditPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  await requireAdmin()
  const supabase = await createClient()

  // Fetch filter lists
  const [{ data: subjects }, { data: grades }] = await Promise.all([
    supabase.from('subjects').select('id, name_ar, icon').order('name_ar'),
    supabase
      .from('grades')
      .select('id, name_ar, grade_number')
      .order('grade_number'),
  ])

  // ── Fetch questions based on active tab ──────────────────────────────────
  const tab = searchParams.tab || 'pending'

  let query = supabase
    .from('questions')
    .select(
      `
      id, question_type, question_text, options, correct_answer, explanation,
      difficulty_level, bloom_level, is_approved, status, tags, created_at,
      subjects(id, name_ar, icon),
      grades(id, name_ar),
      units(name_ar),
      lessons(name_ar)
    `
    )
    .order('created_at', { ascending: false })
    .limit(150)

  if (tab === 'pending') query = query.eq('is_approved', false)
  if (tab === 'approved') query = query.eq('is_approved', true)
  if (tab === 'review') query = query.eq('status', 'review')

  if (searchParams.subject) query = query.eq('subject_id', searchParams.subject)
  if (searchParams.grade) query = query.eq('grade_id', searchParams.grade)

  const { data: questions } = await query

  // ── Stats ─────────────────────────────────────────────────────────────────
  const [
    { count: totalCount },
    { count: pendingCount },
    { count: reviewCount },
    { count: approvedCount },
  ] = await Promise.all([
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', false),
    supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'review'),
    supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', true),
  ])

  const stats = {
    total: totalCount || 0,
    pending: pendingCount || 0,
    review: reviewCount || 0,
    approved: approvedCount || 0,
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <h1 className="bg-gradient-to-r from-violet-700 to-indigo-600 bg-clip-text font-display text-3xl font-bold text-transparent">
              مركز التوثيق والتدقيق
            </h1>
          </div>
          <p className="mr-11 text-sm text-muted-foreground">
            مراجعة جودة الأسئلة وإعادة تصنيفها باستخدام Gemini 3.5 Flash
          </p>
        </div>
        <Link
          href="/admin/questions"
          className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
        >
          ← بنك الأسئلة
        </Link>
      </div>

      {/* ─── Stats Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          {
            label: 'إجمالي الأسئلة',
            value: stats.total,
            icon: HelpCircle,
            color: 'text-slate-600',
            bg: 'bg-slate-50',
            border: 'border-slate-200',
          },
          {
            label: 'غير معتمد',
            value: stats.pending,
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            border: 'border-amber-200',
          },
          {
            label: 'قيد المراجعة',
            value: stats.review,
            icon: Sparkles,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-200',
          },
          {
            label: 'معتمد ومحقق',
            value: stats.approved,
            icon: CheckCircle2,
            color: 'text-green-600',
            bg: 'bg-green-50',
            border: 'border-green-200',
          },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div
            key={label}
            className={`${bg} border ${border} flex items-center gap-4 rounded-2xl p-4`}
          >
            <div
              className={`h-10 w-10 rounded-xl ${bg} border ${border} flex shrink-0 items-center justify-center`}
            >
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <p className={`text-2xl font-black ${color}`}>
                {value.toLocaleString('ar-EG')}
              </p>
              <p className="text-xs leading-tight text-muted-foreground">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Info Banner ─────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50 p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-violet-500" />
        <p className="text-sm leading-relaxed text-violet-800">
          <strong>كيفية الاستخدام:</strong> اضغط على السؤال لتوسيعه، ثم اضغط{' '}
          <strong>«تدقيق ذكي»</strong> ليقوم Gemini بمراجعة صحة الإجابة، جودة
          الصياغة، ورموز LaTeX. بعد المراجعة يمكنك قبول الاقتراحات أو تعديلها أو
          رفضها.
        </p>
      </div>

      {/* ─── Main Component ──────────────────────────────────────────────── */}
      <QuestionAuditCenter
        initialQuestions={questions || []}
        subjects={subjects || []}
        grades={grades || []}
        activeTab={tab}
        stats={stats}
      />
    </div>
  )
}
