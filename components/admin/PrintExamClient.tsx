'use client'

import { useState, useEffect } from 'react'
import { Printer, Eye, EyeOff, LayoutList } from 'lucide-react'
import { MathRenderer } from '@/components/ui/MathRenderer'

const stripMathContent = (text: string): string => {
  return text
    .replace(/\\[\[\(][\s\S]*?\\[\]\)]/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$]*?\$/g, ' ')
    .replace(/\\[a-zA-Z]+\{[^}]*\}/g, ' ')
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[0-9+\-*/=<>()\[\]{}^_.,%;:]/g, ' ')
    .trim()
}

const hasArabic = (text: string): boolean => /[\u0600-\u06FF]/.test(text)

const detectRTLFromQuestionText = (text: string): boolean | null => {
  let cleaned = stripMathContent(text)
  cleaned = cleaned.replace(/\b(sin|cos|tan|log|ln|lim|max|min|mod|det|sec|csc|cot|exp|sqrt|deg|var|let|if|in|at|of|to|cm|mm|km|kg|mg)\b/gi, ' ')
  const arabicChars = (cleaned.match(/[\u0600-\u06FF]/g) || []).length
  const latinChars = (cleaned.match(/[a-zA-Z]/g) || []).length
  const total = arabicChars + latinChars
  if (total < 5) return null
  return arabicChars / total >= 0.20
}

export type AnswerMode = 'none' | 'short' | 'full'

