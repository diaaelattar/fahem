'use client'

import { useState, useMemo, useRef } from 'react'
import {
  X,
  Sparkles,
  AlertCircle,
  Sliders,
  RotateCcw,
  CheckCircle2,
  Layers,
} from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import type { QuestionItem } from './ExamBuilderTypes'

interface Props {
  availableQuestions: QuestionItem[]
  onAdd: (questions: QuestionItem[]) => void
  onClose: () => void
}

interface QuestionTypeConfig {
  id: string
  label: string
  category: 'objective' | 'essay'
  badgeColor: string
}

const TYPES: QuestionTypeConfig[] = [
  {
    id: 'mcq',
    label: 'اختيار من متعدد',
    category: 'objective',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 'true_false',
    label: 'صح وخطأ',
    category: 'objective',
    badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  {
    id: 'fill_blank',
    label: 'إكمال الفراغ',
    category: 'objective',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  {
    id: 'essay',
    label: 'سؤال مقالي / إنشائي',
    category: 'essay',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    id: 'correction',
    label: 'صوب ما تحته خط / تصحيح',
    category: 'essay',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
  },
]

const DIFFICULTIES = [
  { id: 'easy', label: 'سهل (30%)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { id: 'medium', label: 'متوسط (50%)', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { id: 'hard', label: 'صعب (20%)', color: 'text-red-700 bg-red-50 border-red-200' },
]

export function AutoSelectModal({ availableQuestions, onAdd, onClose }: Props) {
  // state: selection[type][difficulty] = number
  const [selection, setSelection] = useState<
    Record<string, Record<string, number>>
  >({
    mcq: { easy: 0, medium: 0, hard: 0 },
    true_false: { easy: 0, medium: 0, hard: 0 },
    fill_blank: { easy: 0, medium: 0, hard: 0 },
    essay: { easy: 0, medium: 0, hard: 0 },
    correction: { easy: 0, medium: 0, hard: 0 },
  })

  const [activePreset, setActivePreset] = useState<string>('custom')
  const [customTotalInput, setCustomTotalInput] = useState<string>('20')
  const [notification, setNotification] = useState<string>('')

  const modalRef = useRef<HTMLDivElement>(null)
  useFocusTrap(modalRef, true, onClose)

  // Calculate available counts per type & difficulty
  const availableCounts = useMemo(() => {
    const counts: Record<string, Record<string, number>> = {
      mcq: { easy: 0, medium: 0, hard: 0 },
      true_false: { easy: 0, medium: 0, hard: 0 },
      fill_blank: { easy: 0, medium: 0, hard: 0 },
      essay: { easy: 0, medium: 0, hard: 0 },
      correction: { easy: 0, medium: 0, hard: 0 },
    }
    availableQuestions.forEach((q) => {
      const t = q.question_type || 'mcq'
      const d = q.difficulty_level || 'medium'
      if (counts[t] && counts[t][d] !== undefined) {
        counts[t][d]++
      } else if (counts[t]) {
        counts[t]['medium']++
      }
    })
    return counts
  }, [availableQuestions])

  const totalAvailableInBank = useMemo(() => {
    return Object.values(availableCounts).reduce(
      (sum, diffObj) => sum + Object.values(diffObj).reduce((s, n) => s + n, 0),
      0
    )
  }, [availableCounts])

  const handleSelect = (type: string, diff: string, val: string) => {
    let num = parseInt(val) || 0
    if (num < 0) num = 0
    const maxAvailable = availableCounts[type]?.[diff] || 0
    if (num > maxAvailable) num = maxAvailable

    setActivePreset('custom')
    setSelection((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [diff]: num,
      },
    }))
  }

  // Summary Metrics
  const summary = useMemo(() => {
    let total = 0
    let objectiveCount = 0
    let essayCount = 0
    const diffTotals: Record<string, number> = { easy: 0, medium: 0, hard: 0 }

    TYPES.forEach((t) => {
      DIFFICULTIES.forEach((d) => {
        const count = selection[t.id]?.[d.id] || 0
        total += count
        if (t.category === 'objective') {
          objectiveCount += count
        } else {
          essayCount += count
        }
        diffTotals[d.id] += count
      })
    })

    const objPct = total > 0 ? Math.round((objectiveCount / total) * 100) : 0
    const essayPct = total > 0 ? 100 - objPct : 0

    const isNcreeCompliant = total > 0 && objPct >= 80 && objPct <= 90

    return {
      total,
      objectiveCount,
      essayCount,
      objPct,
      essayPct,
      diffTotals,
      isNcreeCompliant,
    }
  }, [selection])

  // Reset all counts
  const handleReset = () => {
    setSelection({
      mcq: { easy: 0, medium: 0, hard: 0 },
      true_false: { easy: 0, medium: 0, hard: 0 },
      fill_blank: { easy: 0, medium: 0, hard: 0 },
      essay: { easy: 0, medium: 0, hard: 0 },
      correction: { easy: 0, medium: 0, hard: 0 },
    })
    setActivePreset('custom')
    setNotification('تم تصفير جميع الخانات')
    setTimeout(() => setNotification(''), 3000)
  }

  // Intelligent Distribution Helper
  const applySmartDistribution = (
    targetTotal: number,
    targetObjRatio: number = 0.85,
    presetName: string = ''
  ) => {
    const newSel: Record<string, Record<string, number>> = {
      mcq: { easy: 0, medium: 0, hard: 0 },
      true_false: { easy: 0, medium: 0, hard: 0 },
      fill_blank: { easy: 0, medium: 0, hard: 0 },
      essay: { easy: 0, medium: 0, hard: 0 },
      correction: { easy: 0, medium: 0, hard: 0 },
    }

    if (totalAvailableInBank === 0) {
      setNotification('لا توجد أسئلة كافية في بنك الأسئلة الحالي')
      return
    }

    const clampedTotal = Math.min(targetTotal, totalAvailableInBank)
    const targetObj = Math.round(clampedTotal * targetObjRatio)
    const targetEssay = clampedTotal - targetObj

    // Difficulty proportions: 30% easy, 50% medium, 20% hard
    const diffRatios = { easy: 0.3, medium: 0.5, hard: 0.2 }

    // Helper to allocate into types
    const allocateCategory = (
      types: string[],
      categoryTotal: number
    ) => {
      let remaining = categoryTotal
      const diffTargets = {
        easy: Math.round(categoryTotal * diffRatios.easy),
        medium: Math.round(categoryTotal * diffRatios.medium),
        hard: Math.round(categoryTotal * diffRatios.hard),
      }
      // Fix rounding discrepancy
      const diffSum = diffTargets.easy + diffTargets.medium + diffTargets.hard
      if (diffSum !== categoryTotal) {
        diffTargets.medium += categoryTotal - diffSum
      }

      // Distribute across difficulties
      for (const d of ['medium', 'easy', 'hard'] as const) {
        let neededForDiff = diffTargets[d]
        for (const t of types) {
          if (neededForDiff <= 0 || remaining <= 0) break
          const available = availableCounts[t]?.[d] || 0
          const toTake = Math.min(neededForDiff, available, remaining)
          newSel[t][d] = toTake
          neededForDiff -= toTake
          remaining -= toTake
        }
      }

      // If still remaining, fill wherever possible within category
      if (remaining > 0) {
        for (const t of types) {
          for (const d of ['medium', 'easy', 'hard']) {
            if (remaining <= 0) break
            const available = availableCounts[t]?.[d] || 0
            const alreadyTaken = newSel[t][d] || 0
            const spare = available - alreadyTaken
            if (spare > 0) {
              const take = Math.min(spare, remaining)
              newSel[t][d] += take
              remaining -= take
            }
          }
        }
      }

      return categoryTotal - remaining // actual allocated
    }

    const objTypes = ['mcq', 'true_false', 'fill_blank']
    const essayTypes = ['essay', 'correction']

    const objAllocated = allocateCategory(objTypes, targetObj)
    const essayAllocated = allocateCategory(essayTypes, targetEssay)
    const totalAllocated = objAllocated + essayAllocated

    setSelection(newSel)
    if (presetName) setActivePreset(presetName)

    setNotification(
      `تم توزيع ${totalAllocated} سؤال بنجاح (${objAllocated} موضوعي + ${essayAllocated} مقالي) وفق الأسئلة المتاحة بالبنك`
    )
    setTimeout(() => setNotification(''), 4500)
  }

  // Preset Handlers
  const handleApplyNcree = (count: number, label: string) => {
    applySmartDistribution(count, 0.85, label)
  }

  const handleCustomTotalApply = (ratio: number) => {
    const val = parseInt(customTotalInput) || 0
    if (val <= 0) {
      setNotification('يرجى كتابة عدد أسئلة صحيح أكبر من صفر')
      setTimeout(() => setNotification(''), 3000)
      return
    }
    applySmartDistribution(val, ratio, 'custom-applied')
  }

  const handleGenerate = () => {
    if (summary.total === 0) return

    let selectedResult: QuestionItem[] = []

    TYPES.forEach((typeObj) => {
      DIFFICULTIES.forEach((diffObj) => {
        const requiredCount = selection[typeObj.id]?.[diffObj.id] || 0
        if (requiredCount > 0) {
          const pool = availableQuestions.filter(
            (q) =>
              (q.question_type || 'mcq') === typeObj.id &&
              (q.difficulty_level || 'medium') === diffObj.id
          )

          // Shuffle
          const shuffled = [...pool].sort(() => Math.random() - 0.5)

          // Pick top N
          selectedResult = [
            ...selectedResult,
            ...shuffled.slice(0, requiredCount),
          ]
        }
      })
    })

    onAdd(selectedResult)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/80 px-6 py-5">
          <div>
            <h2
              id="modal-title"
              className="flex items-center gap-2 text-xl font-black text-indigo-950"
            >
              <Sparkles className="h-6 w-6 text-indigo-600" aria-hidden="true" />
              توليد الاختبار عشوائياً بمواصفات تربوية
            </h2>
            <p className="mt-1 text-xs font-semibold text-indigo-700">
              اختر أحد القوالب الوزارية المعتمدة أو حدد ما يناسبك بحرية تخصيص كاملة
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-black/5 hover:text-slate-800"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Notification Pill */}
        {notification && (
          <div className="bg-emerald-50 px-6 py-2.5 text-center text-xs font-bold text-emerald-800 border-b border-emerald-100 flex items-center justify-center gap-2 animate-fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {notification}
          </div>
        )}

        <div className="overflow-y-auto p-6 space-y-6">
          {availableQuestions.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <AlertCircle
                className="mb-3 h-12 w-12 text-amber-500"
                aria-hidden="true"
              />
              <p className="font-bold text-slate-800">
                لا توجد أسئلة متاحة للسحب العشوائي
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                يرجى تغيير الفلاتر (الوحدة / الدرس) لعرض المزيد من الأسئلة في بنك الأسئلة
              </p>
            </div>
          ) : (
            <>
              {/* Presets & Customization Header */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                    <Layers className="h-4 w-4 text-indigo-600" />
                    قوالب سريعة جاهزة (مواصفات الوزارة NCREE):
                  </div>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-rose-600 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    تصفير الأرقام
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyNcree(46, 'ncree-ar')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                      activePreset === 'ncree-ar'
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                        : 'border-indigo-200 bg-white hover:border-indigo-400 text-indigo-950'
                    }`}
                  >
                    <span className="text-xs font-black">لغة عربية (46 سؤالاً)</span>
                    <span className="text-[10px] opacity-80 mt-0.5">85% موضوعي / 15% مقالي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyNcree(44, 'ncree-lang')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                      activePreset === 'ncree-lang'
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                        : 'border-indigo-200 bg-white hover:border-indigo-400 text-indigo-950'
                    }`}
                  >
                    <span className="text-xs font-black">لغات وإنجليزي (44 سؤالاً)</span>
                    <span className="text-[10px] opacity-80 mt-0.5">85% موضوعي / 15% مقالي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyNcree(40, 'ncree-sci')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                      activePreset === 'ncree-sci'
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                        : 'border-indigo-200 bg-white hover:border-indigo-400 text-indigo-950'
                    }`}
                  >
                    <span className="text-xs font-black">علوم ورياضيات (40 سؤالاً)</span>
                    <span className="text-[10px] opacity-80 mt-0.5">85% موضوعي / 15% مقالي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyNcree(20, 'monthly-20')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                      activePreset === 'monthly-20'
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                        : 'border-indigo-200 bg-white hover:border-indigo-400 text-indigo-950'
                    }`}
                  >
                    <span className="text-xs font-black">اختبار شهري (20 سؤالاً)</span>
                    <span className="text-[10px] opacity-80 mt-0.5">متوازن وشامل</span>
                  </button>
                </div>

                {/* Free Custom Total Row */}
                <div className="mt-3.5 pt-3 border-t border-indigo-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-indigo-600" />
                    <span className="font-bold text-slate-700">تخصيص حر لأي عدد إجمالي:</span>
                    <input
                      type="number"
                      min="1"
                      max={totalAvailableInBank}
                      value={customTotalInput}
                      onChange={(e) => setCustomTotalInput(e.target.value)}
                      className="w-16 rounded-lg border border-indigo-300 px-2 py-1 text-center font-bold text-indigo-950 focus:border-indigo-600 focus:outline-none"
                    />
                    <span className="text-[11px] text-slate-500">سؤالاً</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCustomTotalApply(0.85)}
                      className="rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-900 px-3 py-1 font-bold transition-colors text-[11px]"
                    >
                      تطبيق نسبة NCREE (85% / 15%)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCustomTotalApply(0.7)}
                      className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1 font-bold transition-colors text-[11px]"
                    >
                      توزيع متكافئ
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Selection Table */}
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-border">
                      <th scope="col" className="p-3.5 font-bold text-slate-700">
                        نوع السؤال وتصنيفه
                      </th>
                      {DIFFICULTIES.map((d) => (
                        <th key={d.id} scope="col" className="p-3.5 text-center font-bold">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${d.color}`}
                          >
                            {d.label}
                          </span>
                        </th>
                      ))}
                      <th scope="col" className="p-3.5 text-center font-bold text-slate-700">
                        إجمالي النوع
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {TYPES.map((type) => {
                      const rowTotal = Object.values(selection[type.id] || {}).reduce(
                        (a, b) => a + b,
                        0
                      )
                      const rowAvailable = Object.values(
                        availableCounts[type.id] || {}
                      ).reduce((a, b) => a + b, 0)

                      return (
                        <tr key={type.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">
                                {type.label}
                              </span>
                              <span
                                className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${type.badgeColor}`}
                              >
                                {type.category === 'objective' ? 'موضوعي' : 'مقالي'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              متاح بالبنك: {rowAvailable} سؤال
                            </span>
                          </td>
                          {DIFFICULTIES.map((diff) => {
                            const max = availableCounts[type.id]?.[diff.id] || 0
                            const val = selection[type.id]?.[diff.id] || ''
                            return (
                              <td key={diff.id} className="p-3 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    max={max}
                                    value={val}
                                    onChange={(e) =>
                                      handleSelect(
                                        type.id,
                                        diff.id,
                                        e.target.value
                                      )
                                    }
                                    disabled={max === 0}
                                    aria-label={`عدد أسئلة ${type.label} بمستوى ${diff.label}`}
                                    className="w-16 rounded-xl border-2 border-border px-2 py-1 text-center font-bold text-slate-900 focus:border-indigo-600 focus:outline-none disabled:bg-muted/40 disabled:opacity-40"
                                    placeholder="0"
                                  />
                                  <span className="text-[10px] font-semibold text-slate-400">
                                    متاح: {max}
                                  </span>
                                </div>
                              </td>
                            )
                          })}
                          <td className="p-3 text-center">
                            <span className="inline-block min-w-[2rem] rounded-lg bg-slate-100 px-2 py-1 text-xs font-black text-slate-800">
                              {rowTotal}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Live Rubric & Compliance Summary Bar */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">التوزيع النوعي:</span>
                      <span className="rounded-md bg-blue-100 px-2 py-0.5 text-blue-800">
                        موضوعي: {summary.objectiveCount} ({summary.objPct}%)
                      </span>
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-amber-800">
                        مقالي: {summary.essayCount} ({summary.essayPct}%)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 border-r border-slate-300 pr-4">
                      <span className="text-slate-500">مستويات الصعوبة:</span>
                      <span className="text-emerald-700">
                        سهل: {summary.diffTotals.easy}
                      </span>
                      <span className="text-amber-700">
                        متوسط: {summary.diffTotals.medium}
                      </span>
                      <span className="text-red-700">
                        صعب: {summary.diffTotals.hard}
                      </span>
                    </div>
                  </div>

                  <div>
                    {summary.total > 0 && (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black ${
                          summary.isNcreeCompliant
                            ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                            : 'border-indigo-200 bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {summary.isNcreeCompliant ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            متوافق مع معايير NCREE الوزارية (85% ± 5%)
                          </>
                        ) : (
                          <>
                            <Sliders className="h-3.5 w-3.5 text-indigo-600" />
                            تخصيص حر مخصص للمعلم
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between border-t border-border bg-slate-50 px-6 py-4">
          <div className="text-sm font-bold text-slate-600">
            إجمالي الأسئلة المحددة للاختبار:{' '}
            <span className="mx-1 text-2xl font-black text-indigo-600">
              {summary.total}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              (من أصل {totalAvailableInBank} سؤال متاح بالبنك)
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-muted"
            >
              إلغاء
            </button>
            <button
              onClick={handleGenerate}
              disabled={summary.total === 0}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-2.5 text-sm font-black text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" /> إدراج الأسئلة في الاختبار
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
