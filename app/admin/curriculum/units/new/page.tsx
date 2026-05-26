'use client'
// app/admin/curriculum/units/new/page.tsx
// إضافة وحدة دراسية جديدة

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Save, ArrowRight } from 'lucide-react'

export default function NewUnitPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient() as any

  const [form, setForm] = useState({
    name_ar: '',
    subject_id: '',
    grade_id: searchParams.get('grade') || '',
    semester: 'term_1',
    sort_order: '1',
    description: '',
    is_active: true,
  })
  const [grades, setGrades] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // جلب الصفوف والمواد عند تحميل الصفحة
  useState(() => {
    supabase
      .from('grades')
      .select('id, name_ar')
      .order('grade_number')
      .then(({ data }: any) => {
        setGrades(data || [])
      })
    supabase
      .from('subjects')
      .select('id, name_ar, icon')
      .order('id')
      .then(({ data }: any) => {
        setSubjects(data || [])
      })
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name_ar.trim() || !form.subject_id || !form.grade_id) {
      setError('يرجى ملء جميع الحقول المطلوبة')
      return
    }
    setLoading(true)
    setError('')

    const { data, error: err } = await supabase
      .from('units')
      .insert({
        name_ar: form.name_ar.trim(),
        subject_id: parseInt(form.subject_id),
        grade_id: parseInt(form.grade_id),
        semester: form.semester,
        sort_order: parseInt(form.sort_order) || 1,
        description: form.description.trim() || null,
        is_active: form.is_active,
      })
      .select('id')
      .single()

    if (err) {
      setError('حدث خطأ أثناء الحفظ: ' + err.message)
      setLoading(false)
      return
    }

    router.push(`/admin/curriculum/units/${data.id}`)
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in space-y-6 pb-12">
      {/* Header */}
      <div>
        <a
          href="/admin/curriculum?tab=units"
          className="mb-4 flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowRight className="h-4 w-4" /> العودة للوحدات
        </a>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">إضافة وحدة دراسية جديدة</h1>
            <p className="text-sm text-muted-foreground">
              تنظيم المحتوى: مادة → وحدة → دروس
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-border bg-white p-8"
      >
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            ❌ {error}
          </div>
        )}

        {/* Unit Name */}
        <div>
          <label className="mb-2 block text-sm font-bold">
            اسم الوحدة الدراسية *
          </label>
          <input
            type="text"
            value={form.name_ar}
            onChange={(e) =>
              setForm((f) => ({ ...f, name_ar: e.target.value }))
            }
            placeholder="مثال: الوحدة الأولى — التواصل اللغوي"
            className="w-full rounded-xl border-2 border-border px-4 py-3 text-base transition-colors focus:border-primary focus:outline-none"
            required
          />
        </div>

        {/* Subject */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-bold">
              المادة الدراسية *
            </label>
            <select
              value={form.subject_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, subject_id: e.target.value }))
              }
              className="w-full rounded-xl border-2 border-border bg-white px-4 py-3 transition-colors focus:border-primary focus:outline-none"
              required
            >
              <option value="">اختر المادة...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.icon} {s.name_ar}
                </option>
              ))}
            </select>
          </div>

          {/* Grade */}
          <div>
            <label className="mb-2 block text-sm font-bold">
              الصف الدراسي *
            </label>
            <select
              value={form.grade_id}
              onChange={(e) => {
                const newGradeId = e.target.value
                const selectedGrade = grades.find(
                  (g) => g.id.toString() === newGradeId
                )
                const isThirdSec =
                  selectedGrade?.name_ar?.includes('الثالث الثانوى') ||
                  selectedGrade?.name_ar?.includes('الثالث الثانوي')
                setForm((f) => ({
                  ...f,
                  grade_id: newGradeId,
                  semester: isThirdSec
                    ? 'full_year'
                    : f.semester === 'full_year'
                      ? 'term_1'
                      : f.semester,
                }))
              }}
              className="w-full rounded-xl border-2 border-border bg-white px-4 py-3 transition-colors focus:border-primary focus:outline-none"
              required
            >
              <option value="">اختر الصف...</option>
              {grades.map((g: any) => (
                <option key={g.id} value={g.id}>
                  {g.name_ar}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Semester & Sort Order */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-bold">
              الفصل الدراسي *
            </label>
            <select
              value={form.semester}
              onChange={(e) =>
                setForm((f) => ({ ...f, semester: e.target.value }))
              }
              className="w-full rounded-xl border-2 border-border bg-white px-4 py-3 transition-colors focus:border-primary focus:outline-none"
              required
            >
              <option value="term_1">الفصل الدراسي الأول</option>
              <option value="term_2">الفصل الدراسي الثاني</option>
              <option value="full_year">عام دراسي كامل</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              تلقائي لـ "عام كامل" للصف الثالث الثانوي
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold">ترتيب الوحدة</label>
            <input
              type="number"
              min="1"
              value={form.sort_order}
              onChange={(e) =>
                setForm((f) => ({ ...f, sort_order: e.target.value }))
              }
              className="w-full rounded-xl border-2 border-border px-4 py-3 transition-colors focus:border-primary focus:outline-none"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              الوحدة 1 تظهر أولاً
            </p>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="mb-2 block text-sm font-bold">
            وصف الوحدة (اختياري)
          </label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="نبذة مختصرة عن محتوى هذه الوحدة..."
            rows={3}
            className="w-full resize-none rounded-xl border-2 border-border px-4 py-3 transition-colors focus:border-primary focus:outline-none"
          />
        </div>

        {/* Active */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
            className={`h-6 w-12 rounded-full transition-all ${form.is_active ? 'bg-primary' : 'bg-muted'}`}
          >
            <span
              className={`mx-0.5 block h-5 w-5 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-0'}`}
            />
          </button>
          <label className="text-sm font-medium">
            الوحدة نشطة ومتاحة للطلاب
          </label>
        </div>

        {/* Submit */}
        <div className="flex gap-3 border-t border-border pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3 font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {loading ? 'جاري الحفظ...' : 'حفظ الوحدة'}
          </button>
          <a
            href="/admin/curriculum?tab=units"
            className="rounded-xl border border-border px-6 py-3 font-medium transition-colors hover:bg-muted"
          >
            إلغاء
          </a>
        </div>
      </form>
    </div>
  )
}
