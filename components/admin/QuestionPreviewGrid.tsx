'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, X, Edit2, Save, Trash2, Loader2, Check, Filter } from 'lucide-react'
import { MathRenderer } from '@/components/ui/MathRenderer'

interface GeneratedQuestion {
  type: 'mcq' | 'true_false' | 'fill_blank' | 'essay' | 'correction'
  question_text: string
  options: string[] | null
  correct_answer: string
  explanation: string
  source_paragraph?: string
  difficulty: 'easy' | 'medium' | 'hard'
  bloom_level?: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'
  status?: 'draft' | 'review' | 'approved' | 'rejected'
  points: number
  context_passage?: string | null
  learning_outcome?: string | null
  learning_outcome_id?: number | null
}

const TYPE_LABELS = { mcq: 'اختيار من متعدد', true_false: 'صح / خطأ', fill_blank: 'ملء فراغ', essay: 'مقالي', correction: 'تصويب خطأ' }
const DIFF_LABELS = { easy: 'سهل', medium: 'متوسط', hard: 'صعب' }
const DIFF_COLORS = { easy: 'badge-easy', medium: 'badge-medium', hard: 'badge-hard' }
const TYPE_COLORS = { mcq: 'badge-mcq', true_false: 'badge-true-false', fill_blank: 'badge-fill-blank', essay: 'bg-purple-100 text-purple-800', correction: 'bg-rose-100 text-rose-800' }

