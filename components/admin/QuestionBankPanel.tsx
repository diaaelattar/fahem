'use client'

import { useState } from 'react'
import { Plus, Check, Search, Sparkles, Eye, X, SlidersHorizontal } from 'lucide-react'
import type { QuestionItem, SelectedQuestion, ExamFormState, FilterOption } from './ExamBuilderTypes'
import { TYPE_AR, DIFF_AR, DIFF_COLOR, TYPE_COLOR } from './ExamBuilderTypes'
import { getSubjectDirection, getSubjectTextAlignClass } from '@/lib/utils/subject-formatting'

function groupQuestions<T extends { context_passage?: string | null }>(questionsList: T[]) {
  const groups: { passage: string | null; items: T[] }[] = []
  const passageToGroupIndex = new Map<string, number>()

  questionsList.forEach(q => {
    if (q.context_passage) {
      if (passageToGroupIndex.has(q.context_passage)) {
        const gIdx = passageToGroupIndex.get(q.context_passage)!
        groups[gIdx].items.push(q)
      } else {
        passageToGroupIndex.set(q.context_passage, groups.length)
        groups.push({ passage: q.context_passage, items: [q] })
      }
    } else {
      groups.push({ passage: null, items: [q] })
    }
  })
  return groups
}

interface Props {
  form: ExamFormState
  onFormChange: (f: ExamFormState) => void
  bankQuestions: QuestionItem[]
  selectedQuestions: SelectedQuestion[]
  loading: boolean
  onAdd: (q: QuestionItem) => void
  onRemove: (id: string) => void
  onAutoSelect: () => void
  onUpdatePoints?: (id: string, pts: number) => void
  onAIGenerate?: () => void
}

