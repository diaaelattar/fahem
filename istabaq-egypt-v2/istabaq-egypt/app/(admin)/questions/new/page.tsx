'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Minus, Loader2, CheckCircle } from 'lucide-react'
import { toast } from '@/components/ui/toaster'

interface SubjectGrade {
  subjects: { id: number; name_ar: string; icon: string }[]
  grades: { id: number; name_ar: string; grade_number: number }[]
}

export default function NewQuestionPage() {
  const router = useRouter()
  const supabase = createClient()

  const [type, setType] = useState<'mcq' | 'true_false' | 'fill_blank'>('mcq')
  const [questionText, setQuestionText] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [explanation, setExplanation] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [points, setPoints] = useState(1)
  const [subjectId, setSubjectId] = useState('')
  const [gradeId, setGradeId] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const [subjects, setSubjects] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])

  // Load subjects and grades on mount
  useState(() => {
    const load = async () => {
      const [{ data: s }, { data: g }] = await Promise.all([
        supabase.from('subjects').select('id, name_ar, icon').order('name_ar'),
        supabase.from('grades').select('id, name_ar, grade_number').order('grade_number'),
      ])
      setSubjects(s || [])
      setGrades(g || [])
    }
    load()
  })

  const handleSave = async (approve = false) => {
    if (!questionText.trim()) { toast({ title: 'نص السؤال مطلوب', type: 'error' }); return }
    if (!correctAnswer.trim()) { toast({ title: 'الإجابة الصحيحة مطلوبة', type: 'error' }); return }
    if (type === 'mcq' && options.some(o => !o.trim())) {
      toast({ title: 'يجب ملء جميع خيارات الإجابة', type: 'error' }); return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('غير مسجل الدخول')

      const { error } = await supabase.from('questions').insert({
        admin_id: user.id,
        question_type: type,
        question_text: questionText.trim(),
        options: type === 'mcq' ? options : type === 'true_false' ? ['صح', 'خطأ'] : null,
        correct_answer: correctAnswer.trim(),
        explanation: explanation.trim() || null,
        difficulty_level: difficulty,
        points,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        subject_id: subjectId ? parseInt(subjectId) : null,
        grade_id: gradeId ? parseInt(gradeId) : null,
        is_approved: approve,
      })

      if (error) throw error
      toast({ title: approve ? 'تم حفظ السؤال واعتماده ✅' : 'تم حفظ السؤال كمسودة', type: 'success' })
      setTimeout(() => router.push('/admin/questions'), 800)
    } catch (err: any) {
      toast({ title: 'خطأ في الحفظ', description: err.message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">إضافة سؤال جديد</h1>
        <p className="text-muted-foreground mt-1">أضف سؤالاً يدوياً إلى بنك الأسئلة</p>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
        {/* Type */}
        <div>
          <label className="text-sm font-semibold block mb-2">نوع السؤال *</label>
          <div className="flex gap-2">
            {([
              { id: 'mcq', label: 'اختيار من متعدد' },
              { id: 'true_false', label: 'صح / خطأ' },
              { id: 'fill_blank', label: 'ملء الفراغات' },
            ] as const).map(t => (
              <button key={t.id} onClick={() => { setType(t.id); setCorrectAnswer('') }}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  type === t.id ? 'bg-primary text-white border-primary' : 'border-border hover:border-primary/40'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Question Text */}
        <div>
          <label className="text-sm font-semibold block mb-2">نص السؤال *</label>
          <textarea value={questionText} onChange={e => setQuestionText(e.target.value)}
            placeholder="اكتب نص السؤال هنا..."
            rows={3}
            className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none leading-relaxed" />
        </div>

        {/* MCQ Options */}
        {type === 'mcq' && (
          <div>
            <label className="text-sm font-semibold block mb-2">خيارات الإجابة *</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
                    {['أ', 'ب', 'ج', 'د'][i]}
                  </span>
                  <input value={opt} onChange={e => setOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                    placeholder={`الخيار ${['أ', 'ب', 'ج', 'د'][i]}`}
                    className={`flex-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                      correctAnswer === opt && opt ? 'border-green-400 bg-green-50 focus:ring-green-200' : 'border-border focus:ring-primary/30'
                    }`} />
                  <button onClick={() => setCorrectAnswer(opt)}
                    className={`px-3 py-2 text-xs rounded-xl border font-medium transition-all ${
                      correctAnswer === opt && opt ? 'bg-green-500 text-white border-green-500' : 'border-border hover:border-green-400 hover:text-green-600'
                    }`}>
                    {correctAnswer === opt && opt ? '✓ صحيح' : 'تعيين صحيح'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* True/False */}
        {type === 'true_false' && (
          <div>
            <label className="text-sm font-semibold block mb-2">الإجابة الصحيحة *</label>
            <div className="flex gap-3">
              {['صح', 'خطأ'].map(opt => (
                <button key={opt} onClick={() => setCorrectAnswer(opt)}
                  className={`flex-1 py-3 rounded-xl border-2 text-base font-bold transition-all ${
                    correctAnswer === opt
                      ? opt === 'صح' ? 'bg-green-50 border-green-400 text-green-700' : 'bg-red-50 border-red-400 text-red-700'
                      : 'border-border hover:border-primary/40'
                  }`}>
                  {opt === 'صح' ? '✅ صح' : '❌ خطأ'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Fill Blank */}
        {type === 'fill_blank' && (
          <div>
            <label className="text-sm font-semibold block mb-2">الإجابة الصحيحة *</label>
            <input value={correctAnswer} onChange={e => setCorrectAnswer(e.target.value)}
              placeholder="اكتب الإجابة الصحيحة هنا..."
              className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <p className="text-xs text-muted-foreground mt-1">💡 استخدم _______ في نص السؤال للدلالة على الفراغ</p>
          </div>
        )}

        {/* Explanation */}
        <div>
          <label className="text-sm font-semibold block mb-2">شرح الإجابة</label>
          <textarea value={explanation} onChange={e => setExplanation(e.target.value)}
            placeholder="اشرح لماذا هذه الإجابة صحيحة..."
            rows={2}
            className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-sm font-semibold block mb-1.5">مستوى الصعوبة</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)}
              className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-white focus:outline-none">
              <option value="easy">سهل</option>
              <option value="medium">متوسط</option>
              <option value="hard">صعب</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1.5">الدرجة</label>
            <input type="number" min={1} max={20} value={points} onChange={e => setPoints(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1.5">المادة</label>
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-white focus:outline-none">
              <option value="">اختياري</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name_ar}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1.5">الصف</label>
            <select value={gradeId} onChange={e => setGradeId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-white focus:outline-none">
              <option value="">اختياري</option>
              {grades.map(g => <option key={g.id} value={g.id}>{g.name_ar}</option>)}
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="text-sm font-semibold block mb-2">وسوم (اختياري)</label>
          <input value={tags} onChange={e => setTags(e.target.value)}
            placeholder="مثال: جبر, معادلات, درجة أولى (مفصولة بفواصل)"
            className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button onClick={() => handleSave(false)} disabled={saving}
          className="flex items-center gap-2 border border-border px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-muted transition-colors disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          حفظ كمسودة
        </button>
        <button onClick={() => handleSave(true)} disabled={saving}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          حفظ واعتماد السؤال
        </button>
        <button onClick={() => router.back()} className="mr-auto text-sm text-muted-foreground hover:text-foreground">
          إلغاء
        </button>
      </div>
    </div>
  )
}
