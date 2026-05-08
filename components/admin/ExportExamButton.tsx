'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ExportExamButtonProps {
  examId: string
  examTitle: string
}

export function ExportExamButton({ examId, examTitle }: ExportExamButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const supabase = createClient() as any

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Fetch exam data
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single()
      
      if (examError) throw examError

      // Fetch questions
      const { data: questionsData, error: qError } = await supabase
        .from('exam_questions')
        .select('question_order, questions(*)')
        .eq('exam_id', examId)
        .order('question_order')

      if (qError) throw qError

      // Format for Google Forms or general JSON
      const exportData = {
        title: examData.title,
        description: examData.instructions || '',
        duration_minutes: examData.duration_minutes,
        questions: questionsData.map((eq: any) => ({
          type: eq.questions.question_type,
          text: eq.questions.question_text,
          points: eq.questions.points,
          options: eq.questions.options,
          correct_answer: eq.questions.correct_answer,
          explanation: eq.questions.explanation,
          bloom_level: eq.questions.bloom_level
        }))
      }

      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `exam_${examTitle.replace(/\s+/g, '_')}_export.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      alert('تم تصدير الاختبار بنجاح. يمكنك استخدام هذا الملف لاستيراد الأسئلة في أنظمة أخرى.')
    } catch (error: any) {
      console.error(error)
      alert('حدث خطأ أثناء تصدير الاختبار: ' + error.message)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
      title="تصدير الاختبار بصيغة JSON (متوافق مع أدوات التحويل إلى Google Forms)"
    >
      {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      تصدير
    </button>
  )
}
