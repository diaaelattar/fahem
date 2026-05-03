'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ClipboardList, Clock, CheckCircle, Save, Plus, Search } from 'lucide-react'

export default function NewExamPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [subjects, setSubjects] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [questions, setQuestions] = useState<any[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    title: '',
    subject_id: '',
    grade_id: '',
    duration_minutes: 60,
    passing_score: 50,
    is_published: false
  })

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: s }, { data: g }] = await Promise.all([
        supabase.from('subjects').select('*').order('name_ar'),
        supabase.from('grades').select('*').order('grade_number')
      ])
      setSubjects(s || [])
      setGrades(g || [])
    }
    fetchData()
  }, [supabase])

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data } = await supabase
        .from('questions')
        .select('*')
        .eq('subject_id', formData.subject_id)
        .eq('grade_id', formData.grade_id)
        .eq('is_approved', true)
      setQuestions(data || [])
    }

    if (formData.subject_id && formData.grade_id) {
      fetchQuestions()
    }
  }, [formData.subject_id, formData.grade_id, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedQuestions.length === 0) {
      alert('الرجاء اختيار سؤال واحد على الأقل')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('جلسة الإدارة منتهية، يرجى تسجيل الدخول مجدداً')
        return
      }

      const { data: exam, error: examError } = await supabase
        .from('exams')
        .insert({
          admin_id: user.id,
          title: formData.title,
          subject_id: parseInt(formData.subject_id),
          grade_id: parseInt(formData.grade_id),
          duration_minutes: formData.duration_minutes,
          passing_score: formData.passing_score,
          is_published: formData.is_published,
          questions_count: selectedQuestions.length
        })
        .select()
        .single()

      if (examError) throw examError

      const examQuestions = selectedQuestions.map((qId, index) => ({
        exam_id: exam.id,
        question_id: qId,
        question_order: index
      }))

      const { error: batchError } = await supabase
        .from('exam_questions')
        .insert(examQuestions)

      if (batchError) throw batchError

      alert('تم إنشاء الاختبار بنجاح')
      router.push('/admin/exams')
    } catch (error: any) {
      console.error(error)
      alert('خطأ في إنشاء الاختبار: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleQuestion = (id: string) => {
    setSelectedQuestions(prev => 
      prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-display font-bold">إنشاء اختبار جديد</h1>
        <p className="text-muted-foreground mt-1">قم بتحديد المعايير واختيار الأسئلة من البنك</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-border shadow-sm space-y-4">
            <h2 className="font-bold flex items-center gap-2"><ClipboardList className="w-5 h-5 text-primary" /> تفاصيل الاختبار</h2>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">عنوان الاختبار</label>
              <input 
                required
                type="text" 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="مثال: اختبار شهر أكتوبر - تاريخ"
                className="w-full px-4 py-2 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">المادة</label>
                <select 
                  required
                  value={formData.subject_id}
                  onChange={e => setFormData({...formData, subject_id: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-all"
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
                  className="w-full px-4 py-2 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="">اختر الصف</option>
                  {grades.map(g => <option key={g.id} value={g.id}>{g.name_ar}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">المدة (دقيقة)</label>
                <input 
                  type="number" 
                  value={formData.duration_minutes}
                  onChange={e => setFormData({...formData, duration_minutes: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 rounded-xl border border-border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">درجة النجاح %</label>
                <input 
                  type="number" 
                  value={formData.passing_score}
                  onChange={e => setFormData({...formData, passing_score: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 rounded-xl border border-border"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="publish"
                checked={formData.is_published}
                onChange={e => setFormData({...formData, is_published: e.target.checked})}
                className="w-4 h-4 text-primary"
              />
              <label htmlFor="publish" className="text-sm font-medium cursor-pointer">نشر الاختبار فوراً</label>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {loading ? 'جاري الحفظ...' : <><Save className="w-5 h-5" /> حفظ الاختبار</>}
            </button>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex-1 min-h-[500px]">
             <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold flex items-center gap-2 text-lg"><Plus className="w-5 h-5 text-primary" /> اختيار الأسئلة ({selectedQuestions.length})</h2>
                <div className="relative">
                  <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" placeholder="بحث في الأسئلة..." className="pr-10 pl-4 py-1.5 rounded-lg border border-border text-sm outline-none" />
                </div>
             </div>

             {!formData.subject_id || !formData.grade_id ? (
               <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <ClipboardList className="w-12 h-12 mb-4 opacity-20" />
                  <p>الرجاء اختيار المادة والصف لعرض الأسئلة المتاحة</p>
               </div>
             ) : questions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mb-4 opacity-20" />
                  <p>لا توجد أسئلة معتمدة لهذه المادة في البنك حالياً</p>
                </div>
             ) : (
                <div className="space-y-4">
                  {questions.map(q => (
                    <div 
                      key={q.id}
                      onClick={() => toggleQuestion(q.id)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        selectedQuestions.includes(q.id) 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selectedQuestions.includes(q.id) ? 'bg-primary border-primary' : 'border-border'
                        }`}>
                          {selectedQuestions.includes(q.id) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm leading-relaxed">{q.question_text}</p>
                          <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="bg-muted px-2 py-0.5 rounded uppercase">{q.question_type}</span>
                            <span>{q.difficulty}</span>
                            <span>{q.points} نقطة</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
             )}
          </div>
        </div>
      </form>
    </div>
  )
}
