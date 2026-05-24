'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Loader2, Sparkles, Upload, FileText, CheckCircle, 
  Trash2, Brain, AlertCircle, HelpCircle, ChevronLeft, Check 
} from 'lucide-react'

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
  gradeId
}: AIQuestionGeneratorModalProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text')
  const [pastedText, setPastedText] = useState('')
  
  // File Upload State
  const [file, setFile] = useState<File | null>(null)
  const [fileBase64, setFileBase64] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Generation options
  const [questionCount, setQuestionCount] = useState<number>(5)
  const [requestedTypes, setRequestedTypes] = useState<string[]>(['mcq'])
  const [targetCognitiveLevel, setTargetCognitiveLevel] = useState<string>('متنوع')
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
    { value: 'مستويات عليا وتفكير ناقد', label: 'مستويات عليا وتفكير ناقد (متقدم)' },
  ]

  // Convert uploaded file to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const validExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'webp']
    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || ''
    
    if (!validExtensions.includes(ext)) {
      setError('امتداد الملف غير مدعوم! يرجى رفع ملف PDF أو صورة (PNG, JPG, WEBP).')
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
    setRequestedTypes(prev => 
      prev.includes(val) 
        ? prev.filter(t => t !== val) 
        : [...prev, val]
    )
  }

  const handleGenerate = async () => {
    setError('')
    setGeneratedQuestions([])
    
    if (activeTab === 'text' && pastedText.trim().length < 20) {
      setError('يرجى إدخال نص كافٍ (20 حرفاً على الأقل) لتوليد الأسئلة بشكل سليم.')
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
          fileExtension: activeTab === 'file' ? file?.name.split('.').pop()?.toLowerCase() : undefined,
          subjectId,
          gradeId,
          questionCount,
          requestedTypes,
          targetCognitiveLevel,
          customInstructions: customInstructions.trim() || undefined,
          passageBased
        })
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
      setError(err.message || 'فشل التوليد، يرجى التحقق من الاتصال والمحاولة مجدداً.')
    } finally {
      setGenerating(false)
    }
  }

  const handleAddSelected = () => {
    const questionsToInsert = generatedQuestions
      .filter((_, idx) => selectedIndices.has(idx))
      .map(q => ({
        id: `ai-${Math.random().toString(36).substr(2, 9)}`,
        question_text: q.question_text || q.text,
        question_type: q.question_type || q.type || 'mcq',
        context_passage: q.context_passage || null,
        difficulty_level: q.difficulty_level || q.difficulty || 'medium',
        points: q.points || 1,
        options: q.options || (q.question_type === 'true_false' ? ['صح', 'خطأ'] : []),
        correct_answer: q.correct_answer || q.answer || '',
        explanation: q.explanation || '',
        status: 'approved',
        is_approved: true
      }))

    onAddQuestions(questionsToInsert)
    onClose()
  }

  const toggleSelectQuestion = (idx: number) => {
    setSelectedIndices(prev => {
      const copy = new Set(prev)
      if (copy.has(idx)) copy.delete(idx)
      else copy.add(idx)
      return copy
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-lg">مساعد التوليد الذكي بالذكاء الاصطناعي (AI)</h3>
              <p className="text-xs text-indigo-100 font-medium">ارفع درسك أو الصق نصًا وسيتكفل النظام ببناء بنك أسئلتك فوراً</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Container */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {generatedQuestions.length === 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {/* Settings Form Column */}
              <div className="md:col-span-2 space-y-4">
                {/* Tabs selection */}
                <div className="flex bg-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => { setActiveTab('text'); setError(''); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'text' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <FileText className="w-4 h-4" />
                    لصق نص الدرس
                  </button>
                  <button
                    onClick={() => { setActiveTab('file'); setError(''); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'file' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <Upload className="w-4 h-4" />
                    رفع مستند أو صورة (PDF/JPG)
                  </button>
                </div>

                {activeTab === 'text' ? (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">نص الدرس أو الفقرة التعليمية</label>
                    <textarea
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="الصق هنا الفقرات التعليمية أو الملخص الدراسي الذي تريد توليد الأسئلة منه..."
                      className="w-full h-64 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-300 focus:outline-none text-sm leading-relaxed"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 block">ملف الدرس</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${file ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'}`}
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
                          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                          <div>
                            <p className="font-bold text-slate-800">{file.name}</p>
                            <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setFile(null)
                              setFileBase64(null)
                            }}
                            className="text-xs text-rose-500 font-bold hover:underline flex items-center gap-1 mx-auto mt-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> إزالة الملف
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-10 h-10 text-slate-400 mx-auto" />
                          <p className="font-bold text-slate-700">اسحب أو انقر لرفع ملف</p>
                          <p className="text-xs text-slate-400">يدعم PDF، أو صور الدرس (الحد الأقصى 8 ميجابايت)</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Config Column */}
              <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
                <div className="space-y-4">
                  <h4 className="font-black text-slate-700 text-sm flex items-center gap-1">
                    <Brain className="w-4 h-4 text-indigo-500" /> إعدادات الأسئلة
                  </h4>

                  {/* Question count */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-500">
                      <span>عدد الأسئلة المطلوبة</span>
                      <span className="text-indigo-600">{questionCount} أسئلة</span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={15}
                      value={questionCount}
                      onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  {/* Cognitive Levels */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">المستوى المعرفي (بلوم)</label>
                    <select
                      value={targetCognitiveLevel}
                      onChange={(e) => setTargetCognitiveLevel(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                      {COGNITIVE_LEVELS.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Question Types */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">الأنواع المطلوبة</label>
                    <div className="grid grid-cols-2 gap-2">
                      {QUESTION_TYPES.map(type => {
                        const active = requestedTypes.includes(type.value)
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => toggleType(type.value)}
                            className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all text-center ${active ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-100' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
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
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <label htmlFor="passageBased" className="text-xs font-bold text-slate-600 cursor-pointer flex items-center gap-1 select-none">
                      أسئلة قائمة على قطع ونصوص مشتركة
                      <span title="يربط الأسئلة بفقرة قراءة أو سياق موحد يوضع في context_passage">
                        <HelpCircle className="w-3 h-3 text-slate-400" />
                      </span>
                    </label>
                  </div>

                  {/* Custom Instructions */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">تعليمات مخصصة إضافية (اختياري)</label>
                    <textarea
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      placeholder="مثال: ركز على القواعد النحوية، أو اجعل الاختيارات قريبة الصعوبة..."
                      className="w-full h-20 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-300 focus:outline-none text-xs"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold rounded-xl flex items-start gap-1.5 leading-tight animate-fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={generating}
                  onClick={handleGenerate}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 mt-4"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري صياغة وتوليد الأسئلة...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      ابدأ التوليد التلقائي
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Result Preview Screen */
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <h4 className="font-black text-slate-800 text-base">تم التوليد بنجاح! 🎉</h4>
                  <p className="text-xs text-slate-500 font-medium">راجع الأسئلة أدناه وحدد التي تود استيرادها لاختبارك</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      if (selectedIndices.size === generatedQuestions.length) setSelectedIndices(new Set())
                      else setSelectedIndices(new Set(generatedQuestions.map((_, i) => i)))
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    {selectedIndices.size === generatedQuestions.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                  </button>
                  <button 
                    onClick={() => setGeneratedQuestions([])}
                    className="px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-100"
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
                      className={`border rounded-2xl p-5 cursor-pointer transition-all relative ${selected ? 'border-indigo-500 bg-indigo-50/10 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                    >
                      <div className="absolute top-5 left-5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shadow-sm" style={{ borderColor: selected ? '#6366f1' : '#cbd5e1', backgroundColor: selected ? '#6366f1' : 'transparent' }}>
                        {selected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>

                      {q.context_passage && (
                        <div className="bg-slate-50 border-r-4 border-indigo-400 p-3 rounded-lg text-xs mb-3 text-slate-600 leading-relaxed font-medium">
                          <strong>سياق مشترك:</strong> {q.context_passage}
                        </div>
                      )}

                      <div className="flex items-start gap-2.5 ml-8">
                        <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded font-bold shrink-0">
                          {QUESTION_TYPES.find(t => t.value === qType)?.label || 'اختيار من متعدد'}
                        </span>
                        <h5 className="font-bold text-slate-800 text-sm leading-relaxed">{q.question_text || q.text}</h5>
                      </div>

                      {qType === 'mcq' && q.options && Array.isArray(q.options) && (
                        <div className="grid grid-cols-2 gap-3 mt-4 ml-8 mr-2">
                          {q.options.map((opt: string, oIdx: number) => (
                            <div 
                              key={oIdx} 
                              className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${opt === q.correct_answer || opt === q.answer ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold' : 'bg-slate-50/50 border-slate-100 text-slate-500'}`}
                            >
                              <span className="w-5 h-5 rounded bg-white border flex items-center justify-center font-bold">{String.fromCharCode(65 + oIdx)}</span>
                              <span>{opt}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {qType === 'true_false' && (
                        <div className="flex gap-4 mt-4 ml-8">
                          <span className={`px-4 py-1.5 rounded-xl border text-xs font-bold ${q.correct_answer === 'صح' || q.correct_answer === 'true' || q.correct_answer === true ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>صح</span>
                          <span className={`px-4 py-1.5 rounded-xl border text-xs font-bold ${q.correct_answer === 'خطأ' || q.correct_answer === 'false' || q.correct_answer === false ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>خطأ</span>
                        </div>
                      )}

                      {q.explanation && (
                        <div className="mt-4 ml-8 pt-3 border-t border-slate-100 text-xs text-slate-500 leading-relaxed font-medium">
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
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-sm font-bold transition-colors"
          >
            إلغاء
          </button>
          
          {generatedQuestions.length > 0 && (
            <button
              onClick={handleAddSelected}
              disabled={selectedIndices.size === 0}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-100"
            >
              استيراد الأسئلة المحددة ({selectedIndices.size})
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
