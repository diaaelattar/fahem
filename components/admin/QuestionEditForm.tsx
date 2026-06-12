'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { GeometricShapeBuilder } from '@/components/shared/GeometricShapeBuilder'

export function QuestionEditForm({
  question,
  subjects,
  grades,
}: {
  question: any
  subjects: any[]
  grades: any[]
}) {
  const router = useRouter()
  const supabase = createClient()

  const [questionText, setQuestionText] = useState(question.question_text)
  const [options, setOptions] = useState<string[]>(
    question.options ||
      (question.question_type === 'mcq' ? ['', '', '', ''] : [])
  )
  const [correctAnswer, setCorrectAnswer] = useState(question.correct_answer)
  const [explanation, setExplanation] = useState(question.explanation || '')
  const [difficulty, setDifficulty] = useState(question.difficulty_level)
  const [points, setPoints] = useState(question.points)
  const [subjectId, setSubjectId] = useState(
    question.subject_id?.toString() || ''
  )
  const [gradeId, setGradeId] = useState(question.grade_id?.toString() || '')
  const [isApproved, setIsApproved] = useState(question.is_approved)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showSvgBuilder, setShowSvgBuilder] = useState(false)

  const handleSave = async () => {
    if (!questionText.trim()) {
      toast.error('نص السؤال مطلوب')
      return
    }
    if (!correctAnswer.trim()) {
      toast.error('الإجابة الصحيحة مطلوبة')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('questions')
        .update({
          question_text: questionText.trim(),
          options:
            question.question_type === 'mcq' ? options : question.options,
          correct_answer: correctAnswer.trim(),
          explanation: explanation.trim() || null,
          difficulty_level: difficulty,
          points,
          subject_id: subjectId ? parseInt(subjectId) : null,
          grade_id: gradeId ? parseInt(gradeId) : null,
          is_approved: isApproved,
        })
        .eq('id', question.id)

      if (error) throw error
      toast.success('تم تحديث السؤال بنجاح!')
      setTimeout(() => router.push('/admin/questions'), 800)
    } catch (err: any) {
      toast.error('خطأ في التحديث: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من حذف هذا السؤال؟ لا يمكن التراجع.')) return
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', question.id)
      if (error) throw error
      toast.success('تم حذف السؤال بنجاح')
      router.push('/admin/questions')
    } catch (err: any) {
      toast.error('خطأ في الحذف: ' + err.message)
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-white p-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold">نص السؤال *</label>
          <button
            type="button"
            onClick={() => setShowSvgBuilder(true)}
            className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary transition-all hover:bg-primary/10"
          >
            🎨 رسم هندسي (SVG)
          </button>
        </div>
        <textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-xl border border-border px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {question.question_type === 'mcq' && (
        <div>
          <label className="mb-2 block text-sm font-semibold">
            خيارات الإجابة
          </label>
          <div className="space-y-2">
            {options.map((opt: string, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground">
                  {['أ', 'ب', 'ج', 'د'][i]}
                </span>
                <input
                  value={opt}
                  onChange={(e) =>
                    setOptions((prev) =>
                      prev.map((o: string, j: number) =>
                        j === i ? e.target.value : o
                      )
                    )
                  }
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm focus:outline-none ${correctAnswer === opt ? 'border-green-400 bg-green-50' : 'border-border'}`}
                />
                <button
                  onClick={() => setCorrectAnswer(opt)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${correctAnswer === opt ? 'border-green-500 bg-green-500 text-white' : 'border-border hover:border-green-400'}`}
                >
                  {correctAnswer === opt ? '✓ صحيح' : 'تعيين'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {question.question_type === 'fill_blank' && (
        <div>
          <label className="mb-2 block text-sm font-semibold">
            الإجابة الصحيحة *
          </label>
          <input
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      )}

      {question.question_type === 'true_false' && (
        <div>
          <label className="mb-2 block text-sm font-semibold">
            الإجابة الصحيحة *
          </label>
          <div className="flex gap-3">
            {['صح', 'خطأ'].map((opt) => (
              <button
                key={opt}
                onClick={() => setCorrectAnswer(opt)}
                className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-bold transition-all ${correctAnswer === opt ? (opt === 'صح' ? 'border-green-400 bg-green-50 text-green-700' : 'border-red-400 bg-red-50 text-red-700') : 'border-border'}`}
              >
                {opt === 'صح' ? '✅ صح' : '❌ خطأ'}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-semibold">شرح الإجابة</label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold">الصعوبة</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm focus:outline-none"
          >
            <option value="easy">سهل</option>
            <option value="medium">متوسط</option>
            <option value="hard">صعب</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">الدرجة</label>
          <input
            type="number"
            min={1}
            max={20}
            value={points}
            onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
            className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">المادة</label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm focus:outline-none"
          >
            <option value="">غير محدد</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name_ar}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">الصف</label>
          <select
            value={gradeId}
            onChange={(e) => setGradeId(e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm focus:outline-none"
          >
            <option value="">غير محدد</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name_ar}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <input
          type="checkbox"
          id="approved"
          checked={isApproved}
          onChange={(e) => setIsApproved(e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
        <label htmlFor="approved" className="text-sm font-medium">
          معتمد (يظهر في بنك الأسئلة)
        </label>
      </div>

      <div className="flex items-center gap-3 border-t border-border pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          حفظ التغييرات
        </button>
        <button
          onClick={() => router.back()}
          className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          إلغاء
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="mr-auto flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          حذف السؤال
        </button>
      </div>

      <GeometricShapeBuilder
        isOpen={showSvgBuilder}
        onClose={() => setShowSvgBuilder(false)}
        onInsert={(svg) => setQuestionText((prev: string) => (prev ? prev + '\n' + svg : svg))}
      />
    </div>
  )
}
