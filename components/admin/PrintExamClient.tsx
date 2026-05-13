'use client'

import { useState } from 'react'
import { Printer, Eye, EyeOff } from 'lucide-react'
import { MathRenderer } from '@/components/ui/MathRenderer'

/**
 * Strip LaTeX blocks, math expressions, numbers, and operators from text
 * so that only meaningful language characters remain for direction detection.
 */
const stripMathContent = (text: string): string => {
  return text
    // Remove LaTeX inline: \( ... \) and \[ ... \]
    .replace(/\\[\[\(][\s\S]*?\\[\]\)]/g, ' ')
    // Remove dollar-sign math: $...$ and $$...$$
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$]*?\$/g, ' ')
    // Remove common LaTeX commands
    .replace(/\\[a-zA-Z]+\{[^}]*\}/g, ' ')
    .replace(/\\[a-zA-Z]+/g, ' ')
    // Remove digits, math operators, parentheses
    .replace(/[0-9+\-*/=<>()\[\]{}^_.,%;:]/g, ' ')
    .trim()
}

/** Check if text contains any Arabic character — used for short strings like subject names */
const hasArabic = (text: string): boolean => /[\u0600-\u06FF]/.test(text)

/**
 * Detect RTL from question text using ratio approach (for mixed-language math content).
 * Strips math function names (sin, cos, log…) before counting characters.
 * Returns true if Arabic chars ≥ 20% of remaining letter characters.
 */
const detectRTLFromQuestionText = (text: string): boolean | null => {
  let cleaned = stripMathContent(text)
  // Also strip common math English words that are NOT language indicators
  cleaned = cleaned.replace(/\b(sin|cos|tan|log|ln|lim|max|min|mod|det|sec|csc|cot|exp|sqrt|deg|var|let|if|in|at|of|to|cm|mm|km|kg|mg)\b/gi, ' ')
  const arabicChars = (cleaned.match(/[\u0600-\u06FF]/g) || []).length
  const latinChars = (cleaned.match(/[a-zA-Z]/g) || []).length
  const total = arabicChars + latinChars
  if (total < 5) return null // not enough meaningful data
  return arabicChars / total >= 0.20
}

