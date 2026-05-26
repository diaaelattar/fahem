'use client'

import { useState, useMemo } from 'react'
import {
  Wand2,
  CheckCircle2,
  AlertTriangle,
  Search,
  Loader2,
  RefreshCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  XCircle,
  Filter,
  Pencil,
} from 'lucide-react'
import { MathRenderer } from '@/components/ui/MathRenderer'
import { toast } from 'sonner'
import {
  getSubjectDirection,
  getSubjectTextAlignClass,
} from '@/lib/utils/subject-formatting'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

const TYPE_AR: Record<string, string> = {
  mcq: 'اختيار متعدد',
  true_false: 'صح/خطأ',
  fill_blank: 'ملء فراغ',
  essay: 'مقالي',
  correction: 'تصحيح',
}
const DIFF_AR: Record<string, { ar: string; cls: string }> = {
  easy: { ar: 'سهل', cls: 'bg-green-50 text-green-700 border-green-200' },
  medium: {
    ar: 'متوسط',
    cls: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  },
  hard: { ar: 'صعب', cls: 'bg-red-50 text-red-700 border-red-200' },
}
const BLOOM_AR: Record<string, string> = {
  remember: 'تذكر',
  understand: 'فهم',
  apply: 'تطبيق',
  analyze: 'تحليل',
  evaluate: 'تقييم',
  create: 'إبداع',
}

interface Props {
  initialQuestions: any[]
  subjects: any[]
  grades: any[]
  activeTab: string
  stats: { total: number; pending: number; review: number; approved: number }
}

