'use client'
// app/admin/curriculum/units/new/page.tsx
// إضافة وحدة دراسية جديدة

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Save, ArrowRight } from 'lucide-react'

const SUBJECTS = [
  { id: 1, name: 'اللغة العربية', icon: '📖' },
  { id: 2, name: 'اللغة الإنجليزية', icon: '🔤' },
  { id: 3, name: 'الرياضيات', icon: '🔢' },
  { id: 4, name: 'العلوم', icon: '🔬' },
  { id: 5, name: 'الدراسات الاجتماعية', icon: '🌍' },
  { id: 6, name: 'الفيزياء', icon: '⚡' },
  { id: 7, name: 'الكيمياء', icon: '🧪' },
  { id: 8, name: 'التاريخ', icon: '📜' },
]

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // جلب الصفوف عند تحميل الصفحة
  useState(() => {
    supabase.from('grades').select('id, name_ar').order('grade_number').then(({ data }: any) => {
      setGrades(data || [])
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
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <a href="/admin/curriculum?tab=units"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4 transition-colors w-fit">
          <ArrowRight className="w-4 h-4" /> العودة للوحدات
        </a>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">إضافة وحدة دراسية جديدة</h1>
            <p className="text-muted-foreground text-sm">تنظيم المحتوى: مادة → وحدة → دروس</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            ❌ {error}
          </div>
        )}

        {/* Unit Name */}
        <div>
          <label className="block text-sm font-bold mb-2">اسم الوحدة الدراسية *</label>
          <input
            type="text"
            value={form.name_ar}
            onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))}
            placeholder="مثال: الوحدة الأولى — التواصل اللغوي"
            className="w-full px-4 py-3 border-2 border-border rounded-xl text-base focus:outline-none focus:border-primary transition-colors"
            required
          />
        </div>

        {/* Subject */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2">المادة الدراسية *</label>
            <select
              value={form.subject_id}
              onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-primary transition-colors bg-white"
              required
            >
              <option value="">اختر المادة...</option>
              {SUBJECTS.map(s => (
                <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
              ))}
            </select>
          </div>

          {/* Grade */}
          <div>
            <label className="block text-sm font-bold mb-2">الصف الدراسي *</label>
            <select
              value={form.grade_id}
              onChange={e => {
                const newGradeId = e.target.value
                const selectedGrade = grades.find(g => g.id.toString() === newGradeId)
                const isThirdSec = selectedGrade?.name_ar?.includes('الثالث الثانوى') || selectedGrade?.name_ar?.includes('الثالث الثانوي')
                setForm(f => ({ 
                  ...f, 
                  grade_id: newGradeId,
                  semester: isThirdSec ? 'full_year' : f.semester === 'full_year' ? 'term_1' : f.semester
                }))
              }}
              className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-primary transition-colors bg-white"
              required
            >
              <option value="">اختر الصف...</option>
              {grades.map((g: any) => (
                <option key={g.id} value={g.id}>{g.name_ar}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Semester & Sort Order */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2">الفصل الدراسي *</label>
            <select
              value={form.semester}
              onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-primary transition-colors bg-white"
              required
            >
              <option value="term_1">الفصل الدراسي الأول</option>
              <option value="term_2">الفصل الدراسي الثاني</option>
              <option value="full_year">عام دراسي كامل</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">تلقائي لـ "عام كامل" للصف الثالث الثانوي</p>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">ترتيب الوحدة</label>
            <input
              type="number"
              min="1"
              value={form.sort_order}
              onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-primary transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-1">الوحدة 1 تظهر أولاً</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold mb-2">وصف الوحدة (اختياري)</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="نبذة مختصرة عن محتوى هذه الوحدة..."
            rows={3}
            className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </div>

        {/* Active */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
            className={`w-12 h-6 rounded-full transition-all ${form.is_active ? 'bg-primary' : 'bg-muted'}`}
          >
            <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
          <label className="text-sm font-medium">الوحدة نشطة ومتاحة للطلاب</label>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {loading ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {loading ? 'جاري الحفظ...' : 'حفظ الوحدة'}
          </button>
          <a href="/admin/curriculum?tab=units"
            className="px-6 py-3 border border-border rounded-xl font-medium hover:bg-muted transition-colors">
            إلغاء
          </a>
        </div>
      </form>
    </div>
  )
}