export function PrintExamClient({ exam, questions }: { exam: any, questions: any[] }) {
  const [showAnswers, setShowAnswers] = useState(false)

  // --- Determine text direction ---
  // 1. Subject name: any Arabic character = definitively RTL
  const subjectName = exam.subjects?.name_ar || ''
  const examTitle = exam.title || ''

  let isRTL: boolean | null = null

  if (hasArabic(subjectName)) {
    isRTL = true   // e.g. "الرياضيات" → RTL ✓
  } else if (subjectName.length > 1) {
    isRTL = false  // e.g. "Mathematics" → LTR ✓
  }

  // 2. Fallback to exam title (same logic)
  if (isRTL === null) {
    if (hasArabic(examTitle)) {
      isRTL = true
    } else if (examTitle.length > 1) {
      isRTL = false
    }
  }

  // 3. Fallback: sample first 5 questions' text with ratio check
  if (isRTL === null && questions.length > 0) {
    const sampleText = questions.slice(0, 5).map((q: any) => q.question_text || '').join(' ')
    isRTL = detectRTLFromQuestionText(sampleText)
  }

  // 4. Final fallback: RTL (Arabic-first platform)
  if (isRTL === null) isRTL = true

  const dir = isRTL ? 'rtl' : 'ltr'
  const textAlign = isRTL ? 'text-right' : 'text-left'

  const handlePrint = () => {
    window.print()
  }

  // To fix LaTeX math rendering, we rely on the global MathJax script loaded in layout
  // and the dangerouslySetInnerHTML works with it.

  // Group questions by type
  const groupedQuestions = questions.reduce((acc, q) => {
    if (!acc[q.question_type]) acc[q.question_type] = []
    acc[q.question_type].push(q)
    return acc
  }, {} as Record<string, any[]>)

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
  
  // Ordered types
  const typeOrder = ['mcq', 'true_false', 'fill_blank', 'correction', 'essay']
  const activeGroups = typeOrder.filter(t => groupedQuestions[t] && groupedQuestions[t].length > 0)

  return (
    <div className="min-h-screen bg-slate-100 p-8 print:p-0 print:bg-white" dir={dir}>
      {/* Control Bar (Hidden in Print) */}
      <div className="max-w-4xl mx-auto bg-white p-4 rounded-xl shadow-sm mb-8 flex items-center justify-between print:hidden">
        <h2 className="font-bold text-slate-800">إعدادات الطباعة</h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAnswers(!showAnswers)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-bold transition-colors"
          >
            {showAnswers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showAnswers ? 'إخفاء نموذج الإجابة' : 'إظهار نموذج الإجابة'}
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white hover:bg-primary/90 rounded-lg text-sm font-bold transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            طباعة PDF
          </button>
        </div>
      </div>

      {/* Print A4 Container */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-xl min-h-[297mm] print:shadow-none print:w-full print:max-w-none print:m-0 relative">
        {/* Frame for print */}
        <div className="print:border-[3px] print:border-double print:border-slate-800 min-h-[297mm] m-4 print:m-0 print:p-2">
          <div className="print:border print:border-slate-800 min-h-full">
            {/* Exam Header - Official Style */}
            <div className="p-6 border-b-4 border-double border-slate-800 flex justify-between items-start">
              {/* Right Side (Arabic) */}
              <div className="text-sm font-bold leading-relaxed text-slate-800 space-y-1">
                <p>مديرية التربية والتعليم بـ .......................</p>
                <p>إدارة ....................... التعليمية</p>
                <p>مدرسة .......................</p>
              </div>

              {/* Center - Title */}
              <div className="text-center space-y-3 flex-1 px-4">
                <h1 className="text-3xl font-black text-slate-900 border-b-2 border-slate-800 inline-block pb-1 px-4">
                  {exam.title}
                </h1>
                <p className="text-lg font-bold text-slate-800">
                  المادة: {exam.subjects?.name_ar} | الصف: {exam.grades?.name_ar}
                </p>
              </div>

              {/* Left Side (Student info box for print) */}
              <div className="text-sm font-bold text-slate-800 border-2 border-slate-800 p-2 rounded-lg w-48 text-center space-y-2">
                <p>الزمن: {exam.duration_minutes} دقيقة</p>
                <p className="border-t border-slate-800 pt-1">الدرجة الكلية: {exam.total_points}</p>
              </div>
            </div>
            
            {/* Student Details Row */}
            {!showAnswers && (
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
            const groupQ = groupedQuestions[type]
            const questionNumbersAR = ['السؤال الأول', 'السؤال الثاني', 'السؤال الثالث', 'السؤال الرابع', 'السؤال الخامس']
            const questionNumbersEN = ['Question One', 'Question Two', 'Question Three', 'Question Four', 'Question Five']
            const questionNumbers = isRTL ? questionNumbersAR : questionNumbersEN
            const fallbackLabel = isRTL ? `السؤال ${groupIdx + 1}` : `Question ${groupIdx + 1}`
            const groupTitle = `${questionNumbers[groupIdx] || fallbackLabel}: ${questionTypeTitles[type]}`

            return (
              <div key={type} className="space-y-6">
                <h3 className={`font-bold text-xl text-slate-800 border-b-2 border-slate-800 pb-2 mb-6 ${textAlign}`} dir={dir}>
                  {groupTitle}
                </h3>
                <div className="space-y-8">
                  {groupQ.map((q: any, idx: number) => (
                    <div key={q.id} className="space-y-3 break-inside-avoid">
              <div className="flex items-start gap-2" dir={dir}>
                <span className="font-bold shrink-0">{idx + 1}.</span>
                <div className={`flex-1 ${textAlign}`}>
                  {q.context_passage && (
                    <div className="bg-slate-50 p-3 rounded mb-3 text-sm italic border border-slate-200">
                      <MathRenderer text={q.context_passage} dir={dir} />
                    </div>
                  )}
                  <div className={`flex ${
                    q.image_position === 'top' ? 'flex-col-reverse' :
                    q.image_position === 'right' ? 'flex-row-reverse gap-6 items-start' :
                    q.image_position === 'left' ? 'flex-row gap-6 items-start' :
                    'flex-col' // bottom (default)
                  }`}>
                    <div className="flex-1 font-medium text-lg leading-relaxed">
                      <MathRenderer text={q.question_text.replace(/^(\(?\d+[[\)\.\-\s]\s*)/, '').trim()} dir={dir} />
                    </div>
                    {q.question_image_url && (
                      <div className={`text-center shrink-0 ${
                        q.image_position === 'right' || q.image_position === 'left' ? 'w-1/3' : 'mt-4 w-full'
                      }`}>
                        <img
                          src={q.question_image_url}
                          alt="صورة السؤال"
                          className="max-h-48 object-contain inline-block border border-slate-200 rounded-lg shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-sm font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded">
                  ({q.points_override ?? q.points} درجات)
                </div>
              </div>

              {/* Options for MCQ */}
              {q.question_type === 'mcq' && q.options && (
                <div className={`grid grid-cols-2 gap-y-3 gap-x-6 ${isRTL ? 'pr-6' : 'pl-6'}`}>
                  {q.options.map((opt: string, oIdx: number) => {
                    const isCorrect = showAnswers && opt === q.correct_answer;
                    return (
                      <div key={oIdx} className={`flex items-center gap-2 text-base ${isCorrect ? 'font-bold text-green-700' : ''}`}>
                        <div className={`w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center shrink-0 ${isCorrect ? 'bg-green-100 border-green-600' : ''}`}>
                           {isCorrect && <div className="w-2 h-2 rounded-full bg-green-600" />}
                        </div>
                        <MathRenderer text={opt} dir={dir} />
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Text answer areas for non-MCQ */}
              {!showAnswers && q.question_type !== 'mcq' && (
                <div className={`mt-6 space-y-8 ${isRTL ? 'pr-6' : 'pl-6'} mb-4`}>
                  {Array.from({ length: q.question_type === 'essay' ? 8 : 2 }).map((_, i) => (
                    <div key={i} className="border-b-2 border-slate-300 border-dashed w-full" />
                  ))}
                </div>
              )}

              {/* Show Model Answer */}
              {showAnswers && (
                <div className={`mt-3 ${isRTL ? 'pr-6' : 'pl-6'}`}>
                  {q.question_type !== 'mcq' && (
                    <div className="bg-green-50 p-3 rounded border border-green-200 mb-2">
                      <span className="font-bold text-green-800 text-sm block mb-1">الإجابة الصحيحة:</span>
                      <div className="text-green-700 font-medium">
                        <MathRenderer text={q.correct_answer} dir={dir} />
                      </div>
                    </div>
                  )}
                  {q.explanation && (
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <span className="font-bold text-blue-800 text-sm block mb-1">التفسير:</span>
                      <div className="text-blue-700 text-sm">
                        <MathRenderer text={q.explanation} dir={dir} />
                      </div>
                    </div>
                  )}
                </div>
              )}
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
