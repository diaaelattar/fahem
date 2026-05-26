'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  CheckCircle,
  X,
  Edit2,
  Save,
  Trash2,
  Loader2,
  Check,
  Filter,
} from 'lucide-react'
import { MathRenderer } from '@/components/ui/MathRenderer'

interface GeneratedQuestion {
  type: 'mcq' | 'true_false' | 'fill_blank' | 'essay' | 'correction'
  question_text: string
  options: string[] | null
  correct_answer: string
  explanation: string
  source_paragraph?: string
  difficulty: 'easy' | 'medium' | 'hard'
  bloom_level?:
    | 'remember'
    | 'understand'
    | 'apply'
    | 'analyze'
    | 'evaluate'
    | 'create'
  status?: 'draft' | 'review' | 'approved' | 'rejected'
  points: number
  context_passage?: string | null
  learning_outcome?: string | null
  learning_outcome_id?: number | null
}

type PreviewQuestion = GeneratedQuestion & {
  id: string
  selected: boolean
  editing: boolean
}

const TYPE_LABELS = {
  mcq: 'اختيار من متعدد',
  true_false: 'صح / خطأ',
  fill_blank: 'ملء فراغ',
  essay: 'مقالي',
  correction: 'تصويب خطأ',
}
const DIFF_LABELS = { easy: 'سهل', medium: 'متوسط', hard: 'صعب' }
const DIFF_COLORS = {
  easy: 'badge-easy',
  medium: 'badge-medium',
  hard: 'badge-hard',
}
const TYPE_COLORS = {
  mcq: 'badge-mcq',
  true_false: 'badge-true-false',
  fill_blank: 'badge-fill-blank',
  essay: 'bg-purple-100 text-purple-800',
  correction: 'bg-rose-100 text-rose-800',
}

