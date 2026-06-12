'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles, AlertCircle, Info, Sliders, CheckCircle2 } from 'lucide-react'
import { TYPE_AR, DIFF_AR, DIFF_COLOR, TYPE_COLOR, QuestionItem } from './ExamBuilderTypes'
import { MathRenderer } from '@/components/ui/MathRenderer'
import { toast } from 'sonner'


interface Props {
  isOpen: boolean
  onClose: () => void
  bankQuestions: QuestionItem[]
  selectedQuestions: any[]
  onAdd: (q: QuestionItem) => void
  onRemove: (id: string) => void
  gradeName?: string
}

export function CprtSimulatorModal({
  isOpen,
  onClose,
  bankQuestions,
  selectedQuestions,
  onAdd,
  onRemove,
  gradeName = '',
}: Props) {
  // Inputs
  const [totalQuestions, setTotalQuestions] = useState(10)
  const [totalPoints, setTotalPoints] = useState(20)

  // Distribution Ratios
  const [objectiveRatio, setObjectiveRatio] = useState(85) // MCQ / TF
  const [subjectiveRatio, setSubjectiveRatio] = useState(15) // Essay / Blank

  const [easyRatio, setEasyRatio] = useState(30)
  const [mediumRatio, setMediumRatio] = useState(40)
  const [hardRatio, setHardRatio] = useState(30)

  // Results
  const [generatedQuestions, setGeneratedQuestions] = useState<QuestionItem[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [step, setStep] = useState<'config' | 'preview'>('config')

  // Detect grade level to set default ratios automatically
  useEffect(() => {
    if (isOpen) {
      const isHighSchool =
        gradeName.includes('الأول الثانوي') ||
        gradeName.includes('الثاني الثانوي') ||
        gradeName.includes('الثالث الثانوي') ||
        gradeName.includes('ثانوي')

      if (isHighSchool) {
        setObjectiveRatio(85)
        setSubjectiveRatio(15)
        toast.info('تم ضبط النسب تلقائياً بناءً على مواصفات المرحلة الثانوية المصرية (85% موضوعي / 15% مقالي)')
      } else {
        setObjectiveRatio(100)
        setSubjectiveRatio(0)
        toast.info('تم ضبط النسب تلقائياً بناءً على مواصفات المراحل الأساسية (100% موضوعي)')
      }
      setStep('config')
      setGeneratedQuestions([])
      setWarnings([])
    }
  }, [isOpen, gradeName])

  // Handle bidirectional ratio changes
  const handleObjectiveRatioChange = (val: number) => {
    setObjectiveRatio(val)
    setSubjectiveRatio(100 - val)
  }

  const handleSubjectiveRatioChange = (val: number) => {
    setSubjectiveRatio(val)
    setObjectiveRatio(100 - val)
  }

  // Handle difficulty ratio changes (keep total at 100%)
  const handleDiffRatioChange = (type: 'easy' | 'medium' | 'hard', value: number) => {
    if (type === 'easy') {
      setEasyRatio(value)
      const remainder = 100 - value
      // Distribute remainder between medium and hard proportionally
      const sumOther = mediumRatio + hardRatio
      if (sumOther > 0) {
        setMediumRatio(Math.round((mediumRatio / sumOther) * remainder))
        setHardRatio(100 - value - Math.round((mediumRatio / sumOther) * remainder))
      } else {
        setMediumRatio(Math.round(remainder / 2))
        setHardRatio(remainder - Math.round(remainder / 2))
      }
    } else if (type === 'medium') {
      setMediumRatio(value)
      const remainder = 100 - value
      const sumOther = easyRatio + hardRatio
      if (sumOther > 0) {
        setEasyRatio(Math.round((easyRatio / sumOther) * remainder))
        setHardRatio(100 - value - Math.round((easyRatio / sumOther) * remainder))
      } else {
        setEasyRatio(Math.round(remainder / 2))
        setHardRatio(remainder - Math.round(remainder / 2))
      }
    } else {
      setHardRatio(value)
      const remainder = 100 - value
      const sumOther = easyRatio + mediumRatio
      if (sumOther > 0) {
        setEasyRatio(Math.round((easyRatio / sumOther) * remainder))
        setMediumRatio(100 - value - Math.round((easyRatio / sumOther) * remainder))
      } else {
        setEasyRatio(Math.round(remainder / 2))
        setMediumRatio(remainder - Math.round(remainder / 2))
      }
    }
  }

  const handleGenerate = () => {
    if (bankQuestions.length === 0) {
      toast.error('بنك الأسئلة فارغ، يرجى تهيئة الأسئلة أولاً.')
      return
    }

    // Calculate targets
    const targetObjCount = Math.round(totalQuestions * (objectiveRatio / 100))
    const targetSubCount = totalQuestions - targetObjCount

    const targetEasyCount = Math.round(totalQuestions * (easyRatio / 100))
    const targetHardCount = Math.round(totalQuestions * (hardRatio / 100))
    const targetMedCount = totalQuestions - targetEasyCount - targetHardCount

    // Classify bank questions into categories
    const isObjective = (q: QuestionItem) =>
      q.question_type === 'mcq' || q.question_type === 'true_false'
    const isSubjective = (q: QuestionItem) =>
      q.question_type === 'essay' || q.question_type === 'fill_blank'

    const buckets: Record<string, QuestionItem[]> = {
      obj_easy: bankQuestions.filter(q => isObjective(q) && q.difficulty_level === 'easy'),
      obj_medium: bankQuestions.filter(q => isObjective(q) && q.difficulty_level === 'medium'),
      obj_hard: bankQuestions.filter(q => isObjective(q) && q.difficulty_level === 'hard'),
      sub_easy: bankQuestions.filter(q => isSubjective(q) && q.difficulty_level === 'easy'),
      sub_medium: bankQuestions.filter(q => isSubjective(q) && q.difficulty_level === 'medium'),
      sub_hard: bankQuestions.filter(q => isSubjective(q) && q.difficulty_level === 'hard'),
    }

    const selected: QuestionItem[] = []
    const newWarnings: string[] = []

    // Helper to draw questions from a bucket
    const draw = (bucketKey: string, count: number): QuestionItem[] => {
      const bucket = buckets[bucketKey]
      const drawn: QuestionItem[] = []

      // Shuffle helper
      const shuffled = [...bucket].sort(() => 0.5 - Math.random())

      for (let i = 0; i < Math.min(count, shuffled.length); i++) {
        drawn.push(shuffled[i])
        // Remove from original bucket so it's not selected twice
        buckets[bucketKey] = buckets[bucketKey].filter(x => x.id !== shuffled[i].id)
      }
      return drawn
    }

    // 1. Calculate target slots for each cell in the 2x3 matrix
    // e.g. target obj_easy slots = targetObjCount * (easyRatio/100)
    let slots = {
      obj_easy: Math.round(targetObjCount * (easyRatio / 100)),
      obj_hard: Math.round(targetObjCount * (hardRatio / 100)),
      sub_easy: Math.round(targetSubCount * (easyRatio / 100)),
      sub_hard: Math.round(targetSubCount * (hardRatio / 100)),
    } as any

    slots.obj_medium = targetObjCount - slots.obj_easy - slots.obj_hard
    slots.sub_medium = targetSubCount - slots.sub_easy - slots.sub_hard

    // Adjust in case of negative or incorrect sums due to rounding
    if (slots.obj_medium < 0) slots.obj_medium = 0
    if (slots.sub_medium < 0) slots.sub_medium = 0

    // Draw for each cell
    const cells = ['obj_easy', 'obj_medium', 'obj_hard', 'sub_easy', 'sub_medium', 'sub_hard']
    const drawnMap = {} as any

    cells.forEach(cell => {
      const count = slots[cell] || 0
      drawnMap[cell] = draw(cell, count)
      selected.push(...drawnMap[cell])

      if (drawnMap[cell].length < count) {
        const diffName = cell.includes('easy') ? 'سهل' : cell.includes('hard') ? 'صعب' : 'متوسط'
        const typeName = cell.includes('obj') ? 'موضوعي' : 'مقالي'
        newWarnings.push(`عجز في أسئلة [${typeName} - ${diffName}]: تم سحب ${drawnMap[cell].length} من أصل ${count}`)
      }
    })

    // 2. Handle deficit using a general pool of unused questions
    let deficit = totalQuestions - selected.length
    if (deficit > 0) {
      // Find any unused questions in the bank
      const usedIds = new Set(selected.map(s => s.id))
      let remainingPool = bankQuestions.filter(q => !usedIds.has(q.id))

      if (remainingPool.length < deficit) {
        newWarnings.push(`عجز كلي في بنك الأسئلة: يتوفر ${bankQuestions.length} سؤال فقط بينما المطلوب ${totalQuestions}`)
        deficit = remainingPool.length
      }

      // Draw from pool
      const shuffledPool = [...remainingPool].sort(() => 0.5 - Math.random())
      for (let i = 0; i < deficit; i++) {
        selected.push(shuffledPool[i])
      }
      if (deficit > 0) {
        newWarnings.push(`تم تعويض ${deficit} سؤال مفقود بسحب عشوائي بديل من الأسئلة المتاحة.`)
      }
    }

    // Set points override if necessary to match total points
    // Basic logic: distribute points roughly
    const basePoints = Math.floor(totalPoints / totalQuestions)
    let remainderPoints = totalPoints % totalQuestions

    const finalQuestions = selected.map((q, idx) => {
      const extra = idx < remainderPoints ? 1 : 0
      return {
        ...q,
        points: basePoints + extra, // override local points for simulator preview
      }
    })

    setGeneratedQuestions(finalQuestions)
    setWarnings(newWarnings)
    setStep('preview')
  }

  const handleApply = () => {
    // Clear old selections
    selectedQuestions.forEach(q => onRemove(q.id))
    // Add new ones
    generatedQuestions.forEach(q => {
      onAdd({
        ...q,
        points_override: q.points, // pass the computed simulator points
      } as any)
    })
    toast.success('تم تطبيق الامتحان الذكي بنجاح!')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div
        className="flex h-[90vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">
                محاكي الامتحان المصري المعياري (CPRT)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                توليد وسحب أسئلة ذكي يطابق المعايير التربوية المصرية والصف المختار ({gradeName})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'config' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Right Side: Setup Inputs */}
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                  مواصفات هيكل الاختبار
                </h3>

                {/* Questions and Points inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">عدد الأسئلة الكلي</label>
                    <input
                      type="number"
                      min={2}
                      max={100}
                      value={totalQuestions}
                      onChange={e => setTotalQuestions(parseInt(e.target.value) || 10)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">الدرجة الكلية</label>
                    <input
                      type="number"
                      min={2}
                      max={150}
                      value={totalPoints}
                      onChange={e => setTotalPoints(parseInt(e.target.value) || 20)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Type Distribution Sliders */}
                <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800">توزيع نوع الأسئلة</span>
                    <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                      مجموع النسب: {objectiveRatio + subjectiveRatio}%
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-600">
                        <span>أسئلة موضوعية (MCQ / صح وخطأ)</span>
                        <span>{objectiveRatio}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={objectiveRatio}
                        onChange={e => handleObjectiveRatioChange(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-600">
                        <span>أسئلة مقالية (Essay / أكمل)</span>
                        <span>{subjectiveRatio}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={subjectiveRatio}
                        onChange={e => handleSubjectiveRatioChange(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Difficulty Distribution Sliders */}
                <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800">توزيع مستويات الصعوبة</span>
                    <span className="text-xs bg-indigo-55 text-indigo-700 font-bold px-2 py-0.5 rounded-full bg-indigo-50">
                      مجموع النسب: {easyRatio + mediumRatio + hardRatio}%
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-600">
                        <span>سهل (المستويات الدنيا لبلوم)</span>
                        <span className="text-green-600 font-bold">{easyRatio}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={easyRatio}
                        onChange={e => handleDiffRatioChange('easy', parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-600">
                        <span>متوسط (التطبيق والفهم)</span>
                        <span className="text-amber-600 font-bold">{mediumRatio}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={mediumRatio}
                        onChange={e => handleDiffRatioChange('medium', parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-600">
                        <span>صعب (التحليل والتقييم والإبداع)</span>
                        <span className="text-red-600 font-bold">{hardRatio}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={hardRatio}
                        onChange={e => handleDiffRatioChange('hard', parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Left Side: Educational Guidelines */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-55/20 bg-slate-50 p-6 space-y-4">
                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                    <Info className="h-4 w-4 text-primary" />
                    المعايير التربوية المطبقة:
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4 pr-1">
                    <li>
                      <strong>المرحلة الثانوية:</strong> النسبة القياسية هي 85% للأسئلة الموضوعية و 15% للأسئلة المقالية.
                    </li>
                    <li>
                      <strong>المرحلة الأساسية:</strong> النسبة القياسية هي 100% للأسئلة الموضوعية لتبسيط قياس الكفاءات الإدراكية.
                    </li>
                    <li>
                      <strong>توزيع الصعوبة:</strong> 30% للمعرفة والتذكر، 40% للفهم والتطبيق، و 30% لمهارات التفكير العليا.
                    </li>
                    <li>
                      <strong>التوزيع التلقائي للدرجات:</strong> يتم توزيع الدرجة الكلية بالتساوي تقريبياً على عدد الأسئلة مع تعويض الفروقات آلياً.
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex justify-between text-xs border-b border-slate-100 pb-2 mb-2">
                    <span className="text-slate-500">مجموع الأسئلة المتاحة بالصف والفلتر</span>
                    <span className="font-bold text-slate-900">{bankQuestions.length} سؤال</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div className="bg-green-50 p-1.5 rounded border border-green-100">
                      <span className="block text-green-700 font-bold">سهل</span>
                      <span className="text-slate-600 font-medium">
                        {bankQuestions.filter(q => q.difficulty_level === 'easy').length} Q
                      </span>
                    </div>
                    <div className="bg-amber-50 p-1.5 rounded border border-amber-100">
                      <span className="block text-amber-700 font-bold">متوسط</span>
                      <span className="text-slate-600 font-medium">
                        {bankQuestions.filter(q => q.difficulty_level === 'medium').length} Q
                      </span>
                    </div>
                    <div className="bg-red-50 p-1.5 rounded border border-red-100">
                      <span className="block text-red-700 font-bold">صعب</span>
                      <span className="text-slate-600 font-medium">
                        {bankQuestions.filter(q => q.difficulty_level === 'hard').length} Q
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  بدء المحاكاة وتوليد الاختبار
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Warnings Banner */}
              {warnings.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-2">
                  <h4 className="text-sm font-bold text-amber-800 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    تنبيهات خوارزمية السحب الذكي:
                  </h4>
                  <ul className="text-xs text-amber-700 space-y-1 list-disc pl-4 pr-1">
                    {warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview List of Generated Questions */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
                  <span>الأسئلة المقترحة للامتحان ({generatedQuestions.length} سؤال)</span>
                  <span className="text-xs text-primary font-medium">مجموع درجات المحاكاة: {totalPoints} درجة</span>
                </h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {generatedQuestions.map((q, idx) => (
                    <div key={q.id} className="rounded-xl border border-slate-100 bg-white p-4 text-sm space-y-2 shadow-sm flex items-start justify-between">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            {TYPE_AR[q.question_type] || q.question_type}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${DIFF_COLOR[q.difficulty_level]}`}>
                            {DIFF_AR[q.difficulty_level] || q.difficulty_level}
                          </span>
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                            درجة السؤال: {q.points}
                          </span>
                        </div>
                        <div
                          className="font-semibold text-slate-800 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: q.question_text }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex items-center justify-end gap-3">
          {step === 'preview' ? (
            <>
              <button
                type="button"
                onClick={() => setStep('config')}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                تعديل المواصفات
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                تطبيق واعتماد الاختبار
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              إلغاء
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
