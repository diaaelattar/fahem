'use client'

import { useState } from 'react'
import { Printer, Eye, EyeOff } from 'lucide-react'
import { MathRenderer } from '@/components/ui/MathRenderer'

export function PrintExamClient({ exam, questions }: { exam: any, questions: any[] }) {
  const [showAnswers, setShowAnswers] = useState(false)

  const handlePrint = () => {
    window.print()
  }

  // To fix LaTeX math rendering, we rely on the global MathJax script loaded in layout
  // and the dangerouslySetInnerHTML works with it.

  return (
    <div className="min-h-screen bg-slate-100 p-8 print:p-0 print:bg-white" dir="rtl">
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
      <div className="max-w-[210mm] mx-auto bg-white shadow-xl rounded-sm print:shadow-none print:rounded-none min-h-[297mm]">
        {/* Exam Header */}
        <div className="p-8 border-b-2 border-slate-800">
          <div className="text-center space-y-2 mb-6">
            <h1 className="text-2xl font-bold font-display">{exam.title}</h1>
            <p className="text-slate-600 font-medium">
              المادة: {exam.subjects?.name_ar} | الصف: {exam.grades?.name_ar}
            </p>
            <div className="flex items-center justify-center gap-6 text-sm font-bold text-slate-700 mt-2">
              <span>الزمن: {exam.duration_minutes} دقيقة</span>
              <span>الدرجة الكلية: {exam.total_points}</span>
              <span>عدد الأسئلة: {exam.questions_count}</span>
            </div>
          </div>
          
          {/* Student Name Box */}
          {!showAnswers && (
             <div className="flex items-center gap-4 mt-6">
                <span className="font-bold">اسم الطالب: </span>
                <div className="flex-1 border-b-2 border-slate-300 border-dotted" />
             </div>
          )}
        </div>

        {/* Questions */}
        <div className="p-8 space-y-8">
          {questions.map((q, idx) => (
            <div key={q.id} className="space-y-3 break-inside-avoid">
              <div className="flex items-start gap-2">
                <span className="font-bold shrink-0">{idx + 1}.</span>
                <div className="flex-1">
                  {q.context_passage && (
                    <div className="bg-slate-50 p-3 rounded mb-3 text-sm italic border border-slate-200">
                      <MathRenderer text={q.context_passage} />
                    </div>
                  )}
                  <div className="font-medium text-lg leading-relaxed">
                    <MathRenderer text={q.question_text} />
                  </div>
                </div>
                <div className="shrink-0 text-sm font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded">
                  ({q.points_override ?? q.points} درجات)
                </div>
              </div>

              {/* Options for MCQ */}
              {q.question_type === 'mcq' && q.options && (
                <div className="grid grid-cols-2 gap-y-3 gap-x-6 pr-6">
                  {q.options.map((opt: string, oIdx: number) => {
                    const isCorrect = showAnswers && opt === q.correct_answer;
                    return (
                      <div key={oIdx} className={`flex items-center gap-2 text-base ${isCorrect ? 'font-bold text-green-700' : ''}`}>
                        <div className={`w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center shrink-0 ${isCorrect ? 'bg-green-100 border-green-600' : ''}`}>
                           {isCorrect && <div className="w-2 h-2 rounded-full bg-green-600" />}
                        </div>
                        <MathRenderer text={opt} />
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Text answer areas for non-MCQ */}
              {!showAnswers && q.question_type !== 'mcq' && (
                <div className="mt-4 space-y-6 pr-6">
                  <div className="border-b border-slate-300 border-dotted w-full" />
                  <div className="border-b border-slate-300 border-dotted w-full" />
                </div>
              )}

              {/* Show Model Answer */}
              {showAnswers && (
                <div className="mt-3 pr-6">
                  {q.question_type !== 'mcq' && (
                    <div className="bg-green-50 p-3 rounded border border-green-200 mb-2">
                      <span className="font-bold text-green-800 text-sm block mb-1">الإجابة الصحيحة:</span>
                      <div className="text-green-700 font-medium">
                        <MathRenderer text={q.correct_answer} />
                      </div>
                    </div>
                  )}
                  {q.explanation && (
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <span className="font-bold text-blue-800 text-sm block mb-1">التفسير:</span>
                      <div className="text-blue-700 text-sm">
                        <MathRenderer text={q.explanation} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