export function QuestionPreviewGrid({
  questions: initialQuestions,
  documentId,
}: {
  questions: GeneratedQuestion[]
  documentId: string
}) {
  const supabase = createClient() as any
  const [questions, setQuestions] = useState<PreviewQuestion[]>(
    initialQuestions.map((q, i) => ({
      ...q,
      id: `q-${i}`,
      selected: true,
      editing: false,
    }))
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [filter, setFilter] = useState<
    'all' | 'mcq' | 'true_false' | 'fill_blank' | 'essay' | 'correction'
  >('all')

  const [docMeta, setDocMeta] = useState<any>(null)
  const [outcomes, setOutcomes] = useState<any[]>([])
  const [newOutcomeText, setNewOutcomeText] = useState('')

  useEffect(() => {
    async function loadMeta() {
      const { data: doc } = await supabase
        .from('documents')
        .select('subject_id, grade_id, unit_id, lesson_id')
        .eq('id', documentId)
        .single()
      if (doc) {
        setDocMeta(doc)
        let query = supabase
          .from('learning_outcomes')
          .select('*')
          .eq('subject_id', doc.subject_id)
          .eq('grade_id', doc.grade_id)
        if (doc.unit_id) query = query.eq('unit_id', doc.unit_id)
        if (doc.lesson_id) query = query.eq('lesson_id', doc.lesson_id)
        const { data } = await query
        setOutcomes(data || [])
      }
    }
    loadMeta()
  }, [documentId, supabase])

  const handleCreateOutcome = async (questionId: string) => {
    if (!newOutcomeText.trim() || !docMeta) return
    try {
      const { data, error } = await supabase
        .from('learning_outcomes')
        .insert({
          description: newOutcomeText.trim(),
          subject_id: docMeta.subject_id,
          grade_id: docMeta.grade_id,
          unit_id: docMeta.unit_id,
          lesson_id: docMeta.lesson_id,
        })
        .select()
        .single()

      if (error) throw error
      if (data) {
        setOutcomes((prev) => [...prev, data])
        updateQuestion(questionId, 'learning_outcome_id', data.id)
        setNewOutcomeText('')
      }
    } catch (err: any) {
      alert('خطأ في إضافة ناتج التعلم: ' + err.message)
    }
  }

  const selectedCount = questions.filter((q) => q.selected).length
  const filtered =
    filter === 'all' ? questions : questions.filter((q) => q.type === filter)

  const toggleSelect = (id: string) =>
    setQuestions((qs) =>
      qs.map((q) => (q.id === id ? { ...q, selected: !q.selected } : q))
    )

  const deleteQuestion = (id: string) =>
    setQuestions((qs) => qs.filter((q) => q.id !== id))

  const updateQuestion = (id: string, field: string, value: string) =>
    setQuestions((qs) =>
      qs.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    )

  const handleSaveAll = async () => {
    const toSave = questions.filter((q) => q.selected)
    if (toSave.length === 0) return

    setSaving(true)
    setSaveError('')
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('غير مسجل الدخول')

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      // جلب بيانات المستند والوحدة (للحصول على التيرم)
      const { data: doc } = await supabase
        .from('documents')
        .select(
          `
          subject_id, grade_id, unit_id, lesson_id,
          units(semester_id)
        `
        )
        .eq('id', documentId)
        .single()

      const sanitizeDifficulty = (diff?: string) => {
        if (!diff) return 'medium'
        const d = diff.toLowerCase().trim()
        if (d.includes('easy') || d.includes('سهل')) return 'easy'
        if (d.includes('hard') || d.includes('صعب')) return 'hard'
        return 'medium'
      }

      const inserts = toSave.map((q) => ({
        admin_id: user.id,
        document_id: documentId,
        question_type: q.type,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer || 'غير محدد',
        explanation: q.source_paragraph
          ? `${q.explanation}\n\n**المرجع:** ${q.source_paragraph}`
          : q.explanation,
        difficulty_level: sanitizeDifficulty(q.difficulty),
        bloom_level: q.bloom_level || 'remember',
        status: q.status || 'draft',
        points: q.points,
        context_passage: q.context_passage || null,
        learning_outcome: q.learning_outcome || null,
        learning_outcome_id: q.learning_outcome_id || null,
        subject_id: doc?.subject_id,
        grade_id: doc?.grade_id,
        unit_id: doc?.unit_id,
        lesson_id: doc?.lesson_id,
        is_approved: q.status === 'approved',
      }))

      const { error } = await supabase.from('questions').insert(inserts)
      if (error) throw error

      // تحديث عداد الأسئلة في المستند
      await supabase
        .from('documents')
        .update({ questions_count: toSave.length })
        .eq('id', documentId)

      setSaved(true)
      // scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      console.error('Save error:', err)
      setSaveError(err.message || 'حدث خطأ غير متوقع أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div className="rounded-2xl border border-border bg-white py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-9 w-9 text-green-600" />
        </div>
        <h3 className="mb-2 text-xl font-bold">تم الحفظ بنجاح! 🎉</h3>
        <p className="mb-6 text-sm text-muted-foreground">
          تم إضافة {selectedCount} سؤالاً إلى بنك الأسئلة. يمكنك الآن إنشاء
          اختبار منها.
        </p>
        <div className="flex justify-center gap-3">
          <a
            href="/admin/questions"
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            عرض بنك الأسئلة
          </a>
          <a
            href="/admin/exams/new"
            className="rounded-xl border border-border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            إنشاء اختبار
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Success Banner */}
      {saved && (
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-green-300 bg-green-50 p-5 animate-in fade-in sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 shrink-0 text-green-600" />
            <div>
              <p className="font-bold text-green-800">تم الحفظ بنجاح! 🎉</p>
              <p className="text-sm text-green-700">
                تم إضافة {selectedCount} سؤالاً إلى بنك الأسئلة.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <a
              href="/admin/questions"
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              عرض بنك الأسئلة
            </a>
            <a
              href="/admin/exams/new"
              className="rounded-xl border border-green-400 px-4 py-2 text-sm font-medium text-green-800 transition-colors hover:bg-green-100"
            >
              إنشاء اختبار
            </a>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {saveError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 animate-in fade-in">
          <X className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div className="flex-1">
            <p className="font-bold text-red-800">فشل الحفظ</p>
            <p className="mt-0.5 text-sm text-red-700">{saveError}</p>
          </div>
          <button
            onClick={() => setSaveError('')}
            className="text-red-400 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white p-5">
        <div>
          <h2 className="text-xl font-bold">مراجعة الأسئلة المولدة</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {questions.length} سؤال • محدد: {selectedCount}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filter */}
          <div className="flex flex-wrap gap-1 rounded-xl bg-muted p-1">
            {(
              [
                'all',
                'mcq',
                'true_false',
                'fill_blank',
                'essay',
                'correction',
              ] as const
            ).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${filter === f ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {f === 'all' ? 'الكل' : TYPE_LABELS[f]}
              </button>
            ))}
          </div>
          <button
            onClick={handleSaveAll}
            disabled={saving || selectedCount === 0}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            حفظ {selectedCount > 0 ? `(${selectedCount})` : ''} في بنك الأسئلة
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {(() => {
          const groups: {
            passage: string | null
            questions: (PreviewQuestion & { originalIndex: number })[]
          }[] = []
          const passageToGroupIndex = new Map<string, number>()

          filtered.forEach((q, idx) => {
            const qWithIndex = { ...q, originalIndex: idx }
            if (q.context_passage) {
              if (passageToGroupIndex.has(q.context_passage)) {
                groups[
                  passageToGroupIndex.get(q.context_passage)!
                ].questions.push(qWithIndex)
              } else {
                passageToGroupIndex.set(q.context_passage, groups.length)
                groups.push({
                  passage: q.context_passage,
                  questions: [qWithIndex],
                })
              }
            } else {
              groups.push({ passage: null, questions: [qWithIndex] })
            }
          })

          return groups.map((group, groupIdx) => (
            <div
              key={`group-${groupIdx}`}
              className={
                group.passage
                  ? 'space-y-3 rounded-3xl border border-slate-200 bg-slate-50/50 p-3 shadow-sm'
                  : 'space-y-3'
              }
            >
              {group.passage && (
                <div className="relative mb-1 mt-2 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm italic leading-relaxed text-indigo-950">
                  <span className="absolute -top-3 right-4 rounded-full border border-indigo-200 bg-indigo-100 px-3 py-0.5 text-[10px] font-bold text-indigo-800">
                    القطعة المرجعية (مرتبط بها {group.questions.length} أسئلة)
                  </span>
                  <MathRenderer text={group.passage} />
                </div>
              )}
              {group.questions.map((q) => (
                <div
                  key={q.id}
                  className={`rounded-2xl border-2 bg-white transition-all ${q.selected ? 'border-primary/30' : 'border-border opacity-60'}`}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleSelect(q.id)}
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${q.selected ? 'border-primary bg-primary' : 'border-border'}`}
                      >
                        {q.selected && <Check className="h-3 w-3 text-white" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        {/* Meta */}
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            #{q.originalIndex + 1}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[q.type]}`}
                          >
                            {TYPE_LABELS[q.type]}
                          </span>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${DIFF_COLORS[q.difficulty]}`}
                          >
                            {DIFF_LABELS[q.difficulty]}
                          </span>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {q.points} {q.points === 1 ? 'درجة' : 'درجات'}
                          </span>
                        </div>

                        {/* Context Passage - تمت إزالته من هنا ونقله للأعلى كإطار تجميعي */}

                        {/* Question text */}
                        {q.editing ? (
                          <textarea
                            value={q.question_text}
                            onChange={(e) =>
                              updateQuestion(
                                q.id,
                                'question_text',
                                e.target.value
                              )
                            }
                            className="mb-3 w-full resize-none rounded-lg border border-primary/40 p-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30"
                            rows={2}
                          />
                        ) : (
                          <div className="mb-3">
                            <MathRenderer
                              text={q.question_text}
                              className="text-base font-medium"
                            />
                          </div>
                        )}

                        {/* Options */}
                        {q.options && (
                          <div className="mb-3 grid gap-2 sm:grid-cols-2">
                            {q.options.map((opt, i) => (
                              <div
                                key={i}
                                className={`rounded-lg border px-3 py-2 text-sm ${opt === q.correct_answer ? 'border-green-400 bg-green-50 font-medium text-green-800' : 'border-border text-foreground'}`}
                              >
                                {opt === q.correct_answer && (
                                  <Check className="ml-1 inline h-3.5 w-3.5 text-green-600" />
                                )}
                                <MathRenderer
                                  text={opt}
                                  className="inline-block"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Correct answer for fill_blank, essay, correction */}
                        {(q.type === 'fill_blank' ||
                          q.type === 'essay' ||
                          q.type === 'correction') && (
                          <div className="mb-3 mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm">
                            <span className="font-medium text-green-800">
                              الإجابة النموذجية:{' '}
                            </span>
                            {q.editing ? (
                              <textarea
                                value={q.correct_answer}
                                onChange={(e) =>
                                  updateQuestion(
                                    q.id,
                                    'correct_answer',
                                    e.target.value
                                  )
                                }
                                className="mt-2 w-full resize-none rounded-md border border-green-300 bg-white p-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
                                rows={2}
                              />
                            ) : (
                              <MathRenderer
                                text={q.correct_answer}
                                className="inline-block text-green-700"
                              />
                            )}
                          </div>
                        )}

                        {/* Learning Outcome */}
                        <div className="mb-3 flex items-center gap-2 text-xs">
                          <span className="rounded border border-indigo-100 bg-indigo-50 px-2 py-1 font-bold text-indigo-600">
                            🎯 ناتج التعلم:
                          </span>
                          {q.editing ? (
                            <div className="flex flex-1 items-center gap-2">
                              <select
                                value={q.learning_outcome_id || ''}
                                onChange={(e) =>
                                  updateQuestion(
                                    q.id,
                                    'learning_outcome_id',
                                    e.target.value
                                  )
                                }
                                className="flex-1 rounded border border-border bg-white p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                              >
                                <option value="">
                                  {q.learning_outcome
                                    ? `(AI: ${q.learning_outcome})`
                                    : 'اختر ناتج تعلم'}
                                </option>
                                {outcomes.map((o) => (
                                  <option key={o.id} value={o.id}>
                                    {o.description}
                                  </option>
                                ))}
                              </select>
                              <div className="flex shrink-0 gap-1">
                                <input
                                  type="text"
                                  placeholder="إضافة جديد..."
                                  value={newOutcomeText}
                                  onChange={(e) =>
                                    setNewOutcomeText(e.target.value)
                                  }
                                  className="w-32 rounded border border-border p-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                                />
                                <button
                                  onClick={() => handleCreateOutcome(q.id)}
                                  type="button"
                                  className="rounded bg-indigo-100 px-2 font-bold text-indigo-700 hover:bg-indigo-200"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              {q.learning_outcome_id
                                ? outcomes.find(
                                    (o) => o.id === q.learning_outcome_id
                                  )?.description
                                : q.learning_outcome || 'غير محدد'}
                            </span>
                          )}
                        </div>

                        {/* Explanation & Source */}
                        {(q.explanation || q.source_paragraph) && (
                          <div className="mb-3 space-y-2">
                            {q.explanation && (
                              <div className="flex gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                                <span className="shrink-0 font-medium">
                                  💡 الشرح:{' '}
                                </span>
                                <MathRenderer text={q.explanation} />
                              </div>
                            )}
                            {q.source_paragraph && (
                              <div className="flex gap-2 rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                                <span className="shrink-0 font-medium">
                                  📄 المرجع:{' '}
                                </span>
                                <span className="italic">
                                  {q.source_paragraph}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() =>
                            setQuestions((qs) =>
                              qs.map((q2) =>
                                q2.id === q.id
                                  ? { ...q2, editing: !q2.editing }
                                  : q2
                              )
                            )
                          }
                          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                        >
                          {q.editing ? (
                            <Save className="h-4 w-4" />
                          ) : (
                            <Edit2 className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteQuestion(q.id)}
                          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        })()}
      </div>
    </div>
  )
}
