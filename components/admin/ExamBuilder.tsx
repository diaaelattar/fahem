'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Loader2, BookOpen, Save, Eye, CheckCircle, GripVertical, BarChart2, Sparkles } from 'lucide-react'
import { QuestionFilterSidebar, type QuestionFilters } from './QuestionFilterSidebar'
import { AutoSelectModal } from './AutoSelectModal'
import { ExamSummaryStats } from './ExamSummaryStats'
import { ExamBuilderSettings } from './ExamBuilderSettings'
import type { QuestionItem, SelectedQuestion, ExamBuilderProps, ExamFormState } from './ExamBuilderTypes'
import { TYPE_AR, DIFF_AR, DIFF_COLOR } from './ExamBuilderTypes'

const DEFAULT_FORM: ExamFormState = {
  title: '', description: '', subjectId: '', gradeId: '', semesterId: '',
  unitId: '', lessonId: '', examType: 'partial', duration: '30',
  passingScore: '', instructions: '', isPublished: false,
  availableFrom: '', availableUntil: '', shuffleQuestions: true,
  shuffleOptions: true, showResultsImmediately: true, allowedAttempts: '1',
}

export function ExamBuilder({ subjects, grades, semesters, units, lessons, examId, initialData }: ExamBuilderProps) {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState<ExamFormState>(() =>
    initialData ? {
      title: initialData.title || '',
      description: initialData.description || '',
      subjectId: initialData.subject_id?.toString() || '',
      gradeId: initialData.grade_id?.toString() || '',
      semesterId: initialData.semester_id?.toString() || '',
      unitId: initialData.unit_id?.toString() || '',
      lessonId: initialData.lesson_id?.toString() || '',
      examType: initialData.exam_type || 'partial',
      duration: initialData.duration_minutes?.toString() || '30',
      passingScore: initialData.passing_score?.toString() || '',
      instructions: initialData.instructions || '',
      isPublished: initialData.is_published || false,
      availableFrom: initialData.available_from?.slice(0, 16) || '',
      availableUntil: initialData.available_until?.slice(0, 16) || '',
      shuffleQuestions: initialData.shuffle_questions ?? true,
      shuffleOptions: initialData.shuffle_options ?? true,
      showResultsImmediately: initialData.show_results_immediately ?? true,
      allowedAttempts: initialData.allowed_attempts?.toString() || '1',
    } : DEFAULT_FORM
  )

  const [filters, setFilters] = useState<QuestionFilters>({
    search: '', gradeId: '', subjectId: '', semesterId: '',
    unitId: '', lessonId: '', questionType: '', difficulty: '',
  })

  const [bankQuestions, setBankQuestions] = useState<QuestionItem[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestion[]>([])
  const [loadingQ, setLoadingQ] = useState(false)
  const [activeTab, setActiveTab] = useState<'settings' | 'questions'>('settings')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [isAutoSelectOpen, setIsAutoSelectOpen] = useState(false)

  const totalPoints = selectedQuestions.reduce((s, q) => s + (q.points_override ?? q.points), 0)

  // Load bank questions whenever filters change
  const loadQuestions = useCallback(async () => {
    setLoadingQ(true)
    let q = supabase
      .from('questions')
      .select('id, question_type, question_text, difficulty_level, points, unit_id, lesson_id, subjects(name_ar,icon), grades(name_ar), units(name_ar), lessons(name_ar)')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(150)

    if (filters.gradeId)      q = q.eq('grade_id', filters.gradeId)
    if (filters.subjectId)    q = q.eq('subject_id', filters.subjectId)
    // if (filters.semesterId)   q = q.eq('semester_id', filters.semesterId) // Requires DB migration
    if (filters.unitId)       q = q.eq('unit_id', filters.unitId)
    if (filters.lessonId)     q = q.eq('lesson_id', filters.lessonId)
    if (filters.questionType) q = q.eq('question_type', filters.questionType)
    if (filters.difficulty)   q = q.eq('difficulty_level', filters.difficulty)
    if (filters.search)       q = q.ilike('question_text', `%${filters.search}%`)

    const { data } = await q
    setBankQuestions((data || []) as unknown as QuestionItem[])
    setLoadingQ(false)
  }, [filters, supabase])

  useEffect(() => { loadQuestions() }, [loadQuestions])

  useEffect(() => {
    if (examId && initialData) {
      supabase.from('exam_questions')
        .select('question_id, question_order, points_override, questions(id,question_type,question_text,difficulty_level,points,unit_id,lesson_id,subjects(name_ar,icon),grades(name_ar))')
        .eq('exam_id', examId)
        .order('question_order')
        .then(({ data }) => {
          if (data) setSelectedQuestions(data.map((eq: any) => ({ ...eq.questions, order: eq.question_order, points_override: eq.points_override })))
        })
    }
  }, [examId])

  const addQuestion = (q: QuestionItem) => {
    if (selectedQuestions.find(s => s.id === q.id)) return
    setSelectedQuestions(prev => [...prev, { ...q, order: prev.length + 1 }])
  }

  const handleAutoAdd = (newQuestions: QuestionItem[]) => {
    setSelectedQuestions(prev => {
      const currentIds = new Set(prev.map(q => q.id))
      const toAdd = newQuestions.filter(q => !currentIds.has(q.id))
      return [...prev, ...toAdd.map((q, i) => ({ ...q, order: prev.length + i + 1 }))]
    })
  }

  const removeQuestion = (id: string) =>
    setSelectedQuestions(prev => prev.filter(q => q.id !== id).map((q, i) => ({ ...q, order: i + 1 })))

  const updatePoints = (id: string, pts: number) =>
    setSelectedQuestions(prev => prev.map(q => q.id === id ? { ...q, points_override: pts } : q))

  const handleSave = async (publish: boolean) => {
    if (!form.title.trim())               { setError('العنوان مطلوب'); return }
    if (!form.subjectId)                  { setError('اختر المادة الدراسية'); return }
    if (!form.gradeId)                    { setError('اختر الصف الدراسي'); return }
    if (selectedQuestions.length === 0)   { setError('أضف سؤالاً واحداً على الأقل'); return }
    if (!form.duration || parseInt(form.duration) < 1) { setError('مدة الاختبار يجب أن تكون أكبر من صفر'); return }

    setError('')
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('غير مسجل الدخول')

      const examData = {
        admin_id: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        subject_id: parseInt(form.subjectId),
        grade_id: parseInt(form.gradeId),
        semester_id: form.semesterId ? parseInt(form.semesterId) : null,
        unit_id: form.unitId ? parseInt(form.unitId) : null,
        lesson_id: form.lessonId ? parseInt(form.lessonId) : null,
        exam_type: form.examType,
        duration_minutes: parseInt(form.duration),
        total_points: totalPoints,
        passing_score: form.passingScore ? parseInt(form.passingScore) : null,
        instructions: form.instructions.trim() || null,
        is_published: publish || form.isPublished,
        available_from: form.availableFrom ? new Date(form.availableFrom).toISOString() : null,
        available_until: form.availableUntil ? new Date(form.availableUntil).toISOString() : null,
        shuffle_questions: form.shuffleQuestions,
        shuffle_options: form.shuffleOptions,
        show_results_immediately: form.showResultsImmediately,
        allowed_attempts: parseInt(form.allowedAttempts) || 1,
      }

      let finalExamId = examId

      if (examId) {
        const { error: e } = await supabase.from('exams').update(examData).eq('id', examId)
        if (e) throw e
        await supabase.from('exam_questions').delete().eq('exam_id', examId)
      } else {
        const { data, error: e } = await supabase.from('exams').insert(examData as any).select('id').single()
        if (e) throw e
        finalExamId = (data as any).id
      }

      const questionsData = selectedQuestions.map((q, i) => ({
        exam_id: finalExamId,
        question_id: q.id,
        question_order: i + 1,
        points_override: q.points_override || null,
      }))

      const { error: qErr } = await supabase.from('exam_questions').insert(questionsData as any)
      if (qErr) throw qErr

      await supabase.from('exams').update({ total_points: totalPoints }).eq('id', finalExamId)

      setSaved(true)
      setTimeout(() => router.push('/admin/exams'), 1200)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const availableInBank = bankQuestions.filter(q => !selectedQuestions.find(s => s.id === q.id))

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
        <ExamBuilderSettings
          form={form} onChange={setForm}
          subjects={subjects} grades={grades} semesters={semesters}
          units={units} lessons={lessons} totalPoints={totalPoints}
        />
      )}

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Filter Sidebar */}
          <div className="space-y-4">
            <QuestionFilterSidebar
              filters={filters} onChange={setFilters}
              grades={grades} subjects={subjects} semesters={semesters}
              units={units} lessons={lessons}
              totalShown={availableInBank.length} totalInBank={bankQuestions.length}
            />
            <ExamSummaryStats questions={selectedQuestions} durationMinutes={parseInt(form.duration) || 0} />
          </div>

          {/* Bank */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold">بنك الأسئلة</h3>
              <span className="text-xs text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-lg">{availableInBank.length} سؤال</span>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 520 }}>
              {loadingQ ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : availableInBank.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground px-4">
                  {bankQuestions.length === 0 ? 'لا توجد أسئلة معتمدة' : 'جميع الأسئلة مضافة أو لا توجد نتائج مطابقة'}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {availableInBank.map(q => (
                    <div key={q.id} className="p-3 hover:bg-muted/30 transition-colors group">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap gap-1.5 mb-1.5">
                            <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{TYPE_AR[q.question_type]}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${DIFF_COLOR[q.difficulty_level]}`}>{DIFF_AR[q.difficulty_level]}</span>
                            {(q.units as any)?.name_ar && (
                              <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">{(q.units as any).name_ar}</span>
                            )}
                            {(q.lessons as any)?.name_ar && (
                              <span className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded">{(q.lessons as any).name_ar}</span>
                            )}
                            <span className="text-[10px] text-muted-foreground">{q.points} درجة</span>
                          </div>
                          <p className="text-sm leading-relaxed line-clamp-2" dangerouslySetInnerHTML={{ __html: q.question_text }} />
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

          {/* Selected */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold flex items-center gap-2">
                  أسئلة الاختبار
                  {selectedQuestions.length > 0 && (
                    <span className="text-xs font-normal text-muted-foreground bg-white px-2 py-0.5 rounded-md border border-border">
                      {selectedQuestions.length} سؤال • {totalPoints} درجة
                    </span>
                  )}
                </h3>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsAutoSelectOpen(true)}
                  disabled={availableInBank.length === 0}
                  className="flex items-center gap-1.5 text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-200 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" /> توليد عشوائي
                </button>
                {selectedQuestions.length > 0 && (
                  <button onClick={() => setSelectedQuestions([])} className="text-xs text-red-500 hover:underline px-2">مسح الكل</button>
                )}
              </div>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 520 }}>
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
                        <GripVertical className="w-4 h-4 text-muted-foreground/40 mt-1 shrink-0 cursor-grab" />
                        <span className="w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-snug line-clamp-2 mb-1.5" dangerouslySetInnerHTML={{ __html: q.question_text }} />
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${DIFF_COLOR[q.difficulty_level]}`}>{DIFF_AR[q.difficulty_level]}</span>
                            <span className="text-xs text-muted-foreground">الدرجة:</span>
                            <input type="number" min={1} max={20}
                              value={q.points_override ?? q.points}
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
        <button onClick={() => router.back()} className="mr-auto text-sm text-muted-foreground hover:text-foreground transition-colors">
          إلغاء
        </button>
      </div>

      {isAutoSelectOpen && (
        <AutoSelectModal 
          availableQuestions={availableInBank}
          onAdd={handleAutoAdd}
          onClose={() => setIsAutoSelectOpen(false)}
        />
      )}
    </div>
  )
}