export function QuestionPreviewGrid({
  questions: initialQuestions,
  documentId,
}: {
  questions: GeneratedQuestion[]
  documentId: string
}) {
  const supabase = createClient() as any
  const [questions, setQuestions] = useState(
    initialQuestions.map((q, i) => ({ ...q, id: `q-${i}`, selected: true, editing: false }))
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [filter, setFilter] = useState<'all' | 'mcq' | 'true_false' | 'fill_blank' | 'essay' | 'correction'>('all')

  const [docMeta, setDocMeta] = useState<any>(null)
  const [outcomes, setOutcomes] = useState<any[]>([])
  const [newOutcomeText, setNewOutcomeText] = useState('')

  useEffect(() => {
    async function loadMeta() {
      const { data: doc } = await supabase.from('documents').select('subject_id, grade_id, unit_id, lesson_id').eq('id', documentId).single()
      if (doc) {
        setDocMeta(doc)
        let query = supabase.from('learning_outcomes').select('*').eq('subject_id', doc.subject_id).eq('grade_id', doc.grade_id)
        if (doc.unit_id) query = query.eq('unit_id', doc.unit_id)
        if (doc.lesson_id) query = query.eq('lesson_id', doc.lesson_id)
        const { data } = await query
        setOutcomes(data || [])
      }
    }
    loadMeta()
  }, [documentId, supabase])

  const handleCreateOutcome = async (questionId: string) => {
    if (!newOutcomeText.trim() || !docMeta) return;
    try {
      const { data, error } = await supabase.from('learning_outcomes').insert({
        description: newOutcomeText.trim(),
        subject_id: docMeta.subject_id,
        grade_id: docMeta.grade_id,
        unit_id: docMeta.unit_id,
        lesson_id: docMeta.lesson_id
      }).select().single()
      
      if (error) throw error;
      if (data) {
        setOutcomes(prev => [...prev, data])
        updateQuestion(questionId, 'learning_outcome_id', data.id)
        setNewOutcomeText('')
      }
    } catch (err: any) {
      alert('خطأ في إضافة ناتج التعلم: ' + err.message)
    }
  }

  const selectedCount = questions.filter(q => q.selected).length
  const filtered = filter === 'all' ? questions : questions.filter(q => q.type === filter)

  const toggleSelect = (id: string) =>
    setQuestions(qs => qs.map(q => q.id === id ? { ...q, selected: !q.selected } : q))

  const deleteQuestion = (id: string) =>
    setQuestions(qs => qs.filter(q => q.id !== id))

  const updateQuestion = (id: string, field: string, value: string) =>
    setQuestions(qs => qs.map(q => q.id === id ? { ...q, [field]: value } : q))

  const handleSaveAll = async () => {
    const toSave = questions.filter(q => q.selected)
    if (toSave.length === 0) return

    setSaving(true)
    setSaveError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('غير مسجل الدخول')

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

      // جلب بيانات المستند والوحدة (للحصول على التيرم)
      const { data: doc } = await supabase.from('documents')
        .select(`
          subject_id, grade_id, unit_id, lesson_id,
          units(semester_id)
        `)
        .eq('id', documentId)
        .single()

      const sanitizeDifficulty = (diff?: string) => {
        if (!diff) return 'medium'
        const d = diff.toLowerCase().trim()
        if (d.includes('easy') || d.includes('سهل')) return 'easy'
        if (d.includes('hard') || d.includes('صعب')) return 'hard'
        return 'medium'
      }

      const inserts = toSave.map(q => ({
        admin_id: user.id,
        document_id: documentId,
        question_type: q.type,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer || 'غير محدد',
        explanation: q.source_paragraph ? `${q.explanation}\n\n**المرجع:** ${q.source_paragraph}` : q.explanation,
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
      await supabase.from('documents').update({ questions_count: toSave.length }).eq('id', documentId)

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
      <div className="text-center py-16 bg-white rounded-2xl border border-border">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-9 h-9 text-green-600" />
        </div>
        <h3 className="text-xl font-bold mb-2">تم الحفظ بنجاح! 🎉</h3>
        <p className="text-muted-foreground text-sm mb-6">
          تم إضافة {selectedCount} سؤالاً إلى بنك الأسئلة. يمكنك الآن إنشاء اختبار منها.
        </p>
        <div className="flex gap-3 justify-center">
          <a href="/admin/questions" className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors">
            عرض بنك الأسئلة
          </a>
          <a href="/admin/exams/new" className="border border-border px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-muted transition-colors">
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-green-50 border border-green-300 rounded-2xl animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
            <div>
              <p className="font-bold text-green-800">تم الحفظ بنجاح! 🎉</p>
              <p className="text-sm text-green-700">تم إضافة {selectedCount} سؤالاً إلى بنك الأسئلة.</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <a href="/admin/questions" className="bg-green-600 text-white px-4 py-2 rounded-xl font-medium text-sm hover:bg-green-700 transition-colors">
              عرض بنك الأسئلة
            </a>
            <a href="/admin/exams/new" className="border border-green-400 text-green-800 px-4 py-2 rounded-xl font-medium text-sm hover:bg-green-100 transition-colors">
              إنشاء اختبار
            </a>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {saveError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-300 rounded-2xl animate-in fade-in">
          <X className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-red-800">فشل الحفظ</p>
            <p className="text-sm text-red-700 mt-0.5">{saveError}</p>
          </div>
          <button onClick={() => setSaveError('')} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-2xl border border-border p-5">
        <div>
          <h2 className="text-xl font-bold">مراجعة الأسئلة المولدة</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {questions.length} سؤال • محدد: {selectedCount}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filter */}
          <div className="flex flex-wrap gap-1 bg-muted rounded-xl p-1">
            {(['all', 'mcq', 'true_false', 'fill_blank', 'essay', 'correction'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                {f === 'all' ? 'الكل' : TYPE_LABELS[f]}
              </button>
            ))}
          </div>
          <button onClick={handleSaveAll} disabled={saving || selectedCount === 0}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ {selectedCount > 0 ? `(${selectedCount})` : ''} في بنك الأسئلة
          </button>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {(() => {
          const groups: { passage: string | null; questions: (GeneratedQuestion & { originalIndex: number })[] }[] = []
          const passageToGroupIndex = new Map<string, number>()

          filtered.forEach((q, idx) => {
            const qWithIndex = { ...q, originalIndex: idx }
            if (q.context_passage) {
              if (passageToGroupIndex.has(q.context_passage)) {
                groups[passageToGroupIndex.get(q.context_passage)!].questions.push(qWithIndex)
              } else {
                passageToGroupIndex.set(q.context_passage, groups.length)
                groups.push({ passage: q.context_passage, questions: [qWithIndex] })
              }
            } else {
              groups.push({ passage: null, questions: [qWithIndex] })
            }
          })

          return groups.map((group, groupIdx) => (
            <div key={`group-${groupIdx}`} className={group.passage ? "bg-slate-50/50 border border-slate-200 rounded-3xl p-3 shadow-sm space-y-3" : "space-y-3"}>
              {group.passage && (
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-950 leading-relaxed italic relative mb-1 mt-2">
                  <span className="absolute -top-3 right-4 bg-indigo-100 text-indigo-800 text-[10px] font-bold px-3 py-0.5 rounded-full border border-indigo-200">
                    القطعة المرجعية (مرتبط بها {group.questions.length} أسئلة)
                  </span>
                  <MathRenderer text={group.passage} />
                </div>
              )}
              {group.questions.map((q) => (
          <div key={q.id}
            className={`bg-white rounded-2xl border-2 transition-all ${q.selected ? 'border-primary/30' : 'border-border opacity-60'}`}>
            <div className="p-5">
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button onClick={() => toggleSelect(q.id)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${q.selected ? 'bg-primary border-primary' : 'border-border'}`}>
                  {q.selected && <Check className="w-3 h-3 text-white" />}
                </button>

                <div className="flex-1 min-w-0">
                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-xs text-muted-foreground font-medium">#{idx + 1}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[q.type]}`}>
                      {TYPE_LABELS[q.type]}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${DIFF_COLORS[q.difficulty]}`}>
                      {DIFF_LABELS[q.difficulty]}
                    </span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {q.points} {q.points === 1 ? 'درجة' : 'درجات'}
                    </span>
                  </div>

                  {/* Context Passage - تمت إزالته من هنا ونقله للأعلى كإطار تجميعي */}

                  {/* Question text */}
                  {q.editing ? (
                    <textarea
                      value={q.question_text}
                      onChange={e => updateQuestion(q.id, 'question_text', e.target.value)}
                      className="w-full border border-primary/40 rounded-lg p-2 text-sm mb-3 resize-none leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30"
                      rows={2}
                    />
                  ) : (
                    <div className="mb-3">
                      <MathRenderer text={q.question_text} className="text-base font-medium" />
                    </div>
                  )}

                  {/* Options */}
                  {q.options && (
                    <div className="grid sm:grid-cols-2 gap-2 mb-3">
                      {q.options.map((opt, i) => (
                        <div key={i}
                          className={`text-sm px-3 py-2 rounded-lg border ${opt === q.correct_answer ? 'bg-green-50 border-green-400 text-green-800 font-medium' : 'border-border text-foreground'}`}>
                          {opt === q.correct_answer && <Check className="inline w-3.5 h-3.5 ml-1 text-green-600" />}
                          <MathRenderer text={opt} className="inline-block" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Correct answer for fill_blank, essay, correction */}
                  {(q.type === 'fill_blank' || q.type === 'essay' || q.type === 'correction') && (
                    <div className="text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3 mt-3">
                      <span className="font-medium text-green-800">الإجابة النموذجية: </span>
                      {q.editing ? (
                        <textarea
                          value={q.correct_answer}
                          onChange={e => updateQuestion(q.id, 'correct_answer', e.target.value)}
                          className="w-full mt-2 border border-green-300 rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-green-400 bg-white"
                          rows={2}
                        />
                      ) : (
                        <MathRenderer text={q.correct_answer} className="inline-block text-green-700" />
                      )}
                    </div>
                  )}

                  {/* Learning Outcome */}
                  <div className="text-xs mb-3 flex items-center gap-2">
                    <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded border border-indigo-100">🎯 ناتج التعلم:</span>
                    {q.editing ? (
                      <div className="flex-1 flex gap-2 items-center">
                        <select 
                          value={q.learning_outcome_id || ''} 
                          onChange={e => updateQuestion(q.id, 'learning_outcome_id', e.target.value)}
                          className="flex-1 border border-border rounded p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white"
                        >
                          <option value="">{q.learning_outcome ? `(AI: ${q.learning_outcome})` : 'اختر ناتج تعلم'}</option>
                          {outcomes.map(o => (
                            <option key={o.id} value={o.id}>{o.description}</option>
                          ))}
                        </select>
                        <div className="flex gap-1 shrink-0">
                          <input 
                            type="text" 
                            placeholder="إضافة جديد..." 
                            value={newOutcomeText}
                            onChange={e => setNewOutcomeText(e.target.value)}
                            className="w-32 border border-border rounded p-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                          />
                          <button onClick={() => handleCreateOutcome(q.id)} type="button" className="bg-indigo-100 text-indigo-700 px-2 rounded hover:bg-indigo-200 font-bold">+</button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        {q.learning_outcome_id 
                          ? outcomes.find(o => o.id === q.learning_outcome_id)?.description 
                          : q.learning_outcome || 'غير محدد'}
                      </span>
                    )}
                  </div>

                  {/* Explanation & Source */}
                  {(q.explanation || q.source_paragraph) && (
                    <div className="space-y-2 mb-3">
                      {q.explanation && (
                        <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 leading-relaxed flex gap-2">
                           <span className="font-medium shrink-0">💡 الشرح: </span>
                           <MathRenderer text={q.explanation} />
                        </div>
                      )}
                      {q.source_paragraph && (
                        <div className="text-xs text-amber-800 bg-amber-50/50 border border-amber-100 rounded-lg px-3 py-2 leading-relaxed flex gap-2">
                           <span className="font-medium shrink-0">📄 المرجع: </span>
                           <span className="italic">{q.source_paragraph}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setQuestions(qs => qs.map(q2 => q2.id === q.id ? { ...q2, editing: !q2.editing } : q2))}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-primary">
                    {q.editing ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                  </button>
                  <button onClick={() => deleteQuestion(q.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
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
