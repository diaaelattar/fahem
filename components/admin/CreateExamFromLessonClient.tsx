'use client'
// components/admin/CreateExamFromLessonClient.tsx
// نموذج إنشاء اختبار من درس — Client Component

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Zap, Save, CheckCircle } from 'lucide-react'

interface Props {
  lesson: { id: number; name_ar: string; duration_minutes: number }
  unit: { id: number; name_ar: string; subjects: { id: number; name_ar: string }; grades: { id: number; name_ar: string } }
  questions: Array<{ id: string; question_type: string; points: number; difficulty_level: string }>
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
    const count = Math.min(parseInt(form.count) || questions.length, questions.length)
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

      const { error: eqErr } = await supabase.from('exam_questions').insert(examQuestions)
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
      <div className="bg-white rounded-2xl border border-border p-10 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">تم إنشاء الاختبار! 🎉</h2>
        <p className="text-muted-foreground mb-8">{form.title}</p>
        <div className="flex gap-3 justify-center">
          <a href={`/admin/exams/${createdExamId}`}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90">
            عرض الاختبار
          </a>
          <a href={`/admin/curriculum/lessons/${lesson.id}`}
            className="border border-border px-6 py-3 rounded-xl font-medium hover:bg-muted">
            العودة للدرس
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-8 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">❌ {error}</div>
      )}

      {/* Exam Title */}
      <div>
        <label className="block text-sm font-bold mb-2">عنوان الاختبار *</label>
        <input type="text" value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-primary transition-colors" />
      </div>

      {/* Questions Count + Duration */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold mb-2">عدد الأسئلة</label>
          <input type="number" min="1" max={questions.length} value={form.count}
            onChange={e => setForm(f => ({ ...f, count: e.target.value }))}
            className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-primary" />
          <p className="text-xs text-muted-foreground mt-1">من أصل {questions.length} سؤال متاح</p>
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">مدة الاختبار (دقيقة)</label>
          <input type="number" min="5" value={form.duration_minutes}
            onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
            className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-primary" />
        </div>
      </div>

      {/* Passing Score */}
      <div>
        <label className="block text-sm font-bold mb-2">نسبة النجاح %</label>
        <div className="flex items-center gap-4">
          <input type="range" min="30" max="100" step="5" value={form.passing_score}
            onChange={e => setForm(f => ({ ...f, passing_score: e.target.value }))}
            className="flex-1" />
          <span className="text-2xl font-bold text-primary w-16 text-center">{form.passing_score}%</span>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <button type="button" onClick={() => setForm(f => ({ ...f, shuffle: !f.shuffle }))}
            className={`w-11 h-6 rounded-full transition-all shrink-0 ${form.shuffle ? 'bg-primary' : 'bg-muted'}`}>
            <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.shuffle ? 'translate-x-5' : ''}`} />
          </button>
          <span className="text-sm font-medium">خلط الأسئلة عشوائياً</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <button type="button" onClick={() => setForm(f => ({ ...f, is_published: !f.is_published }))}
            className={`w-11 h-6 rounded-full transition-all shrink-0 ${form.is_published ? 'bg-green-500' : 'bg-muted'}`}>
            <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.is_published ? 'translate-x-5' : ''}`} />
          </button>
          <span className="text-sm font-medium">نشر الاختبار فوراً للطلاب</span>
        </label>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5">
        <h4 className="font-bold text-green-800 mb-3">ملخص الاختبار</h4>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div><div className="text-xl font-bold text-green-700">{form.count}</div><div className="text-xs text-green-600">سؤال</div></div>
          <div><div className="text-xl font-bold text-green-700">{form.duration_minutes}د</div><div className="text-xs text-green-600">المدة</div></div>
          <div><div className="text-xl font-bold text-green-700">{form.passing_score}%</div><div className="text-xs text-green-600">للنجاح</div></div>
        </div>
      </div>

      {/* Submit */}
      <button onClick={handleCreate} disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-60 shadow-lg shadow-green-500/20">
        {loading ? (
          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : <Zap className="w-5 h-5" />}
        {loading ? 'جاري الإنشاء...' : 'إنشاء الاختبار الآن'}
      </button>
    </div>
  )
}
