'use client'

import { useState } from 'react'
import {
  Plus,
  Check,
  Search,
  Sparkles,
  Eye,
  X,
  SlidersHorizontal,
} from 'lucide-react'
import type {
  QuestionItem,
  SelectedQuestion,
  ExamFormState,
  FilterOption,
} from './ExamBuilderTypes'
import { TYPE_AR, DIFF_AR, DIFF_COLOR, TYPE_COLOR } from './ExamBuilderTypes'
import {
  getSubjectDirection,
  getSubjectTextAlignClass,
} from '@/lib/utils/subject-formatting'

function groupQuestions<T extends { context_passage?: string | null }>(
  questionsList: T[]
) {
  const groups: { passage: string | null; items: T[] }[] = []
  const passageToGroupIndex = new Map<string, number>()

  questionsList.forEach((q) => {
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

function QuestionPreviewModal({
  question,
  onClose,
  dir,
  textAlign,
}: {
  question: QuestionItem
  onClose: () => void
  dir: 'rtl' | 'ltr'
  textAlign: string
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute left-4 top-4 rounded-xl p-1.5 transition-colors hover:bg-slate-100"
        >
          <X className="h-5 w-5 text-slate-500" />
        </button>
        <div className="mb-4 flex flex-wrap gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-bold ${TYPE_COLOR[question.question_type]}`}
          >
            {TYPE_AR[question.question_type]}
          </span>
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-bold ${DIFF_COLOR[question.difficulty_level]}`}
          >
            {DIFF_AR[question.difficulty_level]}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
            {question.points} درجة
          </span>
        </div>
        {question.context_passage && (
          <div
            className={`mb-4 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-sm font-medium italic text-indigo-800 ${textAlign}`}
            dir={dir}
          >
            القطعة: {question.context_passage}
          </div>
        )}
        <div
          className={`mb-4 text-base font-semibold leading-relaxed text-slate-800 ${textAlign}`}
          dir={dir}
          dangerouslySetInnerHTML={{ __html: question.question_text }}
        />
        {(question as any).options && (
          <div className="space-y-2">
            {(question as any).options.map((opt: any, i: number) => (
              <div
                key={i}
                className={`rounded-xl border p-3 text-sm ${opt.is_correct ? 'border-emerald-200 bg-emerald-50 font-bold text-emerald-800' : 'border-slate-200 bg-slate-50'} ${textAlign}`}
                dir={dir}
              >
                {String.fromCharCode(65 + i)}. {opt.option_text}
                {opt.is_correct && (
                  <span className="mr-2 text-emerald-600">✓</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function QuestionBankPanel({
  form,
  onFormChange,
  bankQuestions,
  selectedQuestions,
  loading,
  onAdd,
  onRemove,
  onAutoSelect,
  onUpdatePoints,
  onAIGenerate,
}: Props) {
  const [preview, setPreview] = useState<QuestionItem | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const setFilter = (
    key: 'bankSearch' | 'bankQuestionType' | 'bankDifficulty',
    val: string
  ) => {
    onFormChange({ ...form, [key]: val })
  }

  const selectedIds = new Set(selectedQuestions.map((q) => q.id))
  const availableInBank = bankQuestions.filter((q) => !selectedIds.has(q.id))

  const totalPoints = selectedQuestions.reduce(
    (s, q) => s + (q.points_override ?? q.points),
    0
  )

  const subjectName =
    (bankQuestions[0] as any)?.subjects?.name_ar ||
    (selectedQuestions[0] as any)?.subjects?.name_ar ||
    ''
  const subjectDir = getSubjectDirection(subjectName)
  const textAlignClass = getSubjectTextAlignClass(subjectName)

  return (
    <div className="space-y-4">
      {/* ── Step Header ── */}
      <div className="mb-2 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-black text-white shadow-md">
          ٢
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-800">اختيار الأسئلة</h2>
          <p className="text-sm text-slate-500">
            يعرض البنك أسئلة{' '}
            {form.subjectId && (
              <strong className="text-primary">
                {(bankQuestions[0] as any)?.subjects?.name_ar ||
                  'المادة المختارة'}
              </strong>
            )}
            {form.gradeId && (
              <span>
                {' '}
                — {(bankQuestions[0] as any)?.grades?.name_ar || 'الصف المختار'}
              </span>
            )}{' '}
            بناءً على تصفية الخطوة الأولى
          </p>
        </div>
      </div>

      <div className="grid h-full gap-4 lg:grid-cols-2">
        {/* ══ LEFT: Bank ══ */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          {/* Bank Header */}
          <div className="border-b border-border bg-slate-50/70 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-800">بنك الأسئلة</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  <span className="font-bold text-primary">
                    {availableInBank.length}
                  </span>{' '}
                  سؤال متاح للإضافة
                </p>
              </div>
              <button
                onClick={() => setShowFilters((s) => !s)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors ${
                  showFilters
                    ? 'border-primary bg-primary text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-primary/50'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                فلاتر إضافية
              </button>
            </div>

            {/* Search always visible */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={form.bankSearch}
                onChange={(e) => setFilter('bankSearch', e.target.value)}
                placeholder="ابحث في نص السؤال..."
                className="w-full rounded-xl border border-border bg-white py-2 pl-3 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Collapsible extra filters */}
            {showFilters && (
              <div className="mt-3 space-y-3 border-t border-slate-200 pt-3">
                {/* Type chips */}
                <div>
                  <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    نوع السؤال
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      ['', 'الكل'],
                      ['mcq', 'MCQ'],
                      ['true_false', 'صح/خطأ'],
                      ['fill_blank', 'ملء فراغ'],
                    ].map(([v, l]) => (
                      <button
                        key={v}
                        onClick={() => setFilter('bankQuestionType', v)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                          form.bankQuestionType === v
                            ? 'border-primary bg-primary text-white'
                            : 'border-border bg-white hover:border-primary/50'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Difficulty chips */}
                <div>
                  <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    مستوى الصعوبة
                  </p>
                  <div className="flex gap-1.5">
                    {[
                      ['', 'الكل', ''],
                      ['easy', 'سهل', 'border-emerald-300 text-emerald-700'],
                      ['medium', 'متوسط', 'border-amber-300 text-amber-700'],
                      ['hard', 'صعب', 'border-red-300 text-red-700'],
                    ].map(([v, l, cls]) => (
                      <button
                        key={v}
                        onClick={() => setFilter('bankDifficulty', v)}
                        className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors ${
                          form.bankDifficulty === v
                            ? 'border-primary bg-primary text-white'
                            : `bg-white ${cls || 'border-border'} hover:border-primary/50`
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bank List */}
          <div className="flex-1 overflow-y-auto" style={{ maxHeight: 480 }}>
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                <span className="text-sm font-bold">جاري جلب الأسئلة...</span>
              </div>
            ) : availableInBank.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
                  <Search className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-600">
                  {bankQuestions.length === 0
                    ? 'لا توجد أسئلة معتمدة لهذا التصفية'
                    : 'جميع الأسئلة تم إضافتها'}
                </p>
                <p className="text-xs text-slate-400">
                  جرّب تعديل التصفية في الخطوة الأولى
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {groupQuestions(availableInBank).map((group, groupIdx) => {
                  if (group.passage) {
                    return (
                      <div
                        key={`bank-group-${groupIdx}`}
                        className="space-y-3 border-b border-indigo-100/50 bg-indigo-50/20 p-3"
                      >
                        <div
                          className={`relative mt-1 rounded-xl border border-indigo-100/80 bg-indigo-50/80 p-3 text-xs italic leading-relaxed text-indigo-950 ${textAlignClass}`}
                          dir={subjectDir}
                        >
                          <span
                            className={`absolute -top-2.5 ${subjectDir === 'rtl' ? 'right-3' : 'left-3'} rounded-full border border-indigo-200 bg-indigo-100 px-2 py-0.5 text-[9px] font-bold text-indigo-800`}
                          >
                            القطعة المشتركة ({group.items.length} أسئلة متاحة)
                          </span>
                          {group.passage}
                        </div>
                        <div className="divide-y divide-indigo-100/30 overflow-hidden rounded-xl border border-indigo-100/40 bg-white/65">
                          {group.items.map((q) => (
                            <div
                              key={q.id}
                              className="group p-3 transition-colors hover:bg-indigo-50/25"
                            >
                              <div className="flex items-start gap-3">
                                <div className="min-w-0 flex-1">
                                  {/* Tags */}
                                  <div className="mb-2 flex flex-wrap gap-1">
                                    <span
                                      className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${TYPE_COLOR[q.question_type]}`}
                                    >
                                      {TYPE_AR[q.question_type]}
                                    </span>
                                    <span
                                      className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${DIFF_COLOR[q.difficulty_level]}`}
                                    >
                                      {DIFF_AR[q.difficulty_level]}
                                    </span>
                                    {(q.units as any)?.name_ar && (
                                      <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                                        {(q.units as any).name_ar}
                                      </span>
                                    )}
                                    <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                                      {q.points} درجة
                                    </span>
                                  </div>
                                  {/* Text */}
                                  <p
                                    className={`line-clamp-2 text-sm font-medium leading-relaxed text-slate-800 ${textAlignClass}`}
                                    dir={subjectDir}
                                    dangerouslySetInnerHTML={{
                                      __html: q.question_text,
                                    }}
                                  />
                                </div>
                                {/* Actions */}
                                <div className="flex shrink-0 flex-col gap-1.5">
                                  <button
                                    onClick={() => setPreview(q)}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400 transition-all hover:bg-slate-100"
                                    title="معاينة السؤال"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => onAdd(q)}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary transition-all hover:bg-primary hover:text-white"
                                    title="إضافة للاختبار"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  } else {
                    return group.items.map((q) => (
                      <div
                        key={q.id}
                        className="group border-b border-border p-3.5 transition-colors last:border-0 hover:bg-slate-50"
                      >
                        <div className="flex items-start gap-3">
                          <div className="min-w-0 flex-1">
                            {/* Tags */}
                            <div className="mb-2 flex flex-wrap gap-1">
                              <span
                                className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${TYPE_COLOR[q.question_type]}`}
                              >
                                {TYPE_AR[q.question_type]}
                              </span>
                              <span
                                className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${DIFF_COLOR[q.difficulty_level]}`}
                              >
                                {DIFF_AR[q.difficulty_level]}
                              </span>
                              {(q.units as any)?.name_ar && (
                                <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                                  {(q.units as any).name_ar}
                                </span>
                              )}
                              <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                                {q.points} درجة
                              </span>
                            </div>
                            {/* Text */}
                            <p
                              className={`line-clamp-2 text-sm font-medium leading-relaxed text-slate-800 ${textAlignClass}`}
                              dir={subjectDir}
                              dangerouslySetInnerHTML={{
                                __html: q.question_text,
                              }}
                            />
                          </div>
                          {/* Actions */}
                          <div className="flex shrink-0 flex-col gap-1.5">
                            <button
                              onClick={() => setPreview(q)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400 transition-all hover:bg-slate-100"
                              title="معاينة السؤال"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onAdd(q)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary transition-all hover:bg-primary hover:text-white"
                              title="إضافة للاختبار"
                            >
                              <Plus className="h-4 w-4" />
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
        <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          {/* Selected Header */}
          <div className="border-b border-border bg-emerald-50/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-800">أسئلة الاختبار</h3>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    <span className="font-bold text-emerald-600">
                      {selectedQuestions.length}
                    </span>{' '}
                    سؤال
                  </span>
                  {totalPoints > 0 && (
                    <span className="text-xs text-slate-500">
                      · الدرجة الكلية:{' '}
                      <span className="font-black text-primary">
                        {totalPoints}
                      </span>
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onAutoSelect}
                  disabled={availableInBank.length === 0}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" /> عشوائي
                </button>
                {onAIGenerate && (
                  <button
                    onClick={onAIGenerate}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-indigo-700"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" /> توليد
                    بالذكاء الاصطناعي
                  </button>
                )}
                {selectedQuestions.length > 0 && (
                  <button
                    onClick={() =>
                      selectedQuestions.forEach((q) => onRemove(q.id))
                    }
                    className="rounded-xl border border-rose-100 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-500 transition-colors hover:bg-rose-100 hover:text-rose-700"
                  >
                    مسح الكل
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Selected List */}
          <div className="flex-1 overflow-y-auto" style={{ maxHeight: 480 }}>
            {selectedQuestions.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-16 text-center text-slate-500">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
                  <Check className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-sm font-bold">لم تختر أي أسئلة بعد</p>
                <p className="text-xs text-slate-400">
                  اضغط على <Plus className="inline h-3 w-3" /> بجانب أي سؤال
                  لإضافته
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {groupQuestions(selectedQuestions).map((group, groupIdx) => {
                  if (group.passage) {
                    return (
                      <div
                        key={`selected-group-${groupIdx}`}
                        className="space-y-3 border-b border-indigo-100/50 bg-indigo-50/20 p-3"
                      >
                        <div
                          className={`relative mt-1 rounded-xl border border-indigo-100/80 bg-indigo-50/80 p-3 text-xs italic leading-relaxed text-indigo-950 ${textAlignClass}`}
                          dir={subjectDir}
                        >
                          <span
                            className={`absolute -top-2.5 ${subjectDir === 'rtl' ? 'right-3' : 'left-3'} rounded-full border border-indigo-200 bg-indigo-100 px-2 py-0.5 text-[9px] font-bold text-indigo-800`}
                          >
                            القطعة المضافة للاختبار ({group.items.length} أسئلة)
                          </span>
                          {group.passage}
                        </div>
                        <div className="divide-y divide-indigo-100/30 overflow-hidden rounded-xl border border-indigo-100/40 bg-white/65">
                          {group.items.map((q) => {
                            const originalIdx = selectedQuestions.findIndex(
                              (sq) => sq.id === q.id
                            )
                            return (
                              <div
                                key={q.id}
                                className="p-3 transition-colors hover:bg-indigo-50/25"
                              >
                                <div className="flex items-start gap-3">
                                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-xs font-black text-primary">
                                    {originalIdx + 1}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p
                                      className={`mb-2 line-clamp-2 text-sm font-medium leading-snug text-slate-800 ${textAlignClass}`}
                                      dir={subjectDir}
                                      dangerouslySetInnerHTML={{
                                        __html: q.question_text,
                                      }}
                                    />
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span
                                        className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${DIFF_COLOR[q.difficulty_level]}`}
                                      >
                                        {DIFF_AR[q.difficulty_level]}
                                      </span>
                                      <span className="text-[10px] font-semibold text-slate-500">
                                        الدرجة:
                                      </span>
                                      <input
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={q.points_override ?? q.points}
                                        onChange={(e) => {
                                          if (onUpdatePoints)
                                            onUpdatePoints(
                                              q.id,
                                              parseInt(e.target.value) ||
                                                q.points
                                            )
                                        }}
                                        className="w-12 rounded-lg border border-slate-200 bg-white px-1.5 py-0.5 text-center text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                      />
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => onRemove(q.id)}
                                    className="shrink-0 rounded-lg border border-transparent p-1.5 text-slate-300 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
                                    title="إزالة من الاختبار"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  } else {
                    return group.items.map((q) => {
                      const originalIdx = selectedQuestions.findIndex(
                        (sq) => sq.id === q.id
                      )
                      return (
                        <div
                          key={q.id}
                          className="border-b border-border p-3.5 transition-colors last:border-0 hover:bg-slate-50"
                        >
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-xs font-black text-primary">
                              {originalIdx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p
                                className={`mb-2 line-clamp-2 text-sm font-medium leading-snug text-slate-800 ${textAlignClass}`}
                                dir={subjectDir}
                                dangerouslySetInnerHTML={{
                                  __html: q.question_text,
                                }}
                              />
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${DIFF_COLOR[q.difficulty_level]}`}
                                >
                                  {DIFF_AR[q.difficulty_level]}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-500">
                                  الدرجة:
                                </span>
                                <input
                                  type="number"
                                  min={1}
                                  max={20}
                                  value={q.points_override ?? q.points}
                                  onChange={(e) => {
                                    if (onUpdatePoints)
                                      onUpdatePoints(
                                        q.id,
                                        parseInt(e.target.value) || q.points
                                      )
                                  }}
                                  className="w-12 rounded-lg border border-slate-200 bg-white px-1.5 py-0.5 text-center text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => onRemove(q.id)}
                              className="shrink-0 rounded-lg border border-transparent p-1.5 text-slate-300 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
                              title="إزالة من الاختبار"
                            >
                              <X className="h-4 w-4" />
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
      {preview && (
        <QuestionPreviewModal
          question={preview}
          onClose={() => setPreview(null)}
          dir={subjectDir}
          textAlign={textAlignClass}
        />
      )}
    </div>
  )
}
