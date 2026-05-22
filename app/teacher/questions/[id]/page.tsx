'use client'

// app/teacher/questions/[id]/page.tsx
// تعديل سؤال خاص بالمعلم

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { ArrowRight, Save, Trash2, CheckCircle, HelpCircle, Eye, ImagePlus, X, Loader2, Printer } from 'lucide-react'
import { MathRenderer } from '@/components/ui/MathRenderer'

type QuestionType = 'mcq' | 'true_false' | 'fill_blank'
type DifficultyLevel = 'easy' | 'medium' | 'hard'

const TYPE_LABELS: Record<QuestionType, string> = {
  mcq: 'اختيار من متعدد',
  true_false: 'صح أو خطأ',
  fill_blank: 'أكمل الفراغ',
}

export default function TeacherEditQuestionPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [subjects, setSubjects] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [isOwner, setIsOwner] = useState(false)

  const [formData, setFormData] = useState({
    subject_id: '',
    grade_id: '',
    question_type: 'mcq' as QuestionType,
    question_text: '',
    correct_answer: '',
    explanation: '',
    difficulty_level: 'medium' as DifficultyLevel,
    points: 1,
    options: ['', '', '', ''] as string[],
    image_position: 'bottom' as 'top' | 'bottom' | 'right' | 'left',
  })

  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageError, setImageError] = useState('')
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      const [
        { data: question },
        { data: s },
        { data: g },
      ] = await Promise.all([
        (supabase.from('questions').select('*').eq('id', id).single() as any),
        supabase.from('subjects').select('*').order('name_ar'),
        supabase.from('grades').select('*').order('grade_number'),
      ])

      if (question) {
        setIsOwner(question.teacher_id === user?.id)
        setFormData({
          subject_id: String(question.subject_id || ''),
          grade_id: String(question.grade_id || ''),
          question_type: question.question_type as QuestionType,
          question_text: question.question_text,
          correct_answer: question.correct_answer,
          explanation: question.explanation || '',
          difficulty_level: question.difficulty_level as DifficultyLevel,
          points: question.points || 1,
          options: question.options?.length ? question.options : ['', '', '', ''],
          image_position: question.image_position || 'bottom',
        })
        setImageUrl(question.question_image_url || null)
      }
      setSubjects(s || [])
      setGrades(g || [])
      setLoading(false)
    }
    loadData()
  }, [id])

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    setFormData({ ...formData, options: newOptions })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isOwner) { setError('لا يمكنك تعديل هذا السؤال'); return }
    setSaving(true)
    setError('')

    const { error: saveError } = await (supabase.from('questions') as any)
      .update({
        subject_id: formData.subject_id || null,
        grade_id: formData.grade_id || null,
        question_type: formData.question_type,
        question_text: formData.question_text,
        correct_answer: formData.correct_answer,
        explanation: formData.explanation || null,
        difficulty_level: formData.difficulty_level,
        points: formData.points,
        options: formData.question_type === 'mcq' ? formData.options : null,
        image_position: formData.image_position,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (saveError) {
      setError('خطأ في الحفظ: ' + saveError.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!isOwner) { setError('لا يمكنك حذف هذا السؤال'); return }
    if (!confirm('هل أنت متأكد من حذف هذا السؤال نهائياً؟')) return
    setDeleting(true)
    await supabase.from('questions').delete().eq('id', id)
    router.push('/teacher/questions')
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    setImageError('')
    const form = new FormData()
    form.append('file', file)
    form.append('questionId', id as string)
    const res = await fetch('/api/questions/upload-image', { method: 'POST', body: form })
    const data = await res.json()
    if (!res.ok) {
      setImageError(data.error || 'فشل رفع الصورة')
    } else {
      setImageUrl(data.imageUrl)
    }
    setUploadingImage(false)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const handleImageRemove = async () => {
    if (!confirm('هل تريد حذف صورة السؤال؟')) return
    setUploadingImage(true)
    const res = await fetch('/api/questions/upload-image', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: id, imageUrl }),
    })
    if (res.ok) setImageUrl(null)
    setUploadingImage(false)
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-muted">
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">تعديل سؤال</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {TYPE_LABELS[formData.question_type]}
              {!isOwner && <span className="text-amber-600 mr-2">(سؤال للمراجعة فقط — لا يمكن التعديل)</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href={`/teacher/questions/${id}/print`}
            target="_blank"
            className="flex items-center gap-2 text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-sm hover:bg-slate-50 transition-colors"
          >
            <Printer className="w-4 h-4" />
            طباعة
          </a>
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 text-red-500 border border-red-200 px-4 py-2 rounded-xl text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'جاري الحذف...' : 'حذف'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white p-8 rounded-2xl border border-border shadow-sm space-y-6">

        {/* التصنيف */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">المادة الدراسية</label>
            <select
              value={formData.subject_id}
              onChange={e => setFormData({ ...formData, subject_id: e.target.value })}
              disabled={!isOwner}
              className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
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
              disabled={!isOwner}
              className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
            >
              <option value="">اختر الصف</option>
              {grades.map(g => <option key={g.id} value={g.id}>{g.name_ar}</option>)}
            </select>
          </div>
        </div>

        {/* نوع + صعوبة + نقاط */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">نوع السؤال</label>
            <select
              value={formData.question_type}
              onChange={e => setFormData({ ...formData, question_type: e.target.value as QuestionType })}
              disabled={!isOwner}
              className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
            >
              {Object.entries(TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">مستوى الصعوبة</label>
            <select
              value={formData.difficulty_level}
              onChange={e => setFormData({ ...formData, difficulty_level: e.target.value as DifficultyLevel })}
              disabled={!isOwner}
              className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
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
              onChange={e => setFormData({ ...formData, points: parseInt(e.target.value) })}
              disabled={!isOwner}
              className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
            />
          </div>
        </div>

        {/* نص السؤال */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-primary" /> نص السؤال
          </label>
          <textarea
            required
            rows={3}
            value={formData.question_text}
            onChange={e => setFormData({ ...formData, question_text: e.target.value })}
            disabled={!isOwner}
            className="w-full px-4 py-3 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20 resize-none mb-1 disabled:opacity-60"
          />
          <div className="bg-muted/30 p-3 rounded-xl border border-dashed border-border">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1 font-bold">
              <Eye className="w-3 h-3" /> معاينة التنسيق الرياضي:
            </div>
            <MathRenderer text={formData.question_text || 'سيظهر نص السؤال هنا...'} className="text-sm" />
          </div>
        </div>

        {/* خيارات MCQ */}
        {formData.question_type === 'mcq' && (
          <div className="space-y-3">
            <label className="text-sm font-medium">الخيارات</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {formData.options.map((opt, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                      opt === formData.correct_answer ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      {['أ', 'ب', 'ج', 'د'][i]}
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={e => handleOptionChange(i, e.target.value)}
                      disabled={!isOwner}
                      placeholder={`الخيار ${i + 1}`}
                      className="flex-1 px-3 py-2 rounded-xl border border-border outline-none text-sm focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                    />
                  </div>
                  <div className="mt-1 px-2">
                    <MathRenderer text={opt || '...'} className="text-[11px] text-muted-foreground" />
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
              {['صح', 'خطأ'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  disabled={!isOwner}
                  onClick={() => setFormData({ ...formData, correct_answer: opt })}
                  className={`flex-1 py-2.5 rounded-xl border-2 font-medium text-sm transition-all disabled:opacity-60 ${
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
              onChange={e => setFormData({ ...formData, correct_answer: e.target.value })}
              disabled={!isOwner}
              placeholder={formData.question_type === 'mcq' ? 'يجب أن تطابق أحد الخيارات تماماً' : 'اكتب الإجابة الصحيحة'}
              className="w-full px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
            />
          )}
        </div>

        {/* صورة السؤال */}
        {isOwner && (
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <ImagePlus className="w-4 h-4 text-primary" /> صورة السؤال (اختياري)
            </label>
            {imageUrl ? (
              <>
                <div className="relative group rounded-xl overflow-hidden border border-border bg-muted/30">
                  <img src={imageUrl} alt="صورة السؤال" className="w-full max-h-64 object-contain p-2" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="bg-white text-primary px-4 py-2 rounded-lg text-sm font-bold"
                    >
                      تغيير الصورة
                    </button>
                    <button
                      type="button"
                      onClick={handleImageRemove}
                      disabled={uploadingImage}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingImage}
                className="w-full border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-all group disabled:opacity-50"
              >
                {uploadingImage ? (
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-medium">جاري رفع الصورة...</span>
                  </div>
                ) : (
                  <>
                    <ImagePlus className="w-10 h-10 text-muted-foreground group-hover:text-primary mx-auto mb-2 transition-colors" />
                    <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground">انقر لإرفاق صورة بالسؤال</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">JPG, PNG, WebP — بحد أقصى 5 ميجابايت</p>
                  </>
                )}
              </button>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleImageUpload}
            />
            {imageError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{imageError}</p>
            )}
          </div>
        )}

        {/* الشرح */}
        <div className="space-y-2">
          <label className="text-sm font-medium">شرح الإجابة (اختياري)</label>
          <textarea
            rows={2}
            value={formData.explanation}
            onChange={e => setFormData({ ...formData, explanation: e.target.value })}
            disabled={!isOwner}
            placeholder="لماذا هذه هي الإجابة الصحيحة؟"
            className="w-full px-4 py-3 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20 resize-none mb-1 disabled:opacity-60"
          />
          <div className="bg-muted/30 p-2 rounded-lg border border-dashed border-border">
            <MathRenderer text={formData.explanation || 'لا يوجد شرح مضاف.'} className="text-xs text-muted-foreground" />
          </div>
        </div>

        {isOwner && (
          <button
            type="submit"
            disabled={saving}
            className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20'
            } disabled:opacity-50`}
          >
            {saving ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري الحفظ...</>
            ) : saved ? (
              <><CheckCircle className="w-5 h-5" /> تم الحفظ بنجاح!</>
            ) : (
              <><Save className="w-5 h-5" /> حفظ التعديلات</>
            )}
          </button>
        )}
      </form>
    </div>
  )
}
