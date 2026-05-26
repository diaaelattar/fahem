'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Save, Plus, Trash2, HelpCircle } from 'lucide-react'
import { RichTextEditor } from '@/components/ui/RichTextEditor'

export default function NewQuestionPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [subjects, setSubjects] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])

  const [formData, setFormData] = useState({
    subject_id: '',
    grade_id: '',
    question_type: 'mcq',
    question_text: '',
    correct_answer: '',
    explanation: '',
    difficulty_level: 'medium',
    bloom_level: 'understand',
    points: 1,
    options: ['', '', '', ''],
  })

  useEffect(() => {
    async function fetchData() {
      const [{ data: s }, { data: g }] = await Promise.all([
        supabase.from('subjects').select('*').order('name_ar'),
        supabase.from('grades').select('*').order('grade_number'),
      ])
      setSubjects(s || [])
      setGrades(g || [])
    }
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('غير مصرح')

      const { data: admin } = await supabase
        .from('admins')
        .select('id')
        .eq('id', user.id)
        .single()
      if (!admin) throw new Error('فقط المديرون يمكنهم إضافة أسئلة')

      const { error } = await supabase.from('questions').insert({
        admin_id: (admin as any).id,
        subject_id: parseInt(formData.subject_id),
        grade_id: parseInt(formData.grade_id),
        question_type: formData.question_type,
        question_text: formData.question_text,
        correct_answer: formData.correct_answer,
        explanation: formData.explanation,
        difficulty_level: formData.difficulty_level,
        bloom_level: formData.bloom_level,
        points: formData.points,
        options: formData.question_type === 'mcq' ? formData.options : null,
        status: 'approved',
        is_approved: true, // For backward compatibility if needed
      } as any)

      if (error) throw error

      alert('تم إضافة السؤال بنجاح')
      router.push('/admin/questions')
    } catch (error: any) {
      console.error(error)
      alert('خطأ في إضافة السؤال: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    setFormData({ ...formData, options: newOptions })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-20">
      <div>
        <h1 className="font-display text-3xl font-bold">إضافة سؤال جديد</h1>
        <p className="mt-1 text-muted-foreground">
          قم بإضافة السؤال يدوياً إلى بنك الأسئلة
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-border bg-white p-8 shadow-sm"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">المادة</label>
            <select
              required
              value={formData.subject_id}
              onChange={(e) =>
                setFormData({ ...formData, subject_id: e.target.value })
              }
              className="w-full rounded-xl border border-border px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">اختر المادة</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name_ar}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">الصف الدراسي</label>
            <select
              required
              value={formData.grade_id}
              onChange={(e) =>
                setFormData({ ...formData, grade_id: e.target.value })
              }
              className="w-full rounded-xl border border-border px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">اختر الصف</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name_ar}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">نوع السؤال</label>
            <select
              value={formData.question_type}
              onChange={(e) =>
                setFormData({ ...formData, question_type: e.target.value })
              }
              className="w-full rounded-xl border border-border px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="mcq">اختيار من متعدد</option>
              <option value="true_false">صح أو خطأ</option>
              <option value="fill_blank">أكمل</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">الصعوبة</label>
            <select
              value={formData.difficulty_level}
              onChange={(e) =>
                setFormData({ ...formData, difficulty_level: e.target.value })
              }
              className="w-full rounded-xl border border-border px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="easy">سهل</option>
              <option value="medium">متوسط</option>
              <option value="hard">صعب</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">النقاط</label>
            <input
              type="number"
              value={formData.points}
              onChange={(e) =>
                setFormData({ ...formData, points: parseInt(e.target.value) })
              }
              className="w-full rounded-xl border border-border px-4 py-2 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              مستوى بلوم المعرفي (Bloom's Taxonomy)
            </label>
            <select
              value={formData.bloom_level}
              onChange={(e) =>
                setFormData({ ...formData, bloom_level: e.target.value })
              }
              className="w-full rounded-xl border border-border px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="remember">تذكر (Remember)</option>
              <option value="understand">فهم (Understand)</option>
              <option value="apply">تطبيق (Apply)</option>
              <option value="analyze">تحليل (Analyze)</option>
              <option value="evaluate">تقييم (Evaluate)</option>
              <option value="create">إبداع (Create)</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">نص السؤال</label>
          <RichTextEditor
            value={formData.question_text}
            onChange={(val) => setFormData({ ...formData, question_text: val })}
            placeholder="اكتب نص السؤال هنا..."
          />
        </div>

        {formData.question_type === 'mcq' && (
          <div className="space-y-4 pt-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <HelpCircle className="h-4 w-4" /> الخيارات
            </label>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {formData.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-4 text-xs font-bold text-muted-foreground">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <input
                    required
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(i, e.target.value)}
                    placeholder={`الخيار ${i + 1}`}
                    className="flex-1 rounded-xl border border-border px-4 py-2 outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">الإجابة الصحيحة</label>
          {formData.question_type === 'true_false' ? (
            <select
              value={formData.correct_answer}
              onChange={(e) =>
                setFormData({ ...formData, correct_answer: e.target.value })
              }
              className="w-full rounded-xl border border-border px-4 py-2 outline-none"
            >
              <option value="">اختر الإجابة</option>
              <option value="صح">صح</option>
              <option value="خطأ">خطأ</option>
            </select>
          ) : (
            <input
              required
              type="text"
              value={formData.correct_answer}
              onChange={(e) =>
                setFormData({ ...formData, correct_answer: e.target.value })
              }
              placeholder={
                formData.question_type === 'mcq'
                  ? 'يجب أن تطابق أحد الخيارات تماماً'
                  : 'اكتب الإجابة الصحيحة'
              }
              className="w-full rounded-xl border border-border px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20"
            />
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">شرح الإجابة (اختياري)</label>
          <RichTextEditor
            value={formData.explanation}
            onChange={(val) => setFormData({ ...formData, explanation: val })}
            placeholder="لماذا هذه هي الإجابة الصحيحة؟"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
          >
            {loading ? (
              'جاري الحفظ...'
            ) : (
              <>
                <Save className="h-5 w-5" /> إضافة السؤال للبنك
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-border px-6 py-3 font-medium transition-all hover:bg-muted"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  )
}
