'use client'

// app/teacher/questions/new/page.tsx
// إنشاء سؤال جديد خاص بالمعلم

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Save, ArrowRight, HelpCircle } from 'lucide-react'
import { MathRenderer } from '@/components/ui/MathRenderer'

type QuestionType = 'mcq' | 'true_false' | 'fill_blank'
type DifficultyLevel = 'easy' | 'medium' | 'hard'

const TYPE_LABELS: Record<QuestionType, string> = {
  mcq: 'اختيار من متعدد',
  true_false: 'صح أو خطأ',
  fill_blank: 'أكمل الفراغ',
}

export default function TeacherNewQuestionPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [grades, setGrades] = useState<any[]>([])
  const [teacherSubject, setTeacherSubject] = useState<{ id: string; name_ar: string; icon: string } | null>(null)

  const [formData, setFormData] = useState({
    grade_id: '',
    question_type: 'mcq' as QuestionType,
    question_text: '',
    correct_answer: '',
    explanation: '',
    difficulty_level: 'medium' as DifficultyLevel,
    points: 1,
    options: ['', '', '', ''] as string[],
  })

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // جلب مادة المعلم
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('subject_id, subjects(id, name_ar, icon)')
        .eq('id', user.id)
        .single()

      const subject = teacherData?.subjects as any
      if (!teacherData?.subject_id || !subject) {
        router.push('/auth/teacher-onboarding')
        return
      }

      setTeacherSubject({
        id: String(subject.id),
        name_ar: subject.name_ar,
        icon: subject.icon,
      })

      // جلب الصفوف الدراسية
      const { data: g } = await supabase
        .from('grades')
        .select('*')
        .order('grade_number')

      setGrades(g || [])
      setLoading(false)
    }
    loadData()
  }, [])

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    setFormData({ ...formData, options: newOptions })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacherSubject) return

    setSaving(true)
    setError('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('انتهت جلستك. يرجى تسجيل الدخول مجدداً.')

      const { error: saveError } = await supabase.from('questions').insert({
        teacher_id: user.id,
        subject_id: parseInt(teacherSubject.id, 10),
        grade_id: parseInt(formData.grade_id, 10),
        question_type: formData.question_type,
        question_text: formData.question_text,
        correct_answer: formData.correct_answer,
        explanation: formData.explanation || null,
        difficulty_level: formData.difficulty_level,
        points: formData.points,
        options: formData.question_type === 'mcq' ? formData.options : null,
        status: 'approved', // أو 'review' حسب رغبة المنصة، نضعها approved لتظهر له فوراً
        is_approved: true,
      } as any)

      if (saveError) throw saveError

      router.push('/teacher/questions')
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ السؤال')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-20" dir="rtl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-xl p-2 hover:bg-muted"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">إنشاء سؤال جديد</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            مادة: {teacherSubject?.icon} {teacherSubject?.name_ar}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="space-y-6 rounded-2xl border border-border bg-white p-8 shadow-sm"
      >
        {/* الصف الدراسي */}
        <div className="space-y-2">
          <label className="text-sm font-medium">الصف الدراسي</label>
          <select
            required
            value={formData.grade_id}
            onChange={(e) =>
              setFormData({ ...formData, grade_id: e.target.value })
            }
            className="w-full rounded-xl border border-border px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">اختر الصف</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name_ar}
              </option>
            ))}
          </select>
        </div>

        {/* نوع + صعوبة + نقاط */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">نوع السؤال</label>
            <select
              value={formData.question_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  question_type: e.target.value as QuestionType,
                  correct_answer: '',
                })
              }
              className="w-full rounded-xl border border-border px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
            >
              {Object.entries(TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">مستوى الصعوبة</label>
            <select
              value={formData.difficulty_level}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  difficulty_level: e.target.value as DifficultyLevel,
                })
              }
              className="w-full rounded-xl border border-border px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
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
              min={1}
              max={10}
              value={formData.points}
              onChange={(e) =>
                setFormData({ ...formData, points: parseInt(e.target.value) || 1 })
              }
              className="w-full rounded-xl border border-border px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* نص السؤال */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <HelpCircle className="h-4 w-4 text-primary" /> نص السؤال
          </label>
          <textarea
            required
            rows={3}
            value={formData.question_text}
            onChange={(e) =>
              setFormData({ ...formData, question_text: e.target.value })
            }
            placeholder="اكتب نص السؤال هنا... تدعم الصيغ الرياضية مثل $$x^2$$"
            className="mb-1 w-full resize-none rounded-xl border border-border px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              معاينة التنسيق الرياضي:
            </span>
            <MathRenderer
              text={formData.question_text || 'سيظهر نص السؤال هنا...'}
              className="text-sm"
            />
          </div>
        </div>

        {/* خيارات MCQ */}
        {formData.question_type === 'mcq' && (
          <div className="space-y-3">
            <label className="text-sm font-medium">الخيارات</label>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {formData.options.map((opt, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                        opt && opt === formData.correct_answer
                          ? 'bg-green-500 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {['أ', 'ب', 'ج', 'د'][i]}
                    </span>
                    <input
                      type="text"
                      required={formData.question_type === 'mcq'}
                      value={opt}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                      placeholder={`الخيار ${i + 1}`}
                      className="flex-1 rounded-xl border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="mt-1 px-2">
                    <MathRenderer
                      text={opt || '...'}
                      className="text-[11px] text-muted-foreground"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* الإجابة الصحيحة */}
        <div className="space-y-2">
          <label className="text-sm font-medium">الإجابة الصحيحة</label>
          {formData.question_type === 'true_false' ? (
            <div className="flex gap-3">
              {['صح', 'خطأ'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, correct_answer: opt })
                  }
                  className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-medium transition-all ${
                    formData.correct_answer === opt
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  {opt === 'صح' ? '✅ صح' : '❌ خطأ'}
                </button>
              ))}
            </div>
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
              className="w-full rounded-xl border border-border px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
            />
          )}
        </div>

        {/* الشرح */}
        <div className="space-y-2">
          <label className="text-sm font-medium">شرح الإجابة (اختياري)</label>
          <textarea
            rows={2}
            value={formData.explanation}
            onChange={(e) =>
              setFormData({ ...formData, explanation: e.target.value })
            }
            placeholder="لماذا هذه هي الإجابة الصحيحة؟"
            className="mb-1 w-full resize-none rounded-xl border border-border px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-2">
            <MathRenderer
              text={formData.explanation || 'لا يوجد شرح مضاف.'}
              className="text-xs text-muted-foreground"
            />
          </div>
        </div>

        {/* أزرار الإجراء */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
          >
            {saving ? (
              'جاري الحفظ...'
            ) : (
              <>
                <Save className="h-5 w-5" /> حفظ السؤال
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-border px-6 py-3.5 font-medium transition-all hover:bg-muted"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  )
}
