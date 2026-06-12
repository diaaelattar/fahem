'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Loader2,
  Sparkles,
  Upload,
  FileText,
  CheckCircle,
  Trash2,
  Brain,
  AlertCircle,
  HelpCircle,
  ChevronLeft,
  Check,
} from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface AIQuestionGeneratorModalProps {
  onClose: () => void
  onAddQuestions: (questions: any[]) => void
  subjectId: string
  gradeId: string
}

export function AIQuestionGeneratorModal({
  onClose,
  onAddQuestions,
  subjectId,
  gradeId,
}: AIQuestionGeneratorModalProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text')
  const [pastedText, setPastedText] = useState('')

  // File Upload State
  const [file, setFile] = useState<File | null>(null)
  const [fileBase64, setFileBase64] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useFocusTrap(modalRef, true, onClose)

  // Generation options
  const [questionCount, setQuestionCount] = useState<number>(5)
  const [requestedTypes, setRequestedTypes] = useState<string[]>(['mcq'])
  const [targetCognitiveLevel, setTargetCognitiveLevel] =
    useState<string>('متنوع')
  const [customInstructions, setCustomInstructions] = useState('')
  const [passageBased, setPassageBased] = useState(false)

  // Generation process state
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([])
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())

  // Types list
  const QUESTION_TYPES = [
    { value: 'mcq', label: 'اختيار من متعدد' },
    { value: 'true_false', label: 'صح وخطأ' },
    { value: 'fill_blank', label: 'أكمل الفراغ' },
    { value: 'essay', label: 'سؤال مقالي' },
  ]

  // Cognitive levels list
  const COGNITIVE_LEVELS = [
    { value: 'متنوع', label: 'متنوع وموازٍ' },
    { value: 'تذكر', label: 'تذكر (معرفي بسيط)' },
    { value: 'فهم وتطبيق', label: 'فهم وتطبيق (متوسط)' },
    {
      value: 'مستويات عليا وتفكير ناقد',
      label: 'مستويات عليا وتفكير ناقد (متقدم)',
    },
  ]

  // Convert uploaded file to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const validExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'webp']
    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || ''

    if (!validExtensions.includes(ext)) {
      setError(
        'امتداد الملف غير مدعوم! يرجى رفع ملف PDF أو صورة (PNG, JPG, WEBP).'
      )
      return
    }

    if (selectedFile.size > 8 * 1024 * 1024) {
      setError('حجم الملف كبير جداً! الحد الأقصى المسموح به هو 8 ميجابايت.')
      return
    }

    setFile(selectedFile)

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64Data = reader.result.split(',')[1]
        setFileBase64(base64Data)
      }
    }
    reader.readAsDataURL(selectedFile)
  }

  const toggleType = (val: string) => {
    setRequestedTypes((prev) =>
      prev.includes(val) ? prev.filter((t) => t !== val) : [...prev, val]
    )
  }

  const handleGenerate = async () => {
    setError('')
    setGeneratedQuestions([])

    if (activeTab === 'text' && pastedText.trim().length < 20) {
      setError(
        'يرجى إدخال نص كافٍ (20 حرفاً على الأقل) لتوليد الأسئلة بشكل سليم.'
      )
      return
    }

    if (activeTab === 'file' && !fileBase64) {
      setError('يرجى رفع ملف درس أو صورة أولاً.')
      return
    }

    if (requestedTypes.length === 0) {
      setError('يرجى اختيار نوع أسئلة واحد على الأقل.')
      return
    }

    setGenerating(true)

    try {
      const response = await fetch('/api/teacher/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pastedText: activeTab === 'text' ? pastedText : undefined,
          fileData: activeTab === 'file' ? fileBase64 : undefined,
          fileExtension:
            activeTab === 'file'
              ? file?.name.split('.').pop()?.toLowerCase()
              : undefined,
          subjectId,
          gradeId,
          questionCount,
          requestedTypes,
          targetCognitiveLevel,
          customInstructions: customInstructions.trim() || undefined,
          passageBased,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ غير متوقع أثناء التوليد')
      }

      const qs = data.questions || []
      setGeneratedQuestions(qs)
      // Select all by default
      setSelectedIndices(new Set(qs.map((_: any, i: number) => i)))
    } catch (err: any) {
      setError(
        err.message || 'فشل التوليد، يرجى التحقق من الاتصال والمحاولة مجدداً.'
      )
    } finally {
      setGenerating(false)
    }
  }

  const handleAddSelected = () => {
    const questionsToInsert = generatedQuestions
      .filter((_, idx) => selectedIndices.has(idx))
      .map((q) => ({
        id: `ai-${Math.random().toString(36).substr(2, 9)}`,
        question_text: q.question_text || q.text,
        question_type: q.question_type || q.type || 'mcq',
        context_passage: q.context_passage || null,
        difficulty_level: q.difficulty_level || q.difficulty || 'medium',
        points: q.points || 1,
        options:
          q.options || (q.question_type === 'true_false' ? ['صح', 'خطأ'] : []),
        correct_answer: q.correct_answer || q.answer || '',
        explanation: q.explanation || '',
        status: 'approved',
        is_approved: true,
      }))

    onAddQuestions(questionsToInsert)
    onClose()
  }

  const toggleSelectQuestion = (idx: number) => {
    setSelectedIndices((prev) => {
      const copy = new Set(prev)
      if (copy.has(idx)) copy.delete(idx)
      else copy.add(idx)
      return copy
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      dir="rtl"
    >
      <motion.div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-generator-title"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-white/10 p-2">
              <Sparkles className="h-5 w-5 animate-pulse text-amber-300" aria-hidden="true" />
            </div>
            <div>
              <h3 id="ai-generator-title" className="text-lg font-black">
                مساعد التوليد الذكي بالذكاء الاصطناعي (AI)
              </h3>
              <p className="text-xs font-medium text-indigo-100">
                ارفع درسك أو الصق نصًا وسيتكفل النظام ببناء بنك أسئلتك فوراً
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="rounded-full bg-white/10 p-1.5 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content Container */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {generatedQuestions.length === 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {/* Settings Form Column */}
              <div className="space-y-4 md:col-span-2">
                {/* Tabs selection */}
                <div className="flex rounded-xl bg-slate-100 p-1">
                  <button
                    onClick={() => {
                      setActiveTab('text')
                      setError('')
                    }}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-bold transition-all ${activeTab === 'text' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    لصق نص الدرس
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('file')
                      setError('')
                    }}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-bold transition-all ${activeTab === 'file' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    رفع مستند أو صورة (PDF/JPG)
                  </button>
                </div>

                {activeTab === 'text' ? (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">
                      نص الدرس أو الفقرة التعليمية
                    </label>
                    <textarea
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="الصق هنا الفقرات التعليمية أو الملخص الدراسي الذي تريد توليد الأسئلة منه..."
                      className="h-64 w-full rounded-2xl border border-slate-200 p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500">
                      ملف الدرس
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all ${file ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-300 bg-slate-50/50 hover:border-indigo-400 hover:bg-slate-50'}`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg,.webp"
                      />
                      {file ? (
                        <div className="space-y-2">
                          <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" aria-hidden="true" />
                          <div>
                            <p className="font-bold text-slate-800">
                              {file.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setFile(null)
                              setFileBase64(null)
                            }}
                            className="mx-auto mt-2 flex items-center gap-1 text-xs font-bold text-rose-500 hover:underline"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> إزالة الملف
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
                          <p className="font-bold text-slate-700">
                            اسحب أو انقر لرفع ملف
                          </p>
                          <p className="text-xs text-slate-400">
                            يدعم PDF، أو صور الدرس (الحد الأقصى 8 ميجابايت)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Config Column */}
              <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="space-y-4">
                  <h4 className="flex items-center gap-1 text-sm font-black text-slate-700">
                    <Brain className="h-4 w-4 text-indigo-500" aria-hidden="true" /> إعدادات
                    الأسئلة
                  </h4>

                  {/* Question count */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-500">
                      <span>عدد الأسئلة المطلوبة</span>
                      <span className="text-indigo-600">
                        {questionCount} أسئلة
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={15}
                      value={questionCount}
                      onChange={(e) =>
                        setQuestionCount(parseInt(e.target.value))
                      }
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  {/* Cognitive Levels */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">
                      المستوى المعرفي (بلوم)
                    </label>
                    <select
                      value={targetCognitiveLevel}
                      onChange={(e) => setTargetCognitiveLevel(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                      {COGNITIVE_LEVELS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Question Types */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">
                      الأنواع المطلوبة
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {QUESTION_TYPES.map((type) => {
                        const active = requestedTypes.includes(type.value)
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => toggleType(type.value)}
                            className={`rounded-lg border px-2 py-1.5 text-center text-xs font-bold transition-all ${active ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-100' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                          >
                            {type.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Passage-based question */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="passageBased"
                      checked={passageBased}
                      onChange={(e) => setPassageBased(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label
                      htmlFor="passageBased"
                      className="flex cursor-pointer select-none items-center gap-1 text-xs font-bold text-slate-600"
                    >
                      أسئلة قائمة على قطع ونصوص مشتركة
                      <span title="يربط الأسئلة بفقرة قراءة أو سياق موحد يوضع في context_passage">
                        <HelpCircle className="h-3 w-3 text-slate-400" aria-hidden="true" />
                      </span>
                    </label>
                  </div>

                  {/* Custom Instructions */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">
                      تعليمات مخصصة إضافية (اختياري)
                    </label>
                    <textarea
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      placeholder="مثال: ركز على القواعد النحوية، أو اجعل الاختيارات قريبة الصعوبة..."
                      className="h-20 w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex animate-fade-in items-start gap-1.5 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs font-bold leading-tight text-rose-700">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" aria-hidden="true" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={generating}
                  onClick={handleGenerate}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-100 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      جاري صياغة وتوليد الأسئلة...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-amber-300" aria-hidden="true" />
                      ابدأ التوليد التلقائي
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Result Preview Screen */
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div>
                  <h4 className="text-base font-black text-slate-800">
                    تم التوليد بنجاح! 🎉
                  </h4>
                  <p className="text-xs font-medium text-slate-500">
                    راجع الأسئلة أدناه وحدد التي تود استيرادها لاختبارك
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (selectedIndices.size === generatedQuestions.length)
                        setSelectedIndices(new Set())
                      else
                        setSelectedIndices(
                          new Set(generatedQuestions.map((_, i) => i))
                        )
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    {selectedIndices.size === generatedQuestions.length
                      ? 'إلغاء تحديد الكل'
                      : 'تحديد الكل'}
                  </button>
                  <button
                    onClick={() => setGeneratedQuestions([])}
                    className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100"
                  >
                    توليد جديد 🔄
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {generatedQuestions.map((q: any, idx: number) => {
                  const selected = selectedIndices.has(idx)
                  const qType = q.question_type || q.type || 'mcq'
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleSelectQuestion(idx)}
                      className={`relative cursor-pointer rounded-2xl border p-5 transition-all ${selected ? 'border-indigo-500 bg-indigo-50/10 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    >
                      <div
                        className="absolute left-5 top-5 flex h-6 w-6 items-center justify-center rounded-full border-2 shadow-sm transition-colors"
                        style={{
                          borderColor: selected ? '#6366f1' : '#cbd5e1',
                          backgroundColor: selected ? '#6366f1' : 'transparent',
                        }}
                      >
                        {selected && (
                          <Check className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                        )}
                      </div>

                      {q.context_passage && (
                        <div className="mb-3 rounded-lg border-r-4 border-indigo-400 bg-slate-50 p-3 text-xs font-medium leading-relaxed text-slate-600">
                          <strong>سياق مشترك:</strong> {q.context_passage}
                        </div>
                      )}

                      <div className="ml-8 flex items-start gap-2.5">
                        <span className="shrink-0 rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                          {QUESTION_TYPES.find((t) => t.value === qType)
                            ?.label || 'اختيار من متعدد'}
                        </span>
                        <h5 className="text-sm font-bold leading-relaxed text-slate-800">
                          {q.question_text || q.text}
                        </h5>
                      </div>

                      {qType === 'mcq' &&
                        q.options &&
                        Array.isArray(q.options) && (
                          <div className="ml-8 mr-2 mt-4 grid grid-cols-2 gap-3">
                            {q.options.map((opt: string, oIdx: number) => (
                              <div
                                key={oIdx}
                                className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-medium ${opt === q.correct_answer || opt === q.answer ? 'border-emerald-300 bg-emerald-50 font-bold text-emerald-700' : 'border-slate-100 bg-slate-50/50 text-slate-500'}`}
                              >
                                <span className="flex h-5 w-5 items-center justify-center rounded border bg-white font-bold">
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span>{opt}</span>
                              </div>
                            ))}
                          </div>
                        )}

                      {qType === 'true_false' && (
                        <div className="ml-8 mt-4 flex gap-4">
                          <span
                            className={`rounded-xl border px-4 py-1.5 text-xs font-bold ${q.correct_answer === 'صح' || q.correct_answer === 'true' || q.correct_answer === true ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                          >
                            صح
                          </span>
                          <span
                            className={`rounded-xl border px-4 py-1.5 text-xs font-bold ${q.correct_answer === 'خطأ' || q.correct_answer === 'false' || q.correct_answer === false ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                          >
                            خطأ
                          </span>
                        </div>
                      )}

                      {q.explanation && (
                        <div className="ml-8 mt-4 border-t border-slate-100 pt-3 text-xs font-medium leading-relaxed text-slate-500">
                          💡 <strong>التفسير العلمي:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100"
          >
            إلغاء
          </button>

          {generatedQuestions.length > 0 && (
            <button
              onClick={handleAddSelected}
              disabled={selectedIndices.size === 0}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-100 transition-colors hover:bg-indigo-700 disabled:opacity-60"
            >
              استيراد الأسئلة المحددة ({selectedIndices.size})
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
