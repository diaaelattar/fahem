'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Save, Plus, Trash2, HelpCircle } from 'lucide-react'

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
    points: 1,
    options: ['', '', '', '']
  })

  useEffect(() => {
    async function fetchData() {
      const [{ data: s }, { data: g }] = await Promise.all([
        supabase.from('subjects').select('*').order('name_ar'),
        supabase.from('grades').select('*').order('grade_number')
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('غير مصرح')

      const { data: admin } = await supabase.from('admins').select('id').eq('id', user.id).single()
      if (!admin) throw new Error('فقط المديرون يمكنهم إضافة أسئلة')

      const { error } = await supabase
        .from('questions')
        .insert({
          admin_id: admin.id,
          subject_id: formData.subject_id,
          grade_id: formData.grade_id,
          question_type: formData.question_type,
          question_text: formData.question_text,
          correct_answer: formData.correct_answer,
          explanation: formData.explanation,
          difficulty_level: formData.difficulty_level,
          points: formData.points,
          options: formData.question_type === 'mcq' ? formData.options : null,
          is_approved: true
        })

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
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-display font-bold">إضافة سؤال جديد</h1>
        <p className="text-muted-foreground mt-1">قم بإضافة السؤال يدوياً إلى بنك الأسئلة</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-border shadow-sm space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">المادة</label>
            <select 
              required
              value={formData.subject_id}
              onChange={e => setFormData({...formData, subject_id: e.target.value})}
              className="w-full px-4 py-2 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">اختر المادة</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name_ar}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">الصف الدراسي</label>
            <select 
              required
              value={formData.grade_id}
              onChange={e => setFormData({...formData, grade_id: e.target.value})}
              className="w-full px-4 py-2 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">اختر الصف</option>
              {grades.map(g => <option key={g.id} value={g.id}>{g.name_ar}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">نوع السؤال</label>
            <select 
              value={formData.question_type}
              onChange={e => setFormData({...formData, question_type: e.target.value})}
              className="w-full px-4 py-2 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20"
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
              onChange={e => setFormData({...formData, difficulty_level: e.target.value})}
              className="w-full px-4 py-2 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20"
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
              onChange={e => setFormData({...formData, points: parseInt(e.target.value)})}
              className="w-full px-4 py-2 rounded-xl border border-border outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">نص السؤال</label>
          <textarea 
            required
            rows={3}
            value={formData.question_text}
            onChange={e => setFormData({...formData, question_text: e.target.value})}
            placeholder="اكتب نص السؤال هنا..."
            className="w-full px-4 py-2 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {formData.question_type === 'mcq' && (
          <div className="space-y-4 pt-2">
            <label className="text-sm font-medium flex items-center gap-2"><HelpCircle className="w-4 h-4" /> الخيارات</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground w-4">{String.fromCharCode(65 + i)}</span>
                  <input 
                    required
                    type="text" 
                    value={opt}
                    onChange={e => handleOptionChange(i, e.target.value)}
                    placeholder={`الخيار ${i + 1}`}
                    className="flex-1 px-4 py-2 rounded-xl border border-border outline-none"
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
              onChange={e => setFormData({...formData, correct_answer: e.target.value})}
              className="w-full px-4 py-2 rounded-xl border border-border outline-none"
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
              onChange={e => setFormData({...formData, correct_answer: e.target.value})}
              placeholder={formData.question_type === 'mcq' ? "يجب أن تطابق أحد الخيارات تماماً" : "اكتب الإجابة الصحيحة"}
              className="w-full px-4 py-2 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20"
            />
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">شرح الإجابة (اختياري)</label>
          <textarea 
            rows={2}
            value={formData.explanation}
            onChange={e => setFormData({...formData, explanation: e.target.value})}
            placeholder="لماذا هذه هي الإجابة الصحيحة؟"
            className="w-full px-4 py-2 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="pt-4 flex gap-4">
          <button 
            type="submit"
            disabled={loading}
            className="flex-1 bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            {loading ? 'جاري الحفظ...' : <><Save className="w-5 h-5" /> إضافة السؤال للبنك</>}
          </button>
          <button 
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 rounded-xl border border-border font-medium hover:bg-muted transition-all"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  )
}
