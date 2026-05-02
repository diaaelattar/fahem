'use client'

// app/admin/exams/[id]/page.tsx
// تعديل اختبار موجود — يجلب بياناته ويعرضها للتعديل

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowRight, Save, Trash2, Eye, EyeOff, CheckCircle,
  ClipboardList, Clock, Search, Settings2,
} from 'lucide-react'
import { MathRenderer } from '@/components/ui/MathRenderer'

export default function EditExamPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [subjects, setSubjects] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [questions, setQuestions] = useState<any[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [searchQ, setSearchQ] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    subject_id: '',
    grade_id: '',
    duration_minutes: 60,
    passing_score: 50,
    is_published: false,
    instructions: '',
    available_from: '',
    available_until: '',
    shuffle_questions: true,
    show_results_immediately: true,
    allowed_attempts: 1,
  })

  // جلب بيانات الاختبار
  useEffect(() => {
    async function loadAll() {
      const [
        { data: exam },
        { data: s },
        { data: g },
      ] = await Promise.all([
        supabase.from('exams')
          .select('*, exam_questions(question_id, question_order)')
          .eq('id', id)
          .single() as any,
        supabase.from('subjects').select('*').order('name_ar'),
        supabase.from('grades').select('*').order('grade_number'),
      ])

      if (exam) {
        setFormData({
          title: exam.title,
          subject_id: String(exam.subject_id || ''),
          grade_id: String(exam.grade_id || ''),
          duration_minutes: exam.duration_minutes,
          passing_score: exam.passing_score || 50,
          is_published: exam.is_published,
          instructions: exam.instructions || '',
          available_from: exam.available_from ? exam.available_from.slice(0, 16) : '',
          available_until: exam.available_until ? exam.available_until.slice(0, 16) : '',
          shuffle_questions: exam.shuffle_questions ?? true,
          show_results_immediately: exam.show_results_immediately ?? true,
          allowed_attempts: exam.allowed_attempts || 1,
        })
        setSelectedQuestions(
          (exam.exam_questions || [])
            .sort((a: any, b: any) => a.question_order - b.question_order)
            .map((eq: any) => eq.question_id)
        )
      }
      setSubjects(s || [])
      setGrades(g || [])
      setLoading(false)
    }
    loadAll()
  }, [id])

  // جلب الأسئلة عند تغيير المادة أو الصف
  useEffect(() => {
    if (!formData.subject_id || !formData.grade_id) return
    supabase.from('questions')
      .select('id, question_text, question_type, difficulty_level, points, is_approved')
      .eq('subject_id', formData.subject_id)
      .eq('grade_id', formData.grade_id)
      .eq('is_approved', true)
      .then(({ data }) => setQuestions(data || []))
  }, [formData.subject_id, formData.grade_id])

  const toggleQuestion = (qId: string) => {
    setSelectedQuestions(prev =>
      prev.includes(qId) ? prev.filter(x => x !== qId) : [...prev, qId]
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedQuestions.length === 0) {
      alert('الرجاء اختيار سؤال واحد على الأقل')
      return
    }
    setSaving(true)

    // حساب المجموع الكلي
    const totalPoints = questions
      .filter(q => selectedQuestions.includes(q.id))
      .reduce((acc, q) => acc + (q.points || 1), 0)

    const { error: examError } = await (supabase.from('exams') as any)
      .update({
        ...formData,
        subject_id: formData.subject_id ? parseInt(formData.subject_id) : null,
        grade_id: formData.grade_id ? parseInt(formData.grade_id) : null,
        available_from: formData.available_from || null,
        available_until: formData.available_until || null,
        questions_count: selectedQuestions.length,
        total_points: totalPoints,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (!examError) {
      // تحديث الأسئلة
      await supabase.from('exam_questions').delete().eq('exam_id', id)
      await (supabase.from('exam_questions') as any).insert(
        selectedQuestions.map((qId, i) => ({
          exam_id: id,
          question_id: qId,
          question_order: i,
        }))
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      alert('خطأ في الحفظ: ' + examError.message)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm(`هل أنت متأكد من حذف "${formData.title}"؟ لا يمكن التراجع عن هذا الإجراء.`)) return
    setDeleting(true)
    
    try {
      const resp = await fetch('/api/exams/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      const data = await resp.json()
      
      if (!resp.ok) {
        alert('فشل الحذف: ' + (data.error || 'خطأ غير معروف'))
        setDeleting(false)
        return
      }
      // إجبار المتصفح على إعادة تحميل صفحة الاختبارات من الخادم وليس من الـ Cache
      window.location.href = '/admin/exams'
    } catch (e: any) {
      alert('خطأ في الاتصال: ' + e.message)
      setDeleting(false)
    }
  }

  const filteredQuestions = questions.filter(q =>
    q.question_text.toLowerCase().includes(searchQ.toLowerCase())
  )

  const TYPE_MAP: Record<string, string> = { mcq: 'MCQ', true_false: 'ص/خ', fill_blank: 'فراغ' }
  const DIFF_MAP: Record<string, string> = { easy: 'سهل', medium: 'متوسط', hard: 'صعب' }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto grid grid-cols-3 gap-6">
        <div className="col-span-1 h-[400px] bg-muted rounded-2xl animate-pulse" />
        <div className="col-span-2 h-[400px] bg-muted rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-muted">
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">تعديل الاختبار</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">{selectedQuestions.length} سؤال مختار</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1 ${
            formData.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {formData.is_published ? <><Eye className="w-3 h-3" /> منشور</> : <><EyeOff className="w-3 h-3" /> مسودة</>}
          </span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 text-red-500 border border-red-200 px-4 py-2 rounded-xl text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'جاري الحذف...' : 'حذف'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* العمود الأيسر — إعدادات الاختبار */}
        <div className="md:col-span-1 space-y-4">

          {/* التفاصيل الأساسية */}
          <div className="bg-white p-6 rounded-2xl border border-border shadow-sm space-y-4">
            <h2 className="font-bold flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" /> تفاصيل الاختبار
            </h2>

            <div className="space-y-2">
              <label className="text-sm font-medium">عنوان الاختبار</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">المادة الدراسية</label>
              <select
                value={formData.subject_id}
                onChange={e => setFormData({ ...formData, subject_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">اختر المادة</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name_ar}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">الصف الدراسي</label>
              <select
                value={formData.grade_id}
                onChange={e => setFormData({ ...formData, grade_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">اختر الصف</option>
                {grades.map(g => <option key={g.id} value={g.id}>{g.name_ar}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">المدة (دقيقة)</label>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={e => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-border text-sm outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">درجة النجاح%</label>
                <input
                  type="number"
                  value={formData.passing_score}
                  onChange={e => setFormData({ ...formData, passing_score: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-border text-sm outline-none"
                />
              </div>
            </div>
          </div>

          {/* الإعدادات المتقدمة */}
          <div className="bg-white p-6 rounded-2xl border border-border shadow-sm space-y-4">
            <h2 className="font-bold flex items-center gap-2 text-sm">
              <Settings2 className="w-4 h-4 text-primary" /> الإعدادات المتقدمة
            </h2>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">التعليمات</label>
              <textarea
                rows={2}
                value={formData.instructions}
                onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                placeholder="تعليمات للطالب قبل بدء الاختبار..."
                className="w-full px-3 py-2 rounded-xl border border-border text-sm outline-none resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">متاح من</label>
              <input
                type="datetime-local"
                value={formData.available_from}
                onChange={e => setFormData({ ...formData, available_from: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border text-sm outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">متاح حتى</label>
              <input
                type="datetime-local"
                value={formData.available_until}
                onChange={e => setFormData({ ...formData, available_until: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border text-sm outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">عدد المحاولات المسموحة</label>
              <select
                value={formData.allowed_attempts}
                onChange={e => setFormData({ ...formData, allowed_attempts: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-border text-sm outline-none"
              >
                <option value={1}>محاولة واحدة</option>
                <option value={2}>محاولتان</option>
                <option value={3}>3 محاولات</option>
                <option value={999}>غير محدود</option>
              </select>
            </div>

            <div className="space-y-2 border-t border-border pt-3">
              {[
                { key: 'shuffle_questions', label: 'خلط ترتيب الأسئلة' },
                { key: 'show_results_immediately', label: 'عرض النتائج فوراً بعد الانتهاء' },
                { key: 'is_published', label: 'نشر الاختبار للطلاب' },
              ].map(opt => (
                <label key={opt.key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData[opt.key as keyof typeof formData] as boolean}
                    onChange={e => setFormData({ ...formData, [opt.key]: e.target.checked })}
                    className="w-4 h-4 text-primary rounded"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              saved ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20'
            } disabled:opacity-50`}
          >
            {saving ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري الحفظ...</>
            ) : saved ? (
              <><CheckCircle className="w-5 h-5" /> تم الحفظ!</>
            ) : (
              <><Save className="w-5 h-5" /> حفظ التعديلات</>
            )}
          </button>
        </div>

        {/* العمود الأيمن — بنك الأسئلة */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-2xl border border-border shadow-sm min-h-[500px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                الأسئلة المختارة ({selectedQuestions.length})
              </h2>
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  placeholder="بحث في الأسئلة..."
                  className="pr-9 pl-4 py-1.5 rounded-lg border border-border text-sm outline-none"
                />
              </div>
            </div>

            {!formData.subject_id || !formData.grade_id ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <ClipboardList className="w-12 h-12 mb-4 opacity-20" />
                <p>اختر المادة والصف لعرض الأسئلة</p>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <p>لا توجد أسئلة لهذه المادة والصف</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredQuestions.map(q => {
                  const selected = selectedQuestions.includes(q.id)
                  return (
                    <div
                      key={q.id}
                      onClick={() => toggleQuestion(q.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selected ? 'bg-primary border-primary' : 'border-border'
                        }`}>
                          {selected && <CheckCircle className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <MathRenderer text={q.question_text} className="text-sm font-medium leading-relaxed line-clamp-2" />
                          <div className="flex gap-2 mt-1.5">
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">{TYPE_MAP[q.question_type] || q.question_type}</span>
                            <span className="text-xs text-muted-foreground">{DIFF_MAP[q.difficulty_level]}</span>
                            <span className="text-xs text-muted-foreground">{q.points} نقطة</span>
                            {!q.is_approved && <span className="text-xs text-yellow-600 bg-yellow-50 px-1.5 rounded">غير معتمد</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
