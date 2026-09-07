'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles, Plus, Loader2 } from 'lucide-react'
import { AIQuestionGeneratorModal } from './AIQuestionGeneratorModal'
import { bulkInsertTeacherQuestionsAction } from '@/app/teacher/questions/actions'
import { toast } from 'sonner'

interface TeacherQuestionsHeaderProps {
  totalCount: number
  showMineOnly: boolean
  myQuestionsCount: number
  subjectId: string
  gradeId: string
}

export function TeacherQuestionsHeader({
  totalCount,
  showMineOnly,
  myQuestionsCount,
  subjectId,
  gradeId,
}: TeacherQuestionsHeaderProps) {
  const router = useRouter()
  const [showAiModal, setShowAiModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleAddAiQuestions = async (questions: any[]) => {
    try {
      setSaving(true)
      const res = await bulkInsertTeacherQuestionsAction(
        questions.map((q) => ({
          question_text: q.question_text || q.text,
          question_type: q.question_type || q.type || 'mcq',
          options: q.options || null,
          correct_answer: q.correct_answer || q.answer,
          explanation: q.explanation || null,
          difficulty_level: q.difficulty_level || 'medium',
          bloom_level: q.bloom_level || 'understand',
          points: q.points || 1,
          context_passage: q.context_passage || null,
          grade_id: gradeId || null,
          subject_id: subjectId || null,
        }))
      )

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`تم حفظ ${res.count} سؤالاً بنجاح في بنك أسئلتك`)
        setShowAiModal(false)
        router.refresh()
      }
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء حفظ الأسئلة')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-800">
            بنك الأسئلة
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            يعرض {totalCount} سؤالاً {showMineOnly && '(أسئلتي فقط)'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all hover:scale-[1.02] hover:from-violet-500 hover:to-indigo-500 active:scale-95"
          >
            <Sparkles className="h-4 w-4 text-yellow-300" />
            توليد بالذكاء الاصطناعي
          </button>

          <Link
            href={
              showMineOnly ? '/teacher/questions' : '/teacher/questions?mine=1'
            }
            className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors ${
              showMineOnly
                ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {showMineOnly ? 'عرض الكل' : `أسئلتي (${myQuestionsCount})`}
          </Link>

          <Link
            href="/teacher/questions/new"
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            إنشاء سؤال
          </Link>
        </div>
      </div>

      {showAiModal && (
        <AIQuestionGeneratorModal
          onClose={() => setShowAiModal(false)}
          onAddQuestions={handleAddAiQuestions}
          subjectId={subjectId}
          gradeId={gradeId}
        />
      )}
    </>
  )
}
