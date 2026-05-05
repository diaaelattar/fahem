'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ClipboardList, CheckCircle, Save, Search, Layers } from 'lucide-react'
import { DraggableQuestionList } from '@/components/admin/DraggableQuestionList'

export default function NewExamPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [subjects, setSubjects] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [questionsBank, setQuestionsBank] = useState<any[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  
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
        .eq('status', 'approved')
      setQuestionsBank(data || [])
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
        } as any)
        .select()
        .single()

      if (examError) throw examError

      const examQuestions = selectedQuestions.map((q, index) => ({
        exam_id: (exam as any).id,
        question_id: q.id,
        question_order: index
      }))

      const { error: batchError } = await supabase
        .from('exam_questions')
        .insert(examQuestions as any)

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

  const toggleQuestion = (question: any) => {
    if (selectedQuestions.find(q => q.id === question.id)) {
      setSelectedQuestions(selectedQuestions.filter(q => q.id !== question.id))
    } else {
      setSelectedQuestions([...selectedQuestions, question])
    }
  }

  const removeQuestion = (id: string) => {
    setSelectedQuestions(selectedQuestions.filter(q => q.id !== id))
  }

  const filteredQuestions = questionsBank.filter((q: any) => 
    q.question_text?.includes(searchQuery) || q.question_type?.includes(searchQuery)
  )

  const totalPoints = selectedQuestions.reduce((sum, q) => sum + (q.points || 1), 0)

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-display font-bold">إنشاء اختبار جديد</h1>
        <div className="flex gap-6 mt-4">
          <div>
            <div className="text-2xl font-display font-bold text-primary">{totalPoints}</div>
            <div className="text-xs text-muted-foreground">إجمالي الدرجات</div>
          </div>
        </div>
        <p className="text-muted-foreground mt-1">قم بتحديد المعايير واختيار الأسئلة من البنك مع إمكانية ترتيبها بالسحب والإفلات</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar: Exam Details */}
        <div className="lg:col-span-1 space-y-6">
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

        {/* Center: Selected Questions (Drag and Drop) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-border shadow-sm h-[800px] flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2"><Layers className="w-5 h-5 text-primary" /> بناء الاختبار</h3>
                <p className="text-sm text-muted-foreground mt-1">اسحب الأسئلة لترتيبها</p>
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-primary">{selectedQuestions.length}</div>
                <div className="text-xs text-muted-foreground">سؤال</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <DraggableQuestionList 
                questions={selectedQuestions} 
                setQuestions={setSelectedQuestions} 
                onRemove={removeQuestion} 
              />
            </div>
          </div>
        </div>

        {/* Right: Question Bank */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-50 p-6 rounded-2xl border border-border h-[800px] flex flex-col">
            <div className="mb-4 pb-4 border-b border-border">
              <h3 className="font-bold text-lg mb-4">بنك الأسئلة المعتمدة</h3>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ابحث في الأسئلة..."
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20 text-sm bg-white"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
              {formData.subject_id && formData.grade_id ? (
                filteredQuestions.length > 0 ? (
                  filteredQuestions.map(q => {
                    const isSelected = selectedQuestions.some(sq => sq.id === q.id)
                    return (
                      <div 
                        key={q.id}
                        onClick={() => toggleQuestion(q)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-primary bg-blue-50/50' 
                            : 'border-border hover:border-primary/40 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex gap-2 mb-2">
                              <span className="text-[10px] font-bold text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-md">{q.question_type}</span>
                            </div>
                            <p className="text-xs font-medium line-clamp-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: q.question_text }}></p>
                          </div>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                            isSelected ? 'bg-primary border-primary text-white' : 'border-slate-300'
                          }`}>
                            {isSelected && <CheckCircle className="w-3 h-3" />}
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    لا توجد أسئلة معتمدة مطابقة لبحثك في هذا المنهج.
                  </div>
                )
              ) : (
                <div className="text-center py-12 text-muted-foreground flex flex-col items-center text-sm">
                  <ClipboardList className="w-8 h-8 mb-3 text-slate-300" />
                  <p>الرجاء اختيار المادة والصف<br/>لعرض البنك</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </form>
    </div>
  )
}
