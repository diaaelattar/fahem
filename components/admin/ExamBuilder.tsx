'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Search, Plus, Trash2, GripVertical, ChevronDown, Loader2,
  Clock, BookOpen, Settings2, Eye, EyeOff, Save, CheckCircle,
  SlidersHorizontal, ToggleLeft, Shuffle, BarChart2
} from 'lucide-react'

interface Question {
  id: string
  question_type: string
  question_text: string
  difficulty_level: string
  points: number
  subjects?: { name_ar: string; icon: string }
  grades?: { name_ar: string }
}

interface SelectedQuestion extends Question {
  order: number
  points_override?: number
}

interface Props {
  subjects: { id: number; name_ar: string; icon: string }[]
  grades: { id: number; name_ar: string; grade_number: number }[]
  semesters: { id: number; name_ar: string }[]
  examId?: string  // for editing
  initialData?: any
}

const TYPE_AR: Record<string, string> = { mcq: 'اختيار من متعدد', true_false: 'صح/خطأ', fill_blank: 'ملء فراغ' }
const DIFF_AR: Record<string, string> = { easy: 'سهل', medium: 'متوسط', hard: 'صعب' }
const DIFF_COLOR: Record<string, string> = { easy: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', hard: 'bg-red-100 text-red-700' }

export function ExamBuilder({ subjects, grades, semesters, examId, initialData }: Props) {
  const router = useRouter()
  const supabase = createClient()

  // Form fields
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [subjectId, setSubjectId] = useState(initialData?.subject_id?.toString() || '')
  const [gradeId, setGradeId] = useState(initialData?.grade_id?.toString() || '')
  const [semesterId, setSemesterId] = useState(initialData?.semester_id?.toString() || '')
  const [duration, setDuration] = useState(initialData?.duration_minutes?.toString() || '30')
  const [passingScore, setPassingScore] = useState(initialData?.passing_score?.toString() || '')
  const [instructions, setInstructions] = useState(initialData?.instructions || '')
  const [isPublished, setIsPublished] = useState(initialData?.is_published || false)
  const [availableFrom, setAvailableFrom] = useState(initialData?.available_from?.slice(0,16) || '')
  const [availableUntil, setAvailableUntil] = useState(initialData?.available_until?.slice(0,16) || '')
  const [shuffleQuestions, setShuffleQuestions] = useState(initialData?.shuffle_questions ?? true)
  const [shuffleOptions, setShuffleOptions] = useState(initialData?.shuffle_options ?? true)
  const [showResultsImmediately, setShowResultsImmediately] = useState(initialData?.show_results_immediately ?? true)
  const [allowedAttempts, setAllowedAttempts] = useState(initialData?.allowed_attempts?.toString() || '1')

  // Question bank
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestion[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGrade, setFilterGrade] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [filterType, setFilterType] = useState('')
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [activeTab, setActiveTab] = useState<'settings' | 'questions'>('settings')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const totalPoints = selectedQuestions.reduce((sum, q) => sum + (q.points_override || q.points), 0)

  // Load questions from bank
  useEffect(() => {
    loadQuestions()
  }, [filterGrade, filterSubject, filterType])

  // Pre-load selected questions for edit mode
  useEffect(() => {
    if (examId && initialData) {
      loadExamQuestions()
    }
  }, [examId])

  async function loadQuestions() {
    setLoadingQuestions(true)
    let q = supabase.from('questions')
      .select('id, question_type, question_text, difficulty_level, points, subjects(name_ar, icon), grades(name_ar)')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(100)

    if (filterGrade) q = q.eq('grade_id', filterGrade)
    if (filterSubject) q = q.eq('subject_id', filterSubject)
    if (filterType) q = q.eq('question_type', filterType)
    if (searchTerm) q = q.ilike('question_text', `%${searchTerm}%`)

    const { data } = await q
    setAllQuestions((data || []) as unknown as Question[])
    setLoadingQuestions(false)
  }

  async function loadExamQuestions() {
    const { data } = await supabase
      .from('exam_questions')
      .select('question_id, question_order, points_override, questions(id, question_type, question_text, difficulty_level, points, subjects(name_ar, icon), grades(name_ar))')
      .eq('exam_id', examId)
      .order('question_order')

    if (data) {
      setSelectedQuestions(data.map((eq: any) => ({
        ...eq.questions,
        order: eq.question_order,
        points_override: eq.points_override,
      })))
    }
  }

  function addQuestion(q: Question) {
    if (selectedQuestions.find(s => s.id === q.id)) return
    setSelectedQuestions(prev => [...prev, { ...q, order: prev.length + 1 }])
  }

  function removeQuestion(id: string) {
    setSelectedQuestions(prev =>
      prev.filter(q => q.id !== id).map((q, i) => ({ ...q, order: i + 1 }))
    )
  }

  function updatePoints(id: string, pts: number) {
    setSelectedQuestions(prev => prev.map(q => q.id === id ? { ...q, points_override: pts } : q))
  }

  async function handleSave(publish = false) {
    if (!title.trim()) { setError('العنوان مطلوب'); return }
    if (!subjectId) { setError('اختر المادة الدراسية'); return }
    if (!gradeId) { setError('اختر الصف الدراسي'); return }
    if (selectedQuestions.length === 0) { setError('أضف سؤالاً واحداً على الأقل'); return }
    if (!duration || parseInt(duration) < 1) { setError('مدة الاختبار يجب أن تكون أكبر من صفر'); return }

    setError('')
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('غير مسجل الدخول')

      const examData = {
        admin_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        subject_id: parseInt(subjectId),
        grade_id: parseInt(gradeId),
        semester_id: semesterId ? parseInt(semesterId) : null,
        duration_minutes: parseInt(duration),
        total_points: totalPoints,
        passing_score: passingScore ? parseInt(passingScore) : null,
        instructions: instructions.trim() || null,
        is_published: publish || isPublished,
        available_from: availableFrom ? new Date(availableFrom).toISOString() : null,
        available_until: availableUntil ? new Date(availableUntil).toISOString() : null,
        shuffle_questions: shuffleQuestions,
        shuffle_options: shuffleOptions,
        show_results_immediately: showResultsImmediately,
        allowed_attempts: parseInt(allowedAttempts) || 1,
      }

      let finalExamId = examId

      if (examId) {
        const { error } = await supabase.from('exams').update(examData).eq('id', examId)
        if (error) throw error
        // حذف الأسئلة القديمة وإعادة إدراجها
        await supabase.from('exam_questions').delete().eq('exam_id', examId)
      } else {
        const { data, error } = await supabase.from('exams').insert(examData).select('id').single()
        if (error) throw error
        finalExamId = data.id
      }

      // إضافة الأسئلة
      const questionsData = selectedQuestions.map((q, i) => ({
        exam_id: finalExamId,
        question_id: q.id,
        question_order: i + 1,
        points_override: q.points_override || null,
      }))

      const { error: qError } = await supabase.from('exam_questions').insert(questionsData)
      if (qError) throw qError

      // تحديث total_points
      await supabase.from('exams').update({ total_points: totalPoints }).eq('id', finalExamId)

      setSaved(true)
      setTimeout(() => router.push('/admin/exams'), 1200)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const filteredAvailable = allQuestions.filter(q => {
    if (selectedQuestions.find(s => s.id === q.id)) return false
    if (searchTerm && !q.question_text.includes(searchTerm)) return false
    return true
  })

  if (saved) return (
    <div className="text-center py-20">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-9 h-9 text-green-600" />
      </div>
      <h3 className="text-xl font-bold mb-2">تم حفظ الاختبار بنجاح! 🎉</h3>
      <p className="text-muted-foreground text-sm">جاري التوجيه إلى قائمة الاختبارات...</p>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex border-b border-border gap-1">
        {(['settings', 'questions'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            {tab === 'settings' ? '⚙️ إعدادات الاختبار' : `📝 الأسئلة (${selectedQuestions.length})`}
          </button>
        ))}
        {totalPoints > 0 && (
          <div className="mr-auto flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
            <BarChart2 className="w-4 h-4" />
            الدرجة الكلية: <span className="font-bold text-foreground">{totalPoints}</span>
          </div>
        )}
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" />المعلومات الأساسية</h3>

            <div>
              <label className="text-sm font-semibold block mb-1.5">عنوان الاختبار *</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="مثال: اختبار الفصل الأول - الجبر"
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            <div>
              <label className="text-sm font-semibold block mb-1.5">وصف الاختبار</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="وصف مختصر للاختبار..."
                rows={2}
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold block mb-1.5">المادة الدراسية *</label>
                <select value={subjectId} onChange={e => setSubjectId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
                  <option value="">اختر المادة</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name_ar}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5">الصف الدراسي *</label>
                <select value={gradeId} onChange={e => setGradeId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
                  <option value="">اختر الصف</option>
                  {grades.map(g => <option key={g.id} value={g.id}>{g.name_ar}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold block mb-1.5">الفصل الدراسي</label>
                <select value={semesterId} onChange={e => setSemesterId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
                  <option value="">اختياري</option>
                  {semesters.map(s => <option key={s.id} value={s.id}>{s.name_ar}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5">مدة الاختبار (دقيقة) *</label>
                <input type="number" min={1} max={300} value={duration} onChange={e => setDuration(e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-1.5">درجة النجاح</label>
              <input type="number" min={0} value={passingScore} onChange={e => setPassingScore(e.target.value)}
                placeholder={`اتركه فارغاً للتعيين تلقائياً (${Math.ceil(totalPoints * 0.5)} = 50٪)`}
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            <div>
              <label className="text-sm font-semibold block mb-1.5">تعليمات الاختبار</label>
              <textarea value={instructions} onChange={e => setInstructions(e.target.value)}
                placeholder="تعليمات تظهر للطالب قبل بدء الاختبار..."
                rows={3}
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="space-y-4">
            {/* Schedule */}
            <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
              <h3 className="font-bold text-base flex items-center gap-2"><Clock className="w-4 h-4 text-primary" />جدولة الاختبار</h3>
              <div>
                <label className="text-sm font-semibold block mb-1.5">تاريخ البدء</label>
                <input type="datetime-local" value={availableFrom} onChange={e => setAvailableFrom(e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5">تاريخ الانتهاء</label>
                <input type="datetime-local" value={availableUntil} onChange={e => setAvailableUntil(e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5">عدد المحاولات المسموحة</label>
                <select value={allowedAttempts} onChange={e => setAllowedAttempts(e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
                  {[1,2,3,5,10].map(n => <option key={n} value={n}>{n} {n === 1 ? 'محاولة' : 'محاولات'}</option>)}
                  <option value="-1">غير محدود</option>
                </select>
              </div>
            </div>

            {/* Options */}
            <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
              <h3 className="font-bold text-base flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-primary" />خيارات الاختبار</h3>
              {[
                { label: 'ترتيب عشوائي للأسئلة', desc: 'تظهر الأسئلة بترتيب مختلف لكل طالب', state: shuffleQuestions, set: setShuffleQuestions },
                { label: 'ترتيب عشوائي للخيارات', desc: 'تُخلط خيارات MCQ لكل طالب', state: shuffleOptions, set: setShuffleOptions },
                { label: 'عرض النتيجة فوراً', desc: 'يرى الطالب درجته بعد التسليم مباشرة', state: showResultsImmediately, set: setShowResultsImmediately },
              ].map(opt => (
                <div key={opt.label} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                  <button onClick={() => opt.set(!opt.state)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${opt.state ? 'bg-primary' : 'bg-muted'}`}>
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${opt.state ? 'translate-x-[1.4rem]' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Question Bank - Left */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-bold mb-3">بنك الأسئلة</h3>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setTimeout(loadQuestions, 400) }}
                    placeholder="بحث في الأسئلة..."
                    className="w-full pr-9 pl-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="flex gap-2">
                  <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-border rounded-lg text-xs bg-white focus:outline-none">
                    <option value="">كل الصفوف</option>
                    {grades.map(g => <option key={g.id} value={g.id}>{g.name_ar}</option>)}
                  </select>
                  <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-border rounded-lg text-xs bg-white focus:outline-none">
                    <option value="">كل المواد</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name_ar}</option>)}
                  </select>
                  <select value={filterType} onChange={e => setFilterType(e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-border rounded-lg text-xs bg-white focus:outline-none">
                    <option value="">كل الأنواع</option>
                    <option value="mcq">اختيار متعدد</option>
                    <option value="true_false">صح/خطأ</option>
                    <option value="fill_blank">ملء فراغ</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
              {loadingQuestions ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : filteredAvailable.length === 0 ? (
                <div className="text-center py-10 text-sm text-muted-foreground">
                  {allQuestions.length === 0 ? 'لا توجد أسئلة معتمدة في البنك بعد' : 'لا توجد نتائج مطابقة'}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredAvailable.map(q => (
                    <div key={q.id} className="p-3 hover:bg-muted/30 transition-colors group">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap gap-1.5 mb-1">
                            <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{TYPE_AR[q.question_type]}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${DIFF_COLOR[q.difficulty_level]}`}>{DIFF_AR[q.difficulty_level]}</span>
                            <span className="text-xs text-muted-foreground">{q.points} درجة</span>
                          </div>
                          <p className="text-sm leading-relaxed line-clamp-2">{q.question_text}</p>
                        </div>
                        <button onClick={() => addQuestion(q)}
                          className="shrink-0 w-7 h-7 rounded-lg bg-primary/10 hover:bg-primary hover:text-white text-primary flex items-center justify-center transition-all">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Questions - Right */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold">أسئلة الاختبار</h3>
                <p className="text-xs text-muted-foreground">{selectedQuestions.length} سؤال • {totalPoints} درجة إجمالية</p>
              </div>
              {selectedQuestions.length > 0 && (
                <button onClick={() => setSelectedQuestions([])}
                  className="text-xs text-red-500 hover:underline">مسح الكل</button>
              )}
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
              {selectedQuestions.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">اضغط على + لإضافة أسئلة من البنك</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {selectedQuestions.map((q, i) => (
                    <div key={q.id} className="p-3 hover:bg-muted/20">
                      <div className="flex items-start gap-2">
                        <span className="w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-snug line-clamp-2 mb-1.5">{q.question_text}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">الدرجة:</span>
                            <input type="number" min={1} max={20}
                              value={q.points_override || q.points}
                              onChange={e => updatePoints(q.id, parseInt(e.target.value) || q.points)}
                              className="w-14 px-2 py-0.5 border border-border rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary/30" />
                          </div>
                        </div>
                        <button onClick={() => removeQuestion(q.id)}
                          className="shrink-0 p-1 hover:bg-red-50 hover:text-red-500 text-muted-foreground rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => handleSave(false)} disabled={saving}
          className="flex items-center gap-2 border border-border px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-muted transition-colors disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ كمسودة
        </button>
        <button onClick={() => handleSave(true)} disabled={saving}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
          حفظ ونشر الاختبار
        </button>
        <button onClick={() => router.back()}
          className="mr-auto text-sm text-muted-foreground hover:text-foreground transition-colors">
          إلغاء
        </button>
      </div>
    </div>
  )
}
