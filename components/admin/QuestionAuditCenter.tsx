'use client'

import { useState, useMemo } from 'react'
import { Wand2, CheckCircle2, AlertTriangle, Search, Loader2, RefreshCcw, Sparkles, ChevronDown, ChevronUp, XCircle, Filter } from 'lucide-react'
import { MathRenderer } from '@/components/ui/MathRenderer'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

const TYPE_AR: Record<string, string> = {
  mcq: 'اختيار متعدد', true_false: 'صح/خطأ', fill_blank: 'ملء فراغ', essay: 'مقالي', correction: 'تصحيح'
}
const DIFF_AR: Record<string, { ar: string; cls: string }> = {
  easy:   { ar: 'سهل',    cls: 'bg-green-50 text-green-700 border-green-200' },
  medium: { ar: 'متوسط',  cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  hard:   { ar: 'صعب',    cls: 'bg-red-50 text-red-700 border-red-200' },
}
const BLOOM_AR: Record<string, string> = {
  remember: 'تذكر', understand: 'فهم', apply: 'تطبيق', analyze: 'تحليل', evaluate: 'تقييم', create: 'إبداع'
}

interface Props {
  initialQuestions: any[]
  subjects: any[]
  grades: any[]
  activeTab: string
  stats: { total: number; pending: number; review: number; approved: number }
}

export function QuestionAuditCenter({ initialQuestions, subjects, grades, activeTab, stats }: Props) {
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
  
  const filterSubject = searchParams.get('subject') || ''
  const filterGrade = searchParams.get('grade') || ''

  const handleFilterChange = (key: string, val: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (val) params.set(key, val)
    else params.delete(key)
    router.push(`/admin/questions/audit?${params.toString()}`)
  }

  const filtered = useMemo(() => questions.filter(q => {
    if (search && !q.question_text.toLowerCase().includes(search.toLowerCase())) return false
    if (filterSubject && q.subjects?.id != filterSubject) return false
    if (filterGrade && q.grades?.id != filterGrade) return false
    return true
  }), [questions, search, filterSubject, filterGrade])

  const toggleSelect = (id: string) =>
    setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  // ── Run single audit ───────────────────────────────────────────────────────
  const runAudit = async (id: string): Promise<void> => {
    if (auditingIds.includes(id)) return
    setAuditingIds(p => [...p, id])
    try {
      const res = await fetch('/api/admin/questions/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل التدقيق')
      setAuditResults(p => ({ ...p, [id]: data.result }))
      // Expand so user sees result immediately
      setExpandedId(id)
      toast.success('اكتمل التدقيق — راجع الاقتراحات')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setAuditingIds(p => p.filter(x => x !== id))
    }
  }

  // ── Bulk audit (sequential with 1s gap) ──────────────────────────────────
  const runBulkAudit = async () => {
    if (!selectedIds.length) return
    setBulkRunning(true)
    let done = 0
    for (const id of selectedIds) {
      await runAudit(id)
      done++
      toast.info(`التدقيق: ${done} / ${selectedIds.length}`)
      await new Promise(r => setTimeout(r, 1000))
    }
    setBulkRunning(false)
    toast.success('اكتمل التدقيق الجماعي')
  }

  // ── Apply suggestions ─────────────────────────────────────────────────────
  const applyAudit = async (id: string) => {
    const res = auditResults[id]
    if (!res?.suggestions) return
    setApplyingIds(p => [...p, id])
    try {
      const r = await fetch('/api/admin/questions/audit/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: id, suggestions: res.suggestions }),
      })
      if (!r.ok) throw new Error((await r.json()).error || 'فشل الحفظ')
      toast.success('✅ تم الاعتماد والتوثيق بنجاح')
      setQuestions(p => p.filter(q => q.id !== id))
      setAuditResults(p => { const n = { ...p }; delete n[id]; return n })
      setExpandedId(null)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setApplyingIds(p => p.filter(x => x !== id))
    }
  }

  // ── Tabs ─────────────────────────────────────────────────────────────────
  const tabs = [
    { key: 'all',      label: 'جميع الأسئلة',     count: stats.total },
    { key: 'pending',  label: 'غير معتمد',          count: stats.pending },
    { key: 'review',   label: 'قيد المراجعة',       count: stats.review },
    { key: 'approved', label: 'معتمد',              count: stats.approved },
  ]

  return (
    <div className="space-y-5" dir="rtl">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(t => (
          <a
            key={t.key}
            href={`/admin/questions/audit?tab=${t.key}`}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 ${
              activeTab === t.key
                ? 'bg-violet-600 text-white border-violet-600 shadow'
                : 'bg-white border-border hover:border-violet-300 text-slate-600'
            }`}
          >
            {t.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${activeTab === t.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {t.count}
            </span>
          </a>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-border p-3 flex flex-wrap gap-3 items-center shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="بحث في نص السؤال..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pr-9 pl-3 py-2 text-sm bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-violet-200 outline-none"
          />
        </div>
        <select
          value={filterSubject}
          onChange={e => handleFilterChange('subject', e.target.value)}
          className="px-3 py-2 text-sm bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-violet-200 outline-none"
        >
          <option value="">جميع المواد</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name_ar}</option>)}
        </select>
        <select
          value={filterGrade}
          onChange={e => handleFilterChange('grade', e.target.value)}
          className="px-3 py-2 text-sm bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-violet-200 outline-none"
        >
          <option value="">جميع الصفوف</option>
          {grades.map(g => <option key={g.id} value={g.id}>{g.name_ar}</option>)}
        </select>
        {selectedIds.length > 0 && (
          <button
            onClick={runBulkAudit}
            disabled={bulkRunning}
            className="bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-violet-700 transition-all disabled:opacity-60"
          >
            {bulkRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            تدقيق المحدد ({selectedIds.length})
          </button>
        )}
        <button onClick={() => router.refresh()} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl" title="تحديث">
          <RefreshCcw className="w-4 h-4" />
        </button>
        <span className="text-xs text-muted-foreground mr-auto">{filtered.length} سؤال</span>
      </div>

      {/* Question Cards */}
      <div className="space-y-3">
        {filtered.map(q => {
          const isExpanded = expandedId === q.id
          const isAuditing = auditingIds.includes(q.id)
          const isApplying = applyingIds.includes(q.id)
          const result = auditResults[q.id] ?? (q.ai_audit_results || null)
          const isSelected = selectedIds.includes(q.id)
          const statusColor = result
            ? result.audit_status === 'perfect' ? 'border-green-300' :
              result.audit_status === 'critical_error' ? 'border-red-300' : 'border-blue-300'
            : isSelected ? 'border-violet-400 ring-1 ring-violet-200' : 'border-border'

          return (
            <div key={q.id} className={`bg-white rounded-2xl border transition-all overflow-hidden shadow-sm ${statusColor}`}>
              {/* Card Header */}
              <div className="p-4 flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(q.id)}
                  className="mt-1.5 w-4 h-4 rounded text-violet-600 border-slate-300 focus:ring-violet-400 cursor-pointer shrink-0"
                />
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : q.id)}>
                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {TYPE_AR[q.question_type] || q.question_type}
                    </span>
                    {q.difficulty_level && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${DIFF_AR[q.difficulty_level]?.cls}`}>
                        {DIFF_AR[q.difficulty_level]?.ar}
                      </span>
                    )}
                    {q.bloom_level && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                        بلوم: {BLOOM_AR[q.bloom_level] || q.bloom_level}
                      </span>
                    )}
                    {q.is_approved && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> معتمد
                      </span>
                    )}
                    {result && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        result.audit_status === 'perfect' ? 'bg-green-100 text-green-700' :
                        result.audit_status === 'critical_error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        <Sparkles className="w-3 h-3" />
                        {result.audit_status === 'perfect' ? 'ممتاز' : result.audit_status === 'critical_error' ? 'خطأ جوهري' : 'يحتاج تحسين'}
                      </span>
                    )}
                  </div>
                  {/* Question Text */}
                  <div className="text-sm font-medium leading-relaxed line-clamp-2">
                    <MathRenderer text={q.question_text} />
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                    {q.grades?.name_ar && <span>📚 {q.grades.name_ar}</span>}
                    {q.subjects?.name_ar && <span>{q.subjects.icon} {q.subjects.name_ar}</span>}
                    {q.units?.name_ar && <span>📦 {q.units.name_ar}</span>}
                    {q.lessons?.name_ar && <span>📄 {q.lessons.name_ar}</span>}
                  </div>
                </div>
                {/* Action buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); runAudit(q.id) }}
                    disabled={isAuditing}
                    title="تدقيق بالذكاء الاصطناعي"
                    className="p-2 text-violet-600 hover:bg-violet-50 rounded-xl transition-all disabled:opacity-40"
                  >
                    {isAuditing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : q.id)}
                    className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* ─ Expanded Body ─ */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/40 p-5">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Left: Current */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">النسخة الحالية</h4>
                      <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-3 shadow-sm">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase">نص السؤال</p>
                          <MathRenderer text={q.question_text} className="text-sm leading-relaxed" />
                        </div>
                        {Array.isArray(q.options) && q.options.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">الخيارات</p>
                            {q.options.map((opt: string, i: number) => (
                              <div key={i} className={`text-xs p-2 rounded-lg flex items-center gap-2 border ${opt === q.correct_answer ? 'bg-green-50 border-green-200 font-bold text-green-800' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                                <span className="w-5 h-5 bg-white border rounded flex items-center justify-center text-[10px] shrink-0">{['أ','ب','ج','د'][i]}</span>
                                <MathRenderer text={opt} />
                              </div>
                            ))}
                          </div>
                        )}
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase">الإجابة الصحيحة</p>
                          <p className="text-xs font-bold text-green-700 bg-green-50 p-2 rounded-lg border border-green-100">
                            <MathRenderer text={q.correct_answer} />
                          </p>
                        </div>
                        {q.explanation && (
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase">التفسير</p>
                            <div className="text-xs text-slate-600 italic leading-relaxed">
                              <MathRenderer text={q.explanation} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: AI Suggestion */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-widest text-violet-500 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5" /> اقتراح Gemini
                      </h4>

                      {!result ? (
                        <div className="bg-white border-2 border-dashed border-violet-200 rounded-xl p-8 text-center flex flex-col items-center">
                          <Wand2 className="w-12 h-12 text-violet-200 mb-3" />
                          <p className="text-sm text-slate-400 mb-4">اضغط «تدقيق ذكي» لتحليل هذا السؤال</p>
                          <button
                            onClick={() => runAudit(q.id)}
                            disabled={isAuditing}
                            className="bg-violet-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-violet-700 transition-all disabled:opacity-50"
                          >
                            {isAuditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                            تشغيل التدقيق الذكي
                          </button>
                        </div>
                      ) : (
                        <div className="bg-white rounded-xl border-2 border-violet-200 p-4 space-y-4 shadow-md">
                          {/* Scores */}
                          <div className="flex gap-3">
                            {[
                              { label: 'دقة علمية', val: result.scientific_accuracy_score },
                              { label: 'LaTeX', val: result.latex_compliance_score }
                            ].map(({ label, val }) => (
                              <div key={label} className="flex-1 bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                                <p className={`text-2xl font-black ${(val ?? 0) >= 80 ? 'text-green-600' : (val ?? 0) >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {val ?? '—'}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
                              </div>
                            ))}
                          </div>

                          {/* Issues */}
                          {result.issues_found?.length > 0 && (
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                              <p className="text-[11px] font-bold text-amber-700 mb-2 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> المشكلات المكتشفة:
                              </p>
                              <ul className="space-y-1">
                                {result.issues_found.map((iss: string, i: number) => (
                                  <li key={i} className="text-[11px] text-amber-800 flex items-start gap-1.5">
                                    <span className="text-amber-500 mt-0.5">•</span>{iss}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {result.audit_status === 'perfect' && (
                            <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                              <p className="text-sm font-bold text-green-700">السؤال ممتاز ولا يحتاج تعديل جوهري</p>
                            </div>
                          )}

                          {result.suggestions && (
                            <>
                              <div>
                                <p className="text-[10px] font-bold text-violet-500 mb-1 uppercase">النص المقترح</p>
                                <div className="text-sm leading-relaxed bg-violet-50/50 p-3 rounded-lg border border-violet-100">
                                  <MathRenderer text={result.suggestions.question_text} />
                                </div>
                              </div>

                              {Array.isArray(result.suggestions.options) && (
                                <div className="space-y-1.5">
                                  <p className="text-[10px] font-bold text-violet-500 uppercase">الخيارات المقترحة</p>
                                  {result.suggestions.options.map((opt: string, i: number) => (
                                    <div key={i} className={`text-xs p-2 rounded-lg flex items-center gap-2 border ${opt === result.suggestions.correct_answer ? 'bg-green-100 border-green-300 font-bold text-green-900' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                                      <span className="w-5 h-5 bg-white border rounded flex items-center justify-center text-[10px] shrink-0">{['أ','ب','ج','د'][i]}</span>
                                      <MathRenderer text={opt} />
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div>
                                <p className="text-[10px] font-bold text-violet-500 mb-1 uppercase">التفسير المقترح</p>
                                <div className="text-xs text-slate-700 bg-blue-50 p-3 rounded-lg border border-blue-100 leading-relaxed">
                                  <MathRenderer text={result.suggestions.explanation} />
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                                <span className="text-[10px] px-2 py-1 rounded-full bg-purple-50 text-purple-700 font-bold">
                                  بلوم: {BLOOM_AR[result.suggestions.bloom_level] || result.suggestions.bloom_level}
                                </span>
                                <span className={`text-[10px] px-2 py-1 rounded-full font-bold border ${DIFF_AR[result.suggestions.difficulty_level]?.cls}`}>
                                  {DIFF_AR[result.suggestions.difficulty_level]?.ar}
                                </span>
                                {result.suggestions.tags?.map((tag: string, i: number) => (
                                  <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">#{tag}</span>
                                ))}
                              </div>
                            </>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => applyAudit(q.id)}
                              disabled={isApplying}
                              className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all disabled:opacity-50 shadow-md"
                            >
                              {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                              اعتماد وتوثيق
                            </button>
                            <button
                              onClick={() => { setAuditResults(p => { const n = {...p}; delete n[q.id]; return n }); }}
                              className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
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
          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <Search className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-bold">لا توجد أسئلة في هذا القسم</p>
          </div>
        )}
      </div>
    </div>
  )
}