export function PrintExamClient({ exam, questions }: { exam: any; questions: any[] }) {
  const [answerMode, setAnswerMode] = useState<AnswerMode>('none')
  const [showSectionHeaders, setShowSectionHeaders] = useState(true)
  const [hiddenQuestions, setHiddenQuestions] = useState<Set<string>>(new Set())

  // --- Print Header Settings ---
  const [localSettings, setLocalSettings] = useState({
    directorate: '',
    administration: '',
    schoolName: '',
    academicYear: '',
    teacherName: '',
    classSection: '',
    examDate: '',
  })

  useEffect(() => {
    const handleSettingsChange = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail) {
        setLocalSettings(customEvent.detail)
      }
    }
    window.addEventListener('print-settings-changed', handleSettingsChange)

    // Load initial from localStorage if available (fallback)
    const stored = localStorage.getItem(`print_settings_exam_${exam.id}`)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setLocalSettings(prev => ({
          ...prev,
          teacherName: parsed.teacherName ?? '',
          classSection: parsed.classSection ?? '',
          examDate: parsed.examDate ?? '',
        }))
      } catch {}
    }

    return () => {
      window.removeEventListener('print-settings-changed', handleSettingsChange)
    }
  }, [exam.id])

  const toggleQuestionVisibility = (qId: string) => {
    setHiddenQuestions(prev => {
      const next = new Set(prev)
      if (next.has(qId)) next.delete(qId)
      else next.add(qId)
      return next
    })
  }

  // --- Direction detection ---
  const subjectName = exam.subjects?.name_ar || ''
  const examTitle = exam.title || ''
  let isRTL: boolean | null = null

  if (hasArabic(subjectName)) isRTL = true
  else if (subjectName.length > 1) isRTL = false

  if (isRTL === null) {
    if (hasArabic(examTitle)) isRTL = true
    else if (examTitle.length > 1) isRTL = false
  }

  if (isRTL === null && questions.length > 0) {
    const sampleText = questions.slice(0, 5).map((q: any) => q.question_text || '').join(' ')
    isRTL = detectRTLFromQuestionText(sampleText)
  }

  if (isRTL === null) isRTL = true

  const dir = isRTL ? 'rtl' : 'ltr'
  const textAlign = isRTL ? 'text-right' : 'text-left'

  const handlePrint = () => window.print()

  const questionTypeTitlesAR: Record<string, string> = {
    mcq: 'اختر الإجابة الصحيحة',
    true_false: 'ضع علامة (✓) أو (✗)',
    fill_blank: 'أكمل الفراغات الآتية',
    correction: 'صوّب ما تحته خط',
    essay: 'أجب عن الأسئلة الآتية',
  }

  const questionTypeTitlesEN: Record<string, string> = {
    mcq: 'Choose the Correct Answer',
    true_false: 'Put True (✓) or False (✗)',
    fill_blank: 'Fill in the Blanks',
    correction: 'Correct the Underlined',
    essay: 'Answer the Following Questions',
  }

  const questionTypeTitles = isRTL ? questionTypeTitlesAR : questionTypeTitlesEN

  interface PassageBlock { passage: string | null; questions: any[] }
  const typeOrder = ['mcq', 'true_false', 'fill_blank', 'correction', 'essay']
  const groupedByType: Record<string, PassageBlock[]> = {}

  for (const q of questions) {
    if (hiddenQuestions.has(q.id)) continue
    const t = q.question_type
    if (!groupedByType[t]) groupedByType[t] = []
    const blocks = groupedByType[t]
    const lastBlock = blocks[blocks.length - 1]
    const passage = q.context_passage || null
    if (lastBlock && lastBlock.passage === passage) {
      lastBlock.questions.push(q)
    } else {
      const existing = blocks.find(b => b.passage === passage)
      if (existing) existing.questions.push(q)
      else blocks.push({ passage, questions: [q] })
    }
  }

  const activeGroups = typeOrder.filter(t => groupedByType[t] && groupedByType[t].length > 0)
  const hiddenCount = hiddenQuestions.size

  return (
    <div className="min-h-screen bg-slate-100 p-8 print:p-0 print:bg-white" dir={dir}>

      {/* ─── Control Bar (hidden when printing) ─── */}
      <div className="max-w-4xl mx-auto bg-white p-4 rounded-xl shadow-sm mb-4 print:hidden" dir="rtl">
        <h2 className="font-bold text-slate-800 mb-4 text-base">⚙️ إعدادات الطباعة</h2>

        {/* Row 1: answer mode + print */}
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
            {(['none', 'short', 'full'] as AnswerMode[]).map(mode => (
              <button key={mode}
                onClick={() => setAnswerMode(mode)}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${answerMode === mode
                  ? mode === 'none' ? 'bg-white text-slate-800 shadow-sm'
                  : mode === 'short' ? 'bg-indigo-100 text-indigo-800 shadow-sm'
                  : 'bg-green-100 text-green-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'}`}
              >
                {mode === 'none' ? 'إخفاء الإجابات' : mode === 'short' ? 'الحل المختصر' : 'الحل الكامل'}
              </button>
            ))}
          </div>
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white hover:bg-primary/90 rounded-lg text-sm font-bold transition-colors shadow-sm">
            <Printer className="w-4 h-4" />
            طباعة PDF
          </button>
        </div>

        {/* Row 2: section headers toggle + hidden count */}
        <div className="flex items-center gap-3 flex-wrap border-t border-slate-100 pt-3">
          <button onClick={() => setShowSectionHeaders(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border-2 transition-all ${
              showSectionHeaders ? 'border-primary bg-primary/5 text-primary' : 'border-slate-300 bg-slate-50 text-slate-500'}`}>
            <LayoutList className="w-4 h-4" />
            {showSectionHeaders ? 'رؤوس الأقسام: ظاهرة' : 'رؤوس الأقسام: مخفية'}
          </button>

          {hiddenCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-orange-700 font-bold bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg">
                🙈 {hiddenCount} سؤال مخفي من الطباعة
              </span>
              <button onClick={() => setHiddenQuestions(new Set())}
                className="text-xs text-slate-500 hover:text-red-600 underline">
                إظهار الكل
              </button>
            </div>
          )}

          <p className="text-xs text-slate-400 mr-auto">
            💡 انقر على أيقونة العين بجانب أي سؤال لإخفائه من الطباعة
          </p>
        </div>
      </div>

      {/* Hidden questions list */}
      {hiddenCount > 0 && (
        <div className="max-w-4xl mx-auto mb-4 print:hidden" dir="rtl">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <p className="text-sm font-bold text-orange-800 mb-2">الأسئلة المخفية من الطباعة:</p>
            <div className="flex flex-wrap gap-2">
              {questions.filter(q => hiddenQuestions.has(q.id)).map(q => (
                <button key={q.id} onClick={() => toggleQuestionVisibility(q.id)}
                  className="flex items-center gap-1.5 bg-white border border-orange-300 text-orange-800 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-orange-100 transition-colors">
                  <Eye className="w-3 h-3" />
                  <span className="line-clamp-1 max-w-[200px]">{q.question_text?.slice(0, 40)}...</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── A4 Print Container ─── */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-xl min-h-[297mm] print:shadow-none print:w-full print:max-w-none print:m-0">
        <div className="print:border-[3px] print:border-double print:border-slate-800 min-h-[297mm] m-4 print:m-0 print:p-2">
          <div className="print:border print:border-slate-800 min-h-full">

            {/* Exam Header */}
            <div className="p-6 border-b-4 border-double border-slate-800 flex justify-between items-start">
              <div className="w-48"></div>
              <div className="text-center space-y-3 flex-1 px-4">
                <h1 className="text-3xl font-black text-slate-900 border-b-2 border-slate-800 inline-block pb-1 px-4">
                  {exam.title}
                </h1>
                <p className="text-lg font-bold text-slate-800">
                  المادة: {exam.subjects?.name_ar} | الصف: {exam.grades?.name_ar}
                  {localSettings.academicYear && ` | العام الدراسي: ${localSettings.academicYear}`}
                </p>
                {(localSettings.teacherName || localSettings.classSection || localSettings.examDate) && (
                  <p className="text-xs font-bold text-slate-600 mt-1">
                    {localSettings.teacherName && `معلم المادة: ${localSettings.teacherName}`}
                    {localSettings.classSection && ` | الشعبة: ${localSettings.classSection}`}
                    {localSettings.examDate && ` | التاريخ: ${new Date(localSettings.examDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                  </p>
                )}
              </div>
              <div className="text-sm font-bold text-slate-800 border-2 border-slate-800 p-2 rounded-lg w-48 text-center space-y-2">
                <p>الزمن: {exam.duration_minutes} دقيقة</p>
                <p className="border-t border-slate-800 pt-1">الدرجة الكلية: {exam.total_points}</p>
              </div>
            </div>

            {/* Student row */}
            {answerMode === 'none' && (
              <div className="px-8 py-4 border-b-2 border-slate-800 flex items-center gap-6 bg-slate-50 print:bg-white text-base font-bold">
                <div className="flex-1 flex items-center gap-2">
                  <span>اسم الطالب: </span>
                  <div className="flex-1 border-b-2 border-slate-400 border-dotted" />
                </div>
                <div className="w-48 flex items-center gap-2">
                  <span>رقم الجلوس: </span>
                  <div className="flex-1 border-b-2 border-slate-400 border-dotted" />
                </div>
              </div>
            )}

            {/* Questions */}
            <div className="p-8 space-y-12">
              {activeGroups.map((type, groupIdx) => {
                const blocks = groupedByType[type]
                const labelsAR = ['السؤال الأول', 'السؤال الثاني', 'السؤال الثالث', 'السؤال الرابع', 'السؤال الخامس']
                const labelsEN = ['Question One', 'Question Two', 'Question Three', 'Question Four', 'Question Five']
                const labels = isRTL ? labelsAR : labelsEN
                const fallback = isRTL ? `السؤال ${groupIdx + 1}` : `Question ${groupIdx + 1}`
                const groupTitle = `${labels[groupIdx] || fallback}: ${questionTypeTitles[type]}`
                let qCounter = 0

                return (
                  <div key={type} className="space-y-6">
                    {showSectionHeaders && (
                      <h3 className={`font-bold text-xl text-slate-800 border-b-2 border-slate-800 pb-2 mb-6 ${textAlign}`} dir={dir}>
                        {groupTitle}
                      </h3>
                    )}

                    <div className="space-y-8">
                      {blocks.map((block, blockIdx) => (
                        <div key={blockIdx} className="space-y-4">

                          {/* Passage */}
                          {block.passage && (
                            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 mb-4 break-inside-avoid" dir={dir}>
                              <p className="font-bold text-amber-900 text-sm mb-3 border-b border-amber-300 pb-2">
                                {isRTL ? 'اقرأ النص التالي ثم أجب عن الأسئلة:' : 'Read the following passage then answer the questions:'}
                              </p>
                              <MathRenderer text={block.passage} dir={dir} />
                            </div>
                          )}

                          {/* Questions */}
                          {block.questions.map((q: any) => {
                            qCounter++
                            const num = qCounter
                            const isHidden = hiddenQuestions.has(q.id)
                            return (
                              <div key={q.id} className={`space-y-3 break-inside-avoid ${block.passage ? 'pr-4 border-r-2 border-amber-200' : ''}`}>
                                <div className="flex items-start gap-2" dir={dir}>
                                  <span className="font-bold shrink-0 text-lg">{num}.</span>
                                  <div className={`flex-1 ${textAlign}`}>
                                    <div className={`flex ${
                                      q.image_position === 'top' ? 'flex-col-reverse' :
                                      q.image_position === 'right' ? 'flex-row-reverse gap-6 items-start' :
                                      q.image_position === 'left' ? 'flex-row gap-6 items-start' : 'flex-col'
                                    }`}>
                                      <div className="flex-1 font-medium text-lg leading-relaxed">
                                        <MathRenderer text={q.question_text.replace(/^(\(?\d+[[\)\.\-\s]\s*)/, '').trim()} dir={dir} />
                                      </div>
                                      {q.question_image_url && (
                                        <div className={`text-center shrink-0 ${q.image_position === 'right' || q.image_position === 'left' ? 'w-1/3' : 'mt-4 w-full'}`}>
                                          <img src={q.question_image_url} alt="صورة السؤال" className="max-h-48 object-contain inline-block border border-slate-200 rounded-lg shadow-sm" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="shrink-0 text-sm font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded">
                                    ({q.points_override ?? q.points} درجات)
                                  </div>

                                  {/* Hide/Show toggle — screen only */}
                                  <button
                                    onClick={() => toggleQuestionVisibility(q.id)}
                                    title={isHidden ? 'إظهار السؤال' : 'إخفاء السؤال من الطباعة'}
                                    className={`print:hidden shrink-0 p-1.5 rounded-lg border transition-all ${
                                      isHidden
                                        ? 'bg-orange-100 border-orange-300 text-orange-600 hover:bg-orange-200'
                                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500'
                                    }`}
                                  >
                                    {isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                  </button>
                                </div>

                                {/* MCQ options */}
                                {q.question_type === 'mcq' && q.options && (() => {
                                  const maxLen = Math.max(...q.options.map((o: string) => o.length))
                                  const cols = maxLen > 40 ? 'grid-cols-1' : maxLen > 15 ? 'grid-cols-2' : 'grid-cols-4'
                                  return (
                                    <div className={`grid ${cols} gap-y-3 gap-x-6 ${isRTL ? 'pr-6' : 'pl-6'}`}>
                                      {q.options.map((opt: string, oIdx: number) => {
                                        const correct = answerMode !== 'none' && opt === q.correct_answer
                                        return (
                                          <div key={oIdx} className={`flex items-start gap-2 text-base ${correct ? 'font-bold text-green-700' : ''}`}>
                                            <div className={`mt-1 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${correct ? 'bg-green-100 border-green-600' : 'border-slate-400'}`}>
                                              {correct && <div className="w-2 h-2 rounded-full bg-green-600" />}
                                            </div>
                                            <div className="flex-1"><MathRenderer text={opt} dir={dir} /></div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )
                                })()}

                                {/* Answer lines */}
                                {answerMode === 'none' && q.question_type !== 'mcq' && (
                                  <div className={`mt-6 space-y-8 ${isRTL ? 'pr-6' : 'pl-6'} mb-4`}>
                                    {Array.from({ length: q.question_type === 'essay' ? 8 : 2 }).map((_, i) => (
                                      <div key={i} className="border-b-2 border-slate-300 border-dashed w-full" />
                                    ))}
                                  </div>
                                )}

                                {/* Model answer */}
                                {answerMode !== 'none' && (
                                  <div className={`mt-3 space-y-2 ${isRTL ? 'pr-6' : 'pl-6'}`}>
                                    {q.question_type !== 'mcq' && (
                                      <div className="bg-green-50 p-3 rounded border border-green-200">
                                        <span className="font-bold text-green-800 text-sm block mb-1">الإجابة الصحيحة:</span>
                                        <div className="text-green-700 font-medium"><MathRenderer text={q.correct_answer} dir={dir} /></div>
                                      </div>
                                    )}
                                    {answerMode === 'full' && q.explanation && (
                                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                        <span className="font-bold text-blue-800 text-sm block mb-1">التفسير:</span>
                                        <div className="text-blue-700 text-sm"><MathRenderer text={q.explanation} dir={dir} /></div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