function QuestionPreviewModal({ question, onClose, dir, textAlign }: { question: QuestionItem; onClose: () => void; dir: 'rtl'|'ltr'; textAlign: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 left-4 p-1.5 rounded-xl hover:bg-slate-100 transition-colors">
          <X className="w-5 h-5 text-slate-500" />
        </button>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${TYPE_COLOR[question.question_type]}`}>
            {TYPE_AR[question.question_type]}
          </span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${DIFF_COLOR[question.difficulty_level]}`}>
            {DIFF_AR[question.difficulty_level]}
          </span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {question.points} درجة
          </span>
        </div>
        {question.context_passage && (
          <div className={`mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-800 font-medium italic ${textAlign}`} dir={dir}>
            القطعة: {question.context_passage}
          </div>
        )}
        <div
          className={`text-base font-semibold text-slate-800 leading-relaxed mb-4 ${textAlign}`}
          dir={dir}
          dangerouslySetInnerHTML={{ __html: question.question_text }}
        />
        {(question as any).options && (
          <div className="space-y-2">
            {(question as any).options.map((opt: any, i: number) => (
              <div key={i} className={`p-3 rounded-xl text-sm border ${opt.is_correct ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200'} ${textAlign}`} dir={dir}>
                {String.fromCharCode(65 + i)}. {opt.option_text}
                {opt.is_correct && <span className="mr-2 text-emerald-600">✓</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function QuestionBankPanel({
  form, onFormChange, bankQuestions, selectedQuestions, loading, onAdd, onRemove, onAutoSelect, onUpdatePoints, onAIGenerate
}: Props) {
  const [preview, setPreview] = useState<QuestionItem | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const setFilter = (key: 'bankSearch' | 'bankQuestionType' | 'bankDifficulty', val: string) => {
    onFormChange({ ...form, [key]: val })
  }

  const selectedIds = new Set(selectedQuestions.map(q => q.id))
  const availableInBank = bankQuestions.filter(q => !selectedIds.has(q.id))

  const totalPoints = selectedQuestions.reduce((s, q) => s + (q.points_override ?? q.points), 0)

  const subjectName = (bankQuestions[0] as any)?.subjects?.name_ar || (selectedQuestions[0] as any)?.subjects?.name_ar || ''
  const subjectDir = getSubjectDirection(subjectName)
  const textAlignClass = getSubjectTextAlignClass(subjectName)

  return (
    <div className="space-y-4">

      {/* ── Step Header ── */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-black flex items-center justify-center shadow-md">٢</div>
        <div>
          <h2 className="font-black text-slate-800 text-lg">اختيار الأسئلة</h2>
          <p className="text-sm text-slate-500">
            يعرض البنك أسئلة{' '}
            {form.subjectId && <strong className="text-primary">{(bankQuestions[0] as any)?.subjects?.name_ar || 'المادة المختارة'}</strong>}
            {form.gradeId && <span> — {(bankQuestions[0] as any)?.grades?.name_ar || 'الصف المختار'}</span>}
            {' '}بناءً على تصفية الخطوة الأولى
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 h-full">

        {/* ══ LEFT: Bank ══ */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col">
          {/* Bank Header */}
          <div className="p-4 border-b border-border bg-slate-50/70">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-black text-slate-800">بنك الأسئلة</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  <span className="font-bold text-primary">{availableInBank.length}</span> سؤال متاح للإضافة
                </p>
              </div>
              <button
                onClick={() => setShowFilters(s => !s)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors ${
                  showFilters ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                فلاتر إضافية
              </button>
            </div>

            {/* Search always visible */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={form.bankSearch}
                onChange={e => setFilter('bankSearch', e.target.value)}
                placeholder="ابحث في نص السؤال..."
                className="w-full pr-9 pl-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              />
            </div>

            {/* Collapsible extra filters */}
            {showFilters && (
              <div className="mt-3 space-y-3 pt-3 border-t border-slate-200">
                {/* Type chips */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">نوع السؤال</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[['', 'الكل'], ['mcq', 'MCQ'], ['true_false', 'صح/خطأ'], ['fill_blank', 'ملء فراغ']].map(([v, l]) => (
                      <button key={v} onClick={() => setFilter('bankQuestionType', v)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-colors font-semibold ${
                          form.bankQuestionType === v ? 'bg-primary text-white border-primary' : 'bg-white border-border hover:border-primary/50'
                        }`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Difficulty chips */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">مستوى الصعوبة</p>
                  <div className="flex gap-1.5">
                    {[['', 'الكل', ''], ['easy', 'سهل', 'border-emerald-300 text-emerald-700'], ['medium', 'متوسط', 'border-amber-300 text-amber-700'], ['hard', 'صعب', 'border-red-300 text-red-700']].map(([v, l, cls]) => (
                      <button key={v} onClick={() => setFilter('bankDifficulty', v)}
                        className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors font-semibold ${
                          form.bankDifficulty === v ? 'bg-primary text-white border-primary' : `bg-white ${cls || 'border-border'} hover:border-primary/50`
                        }`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bank List */}
          <div className="overflow-y-auto flex-1" style={{ maxHeight: 480 }}>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <span className="text-sm font-bold">جاري جلب الأسئلة...</span>
              </div>
            ) : availableInBank.length === 0 ? (
              <div className="text-center py-16 px-6 flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                  <Search className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-600">
                  {bankQuestions.length === 0 ? 'لا توجد أسئلة معتمدة لهذا التصفية' : 'جميع الأسئلة تم إضافتها'}
                </p>
                <p className="text-xs text-slate-400">جرّب تعديل التصفية في الخطوة الأولى</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {groupQuestions(availableInBank).map((group, groupIdx) => {
                  if (group.passage) {
                    return (
                      <div key={`bank-group-${groupIdx}`} className="p-3 bg-indigo-50/20 border-b border-indigo-100/50 space-y-3">
                        <div className={`p-3 bg-indigo-50/80 border border-indigo-100/80 rounded-xl text-xs text-indigo-950 leading-relaxed italic relative mt-1 ${textAlignClass}`} dir={subjectDir}>
                          <span className={`absolute -top-2.5 ${subjectDir === 'rtl' ? 'right-3' : 'left-3'} bg-indigo-100 text-indigo-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-indigo-200`}>
                            القطعة المشتركة ({group.items.length} أسئلة متاحة)
                          </span>
                          {group.passage}
                        </div>
                        <div className="divide-y divide-indigo-100/30 bg-white/65 rounded-xl border border-indigo-100/40 overflow-hidden">
                          {group.items.map(q => (
                            <div key={q.id} className="p-3 hover:bg-indigo-50/25 transition-colors group">
                              <div className="flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  {/* Tags */}
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${TYPE_COLOR[q.question_type]}`}>
                                      {TYPE_AR[q.question_type]}
                                    </span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${DIFF_COLOR[q.difficulty_level]}`}>
                                      {DIFF_AR[q.difficulty_level]}
                                    </span>
                                    {(q.units as any)?.name_ar && (
                                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                        {(q.units as any).name_ar}
                                      </span>
                                    )}
                                    <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                                      {q.points} درجة
                                    </span>
                                  </div>
                                  {/* Text */}
                                  <p
                                    className={`text-sm font-medium text-slate-800 leading-relaxed line-clamp-2 ${textAlignClass}`}
                                    dir={subjectDir}
                                    dangerouslySetInnerHTML={{ __html: q.question_text }}
                                  />
                                </div>
                                {/* Actions */}
                                <div className="flex flex-col gap-1.5 shrink-0">
                                  <button
                                    onClick={() => setPreview(q)}
                                    className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-400 flex items-center justify-center transition-all"
                                    title="معاينة السؤال"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => onAdd(q)}
                                    className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary hover:text-white text-primary flex items-center justify-center transition-all"
                                    title="إضافة للاختبار"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  } else {
                    return group.items.map(q => (
                      <div key={q.id} className="p-3.5 hover:bg-slate-50 transition-colors group border-b border-border last:border-0">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Tags */}
                            <div className="flex flex-wrap gap-1 mb-2">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${TYPE_COLOR[q.question_type]}`}>
                                {TYPE_AR[q.question_type]}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${DIFF_COLOR[q.difficulty_level]}`}>
                                {DIFF_AR[q.difficulty_level]}
                              </span>
                              {(q.units as any)?.name_ar && (
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                  {(q.units as any).name_ar}
                                </span>
                              )}
                              <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                                {q.points} درجة
                              </span>
                            </div>
                            {/* Text */}
                            <p
                              className={`text-sm font-medium text-slate-800 leading-relaxed line-clamp-2 ${textAlignClass}`}
                              dir={subjectDir}
                              dangerouslySetInnerHTML={{ __html: q.question_text }}
                            />
                          </div>
                          {/* Actions */}
                          <div className="flex flex-col gap-1.5 shrink-0">
                            <button
                              onClick={() => setPreview(q)}
                              className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-400 flex items-center justify-center transition-all"
                              title="معاينة السؤال"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onAdd(q)}
                              className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary hover:text-white text-primary flex items-center justify-center transition-all"
                              title="إضافة للاختبار"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                })}
              </div>
            )}
          </div>
        </div>

        {/* ══ RIGHT: Selected ══ */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col">
          {/* Selected Header */}
          <div className="p-4 border-b border-border bg-emerald-50/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-800">أسئلة الاختبار</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500">
                    <span className="font-bold text-emerald-600">{selectedQuestions.length}</span> سؤال
                  </span>
                  {totalPoints > 0 && (
                    <span className="text-xs text-slate-500">
                      · الدرجة الكلية: <span className="font-black text-primary">{totalPoints}</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onAutoSelect}
                  disabled={availableInBank.length === 0}
                  className="flex items-center gap-1.5 text-xs font-bold bg-primary text-white px-3 py-1.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" /> عشوائي
                </button>
                {onAIGenerate && (
                  <button
                    onClick={onAIGenerate}
                    className="flex items-center gap-1.5 text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" /> توليد بالذكاء الاصطناعي
                  </button>
                )}
                {selectedQuestions.length > 0 && (
                  <button
                    onClick={() => selectedQuestions.forEach(q => onRemove(q.id))}
                    className="text-xs font-bold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-xl transition-colors border border-rose-100"
                  >
                    مسح الكل
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Selected List */}
          <div className="overflow-y-auto flex-1" style={{ maxHeight: 480 }}>
            {selectedQuestions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 gap-3 py-16 px-6">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                  <Check className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-sm font-bold">لم تختر أي أسئلة بعد</p>
                <p className="text-xs text-slate-400">اضغط على <Plus className="w-3 h-3 inline" /> بجانب أي سؤال لإضافته</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {groupQuestions(selectedQuestions).map((group, groupIdx) => {
                  if (group.passage) {
                    return (
                      <div key={`selected-group-${groupIdx}`} className="p-3 bg-indigo-50/20 border-b border-indigo-100/50 space-y-3">
                        <div className={`p-3 bg-indigo-50/80 border border-indigo-100/80 rounded-xl text-xs text-indigo-950 leading-relaxed italic relative mt-1 ${textAlignClass}`} dir={subjectDir}>
                          <span className={`absolute -top-2.5 ${subjectDir === 'rtl' ? 'right-3' : 'left-3'} bg-indigo-100 text-indigo-800 text-[9px] font-bold px-2 py-0.5 rounded-full border border-indigo-200`}>
                            القطعة المضافة للاختبار ({group.items.length} أسئلة)
                          </span>
                          {group.passage}
                        </div>
                        <div className="divide-y divide-indigo-100/30 bg-white/65 rounded-xl border border-indigo-100/40 overflow-hidden">
                          {group.items.map(q => {
                            const originalIdx = selectedQuestions.findIndex(sq => sq.id === q.id)
                            return (
                              <div key={q.id} className="p-3 hover:bg-indigo-50/25 transition-colors">
                                <div className="flex items-start gap-3">
                                  <span className="w-6 h-6 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                                    {originalIdx + 1}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={`text-sm font-medium text-slate-800 line-clamp-2 leading-snug mb-2 ${textAlignClass}`}
                                      dir={subjectDir}
                                      dangerouslySetInnerHTML={{ __html: q.question_text }}
                                    />
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${DIFF_COLOR[q.difficulty_level]}`}>
                                        {DIFF_AR[q.difficulty_level]}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-semibold">الدرجة:</span>
                                      <input
                                        type="number" min={1} max={20}
                                        value={q.points_override ?? q.points}
                                        onChange={e => {
                                          if (onUpdatePoints) onUpdatePoints(q.id, parseInt(e.target.value) || q.points)
                                        }}
                                        className="w-12 px-1.5 py-0.5 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white font-bold text-slate-700"
                                      />
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => onRemove(q.id)}
                                    className="shrink-0 p-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-500 text-slate-300 transition-colors border border-transparent hover:border-rose-200"
                                    title="إزالة من الاختبار"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  } else {
                    return group.items.map(q => {
                      const originalIdx = selectedQuestions.findIndex(sq => sq.id === q.id)
                      return (
                        <div key={q.id} className="p-3.5 hover:bg-slate-50 transition-colors border-b border-border last:border-0">
                          <div className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                              {originalIdx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium text-slate-800 line-clamp-2 leading-snug mb-2 ${textAlignClass}`}
                                dir={subjectDir}
                                dangerouslySetInnerHTML={{ __html: q.question_text }}
                              />
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${DIFF_COLOR[q.difficulty_level]}`}>
                                  {DIFF_AR[q.difficulty_level]}
                                </span>
                                <span className="text-[10px] text-slate-500 font-semibold">الدرجة:</span>
                                <input
                                  type="number" min={1} max={20}
                                  value={q.points_override ?? q.points}
                                  onChange={e => {
                                    if (onUpdatePoints) onUpdatePoints(q.id, parseInt(e.target.value) || q.points)
                                  }}
                                  className="w-12 px-1.5 py-0.5 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white font-bold text-slate-700"
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => onRemove(q.id)}
                              className="shrink-0 p-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-500 text-slate-300 transition-colors border border-transparent hover:border-rose-200"
                              title="إزالة من الاختبار"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })
                  }
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {preview && <QuestionPreviewModal question={preview} onClose={() => setPreview(null)} dir={subjectDir} textAlign={textAlignClass} />}
    </div>
  )
}
