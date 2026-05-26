'use client'
// components/admin/CreateExamFromLessonClient.tsx
// نموذج إنشاء اختبار من درس — Client Component

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Zap, Save, CheckCircle } from 'lucide-react'

interface Props {
  lesson: { id: number; name_ar: string; duration_minutes: number }
  unit: {
    id: number
    name_ar: string
    subjects: { id: number; name_ar: string }
    grades: { id: number; name_ar: string }
  }
  questions: Array<{
    id: string
    question_type: string
    points: number
    difficulty_level: string
  }>
}

export function CreateExamFromLessonClient({ lesson, unit, questions }: Props) {
  const router = useRouter()
  const supabase = createClient() as any

  const totalPoints = questions.reduce((acc, q) => acc + (q.points || 1), 0)

  const [form, setForm] = useState({
    title: `اختبار درس: ${lesson.name_ar}`,
    duration_minutes: String(lesson.duration_minutes || 30),
    passing_score: '50',
    count: String(Math.min(questions.length, 10)),
    shuffle: true,
    is_published: false,
    exam_type: 'lesson', // lesson / unit / general
  })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [createdExamId, setCreatedExamId] = useState('')

  // اختيار الأسئلة عشوائياً أو كلها
  const getSelectedQuestions = () => {
    const count = Math.min(
      parseInt(form.count) || questions.length,
      questions.length
    )
    if (form.shuffle) {
      return [...questions].sort(() => Math.random() - 0.5).slice(0, count)
    }
    return questions.slice(0, count)
  }

  const handleCreate = async () => {
    setLoading(true)
    setError('')
    try {
      const selectedQ = getSelectedQuestions()
      const calcPoints = selectedQ.reduce((acc, q) => acc + (q.points || 1), 0)

      // 1. إنشاء الاختبار
      const { data: exam, error: examErr } = await supabase
        .from('exams')
        .insert({
          title: form.title,
          subject_id: unit.subjects?.id,
          grade_id: unit.grades?.id,
          duration_minutes: parseInt(form.duration_minutes) || 30,
          passing_score: parseFloat(form.passing_score) || 50,
          is_published: form.is_published,
          shuffle_questions: form.shuffle,
          exam_type: 'lesson',
          lesson_id: lesson.id,
          unit_id: unit.id,
        })
        .select('id')
        .single()

      if (examErr) throw new Error(examErr.message)

      // 2. إضافة الأسئلة للاختبار
      const examQuestions = selectedQ.map((q, idx) => ({
        exam_id: exam.id,
        question_id: q.id,
        question_order: idx + 1,
        points: q.points || 1,
      }))

      const { error: eqErr } = await supabase
        .from('exam_questions')
        .insert(examQuestions)
      if (eqErr) throw new Error(eqErr.message)

      setCreatedExamId(exam.id)
      setDone(true)
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  // Success Screen
  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-white p-10 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <h2 className="mb-2 text-2xl font-bold">تم إنشاء الاختبار! 🎉</h2>
        <p className="mb-8 text-muted-foreground">{form.title}</p>
        <div className="flex justify-center gap-3">
          <a
            href={`/admin/exams/${createdExamId}`}
            className="rounded-xl bg-primary px-6 py-3 font-bold text-white hover:bg-primary/90"
          >
            عرض الاختبار
          </a>
          <a
            href={`/admin/curriculum/lessons/${lesson.id}`}
            className="rounded-xl border border-border px-6 py-3 font-medium hover:bg-muted"
          >
            العودة للدرس
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-white p-8">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          ❌ {error}
        </div>
      )}

      {/* Exam Title */}
      <div>
        <label className="mb-2 block text-sm font-bold">عنوان الاختبار *</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="w-full rounded-xl border-2 border-border px-4 py-3 transition-colors focus:border-primary focus:outline-none"
        />
      </div>

      {/* Questions Count + Duration */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-bold">عدد الأسئلة</label>
          <input
            type="number"
            min="1"
            max={questions.length}
            value={form.count}
            onChange={(e) => setForm((f) => ({ ...f, count: e.target.value }))}
            className="w-full rounded-xl border-2 border-border px-4 py-3 focus:border-primary focus:outline-none"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            من أصل {questions.length} سؤال متاح
          </p>
        </div>
        <div>
          <label className="mb-2 block text-sm font-bold">
            مدة الاختبار (دقيقة)
          </label>
          <input
            type="number"
            min="5"
            value={form.duration_minutes}
            onChange={(e) =>
              setForm((f) => ({ ...f, duration_minutes: e.target.value }))
            }
            className="w-full rounded-xl border-2 border-border px-4 py-3 focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Passing Score */}
      <div>
        <label className="mb-2 block text-sm font-bold">نسبة النجاح %</label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="30"
            max="100"
            step="5"
            value={form.passing_score}
            onChange={(e) =>
              setForm((f) => ({ ...f, passing_score: e.target.value }))
            }
            className="flex-1"
          />
          <span className="w-16 text-center text-2xl font-bold text-primary">
            {form.passing_score}%
          </span>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3">
        <label className="flex cursor-pointer items-center gap-3">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, shuffle: !f.shuffle }))}
            className={`h-6 w-11 shrink-0 rounded-full transition-all ${form.shuffle ? 'bg-primary' : 'bg-muted'}`}
          >
            <span
              className={`mx-0.5 block h-5 w-5 rounded-full bg-white shadow transition-transform ${form.shuffle ? 'translate-x-5' : ''}`}
            />
          </button>
          <span className="text-sm font-medium">خلط الأسئلة عشوائياً</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <button
            type="button"
            onClick={() =>
              setForm((f) => ({ ...f, is_published: !f.is_published }))
            }
            className={`h-6 w-11 shrink-0 rounded-full transition-all ${form.is_published ? 'bg-green-500' : 'bg-muted'}`}
          >
            <span
              className={`mx-0.5 block h-5 w-5 rounded-full bg-white shadow transition-transform ${form.is_published ? 'translate-x-5' : ''}`}
            />
          </button>
          <span className="text-sm font-medium">نشر الاختبار فوراً للطلاب</span>
        </label>
      </div>

      {/* Summary */}
      <div className="rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-5">
        <h4 className="mb-3 font-bold text-green-800">ملخص الاختبار</h4>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-xl font-bold text-green-700">{form.count}</div>
            <div className="text-xs text-green-600">سؤال</div>
          </div>
          <div>
            <div className="text-xl font-bold text-green-700">
              {form.duration_minutes}د
            </div>
            <div className="text-xs text-green-600">المدة</div>
          </div>
          <div>
            <div className="text-xl font-bold text-green-700">
              {form.passing_score}%
            </div>
            <div className="text-xs text-green-600">للنجاح</div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleCreate}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-4 text-lg font-bold text-white shadow-lg shadow-green-500/20 transition-colors hover:bg-green-700 disabled:opacity-60"
      >
        {loading ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <Zap className="h-5 w-5" />
        )}
        {loading ? 'جاري الإنشاء...' : 'إنشاء الاختبار الآن'}
      </button>
    </div>
  )
}