export function QuestionAuditCenter({
  initialQuestions,
  subjects,
  grades,
  activeTab,
  stats,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [questions, setQuestions] = useState(initialQuestions)

  useEffect(() => {
    setQuestions(initialQuestions)
  }, [initialQuestions])

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [auditingIds, setAuditingIds] = useState<string[]>([])
  const [applyingIds, setApplyingIds] = useState<string[]>([])
  const [auditResults, setAuditResults] = useState<Record<string, any>>({})
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkRunning, setBulkRunning] = useState(false)
  const [search, setSearch] = useState('')
  const [editMode, setEditMode] = useState<Record<string, boolean>>({})

  const updateSuggestion = (id: string, field: string, value: any) => {
    setAuditResults((p) => ({
      ...p,
      [id]: {
        ...p[id],
        suggestions: { ...p[id].suggestions, [field]: value },
      },
    }))
  }

  const filterSubject = searchParams.get('subject') || ''
  const filterGrade = searchParams.get('grade') || ''

  const handleFilterChange = (key: string, val: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (val) params.set(key, val)
    else params.delete(key)
    router.push(`/admin/questions/audit?${params.toString()}`)
  }

  const filtered = useMemo(
    () =>
      questions.filter((q) => {
        if (
          search &&
          !q.question_text.toLowerCase().includes(search.toLowerCase())
        )
          return false
        if (filterSubject && q.subjects?.id != filterSubject) return false
        if (filterGrade && q.grades?.id != filterGrade) return false
        return true
      }),
    [questions, search, filterSubject, filterGrade]
  )

  const toggleSelect = (id: string) =>
    setSelectedIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
    )

  // ── Run single audit ───────────────────────────────────────────────────────
  const runAudit = async (
    id: string,
    force = false,
    overrideText?: string
  ): Promise<void> => {
    if (auditingIds.includes(id)) return

    if (!force && !overrideText) {
      const q = questions.find((x) => x.id === id)
      if (q?.is_approved) {
        if (
          !window.confirm(
            'هذا السؤال معتمد وموثق مسبقاً. هل أنت متأكد أنك تريد إعادة تدقيقه واستهلاك رصيد الذكاء الاصطناعي؟'
          )
        ) {
          return
        }
      }
    }

    setAuditingIds((p) => [...p, id])
    try {
      const res = await fetch('/api/admin/questions/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: id, overrideText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل التدقيق')
      setAuditResults((p) => ({ ...p, [id]: data.result }))
      // Expand so user sees result immediately
      setExpandedId(id)
      toast.success('اكتمل التدقيق — راجع الاقتراحات')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setAuditingIds((p) => p.filter((x) => x !== id))
    }
  }

  // ── Bulk audit (sequential with 1s gap) ──────────────────────────────────
  const runBulkAudit = async () => {
    if (!selectedIds.length) return

    const hasApproved = selectedIds.some(
      (id) => questions.find((q) => q.id === id)?.is_approved
    )
    if (hasApproved) {
      if (
        !window.confirm(
          'بعض الأسئلة المحددة معتمدة مسبقاً. هل تريد حقاً إعادة تدقيقها؟'
        )
      ) {
        return
      }
    }

    setBulkRunning(true)
    let done = 0
    for (const id of selectedIds) {
      await runAudit(id, true) // pass force=true to bypass individual confirm
      done++
      toast.info(`التدقيق: ${done} / ${selectedIds.length}`)
      await new Promise((r) => setTimeout(r, 1000))
    }
    setBulkRunning(false)
    toast.success('اكتمل التدقيق الجماعي')
  }

  // ── Apply suggestions ─────────────────────────────────────────────────────
  const applyAudit = async (id: string) => {
    const res = auditResults[id]
    if (!res?.suggestions) return
    setApplyingIds((p) => [...p, id])
    try {
      const r = await fetch('/api/admin/questions/audit/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: id, suggestions: res.suggestions }),
      })
      if (!r.ok) throw new Error((await r.json()).error || 'فشل الحفظ')
      toast.success('✅ تم الاعتماد والتوثيق بنجاح')
      setQuestions((p) => p.filter((q) => q.id !== id))
      setAuditResults((p) => {
        const n = { ...p }
        delete n[id]
        return n
      })
      setExpandedId(null)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setApplyingIds((p) => p.filter((x) => x !== id))
    }
  }

  // ── Tabs ─────────────────────────────────────────────────────────────────
  const tabs = [
    { key: 'all', label: 'جميع الأسئلة', count: stats.total },
    { key: 'pending', label: 'غير معتمد', count: stats.pending },
    { key: 'review', label: 'قيد المراجعة', count: stats.review },
    { key: 'approved', label: 'معتمد', count: stats.approved },
  ]

  return (
    <div className="space-y-5" dir="rtl">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <a
            key={t.key}
            href={`/admin/questions/audit?tab=${t.key}`}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition-all ${
              activeTab === t.key
                ? 'border-violet-600 bg-violet-600 text-white shadow'
                : 'border-border bg-white text-slate-600 hover:border-violet-300'
            }`}
          >
            {t.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${activeTab === t.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}
            >
              {t.count}
            </span>
          </a>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-white p-3 shadow-sm">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="بحث في نص السؤال..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border-none bg-slate-50 py-2 pl-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-violet-200"
          />
        </div>
        <select
          value={filterSubject}
          onChange={(e) => handleFilterChange('subject', e.target.value)}
          className="rounded-xl border-none bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-200"
        >
          <option value="">جميع المواد</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.icon} {s.name_ar}
            </option>
          ))}
        </select>
        <select
          value={filterGrade}
          onChange={(e) => handleFilterChange('grade', e.target.value)}
          className="rounded-xl border-none bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-200"
        >
          <option value="">جميع الصفوف</option>
          {grades.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name_ar}
            </option>
          ))}
        </select>
        {selectedIds.length > 0 && (
          <button
            onClick={runBulkAudit}
            disabled={bulkRunning}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-violet-700 disabled:opacity-60"
          >
            {bulkRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            تدقيق المحدد ({selectedIds.length})
          </button>
        )}
        <button
          onClick={() => router.refresh()}
          className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
          title="تحديث"
        >
          <RefreshCcw className="h-4 w-4" />
        </button>
        <span className="mr-auto text-xs text-muted-foreground">
          {filtered.length} سؤال
        </span>
      </div>

      {/* Question Cards */}
      <div className="space-y-3">
        {filtered.map((q) => {
          const isExpanded = expandedId === q.id
          const isAuditing = auditingIds.includes(q.id)
          const isApplying = applyingIds.includes(q.id)
          const result = auditResults[q.id] ?? (q.ai_audit_results || null)
          const isSelected = selectedIds.includes(q.id)
          const statusColor = result
            ? result.audit_status === 'perfect'
              ? 'border-green-300'
              : result.audit_status === 'critical_error'
                ? 'border-red-300'
                : 'border-blue-300'
            : isSelected
              ? 'border-violet-400 ring-1 ring-violet-200'
              : 'border-border'

          const dir = getSubjectDirection(q?.subjects?.name_ar)
          const textAlign = getSubjectTextAlignClass(q?.subjects?.name_ar)

          return (
            <div
              key={q.id}
              className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${statusColor}`}
              dir={dir}
            >
              {/* Card Header */}
              <div className="flex items-start gap-3 p-4">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(q.id)}
                  className="mt-1.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-violet-600 focus:ring-violet-400"
                />
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : q.id)}
                >
                  {/* Badges */}
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      {TYPE_AR[q.question_type] || q.question_type}
                    </span>
                    {q.difficulty_level && (
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${DIFF_AR[q.difficulty_level]?.cls}`}
                      >
                        {DIFF_AR[q.difficulty_level]?.ar}
                      </span>
                    )}
                    {q.bloom_level && (
                      <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                        بلوم: {BLOOM_AR[q.bloom_level] || q.bloom_level}
                      </span>
                    )}
                    {q.is_approved && (
                      <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                        <CheckCircle2 className="h-3 w-3" /> معتمد
                      </span>
                    )}
                    {result && (
                      <span
                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          result.audit_status === 'perfect'
                            ? 'bg-green-100 text-green-700'
                            : result.audit_status === 'critical_error'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        <Sparkles className="h-3 w-3" />
                        {result.audit_status === 'perfect'
                          ? 'ممتاز'
                          : result.audit_status === 'critical_error'
                            ? 'خطأ جوهري'
                            : 'يحتاج تحسين'}
                      </span>
                    )}
                  </div>
                  {/* Question Text */}
                  <div
                    className={`line-clamp-2 text-sm font-medium leading-relaxed ${textAlign}`}
                  >
                    <MathRenderer text={q.question_text} dir={dir} />
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                    {q.grades?.name_ar && <span>📚 {q.grades.name_ar}</span>}
                    {q.subjects?.name_ar && (
                      <span>
                        {q.subjects.icon} {q.subjects.name_ar}
                      </span>
                    )}
                    {q.units?.name_ar && <span>📦 {q.units.name_ar}</span>}
                    {q.lessons?.name_ar && <span>📄 {q.lessons.name_ar}</span>}
                  </div>
                </div>
                {/* Action buttons */}
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      runAudit(q.id)
                    }}
                    disabled={isAuditing}
                    title="تدقيق بالذكاء الاصطناعي"
                    className="rounded-xl p-2 text-violet-600 transition-all hover:bg-violet-50 disabled:opacity-40"
                  >
                    {isAuditing ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Wand2 className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : q.id)}
                    className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* ─ Expanded Body ─ */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/40 p-5">
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    {/* Left: Current */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                        النسخة الحالية
                      </h4>
                      <div className="space-y-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                        <div>
                          <p className="mb-1 text-[10px] font-bold uppercase text-slate-400">
                            نص السؤال
                          </p>
                          <div
                            className={`flex ${
                              q.image_position === 'top'
                                ? 'flex-col-reverse'
                                : q.image_position === 'right'
                                  ? 'flex-row-reverse items-center gap-4'
                                  : q.image_position === 'left'
                                    ? 'flex-row items-center gap-4'
                                    : 'flex-col' // bottom (default)
                            }`}
                          >
                            <div className="flex-1">
                              <MathRenderer
                                text={q.question_text}
                                className={`text-sm leading-relaxed ${textAlign}`}
                                dir={dir}
                              />
                            </div>
                            {q.question_image_url && (
                              <div
                                className={`shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 ${
                                  q.image_position === 'right' ||
                                  q.image_position === 'left'
                                    ? 'w-1/3'
                                    : 'mt-2 w-full max-w-xs'
                                }`}
                              >
                                <img
                                  src={q.question_image_url}
                                  alt="صورة السؤال"
                                  className="h-auto w-full object-contain"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        {Array.isArray(q.options) && q.options.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-bold uppercase text-slate-400">
                              الخيارات
                            </p>
                            {q.options.map((opt: string, i: number) => (
                              <div
                                key={i}
                                className={`flex items-center gap-2 rounded-lg border p-2 text-xs ${opt === q.correct_answer ? 'border-green-200 bg-green-50 font-bold text-green-800' : 'border-slate-100 bg-slate-50 text-slate-600'}`}
                              >
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border bg-white text-[10px]">
                                  {['أ', 'ب', 'ج', 'د'][i]}
                                </span>
                                <MathRenderer
                                  text={opt}
                                  dir={dir}
                                  className={textAlign}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        <div>
                          <p className="mb-1 text-[10px] font-bold uppercase text-slate-400">
                            الإجابة الصحيحة
                          </p>
                          <p
                            className={`rounded-lg border border-green-100 bg-green-50 p-2 text-xs font-bold text-green-700 ${textAlign}`}
                          >
                            <MathRenderer text={q.correct_answer} dir={dir} />
                          </p>
                        </div>
                        {q.explanation && (
                          <div>
                            <p className="mb-1 text-[10px] font-bold uppercase text-slate-400">
                              التفسير
                            </p>
                            <div
                              className={`text-xs italic leading-relaxed text-slate-600 ${textAlign}`}
                            >
                              <MathRenderer text={q.explanation} dir={dir} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: AI Suggestion */}
                    <div className="space-y-3">
                      <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-violet-500">
                        {result?.audit_status === 'manual_edit' ? (
                          <>
                            <Pencil className="h-3.5 w-3.5" /> تعديل يدوي
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5" /> اقتراح Gemini
                          </>
                        )}
                      </h4>

                      {!result ? (
                        <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-violet-200 bg-white p-8 text-center">
                          <Wand2 className="mb-3 h-12 w-12 text-violet-200" />
                          <p className="mb-4 text-sm text-slate-400">
                            اضغط «تدقيق ذكي» لتحليل هذا السؤال
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => runAudit(q.id)}
                              disabled={isAuditing}
                              className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-violet-700 disabled:opacity-50"
                            >
                              {isAuditing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Wand2 className="h-4 w-4" />
                              )}
                              تشغيل التدقيق الذكي
                            </button>
                            <button
                              onClick={() => {
                                setAuditResults((p) => ({
                                  ...p,
                                  [q.id]: {
                                    audit_status: 'manual_edit',
                                    issues_found: [],
                                    suggestions: {
                                      question_text: q.question_text,
                                      options: Array.isArray(q.options)
                                        ? [...q.options]
                                        : [],
                                      correct_answer: q.correct_answer,
                                      explanation: q.explanation || '',
                                      difficulty_level:
                                        q.difficulty_level || 'medium',
                                      bloom_level:
                                        q.bloom_level || 'understand',
                                    },
                                  },
                                }))
                                setEditMode((p) => ({ ...p, [q.id]: true }))
                              }}
                              disabled={isAuditing}
                              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-6 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200"
                            >
                              <Pencil className="h-4 w-4" />
                              تعديل يدوي مباشر
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 rounded-xl border-2 border-violet-200 bg-white p-4 shadow-md">
                          {/* Scores */}
                          {result.audit_status !== 'manual_edit' && (
                            <div className="flex gap-3">
                              {[
                                {
                                  label: 'دقة علمية',
                                  val: result.scientific_accuracy_score,
                                },
                                {
                                  label: 'LaTeX',
                                  val: result.latex_compliance_score,
                                },
                              ].map(({ label, val }) => (
                                <div
                                  key={label}
                                  className="flex-1 rounded-xl border border-slate-100 bg-slate-50 p-3 text-center"
                                >
                                  <p
                                    className={`text-2xl font-black ${(val ?? 0) >= 80 ? 'text-green-600' : (val ?? 0) >= 60 ? 'text-yellow-600' : 'text-red-600'}`}
                                  >
                                    {val ?? '—'}
                                  </p>
                                  <p className="mt-0.5 text-[10px] text-slate-500">
                                    {label}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Issues */}
                          {result.issues_found?.length > 0 && (
                            <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                              <p className="mb-2 flex items-center gap-1 text-[11px] font-bold text-amber-700">
                                <AlertTriangle className="h-3.5 w-3.5" />{' '}
                                المشكلات المكتشفة:
                              </p>
                              <ul className="space-y-1">
                                {result.issues_found.map(
                                  (iss: string, i: number) => (
                                    <li
                                      key={i}
                                      className="flex items-start gap-1.5 text-[11px] text-amber-800"
                                    >
                                      <span className="mt-0.5 text-amber-500">
                                        •
                                      </span>
                                      {iss}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                          {result.audit_status === 'perfect' && (
                            <div className="flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 p-3">
                              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                              <p className="text-sm font-bold text-green-700">
                                السؤال ممتاز ولا يحتاج تعديل جوهري
                              </p>
                            </div>
                          )}

                          {result.suggestions && (
                            <>
                              {editMode[q.id] ? (
                                <div className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                                  <div>
                                    <label className="mb-1 block text-[10px] font-bold uppercase text-blue-600">
                                      تعديل النص المقترح
                                    </label>
                                    <textarea
                                      value={result.suggestions.question_text}
                                      onChange={(e) =>
                                        updateSuggestion(
                                          q.id,
                                          'question_text',
                                          e.target.value
                                        )
                                      }
                                      className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                                      rows={3}
                                      dir={getSubjectDirection(
                                        q.subjects?.name_ar
                                      )}
                                    />
                                    <div className="mt-1.5 flex items-center justify-between gap-2">
                                      <div
                                        className={`flex-1 overflow-x-auto rounded border border-slate-100 bg-white p-2 text-sm ${getSubjectTextAlignClass(q.subjects?.name_ar)}`}
                                      >
                                        <MathRenderer
                                          text={
                                            result.suggestions.question_text
                                          }
                                          dir={getSubjectDirection(
                                            q.subjects?.name_ar
                                          )}
                                        />
                                      </div>
                                      <button
                                        onClick={() =>
                                          runAudit(
                                            q.id,
                                            true,
                                            result.suggestions.question_text
                                          )
                                        }
                                        disabled={isAuditing}
                                        className="flex shrink-0 items-center gap-1 rounded-lg bg-violet-100 px-3 py-2 text-xs font-bold text-violet-700 transition-all hover:bg-violet-200 disabled:opacity-50"
                                        title="إعادة التقييم وتوليد الخيارات والإجابة الصحيحة بناءً على هذا النص الجديد"
                                      >
                                        {isAuditing ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <Sparkles className="h-3.5 w-3.5" />
                                        )}
                                        توليد الإجابة للنص الجديد
                                      </button>
                                    </div>
                                  </div>

                                  {Array.isArray(
                                    result.suggestions.options
                                  ) && (
                                    <div className="space-y-2">
                                      <label className="block text-[10px] font-bold uppercase text-blue-600">
                                        تعديل الخيارات المقترحة
                                      </label>
                                      {result.suggestions.options.map(
                                        (opt: string, i: number) => (
                                          <div key={i} className="flex gap-2">
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-xs font-bold">
                                              {['أ', 'ب', 'ج', 'د'][i]}
                                            </span>
                                            <input
                                              type="text"
                                              value={opt}
                                              onChange={(e) => {
                                                const newOpts = [
                                                  ...result.suggestions.options,
                                                ]
                                                newOpts[i] = e.target.value
                                                updateSuggestion(
                                                  q.id,
                                                  'options',
                                                  newOpts
                                                )
                                              }}
                                              className={`flex-1 rounded-lg border border-slate-200 px-3 py-1.5 font-mono text-sm outline-none focus:ring-2 focus:ring-blue-200 ${getSubjectTextAlignClass(q.subjects?.name_ar)}`}
                                              dir={getSubjectDirection(
                                                q.subjects?.name_ar
                                              )}
                                            />
                                          </div>
                                        )
                                      )}
                                      <div className="pt-2">
                                        <label className="mb-1 block text-[10px] font-bold uppercase text-green-600">
                                          الإجابة الصحيحة المقترحة
                                        </label>
                                        <input
                                          type="text"
                                          value={
                                            result.suggestions.correct_answer
                                          }
                                          onChange={(e) =>
                                            updateSuggestion(
                                              q.id,
                                              'correct_answer',
                                              e.target.value
                                            )
                                          }
                                          className={`w-full rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 font-mono text-sm text-green-800 outline-none focus:ring-2 focus:ring-green-400 ${getSubjectTextAlignClass(q.subjects?.name_ar)}`}
                                          dir={getSubjectDirection(
                                            q.subjects?.name_ar
                                          )}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  <div>
                                    <label className="mb-1 block text-[10px] font-bold uppercase text-blue-600">
                                      تعديل التفسير المقترح
                                    </label>
                                    <textarea
                                      value={
                                        result.suggestions.explanation || ''
                                      }
                                      onChange={(e) =>
                                        updateSuggestion(
                                          q.id,
                                          'explanation',
                                          e.target.value
                                        )
                                      }
                                      className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                                      rows={3}
                                      dir={getSubjectDirection(
                                        q.subjects?.name_ar
                                      )}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div>
                                    <p className="mb-1 text-[10px] font-bold uppercase text-violet-500">
                                      النص المقترح
                                    </p>
                                    <div
                                      className={`rounded-lg border border-violet-100 bg-violet-50/50 p-3 text-sm leading-relaxed ${textAlign}`}
                                    >
                                      <MathRenderer
                                        text={result.suggestions.question_text}
                                        dir={dir}
                                      />
                                    </div>
                                  </div>

                                  {Array.isArray(
                                    result.suggestions.options
                                  ) && (
                                    <div className="space-y-1.5">
                                      <p className="text-[10px] font-bold uppercase text-violet-500">
                                        الخيارات المقترحة
                                      </p>
                                      {result.suggestions.options.map(
                                        (opt: string, i: number) => (
                                          <div
                                            key={i}
                                            className={`flex items-center gap-2 rounded-lg border p-2 text-xs ${opt === result.suggestions.correct_answer ? 'border-green-300 bg-green-100 font-bold text-green-900' : 'border-slate-100 bg-slate-50 text-slate-600'}`}
                                          >
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border bg-white text-[10px]">
                                              {['أ', 'ب', 'ج', 'د'][i]}
                                            </span>
                                            <MathRenderer
                                              text={opt}
                                              dir={dir}
                                              className={textAlign}
                                            />
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}

                                  <div>
                                    <p className="mb-1 text-[10px] font-bold uppercase text-violet-500">
                                      التفسير المقترح
                                    </p>
                                    <div
                                      className={`rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs leading-relaxed text-slate-700 ${textAlign}`}
                                    >
                                      <MathRenderer
                                        text={result.suggestions.explanation}
                                        dir={dir}
                                      />
                                    </div>
                                  </div>
                                </>
                              )}

                              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-2">
                                <span className="rounded-full bg-purple-50 px-2 py-1 text-[10px] font-bold text-purple-700">
                                  بلوم:{' '}
                                  {BLOOM_AR[result.suggestions.bloom_level] ||
                                    result.suggestions.bloom_level}
                                </span>
                                <span
                                  className={`rounded-full border px-2 py-1 text-[10px] font-bold ${DIFF_AR[result.suggestions.difficulty_level]?.cls}`}
                                >
                                  {
                                    DIFF_AR[result.suggestions.difficulty_level]
                                      ?.ar
                                  }
                                </span>
                                {result.suggestions.tags?.map(
                                  (tag: string, i: number) => (
                                    <span
                                      key={i}
                                      className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600"
                                    >
                                      #{tag}
                                    </span>
                                  )
                                )}
                              </div>
                            </>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => applyAudit(q.id)}
                              disabled={isApplying}
                              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-green-700 disabled:opacity-50"
                            >
                              {isApplying ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                              اعتماد وتوثيق
                            </button>
                            <button
                              onClick={() => {
                                if (!result.suggestions) {
                                  // Fallback to original question data if AI didn't provide suggestions
                                  setAuditResults((p) => ({
                                    ...p,
                                    [q.id]: {
                                      ...p[q.id],
                                      suggestions: {
                                        question_text: q.question_text,
                                        options: Array.isArray(q.options)
                                          ? [...q.options]
                                          : [],
                                        correct_answer: q.correct_answer,
                                        explanation: q.explanation || '',
                                        difficulty_level:
                                          q.difficulty_level || 'medium',
                                        bloom_level:
                                          q.bloom_level || 'understand',
                                      },
                                    },
                                  }))
                                }
                                setEditMode((p) => ({ ...p, [q.id]: !p[q.id] }))
                              }}
                              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                                editMode[q.id]
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                              }`}
                            >
                              <Pencil className="h-4 w-4" />
                              {editMode[q.id]
                                ? 'إنهاء التعديل'
                                : 'تعديل الاقتراح'}
                            </button>
                            <button
                              onClick={() => {
                                setAuditResults((p) => {
                                  const n = { ...p }
                                  delete n[q.id]
                                  return n
                                })
                              }}
                              className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-200"
                            >
                              تجاهل
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white py-20 text-center">
            <Search className="mx-auto mb-3 h-12 w-12 text-slate-200" />
            <p className="font-bold text-slate-400">
              لا توجد أسئلة في هذا القسم
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
